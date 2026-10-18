import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Private bucket — files are only served through the authenticated download endpoint. */
const BUCKET = 'reports';
const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Injectable()
export class ReportsStorageService {
  private readonly logger = new Logger(ReportsStorageService.name);
  private readonly supabase: SupabaseClient | null = null;
  private isBucketReady = false;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_KEY');

    if (url && serviceKey) {
      this.supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    } else {
      this.logger.warn('SUPABASE_SERVICE_KEY not configured — report files will not be stored.');
    }
  }

  get isEnabled(): boolean {
    return this.supabase !== null;
  }

  buildPath(tenantId: string, reportId: string): string {
    return `${tenantId}/${reportId}.xlsx`;
  }

  async upload(storagePath: string, buffer: Buffer): Promise<void> {
    if (!this.supabase) throw new Error('Report storage not configured');

    await this.ensureBucket(this.supabase);
    const { error } = await this.supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: XLSX_MIME_TYPE,
      upsert: false,
    });
    if (error) throw error;
  }

  /** Creates the private bucket on first use so no manual Supabase setup is needed. */
  private async ensureBucket(supabase: SupabaseClient): Promise<void> {
    if (this.isBucketReady) return;

    const { data } = await supabase.storage.getBucket(BUCKET);
    if (!data) {
      const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
      if (error && !error.message.toLowerCase().includes('already exists')) throw error;
    }
    this.isBucketReady = true;
  }

  async download(storagePath: string): Promise<Buffer | null> {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase.storage.from(BUCKET).download(storagePath);
    if (error) {
      this.logger.error(`Failed to download report file: ${error.message}`);
      return null;
    }
    return Buffer.from(await data.arrayBuffer());
  }

  async remove(storagePaths: string[]): Promise<void> {
    if (!this.supabase || storagePaths.length === 0) return;

    const { error } = await this.supabase.storage.from(BUCKET).remove(storagePaths);
    if (error)
      this.logger.warn(`Failed to delete ${storagePaths.length} report files: ${error.message}`);
  }
}
