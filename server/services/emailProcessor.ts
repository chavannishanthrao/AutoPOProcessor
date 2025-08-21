import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { oauthService } from './oauthService';
import { aiService } from './aiService';
import { documentProcessor } from './documentProcessor';
import { storage } from '../storage';
import { EmailAccount, ExtractedPOData } from '@shared/schema';

interface EmailAttachment {
  filename: string;
  contentType: string;
  data: Buffer;
}

interface EmailData {
  subject: string;
  from: string;
  date: Date;
  attachments: EmailAttachment[];
}

class EmailProcessor {
  
  // Process emails for a specific email account
  async processEmailsForAccount(emailAccount: EmailAccount): Promise<void> {
    try {
      console.log(`Processing emails for ${emailAccount.email} (${emailAccount.provider})`);
      
      let emails: EmailData[] = [];
      
      if (emailAccount.provider === 'gmail') {
        emails = await this.fetchGmailEmails(emailAccount);
      } else if (emailAccount.provider === 'outlook') {
        emails = await this.fetchOutlookEmails(emailAccount);
      } else {
        console.log(`Unsupported provider: ${emailAccount.provider}`);
        return;
      }

      for (const email of emails) {
        await this.processEmail(email, emailAccount);
      }
      
      // Update last checked timestamp
      await storage.updateEmailAccount(emailAccount.id, {
        lastChecked: new Date(),
      });

    } catch (error) {
      console.error(`Error processing emails for ${emailAccount.email}:`, error);
      await storage.createProcessingLog({
        tenantId: emailAccount.tenantId,
        stage: 'email_detection',
        status: 'failed',
        errorMessage: `Failed to process emails: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // Fetch emails from Gmail
  private async fetchGmailEmails(emailAccount: EmailAccount): Promise<EmailData[]> {
    try {
      console.log(`Getting access token for ${emailAccount.email}...`);
      const accessToken = await oauthService.getValidAccessToken(emailAccount.id);
      console.log(`Access token obtained: ${accessToken.substring(0, 10)}...`);
      
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Search for emails from the last 24 hours (including read emails for testing)
      console.log(`Searching Gmail for emails from last 24 hours...`);
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'newer_than:1d (has:attachment OR subject:PO OR subject:"purchase order" OR subject:"order")',
        maxResults: 20,
      });

      console.log(`Gmail API response: ${response.data.messages?.length || 0} messages found`);
      
      if (!response.data.messages) {
        console.log('No messages found');
        return [];
      }

      const emails: EmailData[] = [];
      
      console.log(`Processing ${response.data.messages.length} Gmail messages...`);
      for (const message of response.data.messages) {
      try {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        });

        const headers = email.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const dateHeader = headers.find(h => h.name === 'Date')?.value || '';

        const attachments = await this.extractGmailAttachments(gmail, message.id!, email.data.payload);
        
        // Process emails with attachments OR those that look like PO emails
        const isPotentialPO = subject.toLowerCase().includes('po') || 
                             subject.toLowerCase().includes('purchase') || 
                             subject.toLowerCase().includes('order');
        
        if (attachments.length > 0 || isPotentialPO) {
          emails.push({
            subject,
            from,
            date: new Date(dateHeader),
            attachments,
          });

          // Mark as read
          await gmail.users.messages.modify({
            userId: 'me',
            id: message.id!,
            requestBody: {
              removeLabelIds: ['UNREAD'],
            },
          });
        }
      } catch (error) {
        console.error(`Error processing Gmail message ${message.id}:`, error);
      }
    }

    return emails;
      } catch (error) {
      console.error(`Error in fetchGmailEmails for ${emailAccount.email}:`, error);
      throw error;
    }
  }

  // Fetch emails from Outlook
  private async fetchOutlookEmails(emailAccount: EmailAccount): Promise<EmailData[]> {
    const accessToken = await oauthService.getValidAccessToken(emailAccount.id);
    
    const client = Client.init({
      authProvider: {
        getAccessToken: async () => accessToken,
      },
    });

    // Get unread emails with attachments from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messages = await client
      .api('/me/messages')
      .filter(`isRead eq false and hasAttachments eq true and receivedDateTime ge ${yesterday.toISOString()}`)
      .top(20)
      .get();

    const emails: EmailData[] = [];
    
    for (const message of messages.value) {
      try {
        // Get attachments
        const attachmentsResponse = await client
          .api(`/me/messages/${message.id}/attachments`)
          .get();

        const attachments: EmailAttachment[] = [];
        
        for (const attachment of attachmentsResponse.value) {
          if (attachment['@odata.type'] === '#microsoft.graph.fileAttachment') {
            attachments.push({
              filename: attachment.name,
              contentType: attachment.contentType,
              data: Buffer.from(attachment.contentBytes, 'base64'),
            });
          }
        }

        if (attachments.length > 0) {
          emails.push({
            subject: message.subject,
            from: message.from.emailAddress.address,
            date: new Date(message.receivedDateTime),
            attachments,
          });

          // Mark as read
          await client
            .api(`/me/messages/${message.id}`)
            .patch({
              isRead: true,
            });
        }
      } catch (error) {
        console.error(`Error processing Outlook message ${message.id}:`, error);
      }
    }

    return emails;
  }

  // Extract attachments from Gmail message
  private async extractGmailAttachments(gmail: any, messageId: string, payload: any): Promise<EmailAttachment[]> {
    const attachments: EmailAttachment[] = [];
    
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.filename && part.body.attachmentId) {
          try {
            const attachment = await gmail.users.messages.attachments.get({
              userId: 'me',
              messageId,
              id: part.body.attachmentId,
            });

            attachments.push({
              filename: part.filename,
              contentType: part.mimeType,
              data: Buffer.from(attachment.data.data, 'base64'),
            });
          } catch (error) {
            console.error(`Error fetching Gmail attachment:`, error);
          }
        }
      }
    }

    return attachments;
  }

  // Process individual email
  private async processEmail(email: EmailData, emailAccount: EmailAccount): Promise<void> {
    console.log(`Processing email: ${email.subject} from ${email.from}`);
    
    // First, check if email is related to Purchase Orders using LLM
    const isPoRelated = await this.checkIfPurchaseOrderEmail(email);
    
    if (!isPoRelated) {
      console.log(`Email not PO-related, skipping: ${email.subject}`);
      return;
    }

    // Process each attachment
    for (const attachment of email.attachments) {
      if (this.isSupportedAttachment(attachment)) {
        await this.processAttachment(attachment, email, emailAccount);
      }
    }
  }

  // Check if email is Purchase Order related using LLM
  private async checkIfPurchaseOrderEmail(email: EmailData): Promise<boolean> {
    try {
      const prompt = `
Analyze this email to determine if it contains a Purchase Order or is related to purchase order processing.

Email Subject: "${email.subject}"
Email From: "${email.from}"
Attachment Count: ${email.attachments.length}
Attachment Names: ${email.attachments.map(a => a.filename).join(', ')}

Return only "true" if this email likely contains a purchase order or is related to purchase order processing, otherwise return "false".

Consider these indicators:
- Subject contains words like: PO, Purchase Order, Order, Invoice, Quote, Procurement
- Sender is likely a vendor, supplier, or procurement department
- Attachments are PDFs, images, or documents that might contain purchase orders

Response (true/false only):`;

      const response = await aiService.processWithOpenAI(prompt, 'gpt-3.5-turbo');
      return response.toLowerCase().trim() === 'true';
    } catch (error) {
      console.error('Error checking if email is PO-related:', error);
      return false; // Conservative approach - skip if we can't determine
    }
  }

  // Check if attachment is supported for processing
  private isSupportedAttachment(attachment: EmailAttachment): boolean {
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/bmp',
    ];
    return supportedTypes.includes(attachment.contentType.toLowerCase());
  }

  // Process individual attachment
  private async processAttachment(
    attachment: EmailAttachment, 
    email: EmailData, 
    emailAccount: EmailAccount
  ): Promise<void> {
    try {
      console.log(`Processing attachment: ${attachment.filename}`);
      
      // Extract text from attachment using OCR/document processing
      const extractedText = await documentProcessor.extractText(
        attachment.data,
        attachment.contentType,
        attachment.filename
      );

      if (!extractedText.trim()) {
        console.log(`No text extracted from ${attachment.filename}, skipping`);
        return;
      }

      // Use LLM to extract structured PO data
      const structuredData = await this.extractPurchaseOrderData(extractedText);
      
      if (!structuredData) {
        console.log(`No structured PO data found in ${attachment.filename}`);
        return;
      }

      // Find the user associated with this email account
      const users = await storage.getUsersByTenantId(emailAccount.tenantId);
      const user = users[0]; // For now, associate with first admin user

      if (!user) {
        console.error('No user found for tenant');
        return;
      }

      // Save extracted PO data to database
      await storage.createExtractedPOData({
        tenantId: emailAccount.tenantId,
        userId: user.id,
        emailAccountId: emailAccount.id,
        emailSubject: email.subject,
        emailFrom: email.from,
        emailDate: email.date,
        poNumber: structuredData.poNumber,
        supplier: structuredData.supplier,
        buyer: structuredData.buyer,
        date: structuredData.date ? new Date(structuredData.date) : null,
        amount: structuredData.amount ? parseFloat(structuredData.amount.toString()) : null,
        currency: structuredData.currency || 'USD',
        lineItems: structuredData.lineItems || [],
        attachmentName: attachment.filename,
        extractedText: extractedText,
        llmResponse: structuredData,
        processingStatus: 'completed',
      });

      console.log(`Successfully processed PO from ${attachment.filename}`);
      
    } catch (error) {
      console.error(`Error processing attachment ${attachment.filename}:`, error);
      
      // Save error record
      const users = await storage.getUsersByTenantId(emailAccount.tenantId);
      const user = users[0];
      
      if (user) {
        await storage.createExtractedPOData({
          tenantId: emailAccount.tenantId,
          userId: user.id,
          emailAccountId: emailAccount.id,
          emailSubject: email.subject,
          emailFrom: email.from,
          emailDate: email.date,
          attachmentName: attachment.filename,
          extractedText: '',
          processingStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  // Extract structured PO data using LLM
  private async extractPurchaseOrderData(text: string): Promise<any> {
    try {
      const prompt = `
Extract purchase order information from the following text and return it as a JSON object.

Text to analyze:
"""
${text}
"""

Please extract the following fields (return null for any field that cannot be found):

{
  "poNumber": "Purchase Order number/ID",
  "supplier": "Supplier/Vendor name",
  "buyer": "Buyer/Customer name or company",
  "date": "Order date in YYYY-MM-DD format",
  "amount": "Total amount as a number (no currency symbols)",
  "currency": "Currency code (e.g., USD, EUR, GBP)",
  "lineItems": [
    {
      "description": "Item description",
      "quantity": "Quantity as number",
      "unitPrice": "Unit price as number",
      "totalPrice": "Line total as number"
    }
  ]
}

Return only the JSON object, no other text:`;

      const response = await aiService.processWithOpenAI(prompt, 'gpt-3.5-turbo');
      
      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Error parsing LLM JSON response:', parseError);
        return null;
      }
    } catch (error) {
      console.error('Error extracting PO data with LLM:', error);
      return null;
    }
  }
}

export const emailProcessor = new EmailProcessor();