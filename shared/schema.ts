import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  tenantId: varchar("tenant_id").notNull(),
  role: varchar("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenant table for multi-tenant architecture
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  plan: varchar("plan").notNull().default("enterprise"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email accounts configuration
export const emailAccounts = pgTable("email_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  email: varchar("email").notNull(),
  provider: varchar("provider").notNull(), // gmail, outlook, imap
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  imapConfig: jsonb("imap_config"), // for custom IMAP
  isActive: boolean("is_active").default(true),
  lastChecked: timestamp("last_checked"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ERP system configurations
export const erpSystems = pgTable("erp_systems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // netsuite, sap, oracle
  endpoint: varchar("endpoint").notNull(),
  credentials: jsonb("credentials"), // encrypted credentials
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI model configurations
export const aiConfigurations = pgTable("ai_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  provider: varchar("provider").notNull(), // openai, anthropic, custom
  modelName: varchar("model_name").notNull(),
  apiKey: text("api_key"),
  endpoint: varchar("endpoint"), // for custom models
  configuration: jsonb("configuration"), // model-specific config
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  poNumber: varchar("po_number").notNull(),
  vendorName: varchar("vendor_name").notNull(),
  vendorAddress: text("vendor_address"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
  currency: varchar("currency").default("USD"),
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed, requires_attention
  emailSource: varchar("email_source"), // source email ID
  originalEmail: jsonb("original_email"), // full email content
  extractedData: jsonb("extracted_data"), // LLM extracted data
  validationResults: jsonb("validation_results"),
  erpPushResult: jsonb("erp_push_result"),
  failureReason: text("failure_reason"),
  humanReviewRequired: boolean("human_review_required").default(false),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor master data for validation
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: varchar("name").notNull(),
  alternateNames: jsonb("alternate_names"), // array of alternate names
  address: text("address"),
  taxId: varchar("tax_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Processing workflow logs
export const processingLogs = pgTable("processing_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  purchaseOrderId: varchar("purchase_order_id"),
  stage: varchar("stage").notNull(), // email_detection, ocr_processing, data_validation, erp_formatting, erp_integration
  status: varchar("status").notNull(), // started, completed, failed
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in milliseconds
  details: jsonb("details"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  userId: varchar("user_id"),
  type: varchar("type").notNull(), // failure, success, warning
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedEntity: varchar("related_entity"), // PO ID or other entity
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const upsertUserSchema = createInsertSchema(users);
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertErpSystemSchema = createInsertSchema(erpSystems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertAiConfigurationSchema = createInsertSchema(aiConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertProcessingLogSchema = createInsertSchema(processingLogs).omit({
  id: true,
  createdAt: true,
});
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;
export type ErpSystem = typeof erpSystems.$inferSelect;
export type InsertErpSystem = z.infer<typeof insertErpSystemSchema>;
export type AiConfiguration = typeof aiConfigurations.$inferSelect;
export type InsertAiConfiguration = z.infer<typeof insertAiConfigurationSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type ProcessingLog = typeof processingLogs.$inferSelect;
export type InsertProcessingLog = z.infer<typeof insertProcessingLogSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
