import * as mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import { createWorker } from 'tesseract.js';

class DocumentProcessor {
  private tesseractWorker: Tesseract.Worker | null = null;

  async initializeTesseract(): Promise<void> {
    if (!this.tesseractWorker) {
      this.tesseractWorker = await createWorker('eng');
    }
  }

  async extractText(data: Buffer, contentType: string, filename: string): Promise<string> {
    try {
      console.log(`Extracting text from ${filename} (${contentType})`);

      if (contentType === 'application/pdf') {
        return await this.extractFromPDF(data);
      } else if (contentType.startsWith('image/')) {
        return await this.extractFromImage(data);
      } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.extractFromDocx(data);
      } else {
        console.log(`Unsupported content type: ${contentType}`);
        return '';
      }
    } catch (error) {
      console.error(`Error extracting text from ${filename}:`, error);
      return '';
    }
  }

  private async extractFromPDF(data: Buffer): Promise<string> {
    try {
      // Use a safer import for pdf-parse
      const pdfParse = await import('pdf-parse/lib/pdf-parse.js');
      const pdf = await pdfParse.default(data);
      return pdf.text;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      // Fallback to OCR for PDFs if parsing fails
      return await this.extractFromImage(data);
    }
  }

  private async extractFromImage(data: Buffer): Promise<string> {
    try {
      await this.initializeTesseract();
      if (!this.tesseractWorker) {
        throw new Error('Tesseract worker not initialized');
      }

      const { data: { text } } = await this.tesseractWorker.recognize(data);
      return text.trim();
    } catch (error) {
      console.error('Error extracting image text:', error);
      return '';
    }
  }

  private async extractFromDocx(data: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: data });
      return result.value;
    } catch (error) {
      console.error('Error extracting DOCX text:', error);
      return '';
    }
  }

  async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }
}

export const documentProcessor = new DocumentProcessor();

// Cleanup on process exit
process.on('exit', () => {
  documentProcessor.cleanup();
});

process.on('SIGINT', () => {
  documentProcessor.cleanup();
  process.exit();
});

process.on('SIGTERM', () => {
  documentProcessor.cleanup();
  process.exit();
});