import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { storage } from '../storage';
import crypto from 'crypto';

// Encryption utilities for secure token storage
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-here-change'; // In production, use a proper 32-byte key
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  // Handle case where token might not be encrypted (legacy tokens)
  if (!encryptedText || !encryptedText.includes(':')) {
    // Return as-is if not encrypted
    return encryptedText || '';
  }
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // If not in expected format, return as-is
      return encryptedText;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error, returning token as-is:', error);
    return encryptedText;
  }
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class OAuthService {
  
  // Get OAuth configuration from database
  private async getOAuthConfig(tenantId: string, provider: 'gmail' | 'microsoft') {
    return await storage.getOauthConfiguration(tenantId, provider);
  }

  // Create Google OAuth2 client with tenant-specific config
  private async createGoogleOAuth2Client(tenantId: string) {
    const config = await this.getOAuthConfig(tenantId, 'gmail');
    if (!config) {
      throw new Error('Gmail OAuth configuration not found for this tenant. Please configure OAuth credentials in admin settings.');
    }

    return new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  // Gmail OAuth URLs
  async getGmailAuthUrl(tenantId: string): Promise<string> {
    const googleOAuth2Client = await this.createGoogleOAuth2Client(tenantId);
    const config = await this.getOAuthConfig(tenantId, 'gmail');
    
    const scopes = config?.scopes && config.scopes.length > 0 ? config.scopes : [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  // Microsoft OAuth URLs
  async getMicrosoftAuthUrl(tenantId: string): Promise<string> {
    const config = await this.getOAuthConfig(tenantId, 'microsoft');
    if (!config) {
      throw new Error('Microsoft OAuth configuration not found for this tenant. Please configure OAuth credentials in admin settings.');
    }

    const scopes = config?.scopes && config.scopes.length > 0 
      ? config.scopes.join(' ')
      : 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read';
    
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${config.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=microsoft`;
  }

  // Exchange Google authorization code for tokens
  async exchangeGoogleCode(code: string, userId: string, tenantId: string): Promise<void> {
    try {
      const googleOAuth2Client = await this.createGoogleOAuth2Client(tenantId);
      const { tokens } = await googleOAuth2Client.getToken(code);
      
      // Get user info
      googleOAuth2Client.setCredentials(tokens);
      const gmail = google.gmail({ version: 'v1', auth: googleOAuth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      // Store encrypted tokens
      const tokenData: TokenData = {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt: tokens.expiry_date!,
      };

      await storage.createEmailAccount({
        tenantId,
        email: profile.data.emailAddress!,
        provider: 'gmail',
        accessToken: encrypt(JSON.stringify(tokenData)),
        refreshToken: encrypt(tokens.refresh_token!),
        isActive: true,
      });

    } catch (error) {
      console.error('Error exchanging Google code:', error);
      throw new Error('Failed to connect Gmail account');
    }
  }

  // Handle Gmail OAuth callback - simplified version for session storage
  async handleGmailCallback(code: string, tenantId: string): Promise<any> {
    try {
      const googleOAuth2Client = await this.createGoogleOAuth2Client(tenantId);
      const { tokens } = await googleOAuth2Client.getToken(code);
      
      // Get user info
      googleOAuth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: googleOAuth2Client });
      const userInfo = await oauth2.userinfo.get();

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        email: userInfo.data.email,
        name: userInfo.data.name
      };
    } catch (error) {
      console.error('Error in Gmail callback:', error);
      throw new Error('Failed to exchange Gmail authorization code');
    }
  }

  // Handle Microsoft OAuth callback - simplified version for session storage
  async handleMicrosoftCallback(code: string, tenantId: string): Promise<any> {
    try {
      const config = await this.getOAuthConfig(tenantId, 'microsoft');
      if (!config) {
        throw new Error('Microsoft OAuth configuration not found for this tenant.');
      }
      
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: config.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(tokens.error_description || 'Token exchange failed');
      }

      // Get user info using the access token
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });
      const userInfo = await userResponse.json();

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: Date.now() + (tokens.expires_in * 1000),
        email: userInfo.mail || userInfo.userPrincipalName,
        name: userInfo.displayName || userInfo.mail
      };
    } catch (error) {
      console.error('Error in Microsoft callback:', error);
      throw new Error('Failed to exchange Microsoft authorization code');
    }
  }

  // Exchange Microsoft authorization code for tokens
  async exchangeMicrosoftCode(code: string, userId: string, tenantId: string): Promise<void> {
    try {
      const config = await this.getOAuthConfig(tenantId, 'microsoft');
      if (!config) {
        throw new Error('Microsoft OAuth configuration not found for this tenant.');
      }
      
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: config.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(tokens.error_description || 'Token exchange failed');
      }

      // Get user info using the access token
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });
      const userInfo = await userResponse.json();

      // Store encrypted tokens
      const tokenData: TokenData = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000),
      };

      await storage.createEmailAccount({
        tenantId,
        email: userInfo.mail || userInfo.userPrincipalName,
        provider: 'outlook',
        accessToken: encrypt(JSON.stringify(tokenData)),
        refreshToken: encrypt(tokens.refresh_token),
        isActive: true,
      });

    } catch (error) {
      console.error('Error exchanging Microsoft code:', error);
      throw new Error('Failed to connect Outlook account');
    }
  }

  // Refresh Google tokens
  async refreshGoogleTokens(emailAccountId: string): Promise<string> {
    try {
      const account = await storage.getEmailAccount(emailAccountId);
      if (!account || account.provider !== 'gmail') {
        throw new Error('Invalid email account');
      }

      const tokenData: TokenData = JSON.parse(decrypt(account.accessToken!));
      
      this.googleOAuth2Client.setCredentials({
        refresh_token: decrypt(account.refreshToken!),
      });

      const { credentials } = await this.googleOAuth2Client.refreshAccessToken();
      
      const newTokenData: TokenData = {
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token || tokenData.refreshToken,
        expiresAt: credentials.expiry_date!,
      };

      await storage.updateEmailAccount(emailAccountId, {
        accessToken: encrypt(JSON.stringify(newTokenData)),
        refreshToken: encrypt(newTokenData.refreshToken),
        lastChecked: new Date(),
      });

      return newTokenData.accessToken;
    } catch (error) {
      console.error('Error refreshing Google tokens:', error);
      throw new Error('Failed to refresh Gmail tokens');
    }
  }

  // Refresh Microsoft tokens
  async refreshMicrosoftTokens(emailAccountId: string): Promise<string> {
    try {
      const account = await storage.getEmailAccount(emailAccountId);
      if (!account || account.provider !== 'outlook') {
        throw new Error('Invalid email account');
      }

      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.microsoftClientId,
          client_secret: this.microsoftClientSecret,
          refresh_token: decrypt(account.refreshToken!),
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error('Token refresh failed');
      }

      const newTokenData: TokenData = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || decrypt(account.refreshToken!),
        expiresAt: Date.now() + (tokens.expires_in * 1000),
      };

      await storage.updateEmailAccount(emailAccountId, {
        accessToken: encrypt(JSON.stringify(newTokenData)),
        refreshToken: encrypt(newTokenData.refreshToken),
        lastChecked: new Date(),
      });

      return newTokenData.accessToken;
    } catch (error) {
      console.error('Error refreshing Microsoft tokens:', error);
      throw new Error('Failed to refresh Outlook tokens');
    }
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken(emailAccountId: string): Promise<string> {
    try {
      const account = await storage.getEmailAccount(emailAccountId);
      if (!account) {
        throw new Error('Email account not found');
      }

      let tokenData: TokenData;
      try {
        // Try to parse as JSON (encrypted format)
        const decryptedData = decrypt(account.accessToken!);
        tokenData = JSON.parse(decryptedData);
      } catch (error) {
        // If parsing fails, it's likely a plain text token from OAuth flow
        console.log('Token is not JSON format, treating as plain access token');
        return account.accessToken!; // Return the plain token directly
      }
      
      // Check if token is still valid (with 5-minute buffer)
      if (Date.now() < (tokenData.expiresAt - 5 * 60 * 1000)) {
        return tokenData.accessToken;
      }

      // Token needs refresh
      if (account.provider === 'gmail') {
        return await this.refreshGoogleTokens(emailAccountId);
      } else if (account.provider === 'outlook') {
        return await this.refreshMicrosoftTokens(emailAccountId);
      }

      throw new Error('Unsupported email provider');
    } catch (error) {
      console.error('Error getting valid access token:', error);
      throw error;
    }
  }
}

export const oauthService = new OAuthService();