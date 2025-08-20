import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import tesseract from 'tesseract.js';

export class DocumentProcessor {
  async extractText(attachment: any): Promise<string> {
    const mimeType = attachment.mimeType;
    const data = attachment.data; // Base64 or buffer data
    
    switch (mimeType) {
      case 'application/pdf':
        return this.extractFromPDF(data);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return this.extractFromWord(data);
      case 'image/jpeg':
      case 'image/png':
      case 'image/tiff':
        return this.extractFromImage(data);
      case 'text/plain':
        return this.extractFromText(data);
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }

  private async extractFromPDF(data: Buffer | string): Promise<string> {
    try {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');
      const pdfData = await pdf(buffer);
      return pdfData.text;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  private async extractFromWord(data: Buffer | string): Promise<string> {
    try {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`Failed to extract text from Word document: ${error.message}`);
    }
  }

  private async extractFromImage(data: Buffer | string): Promise<string> {
    try {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');
      
      // Use Tesseract.js for OCR
      const { data: { text } } = await tesseract.recognize(buffer, 'eng', {
        logger: m => console.log(m)
      });
      
      return text;
    } catch (error) {
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }

  private extractFromText(data: Buffer | string): string {
    if (Buffer.isBuffer(data)) {
      return data.toString('utf-8');
    }
    return Buffer.from(data, 'base64').toString('utf-8');
  }

  async validateDocumentQuality(text: string, minLength = 100): Promise<{
    isValid: boolean;
    confidence: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    let confidence = 1.0;

    // Check minimum length
    if (text.length < minLength) {
      issues.push(`Document too short (${text.length} characters)`);
      confidence -= 0.3;
    }

    // Check for garbled text (high ratio of non-alphabetic characters)
    const alphabeticChars = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = text.length;
    const alphabeticRatio = alphabeticChars / totalChars;

    if (alphabeticRatio < 0.5) {
      issues.push('High ratio of non-alphabetic characters detected');
      confidence -= 0.4;
    }

    // Check for common OCR indicators
    const hasNumbers = /\d/.test(text);
    const hasCurrency = /[\$£€¥]/.test(text);
    const hasCommonPOTerms = /(purchase|order|po|invoice|total|amount|vendor|supplier)/i.test(text);

    if (!hasNumbers) {
      issues.push('No numeric values found');
      confidence -= 0.2;
    }

    if (!hasCurrency && !hasCommonPOTerms) {
      issues.push('No purchase order indicators found');
      confidence -= 0.2;
    }

    return {
      isValid: confidence > 0.5,
      confidence: Math.max(0, confidence),
      issues
    };
  }
}

export const documentProcessor = new DocumentProcessor();
