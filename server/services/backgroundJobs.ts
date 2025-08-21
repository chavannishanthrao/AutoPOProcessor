import { storage } from '../storage';
import { emailService } from './emailService';
import { aiService } from './aiService';
import { erpService } from './erpService';
import { PurchaseOrder } from '@shared/schema';

export class BackgroundJobs {
  private emailCheckInterval: NodeJS.Timeout | null = null;
  private tenantIntervals: Map<string, NodeJS.Timeout> = new Map();

  startEmailMonitoring(): void {
    console.log('Starting email monitoring...');
    
    // Check every 5 minutes (300,000 ms)
    this.emailCheckInterval = setInterval(async () => {
      await this.checkAllTenantsEmails();
    }, 5 * 60 * 1000);
    
    // Initial check
    setTimeout(() => this.checkAllTenantsEmails(), 5000);
  }

  stopEmailMonitoring(): void {
    if (this.emailCheckInterval) {
      clearInterval(this.emailCheckInterval);
      this.emailCheckInterval = null;
    }
    
    // Clear tenant-specific intervals
    for (const [tenantId, interval] of this.tenantIntervals) {
      clearInterval(interval);
    }
    this.tenantIntervals.clear();
  }

  private async checkAllTenantsEmails(): Promise<void> {
    try {
      // Import the email processor dynamically to avoid circular dependencies
      const { emailProcessor } = await import('./emailProcessor');
      
      // Get all active email accounts across all tenants
      // We'll need a method to get all email accounts (not tenant-specific)
      const query = `SELECT DISTINCT tenant_id FROM email_accounts WHERE is_active = true`;
      
      // For now, let's get accounts by checking all known tenants
      // In production, you'd want a more efficient approach
      const tenantIds = await this.getAllActiveTenantIds();
      
      for (const tenantId of tenantIds) {
        const emailAccounts = await storage.getEmailAccounts(tenantId);
        const activeAccounts = emailAccounts.filter(acc => acc.isActive);
        
        for (const account of activeAccounts) {
          console.log(`Processing emails for account: ${account.email}`);
          await emailProcessor.processEmailsForAccount(account);
        }
      }
    } catch (error) {
      console.error('Error checking emails for all tenants:', error);
    }
  }

  private async getAllActiveTenantIds(): Promise<string[]> {
    try {
      // Get all tenants that have active email accounts
      const allTenants = await storage.getUsersByTenantId(''); // This needs modification
      // For now, we'll use a simple approach - get all users and extract tenant IDs
      const users = await this.getAllUsers();
      return [...new Set(users.map(user => user.tenantId))];
    } catch (error) {
      console.error('Error getting active tenant IDs:', error);
      return [];
    }
  }

  private async getAllUsers(): Promise<any[]> {
    // This would need a new storage method to get all users
    // For now, return empty array to prevent errors
    return [];
  }

  async processPurchaseOrder(purchaseOrderId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      const po = await storage.getPurchaseOrder(purchaseOrderId);
      if (!po) {
        throw new Error('Purchase order not found');
      }

      console.log(`Processing PO: ${po.poNumber}`);

      // Stage 1: Email Detection (already completed)
      await this.logProcessingStage(po.tenantId, purchaseOrderId, 'email_detection', 'completed', startTime);

      // Stage 2: OCR Processing (already completed if we have extractedData)
      await this.logProcessingStage(po.tenantId, purchaseOrderId, 'ocr_processing', 'completed', startTime);

      // Stage 3: Data Validation
      const validationStartTime = Date.now();
      await this.logProcessingStage(po.tenantId, purchaseOrderId, 'data_validation', 'started', validationStartTime);
      
      const validationResult = await this.validatePOData(po);
      
      await this.logProcessingStage(
        po.tenantId, 
        purchaseOrderId, 
        'data_validation', 
        validationResult.isValid ? 'completed' : 'failed',
        validationStartTime,
        validationResult
      );

      if (!validationResult.isValid) {
        await storage.updatePurchaseOrder(purchaseOrderId, {
          status: 'failed',
          humanReviewRequired: true,
          failureReason: validationResult.reason,
        });
        
        await this.sendFailureNotification(po, validationResult.reason);
        return;
      }

      // Stage 4: ERP Formatting
      const erpFormattingStartTime = Date.now();
      await this.logProcessingStage(po.tenantId, purchaseOrderId, 'erp_formatting', 'started', erpFormattingStartTime);
      
      const formattedData = await this.formatForERP(po);
      
      await this.logProcessingStage(po.tenantId, purchaseOrderId, 'erp_formatting', 'completed', erpFormattingStartTime);

      // Stage 5: ERP Integration
      const erpIntegrationStartTime = Date.now();
      await this.logProcessingStage(po.tenantId, purchaseOrderId, 'erp_integration', 'started', erpIntegrationStartTime);
      
      const erpResult = await erpService.pushToERP(po);
      
      await this.logProcessingStage(
        po.tenantId, 
        purchaseOrderId, 
        'erp_integration', 
        erpResult.success ? 'completed' : 'failed',
        erpIntegrationStartTime,
        erpResult
      );

      if (erpResult.success) {
        await storage.updatePurchaseOrder(purchaseOrderId, {
          status: 'completed',
          processedAt: new Date(),
          erpPushResult: erpResult,
        });
        
        await storage.createNotification({
          tenantId: po.tenantId,
          type: 'success',
          title: 'PO Processed Successfully',
          message: `Purchase Order ${po.poNumber} has been successfully processed and pushed to ERP system.`,
          relatedEntity: purchaseOrderId,
        });
      } else {
        await storage.updatePurchaseOrder(purchaseOrderId, {
          status: 'failed',
          humanReviewRequired: true,
          failureReason: `ERP Integration failed: ${erpResult.error}`,
        });
        
        await this.sendFailureNotification(po, `ERP Integration failed: ${erpResult.error}`);
      }

    } catch (error: any) {
      console.error(`Error processing PO ${purchaseOrderId}:`, error);
      
      const po = await storage.getPurchaseOrder(purchaseOrderId);
      if (po) {
        await storage.updatePurchaseOrder(purchaseOrderId, {
          status: 'failed',
          humanReviewRequired: true,
          failureReason: error.message,
        });
        
        await this.sendFailureNotification(po, error.message);
      }
    }
  }

  private async logProcessingStage(
    tenantId: string,
    purchaseOrderId: string,
    stage: string,
    status: string,
    startTime: number,
    details?: any
  ): Promise<void> {
    const endTime = status !== 'started' ? Date.now() : undefined;
    const duration = endTime ? endTime - startTime : undefined;

    await storage.createProcessingLog({
      tenantId,
      purchaseOrderId,
      stage,
      status,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      duration,
      details,
      errorMessage: status === 'failed' ? details?.error || details?.reason : undefined,
    });
  }

  private async validatePOData(po: PurchaseOrder): Promise<{
    isValid: boolean;
    reason?: string;
    matchedVendor?: any;
  }> {
    const extractedData = po.extractedData as any;
    
    if (!extractedData || !extractedData.vendorName) {
      return {
        isValid: false,
        reason: 'Missing vendor information in extracted data'
      };
    }

    // Get master vendor data
    const vendors = await storage.getVendors(po.tenantId);
    
    // Use AI service for vendor validation
    const aiConfig = await storage.getActiveAiConfiguration(po.tenantId);
    if (!aiConfig) {
      return {
        isValid: false,
        reason: 'No active AI configuration found'
      };
    }

    const validationResult = await aiService.validateVendorData(extractedData, vendors);
    
    if (!validationResult.isValid) {
      return {
        isValid: false,
        reason: `Vendor "${extractedData.vendorName}" not found in master data. ${
          validationResult.suggestions?.length 
            ? `Suggestions: ${validationResult.suggestions.join(', ')}` 
            : 'No similar vendors found.'
        }`
      };
    }

    return {
      isValid: true,
      matchedVendor: validationResult.matchedVendor
    };
  }

  private async formatForERP(po: PurchaseOrder): Promise<any> {
    // Format PO data according to ERP requirements
    const extractedData = po.extractedData as any;
    
    return {
      ...extractedData,
      formattedForERP: true,
      processedAt: new Date().toISOString(),
    };
  }

  private async sendFailureNotification(po: PurchaseOrder, reason: string): Promise<void> {
    await storage.createNotification({
      tenantId: po.tenantId,
      type: 'failure',
      title: 'PO Processing Failed',
      message: `Purchase Order ${po.poNumber} failed to process: ${reason}`,
      relatedEntity: po.id,
    });

    // TODO: Send email notification to configured admin email
    console.log(`Failure notification: PO ${po.poNumber} failed - ${reason}`);
  }

  async reprocessFailedPO(purchaseOrderId: string, updatedData?: any): Promise<void> {
    const po = await storage.getPurchaseOrder(purchaseOrderId);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    // Update PO with corrected data if provided
    if (updatedData) {
      await storage.updatePurchaseOrder(purchaseOrderId, {
        extractedData: { ...po.extractedData, ...updatedData },
        status: 'processing',
        humanReviewRequired: false,
        failureReason: undefined,
      });
    }

    // Restart processing workflow
    await this.processPurchaseOrder(purchaseOrderId);
  }
}

export const backgroundJobs = new BackgroundJobs();

// Start background jobs when module is loaded
backgroundJobs.startEmailMonitoring();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down background jobs...');
  backgroundJobs.stopEmailMonitoring();
  process.exit(0);
});
