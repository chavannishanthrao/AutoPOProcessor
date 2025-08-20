import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import imaps from 'imap-simple';
import { storage } from '../storage';
import { EmailAccount } from '@shared/schema';

// OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/gmail/callback';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || '';
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5000/api/auth/microsoft/callback';

export class EmailService {
  async checkEmails(tenantId: string): Promise<void> {
    const emailAccounts = await storage.getEmailAccounts(tenantId);
    
    for (const account of emailAccounts) {
      if (!account.isActive) continue;
      
      try {
        await this.processEmailAccount(account);
        
        // Update last checked timestamp
        await storage.updateEmailAccount(account.id, {
          lastChecked: new Date(),
        });
      } catch (error) {
        console.error(`Error processing email account ${account.email}:`, error);
        
        // Create notification for failed email check
        await storage.createNotification({
          tenantId: account.tenantId,
          type: 'failure',
          title: 'Email Check Failed',
          message: `Failed to check emails for ${account.email}: ${error.message}`,
          relatedEntity: account.id,
        });
      }
    }
  }

  private async processEmailAccount(account: EmailAccount): Promise<void> {
    switch (account.provider) {
      case 'gmail':
        await this.processGmail(account);
        break;
      case 'outlook':
        await this.processOutlook(account);
        break;
      case 'imap':
        await this.processImap(account);
        break;
      default:
        throw new Error(`Unsupported email provider: ${account.provider}`);
    }
  }

  private async processGmail(account: EmailAccount): Promise<void> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Search for unread emails
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 10,
    });

    const messages = response.data.messages || [];
    
    for (const message of messages) {
      if (!message.id) continue;
      
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      });
      
      await this.processEmail(account, fullMessage.data);
      
      // Mark as read
      await gmail.users.messages.modify({
        userId: 'me',
        id: message.id,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    }
  }

  private async processOutlook(account: EmailAccount): Promise<void> {
    // Microsoft Graph client implementation
    const graphClient = Client.init({
      authProvider: {
        getAccessToken: async () => {
          // Implement token refresh logic
          return account.accessToken!;
        }
      }
    });

    const messages = await graphClient
      .api('/me/mailFolders/inbox/messages')
      .filter('isRead eq false')
      .top(10)
      .get();

    for (const message of messages.value) {
      await this.processEmail(account, message);
      
      // Mark as read
      await graphClient
        .api(`/me/messages/${message.id}`)
        .update({ isRead: true });
    }
  }

  private async processImap(account: EmailAccount): Promise<void> {
    const imapConfig = account.imapConfig as any;
    
    const connection = await imaps.connect({
      imap: {
        user: imapConfig.user,
        password: imapConfig.password,
        host: imapConfig.host,
        port: imapConfig.port,
        tls: imapConfig.tls,
        tlsOptions: { rejectUnauthorized: false },
      },
    });

    await connection.openBox('INBOX');
    
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: '', markSeen: false };
    
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    for (const message of messages) {
      await this.processEmail(account, message);
      
      // Mark as seen
      await connection.addFlags(message.attributes.uid, '\\Seen');
    }
    
    connection.end();
  }

  private async processEmail(account: EmailAccount, emailData: any): Promise<void> {
    // Extract basic email information
    const subject = this.extractSubject(emailData);
    const body = this.extractBody(emailData);
    const attachments = this.extractAttachments(emailData);
    
    // Check if email is PO-related using AI
    const aiConfig = await storage.getActiveAiConfiguration(account.tenantId);
    if (!aiConfig) {
      console.log('No active AI configuration found, skipping email processing');
      return;
    }
    
    // Use AI to determine if email contains PO
    const { aiService } = await import('./aiService');
    const isPOEmail = await aiService.isPurchaseOrderEmail(subject + '\n' + body, aiConfig);
    
    if (isPOEmail && attachments.length > 0) {
      // Process attachments for PO data
      for (const attachment of attachments) {
        await this.processPOAttachment(account.tenantId, attachment, emailData);
      }
    }
  }

  private async processPOAttachment(tenantId: string, attachment: any, emailData: any): Promise<void> {
    const { documentProcessor } = await import('./documentProcessor');
    const { aiService } = await import('./aiService');
    
    try {
      // Extract text from attachment
      const extractedText = await documentProcessor.extractText(attachment);
      
      // Get AI configuration
      const aiConfig = await storage.getActiveAiConfiguration(tenantId);
      if (!aiConfig) return;
      
      // Extract structured PO data using AI
      const poData = await aiService.extractPOData(extractedText, aiConfig);
      
      // Create initial PO record
      const purchaseOrder = await storage.createPurchaseOrder({
        tenantId,
        poNumber: poData.poNumber,
        vendorName: poData.vendorName,
        vendorAddress: poData.vendorAddress,
        totalAmount: poData.totalAmount.toString(),
        currency: poData.currency || 'USD',
        status: 'processing',
        emailSource: emailData.id,
        originalEmail: emailData,
        extractedData: poData,
      });
      
      // Start background processing workflow
      const { backgroundJobs } = await import('./backgroundJobs');
      await backgroundJobs.processPurchaseOrder(purchaseOrder.id);
      
    } catch (error) {
      console.error('Error processing PO attachment:', error);
      
      await storage.createNotification({
        tenantId,
        type: 'failure',
        title: 'PO Processing Failed',
        message: `Failed to process purchase order attachment: ${error.message}`,
      });
    }
  }

  private extractSubject(emailData: any): string {
    if (emailData.payload?.headers) {
      const subject = emailData.payload.headers.find((h: any) => h.name === 'Subject');
      return subject?.value || '';
    }
    return emailData.subject || '';
  }

  private extractBody(emailData: any): string {
    // Implementation varies by provider
    if (emailData.payload?.parts) {
      for (const part of emailData.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString();
        }
      }
    }
    return emailData.body?.content || '';
  }

  private extractAttachments(emailData: any): any[] {
    const attachments: any[] = [];
    
    if (emailData.payload?.parts) {
      for (const part of emailData.payload.parts) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            attachmentId: part.body.attachmentId,
            size: part.body.size,
          });
        }
      }
    }
    
    return attachments;
  }

  // Gmail OAuth methods
  async getGmailAuthUrl(): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    return authUrl;
  }

  async handleGmailCallback(code: string): Promise<any> {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      email: userInfo.data.email,
      name: userInfo.data.name
    };
  }

  async connectGmailWithTokens(tenantId: string, tokens: any): Promise<EmailAccount> {
    const emailAccount = await storage.createEmailAccount({
      tenantId,
      provider: 'gmail',
      email: tokens.email,
      displayName: tokens.name || tokens.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isActive: true,
      lastChecked: new Date(),
    });

    return emailAccount;
  }

  // Microsoft OAuth methods
  async getMicrosoftAuthUrl(): Promise<string> {
    const baseUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      response_type: 'code',
      redirect_uri: MICROSOFT_REDIRECT_URI,
      response_mode: 'query',
      scope: 'offline_access User.Read Mail.Read',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  async handleMicrosoftCallback(code: string): Promise<any> {
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    
    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      code: code,
      redirect_uri: MICROSOFT_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    const tokens = await response.json();
    
    if (!response.ok) {
      throw new Error(`Microsoft OAuth error: ${tokens.error_description}`);
    }

    // Get user info
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    const userInfo = await userResponse.json();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: Date.now() + (tokens.expires_in * 1000),
      email: userInfo.mail || userInfo.userPrincipalName,
      name: userInfo.displayName
    };
  }

  async connectMicrosoftWithTokens(tenantId: string, tokens: any): Promise<EmailAccount> {
    const emailAccount = await storage.createEmailAccount({
      tenantId,
      provider: 'outlook',
      email: tokens.email,
      displayName: tokens.name || tokens.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isActive: true,
      lastChecked: new Date(),
    });

    return emailAccount;
  }

  async connectGmail(tenantId: string, authorizationCode: string): Promise<EmailAccount> {
    // Legacy method - redirect to new OAuth flow
    throw new Error("Please use the new OAuth flow via /api/auth/gmail");
  }

  async connectOutlook(tenantId: string, authorizationCode: string): Promise<EmailAccount> {
    // Legacy method - redirect to new OAuth flow
    throw new Error("Please use the new OAuth flow via /api/auth/microsoft");
  }

  async setupImap(tenantId: string, config: {
    email: string;
    host: string;
    port: number;
    user: string;
    password: string;
    tls: boolean;
  }): Promise<EmailAccount> {
    // Test IMAP connection
    const connection = await imaps.connect({
      imap: {
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: { rejectUnauthorized: false },
      },
    });
    
    await connection.openBox('INBOX');
    connection.end();

    return storage.createEmailAccount({
      tenantId,
      email: config.email,
      provider: 'imap',
      imapConfig: config,
      isActive: true,
    });
  }
}

export const emailService = new EmailService();
