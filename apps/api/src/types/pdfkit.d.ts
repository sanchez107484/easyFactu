// Minimal type declaration for pdfkit to resolve TS7016 error
// This can be replaced with official types if/when available

declare module 'pdfkit' {
  import { Stream } from 'stream';
  export default class PDFDocument {
    constructor(options?: any);
    addPage(options?: any): this;
    text(text: string, x?: number, y?: number, options?: any): this;
    image(src: Buffer | string, x?: number, y?: number, options?: any): this;
    fontSize(size: number): this;
    moveDown(lines?: number): this;
    end(): void;
    on(event: string, callback: (...args: any[]) => void): this;
    // Add more methods as needed for your usage
  }
}
