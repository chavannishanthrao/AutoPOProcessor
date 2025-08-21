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
      let accessToken = await oauthService.getValidAccessToken(emailAccount.id);
      console.log(`Access token obtained: ${accessToken.substring(0, 10)}...`);
      
      const createGmailClient = (token: string) => {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: token });
        return google.gmail({ version: 'v1', auth: oauth2Client });
      };
      
      let gmail = createGmailClient(accessToken);
      let response;
      
      try {
        // Search for emails from the last 24 hours (including read emails for testing)
        console.log(`Searching Gmail for emails from last 24 hours...`);
        response = await gmail.users.messages.list({
          userId: 'me',
          q: 'newer_than:1d (has:attachment OR subject:PO OR subject:"purchase order" OR subject:"order")',
          maxResults: 20,
        });
      } catch (error: any) {
        // Handle authentication errors
        if (error.code === 401) {
          console.log(`Got 401 error, attempting token refresh for ${emailAccount.email}...`);
          accessToken = await oauthService.handleTokenRefreshOnError(emailAccount.id);
          console.log(`Token refreshed, retrying Gmail API call...`);
          gmail = createGmailClient(accessToken);
          response = await gmail.users.messages.list({
            userId: 'me',
            q: 'newer_than:1d (has:attachment OR subject:PO OR subject:"purchase order" OR subject:"order")',
            maxResults: 20,
          });
        } else if (error.code === 403) {
          console.error(`Gmail permission error for ${emailAccount.email}:`, error.message);
          throw new Error(`Gmail account needs to be reconnected with updated permissions. Please disconnect and reconnect your Gmail account in the Email Configuration page.`);
        } else {
          throw error;
        }
      }

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
    
    // Create initial processing log for email detection
    const processingStartTime = Date.now();
    
    // First, check if email is related to Purchase Orders using LLM
    const isPoRelated = await this.checkIfPurchaseOrderEmail(email, emailAccount);
    
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
  private async checkIfPurchaseOrderEmail(email: EmailData, emailAccount: EmailAccount): Promise<boolean> {
    // First, do simple keyword-based detection for obvious PO emails
    const subject = email.subject.toLowerCase();
    const keywordIndicators = [
      'po ', 'po#', 'po-', 'po_', 
      'purchase order', 'purchase ord', 'p.o.',
      'order confirmation', 'order #',
      'procurement', 'invoice', 'quote'
    ];

    const hasKeywords = keywordIndicators.some(keyword => 
      subject.includes(keyword.toLowerCase())
    );

    // If it has obvious keywords or attachments, it's likely a PO email
    if (hasKeywords || email.attachments.length > 0) {
      console.log(`PO detected by keywords or attachments: ${email.subject}`);
      return true;
    }

    // For ambiguous cases, use AI detection as fallback
    try {
      const aiConfig = await storage.getActiveAiConfiguration(emailAccount.tenantId);
      if (!aiConfig) {
        console.log('No AI config, using keyword detection only');
        return hasKeywords;
      }

      const prompt = `Email subject: "${email.subject}"
From: "${email.from}"
Attachments: ${email.attachments.length} files

Is this a purchase order email? Reply only "true" or "false".`;

      const response = await aiService.processWithOpenAI(prompt, aiConfig, 'gpt-3.5-turbo');
      const isPoRelated = response.toLowerCase().trim() === 'true';
      
      if (isPoRelated) {
        console.log(`PO detected by AI: ${email.subject}`);
      }
      
      return isPoRelated;
    } catch (error) {
      console.error('Error in AI PO detection:', error);
      // Fallback to keyword detection if AI fails
      return hasKeywords;
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
    const startTime = Date.now();
    let processingLogId: string | undefined;
    
    try {
      console.log(`Processing attachment: ${attachment.filename}`);
      
      // Create initial processing log entry
      processingLogId = await storage.createProcessingLog({
        tenantId: emailAccount.tenantId,
        stage: 'ocr_processing',
        status: 'started', 
        startTime: new Date(startTime),
        details: {
          emailSubject: email.subject,
          attachmentName: attachment.filename,
          emailFrom: email.from
        }
      });
      
      // Extract text from attachment using OCR/document processing
      const extractedText = await documentProcessor.extractText(
        attachment.data,
        attachment.contentType,
        attachment.filename
      );

      if (!extractedText.trim()) {
        console.log(`No text extracted from ${attachment.filename}, skipping`);
        // Update log to failed
        if (processingLogId) {
          await storage.updateProcessingLog(processingLogId, {
            status: 'failed',
            endTime: new Date(),
            duration: Date.now() - startTime,
            errorMessage: 'No text could be extracted from attachment'
          });
        }
        return;
      }

      // Update log to show OCR completed, AI processing started
      if (processingLogId) {
        await storage.updateProcessingLog(processingLogId, {
          status: 'completed',
          endTime: new Date(),
          duration: Date.now() - startTime
        });
      }

      // Create AI processing log
      const aiStartTime = Date.now();
      const aiLogId = await storage.createProcessingLog({
        tenantId: emailAccount.tenantId,
        stage: 'data_extraction',
        status: 'started',
        startTime: new Date(aiStartTime),
        details: {
          emailSubject: email.subject,
          attachmentName: attachment.filename,
          textLength: extractedText.length
        }
      });

      // Use LLM to extract structured PO data
      const structuredData = await this.extractPurchaseOrderData(extractedText, emailAccount);
      
      if (!structuredData) {
        console.log(`No structured PO data found in ${attachment.filename}`);
        // Update AI log to failed
        if (aiLogId) {
          await storage.updateProcessingLog(aiLogId, {
            status: 'failed',
            endTime: new Date(),
            duration: Date.now() - aiStartTime,
            errorMessage: 'AI could not extract structured PO data'
          });
        }
        return;
      }

      // Update AI processing log to completed
      if (aiLogId) {
        await storage.updateProcessingLog(aiLogId, {
          status: 'completed',
          endTime: new Date(), 
          duration: Date.now() - aiStartTime,
          details: {
            ...((await storage.getProcessingLog(aiLogId))?.details || {}),
            poNumber: structuredData.poNumber,
            supplier: structuredData.supplier,
            amount: structuredData.amount
          }
        });
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

      console.log(`Successfully processed PO from ${attachment.filename}: ${structuredData.poNumber}`);
      
    } catch (error) {
      console.error(`Error processing attachment ${attachment.filename}:`, error);
      
      // Update processing log to failed if exists
      if (processingLogId) {
        await storage.updateProcessingLog(processingLogId, {
          status: 'failed',
          endTime: new Date(),
          duration: Date.now() - startTime,
          errorMessage: error instanceof Error ? error.message : 'Unknown processing error'
        });
      }
      
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
  private async extractPurchaseOrderData(text: string, emailAccount: EmailAccount): Promise<any> {
    try {
      // Get active AI configuration for the tenant
      const aiConfig = await storage.getActiveAiConfiguration(emailAccount.tenantId);
      if (!aiConfig) {
        console.log('No active AI configuration found for tenant:', emailAccount.tenantId);
        return null; // No AI config available, skip processing
      }

      const prompt = `You are a JSON extraction expert. Extract purchase order information from the text below.

Text: ${text}

Return ONLY valid JSON without any explanation, formatting, or code blocks. Extract these fields (use null if not found):

{"poNumber": "PO number", "supplier": "vendor name", "buyer": "customer name", "date": "YYYY-MM-DD", "amount": 0, "currency": "USD", "lineItems": [{"description": "item", "quantity": 1, "unitPrice": 0, "totalPrice": 0}]}

JSON:`;

      const response = await aiService.processWithOpenAI(prompt, aiConfig, aiConfig.modelName || 'gpt-4o');
      
      try {
        // Multiple strategies to extract valid JSON
        console.log('AI response received, length:', response.length);
        
        const cleanedResponse = response.trim();
        
        // Strategy 1: Direct parsing if it's already clean JSON
        try {
          return JSON.parse(cleanedResponse);
        } catch {}
        
        // Strategy 2: Extract from code blocks
        const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          try {
            return JSON.parse(codeBlockMatch[1]);
          } catch {}
        }
        
        // Strategy 3: Find first complete JSON object
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch {}
        }
        
        // Strategy 4: Extract JSON after "JSON:" prompt
        const afterJsonMatch = cleanedResponse.match(/JSON:\s*(\{[\s\S]*?\})/i);
        if (afterJsonMatch) {
          try {
            return JSON.parse(afterJsonMatch[1]);
          } catch {}
        }
        
        // Strategy 5: Clean up common JSON formatting issues
        let fixedJson = cleanedResponse
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .replace(/\n/g, ' ')
          .trim();
        
        // Find the JSON object boundaries
        const start = fixedJson.indexOf('{');
        const end = fixedJson.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          fixedJson = fixedJson.substring(start, end + 1);
          try {
            return JSON.parse(fixedJson);
          } catch {}
        }
        
        console.error('All JSON parsing strategies failed. Response length:', response.length);
        console.error('Response preview:', response.substring(0, 500) + '...');
        return null;
        
      } catch (parseError) {
        console.error('Error parsing LLM JSON response:', parseError);
        console.error('Raw response:', response);
        return null;
      }
    } catch (error) {
      console.error('Error extracting PO data with LLM:', error);
      return null;
    }
  }
}

export const emailProcessor = new EmailProcessor();