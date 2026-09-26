import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'expense-attachments';

@Injectable()
export class ExpenseAttachmentStorageService {
  private readonly logger = new Logger(ExpenseAttachmentStorageService.name);
  private readonly supabase: SupabaseClient | null = null;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_KEY');

    if (!url || !serviceKey) {
      this.logger.warn(
        'SUPABASE_SERVICE_KEY not configured — expense attachment storage disabled. ' +
          'Set it in apps/api/.env to enable.'
      );
      this.enabled = false;
    } else {
      this.supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
      this.enabled = true;
    }
  }

  async upload(
    tenantId: string,
    fileId: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<string> {
    if (!this.enabled || !this.supabase) {
      throw new Error('Expense attachment storage not configured');
    }

    const path = this.buildPath(tenantId, fileId);

    const { error } = await this.supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });

    if (error) {
      this.logger.error(`Failed to upload expense attachment ${fileId}: ${error.message}`);
      throw error;
    }

    return path;
  }

  async getPublicUrl(storagePath: string): Promise<string> {
    if (!this.enabled || !this.supabase) {
      throw new Error('Expense attachment storage not configured');
    }

    const { data } = this.supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  async download(storagePath: string): Promise<Buffer | null> {
    if (!this.enabled || !this.supabase) return null;

    const { data, error } = await this.supabase.storage.from(BUCKET).download(storagePath);

    if (error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return null;
      }
      this.logger.error(`Failed to download expense attachment at ${storagePath}: ${error.message}`);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(storagePath: string): Promise<void> {
    if (!this.enabled || !this.supabase) return;

    const { error } = await this.supabase.storage.from(BUCKET).remove([storagePath]);
    if (error && !error.message.includes('not found')) {
      this.logger.warn(`Failed to delete expense attachment at ${storagePath}: ${error.message}`);
    }
  }

  buildPath(tenantId: string, fileId: string): string {
    return `${tenantId}/${fileId}`;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }
}
