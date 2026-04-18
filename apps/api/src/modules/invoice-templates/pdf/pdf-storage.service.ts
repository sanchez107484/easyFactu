import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'invoices';
const PLACEHOLDER = '[YOUR-SERVICE-ROLE-KEY]';

@Injectable()
export class PdfStorageService {
  private readonly logger = new Logger(PdfStorageService.name);
  private readonly supabase: SupabaseClient | null = null;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_KEY');

    if (!url || !serviceKey || serviceKey === PLACEHOLDER) {
      this.logger.warn(
        'SUPABASE_SERVICE_KEY not configured — PDF caching disabled. ' +
          'Set it in apps/api/.env to enable.'
      );
      this.enabled = false;
    } else {
      this.supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
      this.enabled = true;
    }
  }

  /**
   * Uploads a PDF buffer to Supabase Storage and returns the stored path.
   * Path format: {tenantId}/{invoiceId}-{hash}.pdf (or {tenantId}/{invoiceId}.pdf if no hash)
   * Returns null if storage is not configured.
   */
  async upload(
    tenantId: string,
    invoiceId: string,
    buffer: Buffer,
    contentHash?: string
  ): Promise<string> {
    if (!this.enabled || !this.supabase) throw new Error('PDF storage not configured');

    const path = contentHash
      ? this.buildHashedPath(tenantId, invoiceId, contentHash)
      : this.buildPath(tenantId, invoiceId);

    const { error } = await this.supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (error) {
      this.logger.error(`Failed to upload PDF for invoice ${invoiceId}: ${error.message}`);
      throw error;
    }

    return path;
  }

  /**
   * Downloads a PDF from Supabase Storage and returns its buffer.
   * Returns null if the file does not exist or storage is not configured.
   */
  async download(storagePath: string): Promise<Buffer | null> {
    if (!this.enabled || !this.supabase) return null;

    const { data, error } = await this.supabase.storage.from(BUCKET).download(storagePath);

    if (error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return null;
      }
      this.logger.error(`Failed to download PDF at ${storagePath}: ${error.message}`);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Deletes a stored PDF. Used when an invoice is modified (cache invalidation).
   * Silently ignores non-existent files or unconfigured storage.
   */
  async delete(storagePath: string): Promise<void> {
    if (!this.enabled || !this.supabase) return;

    const { error } = await this.supabase.storage.from(BUCKET).remove([storagePath]);
    if (error && !error.message.includes('not found')) {
      this.logger.warn(`Failed to delete PDF at ${storagePath}: ${error.message}`);
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  buildPath(tenantId: string, invoiceId: string): string {
    return `${tenantId}/${invoiceId}.pdf`;
  }

  buildHashedPath(tenantId: string, invoiceId: string, contentHash: string): string {
    return `${tenantId}/${invoiceId}-${contentHash}.pdf`;
  }
}
