import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { emailService } from "./services/emailService";
import { aiService } from "./services/aiService";
import { erpService } from "./services/erpService";
import { backgroundJobs } from "./services/backgroundJobs";
import { insertEmailAccountSchema, insertErpSystemSchema, insertAiConfigurationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const purchaseOrders = await storage.getPurchaseOrders(user.tenantId, 100);
      const totalPOs = purchaseOrders.length;
      const completedPOs = purchaseOrders.filter(po => po.status === 'completed').length;
      const failedPOs = purchaseOrders.filter(po => po.status === 'failed').length;
      const successRate = totalPOs > 0 ? (completedPOs / totalPOs) * 100 : 0;

      // Calculate average processing time
      const processedPOs = purchaseOrders.filter(po => po.processedAt && po.createdAt);
      const avgProcessingTime = processedPOs.length > 0 
        ? processedPOs.reduce((acc, po) => {
            const duration = new Date(po.processedAt!).getTime() - new Date(po.createdAt).getTime();
            return acc + duration;
          }, 0) / processedPOs.length / 1000 / 60 // Convert to minutes
        : 0;

      res.json({
        totalPOs,
        successRate: Math.round(successRate * 10) / 10,
        avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
        costSavings: totalPOs * 15.2, // Estimated savings per PO
      });
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Purchase orders
  app.get('/api/purchase-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const purchaseOrders = await storage.getPurchaseOrders(user.tenantId, limit);
      res.json(purchaseOrders);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  app.get('/api/purchase-orders/failed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const failedPOs = await storage.getFailedPurchaseOrders(user.tenantId);
      res.json(failedPOs);
    } catch (error) {
      console.error("Error fetching failed purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch failed purchase orders" });
    }
  });

  app.post('/api/purchase-orders/:id/reprocess', isAuthenticated, async (req: any, res) => {
    try {
      const purchaseOrderId = req.params.id;
      const updatedData = req.body;

      await backgroundJobs.reprocessFailedPO(purchaseOrderId, updatedData);
      res.json({ message: 'Purchase order reprocessing started' });
    } catch (error) {
      console.error("Error reprocessing purchase order:", error);
      res.status(500).json({ message: "Failed to reprocess purchase order" });
    }
  });

  // Email accounts
  app.get('/api/email-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const emailAccounts = await storage.getEmailAccounts(user.tenantId);
      // Remove sensitive data
      const sanitized = emailAccounts.map(acc => ({
        ...acc,
        accessToken: undefined,
        refreshToken: undefined,
        imapConfig: acc.provider === 'imap' ? { ...acc.imapConfig, password: undefined } : undefined,
      }));
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching email accounts:", error);
      res.status(500).json({ message: "Failed to fetch email accounts" });
    }
  });

  app.post('/api/email-accounts/gmail/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { authorizationCode } = req.body;
      const emailAccount = await emailService.connectGmail(user.tenantId, authorizationCode);
      res.json(emailAccount);
    } catch (error) {
      console.error("Error connecting Gmail:", error);
      res.status(500).json({ message: "Failed to connect Gmail" });
    }
  });

  app.post('/api/email-accounts/outlook/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { authorizationCode } = req.body;
      const emailAccount = await emailService.connectOutlook(user.tenantId, authorizationCode);
      res.json(emailAccount);
    } catch (error) {
      console.error("Error connecting Outlook:", error);
      res.status(500).json({ message: "Failed to connect Outlook" });
    }
  });

  app.post('/api/email-accounts/imap', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const imapConfig = req.body;
      const emailAccount = await emailService.setupImap(user.tenantId, imapConfig);
      res.json(emailAccount);
    } catch (error) {
      console.error("Error setting up IMAP:", error);
      res.status(500).json({ message: "Failed to setup IMAP" });
    }
  });

  app.delete('/api/email-accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteEmailAccount(req.params.id);
      res.json({ message: 'Email account deleted' });
    } catch (error) {
      console.error("Error deleting email account:", error);
      res.status(500).json({ message: "Failed to delete email account" });
    }
  });

  // ERP systems
  app.get('/api/erp-systems', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const erpSystems = await storage.getErpSystems(user.tenantId);
      // Remove sensitive credentials
      const sanitized = erpSystems.map(erp => ({
        ...erp,
        credentials: undefined,
      }));
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching ERP systems:", error);
      res.status(500).json({ message: "Failed to fetch ERP systems" });
    }
  });

  app.post('/api/erp-systems', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const erpData = insertErpSystemSchema.parse({
        ...req.body,
        tenantId: user.tenantId,
      });

      const erpSystem = await storage.createErpSystem(erpData);
      res.json(erpSystem);
    } catch (error) {
      console.error("Error creating ERP system:", error);
      res.status(500).json({ message: "Failed to create ERP system" });
    }
  });

  app.post('/api/erp-systems/:id/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const erpSystems = await storage.getErpSystems(user.tenantId);
      const erpSystem = erpSystems.find(erp => erp.id === req.params.id);
      
      if (!erpSystem) {
        return res.status(404).json({ message: "ERP system not found" });
      }

      const testResult = await erpService.testERPConnection(erpSystem);
      res.json(testResult);
    } catch (error) {
      console.error("Error testing ERP connection:", error);
      res.status(500).json({ message: "Failed to test ERP connection" });
    }
  });

  // AI configurations
  app.get('/api/ai-configurations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const aiConfigs = await storage.getAiConfigurations(user.tenantId);
      // Remove sensitive API keys
      const sanitized = aiConfigs.map(config => ({
        ...config,
        apiKey: config.apiKey ? '****' : undefined,
      }));
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching AI configurations:", error);
      res.status(500).json({ message: "Failed to fetch AI configurations" });
    }
  });

  app.post('/api/ai-configurations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const aiConfigData = insertAiConfigurationSchema.parse({
        ...req.body,
        tenantId: user.tenantId,
      });

      const aiConfig = await storage.createAiConfiguration(aiConfigData);
      res.json(aiConfig);
    } catch (error) {
      console.error("Error creating AI configuration:", error);
      res.status(500).json({ message: "Failed to create AI configuration" });
    }
  });

  app.post('/api/ai-configurations/:id/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const aiConfigs = await storage.getAiConfigurations(user.tenantId);
      const aiConfig = aiConfigs.find(config => config.id === req.params.id);
      
      if (!aiConfig) {
        return res.status(404).json({ message: "AI configuration not found" });
      }

      const testResult = await aiService.testConnection(aiConfig);
      res.json(testResult);
    } catch (error) {
      console.error("Error testing AI connection:", error);
      res.status(500).json({ message: "Failed to test AI connection" });
    }
  });

  // Processing logs
  app.get('/api/processing-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const purchaseOrderId = req.query.purchaseOrderId as string;
      const logs = await storage.getProcessingLogs(user.tenantId, purchaseOrderId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching processing logs:", error);
      res.status(500).json({ message: "Failed to fetch processing logs" });
    }
  });

  // Notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const notifications = await storage.getNotifications(user.tenantId, userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'subscribe') {
          // Subscribe to tenant-specific updates
          ws.tenantId = data.tenantId;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
    
    // Send initial connection confirmation
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
    }
  });

  // Broadcast real-time updates (this would be called from background jobs)
  global.broadcastUpdate = (tenantId: string, data: any) => {
    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN && (client as any).tenantId === tenantId) {
        client.send(JSON.stringify(data));
      }
    });
  };

  return httpServer;
}
