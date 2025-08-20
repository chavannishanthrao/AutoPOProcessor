import {
  users,
  tenants,
  emailAccounts,
  erpSystems,
  aiConfigurations,
  purchaseOrders,
  vendors,
  processingLogs,
  notifications,
  type User,
  type UpsertUser,
  type Tenant,
  type InsertTenant,
  type EmailAccount,
  type InsertEmailAccount,
  type ErpSystem,
  type InsertErpSystem,
  type AiConfiguration,
  type InsertAiConfiguration,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type Vendor,
  type InsertVendor,
  type ProcessingLog,
  type InsertProcessingLog,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Tenant operations
  getTenant(id: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  
  // Email account operations
  getEmailAccounts(tenantId: string): Promise<EmailAccount[]>;
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  updateEmailAccount(id: string, account: Partial<EmailAccount>): Promise<EmailAccount>;
  deleteEmailAccount(id: string): Promise<void>;
  
  // ERP system operations
  getErpSystems(tenantId: string): Promise<ErpSystem[]>;
  createErpSystem(system: InsertErpSystem): Promise<ErpSystem>;
  updateErpSystem(id: string, system: Partial<ErpSystem>): Promise<ErpSystem>;
  deleteErpSystem(id: string): Promise<void>;
  
  // AI configuration operations
  getAiConfigurations(tenantId: string): Promise<AiConfiguration[]>;
  createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration>;
  updateAiConfiguration(id: string, config: Partial<AiConfiguration>): Promise<AiConfiguration>;
  deleteAiConfiguration(id: string): Promise<void>;
  getActiveAiConfiguration(tenantId: string): Promise<AiConfiguration | undefined>;
  
  // Purchase order operations
  getPurchaseOrders(tenantId: string, limit?: number): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: string, po: Partial<PurchaseOrder>): Promise<PurchaseOrder>;
  getFailedPurchaseOrders(tenantId: string): Promise<PurchaseOrder[]>;
  
  // Vendor operations
  getVendors(tenantId: string): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  findVendorByName(tenantId: string, name: string): Promise<Vendor | undefined>;
  
  // Processing log operations
  createProcessingLog(log: InsertProcessingLog): Promise<ProcessingLog>;
  getProcessingLogs(tenantId: string, purchaseOrderId?: string): Promise<ProcessingLog[]>;
  
  // Notification operations
  getNotifications(tenantId: string, userId?: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Tenant operations
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(tenantData).returning();
    return tenant;
  }
  
  // Email account operations
  async getEmailAccounts(tenantId: string): Promise<EmailAccount[]> {
    return db.select().from(emailAccounts).where(eq(emailAccounts.tenantId, tenantId));
  }

  async createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
    const [emailAccount] = await db.insert(emailAccounts).values(account).returning();
    return emailAccount;
  }

  async updateEmailAccount(id: string, account: Partial<EmailAccount>): Promise<EmailAccount> {
    const [updated] = await db
      .update(emailAccounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(emailAccounts.id, id))
      .returning();
    return updated;
  }

  async deleteEmailAccount(id: string): Promise<void> {
    await db.delete(emailAccounts).where(eq(emailAccounts.id, id));
  }
  
  // ERP system operations
  async getErpSystems(tenantId: string): Promise<ErpSystem[]> {
    return db.select().from(erpSystems).where(eq(erpSystems.tenantId, tenantId));
  }

  async createErpSystem(system: InsertErpSystem): Promise<ErpSystem> {
    const [erpSystem] = await db.insert(erpSystems).values(system).returning();
    return erpSystem;
  }

  async updateErpSystem(id: string, system: Partial<ErpSystem>): Promise<ErpSystem> {
    const [updated] = await db
      .update(erpSystems)
      .set({ ...system, updatedAt: new Date() })
      .where(eq(erpSystems.id, id))
      .returning();
    return updated;
  }

  async deleteErpSystem(id: string): Promise<void> {
    await db.delete(erpSystems).where(eq(erpSystems.id, id));
  }
  
  // AI configuration operations
  async getAiConfigurations(tenantId: string): Promise<AiConfiguration[]> {
    return db.select().from(aiConfigurations).where(eq(aiConfigurations.tenantId, tenantId));
  }

  async createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration> {
    // Deactivate other configs if this one is active
    if (config.isActive) {
      await db
        .update(aiConfigurations)
        .set({ isActive: false })
        .where(eq(aiConfigurations.tenantId, config.tenantId));
    }
    
    const [aiConfig] = await db.insert(aiConfigurations).values(config).returning();
    return aiConfig;
  }

  async updateAiConfiguration(id: string, config: Partial<AiConfiguration>): Promise<AiConfiguration> {
    // If setting as active, deactivate others
    if (config.isActive) {
      const current = await db.select().from(aiConfigurations).where(eq(aiConfigurations.id, id));
      if (current[0]) {
        await db
          .update(aiConfigurations)
          .set({ isActive: false })
          .where(eq(aiConfigurations.tenantId, current[0].tenantId));
      }
    }
    
    const [updated] = await db
      .update(aiConfigurations)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(aiConfigurations.id, id))
      .returning();
    return updated;
  }

  async deleteAiConfiguration(id: string): Promise<void> {
    await db.delete(aiConfigurations).where(eq(aiConfigurations.id, id));
  }

  async getActiveAiConfiguration(tenantId: string): Promise<AiConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(aiConfigurations)
      .where(and(eq(aiConfigurations.tenantId, tenantId), eq(aiConfigurations.isActive, true)));
    return config;
  }
  
  // Purchase order operations
  async getPurchaseOrders(tenantId: string, limit = 50): Promise<PurchaseOrder[]> {
    return db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.tenantId, tenantId))
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(limit);
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return po;
  }

  async createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [purchaseOrder] = await db.insert(purchaseOrders).values(po).returning();
    return purchaseOrder;
  }

  async updatePurchaseOrder(id: string, po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const [updated] = await db
      .update(purchaseOrders)
      .set({ ...po, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return updated;
  }

  async getFailedPurchaseOrders(tenantId: string): Promise<PurchaseOrder[]> {
    return db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.tenantId, tenantId),
          eq(purchaseOrders.humanReviewRequired, true)
        )
      )
      .orderBy(desc(purchaseOrders.createdAt));
  }
  
  // Vendor operations
  async getVendors(tenantId: string): Promise<Vendor[]> {
    return db
      .select()
      .from(vendors)
      .where(eq(vendors.tenantId, tenantId))
      .orderBy(vendors.name);
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  async findVendorByName(tenantId: string, name: string): Promise<Vendor | undefined> {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.tenantId, tenantId), eq(vendors.name, name)));
    return vendor;
  }
  
  // Processing log operations
  async createProcessingLog(log: InsertProcessingLog): Promise<ProcessingLog> {
    const [processingLog] = await db.insert(processingLogs).values(log).returning();
    return processingLog;
  }

  async getProcessingLogs(tenantId: string, purchaseOrderId?: string): Promise<ProcessingLog[]> {
    let query = db
      .select()
      .from(processingLogs)
      .where(eq(processingLogs.tenantId, tenantId));
    
    if (purchaseOrderId) {
      query = query.where(eq(processingLogs.purchaseOrderId, purchaseOrderId));
    }
    
    return query.orderBy(desc(processingLogs.createdAt));
  }
  
  // Notification operations
  async getNotifications(tenantId: string, userId?: string): Promise<Notification[]> {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.tenantId, tenantId));
    
    if (userId) {
      query = query.where(eq(notifications.userId, userId));
    }
    
    return query.orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
