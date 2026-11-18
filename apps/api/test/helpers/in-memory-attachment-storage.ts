import { ExpenseAttachmentStorageService } from '../../src/modules/expense-attachments/expense-attachment-storage.service';

/**
 * Same contract as ExpenseAttachmentStorageService, kept in memory: the security suites test
 * tenant isolation in the database and must never write to the real Supabase bucket.
 */
export class InMemoryAttachmentStorage implements Pick<
  ExpenseAttachmentStorageService,
  'upload' | 'getPublicUrl' | 'download' | 'delete' | 'buildPath'
> {
  private readonly files = new Map<string, Buffer>();

  async upload(tenantId: string, fileId: string, buffer: Buffer): Promise<string> {
    const path = this.buildPath(tenantId, fileId);
    this.files.set(path, buffer);
    return path;
  }

  async getPublicUrl(storagePath: string): Promise<string> {
    return `memory://${storagePath}`;
  }

  async download(storagePath: string): Promise<Buffer | null> {
    return this.files.get(storagePath) ?? null;
  }

  async delete(storagePath: string): Promise<void> {
    this.files.delete(storagePath);
  }

  buildPath(tenantId: string, fileId: string): string {
    return `${tenantId}/${fileId}`;
  }
}
