import { ErpSystem, PurchaseOrder } from '@shared/schema';
import { storage } from '../storage';

export class ERPService {
  async pushToERP(purchaseOrder: PurchaseOrder): Promise<{
    success: boolean;
    erpId?: string;
    error?: string;
  }> {
    const erpSystems = await storage.getErpSystems(purchaseOrder.tenantId);
    const activeErpSystem = erpSystems.find(erp => erp.isActive);
    
    if (!activeErpSystem) {
      return { success: false, error: 'No active ERP system configured' };
    }

    switch (activeErpSystem.type) {
      case 'netsuite':
        return this.pushToNetSuite(activeErpSystem, purchaseOrder);
      case 'sap':
        return this.pushToSAP(activeErpSystem, purchaseOrder);
      case 'oracle':
        return this.pushToOracle(activeErpSystem, purchaseOrder);
      default:
        return { success: false, error: `Unsupported ERP type: ${activeErpSystem.type}` };
    }
  }

  private async pushToNetSuite(erpSystem: ErpSystem, po: PurchaseOrder): Promise<{
    success: boolean;
    erpId?: string;
    error?: string;
  }> {
    try {
      const credentials = erpSystem.credentials as any;
      const extractedData = po.extractedData as any;
      
      // NetSuite REST API integration
      const netsuiteData = {
        entity: this.mapVendorToNetSuite(extractedData.vendorName),
        trandate: new Date().toISOString().split('T')[0],
        memo: `PO ${po.poNumber} - Auto-generated from email`,
        item: {
          list: extractedData.lineItems?.map((item: any) => ({
            item: item.description,
            quantity: item.quantity,
            rate: item.unitPrice,
            amount: item.totalPrice,
          })) || []
        }
      };

      const response = await fetch(`${erpSystem.endpoint}/services/rest/record/v1/purchaseorder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
          'NetSuite-Account': credentials.accountId,
        },
        body: JSON.stringify(netsuiteData),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `NetSuite error: ${error}` };
      }

      const result = await response.json();
      return { 
        success: true, 
        erpId: result.id 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  private async pushToSAP(erpSystem: ErpSystem, po: PurchaseOrder): Promise<{
    success: boolean;
    erpId?: string;
    error?: string;
  }> {
    try {
      const credentials = erpSystem.credentials as any;
      const extractedData = po.extractedData as any;
      
      // SAP API integration
      const sapData = {
        PurchaseOrder: po.poNumber,
        Supplier: extractedData.vendorName,
        DocumentDate: new Date().toISOString().split('T')[0],
        PurchaseOrderItem: extractedData.lineItems?.map((item: any, index: number) => ({
          PurchaseOrderItem: ((index + 1) * 10).toString(),
          Material: item.description,
          PurchaseOrderQuantity: item.quantity.toString(),
          NetPriceAmount: item.unitPrice.toString(),
          NetPriceQuantityUnit: "EA"
        })) || []
      };

      const response = await fetch(`${erpSystem.endpoint}/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials.basicAuth}`,
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'fetch',
        },
        body: JSON.stringify(sapData),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `SAP error: ${error}` };
      }

      const result = await response.json();
      return { 
        success: true, 
        erpId: result.d.PurchaseOrder 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  private async pushToOracle(erpSystem: ErpSystem, po: PurchaseOrder): Promise<{
    success: boolean;
    erpId?: string;
    error?: string;
  }> {
    try {
      // Oracle Fusion Cloud integration
      const credentials = erpSystem.credentials as any;
      const extractedData = po.extractedData as any;
      
      const oracleData = {
        DocumentNumber: po.poNumber,
        Supplier: extractedData.vendorName,
        CurrencyCode: extractedData.currency || 'USD',
        lines: extractedData.lineItems?.map((item: any) => ({
          LineNumber: 1,
          ItemDescription: item.description,
          Quantity: item.quantity,
          UnitPrice: item.unitPrice,
        })) || []
      };

      const response = await fetch(`${erpSystem.endpoint}/fscmRestApi/resources/11.13.18.05/purchaseOrders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/vnd.oracle.adf.resourceitem+json',
        },
        body: JSON.stringify(oracleData),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Oracle error: ${error}` };
      }

      const result = await response.json();
      return { 
        success: true, 
        erpId: result.PurchaseOrderId 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  private mapVendorToNetSuite(vendorName: string): any {
    // Map vendor name to NetSuite internal ID
    // This would typically involve a lookup table or API call
    return {
      internalId: vendorName.toLowerCase().replace(/\s+/g, '-')
    };
  }

  async testERPConnection(erpSystem: ErpSystem): Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      switch (erpSystem.type) {
        case 'netsuite':
          return this.testNetSuiteConnection(erpSystem);
        case 'sap':
          return this.testSAPConnection(erpSystem);
        case 'oracle':
          return this.testOracleConnection(erpSystem);
        default:
          return { success: false, error: 'Unsupported ERP type' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async testNetSuiteConnection(erpSystem: ErpSystem): Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }> {
    const credentials = erpSystem.credentials as any;
    
    const response = await fetch(`${erpSystem.endpoint}/services/rest/record/v1/employee`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.token}`,
        'NetSuite-Account': credentials.accountId,
      },
    });

    if (response.ok) {
      return { success: true, details: { status: 'Connected' } };
    } else {
      const error = await response.text();
      return { success: false, error: `Connection failed: ${error}` };
    }
  }

  private async testSAPConnection(erpSystem: ErpSystem): Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }> {
    const credentials = erpSystem.credentials as any;
    
    const response = await fetch(`${erpSystem.endpoint}/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/$metadata`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials.basicAuth}`,
      },
    });

    if (response.ok) {
      return { success: true, details: { status: 'Connected' } };
    } else {
      const error = await response.text();
      return { success: false, error: `Connection failed: ${error}` };
    }
  }

  private async testOracleConnection(erpSystem: ErpSystem): Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }> {
    const credentials = erpSystem.credentials as any;
    
    const response = await fetch(`${erpSystem.endpoint}/fscmRestApi/resources/11.13.18.05/purchaseOrders?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.token}`,
      },
    });

    if (response.ok) {
      return { success: true, details: { status: 'Connected' } };
    } else {
      const error = await response.text();
      return { success: false, error: `Connection failed: ${error}` };
    }
  }
}

export const erpService = new ERPService();
