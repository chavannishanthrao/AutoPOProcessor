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
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class OAuthService {
  private googleOAuth2Client: any;
  private microsoftClientId: string;
  private microsoftClientSecret: string;

  constructor() {
    // Initialize Google OAuth2 client
    this.googleOAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/auth/google/callback`
    );

    this.microsoftClientId = process.env.MS_CLIENT_ID || '';
    this.microsoftClientSecret = process.env.MS_CLIENT_SECRET || '';
  }

  // Gmail OAuth URLs
  getGmailAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify', // for marking as read
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return this.googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  // Microsoft OAuth URLs
  getMicrosoftAuthUrl(): string {
    const scopes = 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read';
    const redirectUri = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/auth/microsoft/callback`;
    
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${this.microsoftClientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=12345`;
  }

  // Exchange Google authorization code for tokens
  async exchangeGoogleCode(code: string, userId: string, tenantId: string): Promise<void> {
    try {
      const { tokens } = await this.googleOAuth2Client.getToken(code);
      
      // Get user info
      this.googleOAuth2Client.setCredentials(tokens);
      const gmail = google.gmail({ version: 'v1', auth: this.googleOAuth2Client });
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

  // Exchange Microsoft authorization code for tokens
  async exchangeMicrosoftCode(code: string, userId: string, tenantId: string): Promise<void> {
    try {
      const redirectUri = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/auth/microsoft/callback`;
      
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.microsoftClientId,
          client_secret: this.microsoftClientSecret,
          code,
          redirect_uri: redirectUri,
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

      const tokenData: TokenData = JSON.parse(decrypt(account.accessToken!));
      
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