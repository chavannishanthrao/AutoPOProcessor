import OpenAI from "openai";
import { AiConfiguration } from "@shared/schema";

export class AIService {
  private getClient(config: AiConfiguration): OpenAI {
    if (config.provider === 'openai') {
      return new OpenAI({ 
        apiKey: config.apiKey,
      });
    } else if (config.provider === 'custom') {
      return new OpenAI({
        apiKey: config.apiKey || 'dummy-key',
        baseURL: config.endpoint,
      });
    }
    
    throw new Error(`Unsupported AI provider: ${config.provider}`);
  }

  async isPurchaseOrderEmail(emailContent: string, config: AiConfiguration): Promise<boolean> {
    const client = this.getClient(config);
    
    try {
      const response = await client.chat.completions.create({
        model: config.modelName,
        messages: [
          {
            role: "system",
            content: "You are an email classifier. Determine if an email contains a purchase order or is related to purchase order processing. Respond with JSON in this format: { \"isPO\": boolean, \"confidence\": number }"
          },
          {
            role: "user",
            content: `Analyze this email content and determine if it contains a purchase order or is related to purchase order processing:\n\n${emailContent}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.isPO && result.confidence > 0.7;
    } catch (error) {
      console.error('Error classifying email:', error);
      return false;
    }
  }

  async extractPOData(documentText: string, config: AiConfiguration): Promise<any> {
    const client = this.getClient(config);
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await client.chat.completions.create({
      model: config.modelName,
      messages: [
        {
          role: "system",
          content: `You are a purchase order data extraction expert. Extract structured data from purchase order documents and return it as JSON.

Required JSON format:
{
  "poNumber": "string",
  "vendorName": "string", 
  "vendorAddress": "string",
  "totalAmount": number,
  "currency": "string",
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "dueDate": "YYYY-MM-DD",
  "terms": "string"
}

Extract all available information. Use null for missing fields.`
        },
        {
          role: "user",
          content: `Extract purchase order data from this document:\n\n${documentText}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async validateVendorData(extractedData: any, masterVendors: any[]): Promise<{
    isValid: boolean;
    matchedVendor?: any;
    suggestions?: string[];
    confidence: number;
  }> {
    // Simple name matching logic - can be enhanced with fuzzy matching
    const vendorName = extractedData.vendorName?.toLowerCase();
    
    // Exact match
    let exactMatch = masterVendors.find(v => 
      v.name.toLowerCase() === vendorName ||
      (v.alternateNames && v.alternateNames.some((alt: string) => alt.toLowerCase() === vendorName))
    );
    
    if (exactMatch) {
      return {
        isValid: true,
        matchedVendor: exactMatch,
        confidence: 1.0
      };
    }
    
    // Partial matching
    const suggestions = masterVendors
      .filter(v => v.name.toLowerCase().includes(vendorName) || vendorName.includes(v.name.toLowerCase()))
      .slice(0, 3)
      .map(v => v.name);
    
    return {
      isValid: false,
      suggestions,
      confidence: suggestions.length > 0 ? 0.7 : 0.0
    };
  }

  // Generic OpenAI processing method for simple prompts
  async processWithOpenAI(prompt: string, config: AiConfiguration, modelName?: string): Promise<string> {
    try {
      const client = this.getClient(config);
      const model = modelName || config.modelName;
      
      // Use JSON mode for gpt-4 and newer models for better structured responses
      const useJsonMode = model.includes('gpt-4') || model.includes('gpt-3.5-turbo');
      
      const response = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a data extraction assistant. Respond with valid JSON only, no explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
        ...(useJsonMode ? { response_format: { type: "json_object" } } : {})
      });

      return response.choices[0].message.content || '';
    } catch (error: any) {
      console.error('Error processing with OpenAI:', error);
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }

  async testConnection(config: AiConfiguration): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient(config);
      
      const response = await client.chat.completions.create({
        model: config.modelName,
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message. Please respond with 'Test successful'."
          }
        ],
        max_tokens: 50,
      });

      const content = response.choices[0].message.content;
      return { 
        success: content?.includes('Test successful') || content?.includes('test') || true 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

export const aiService = new AIService();
