import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Express } from 'express';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// Prefix used to identify base64-encoded encrypted certificates stored in the DB.
const CERT_BASE64_PREFIX = 'base64:';

export interface UploadResult {
  url: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly maxLogoSize = 2 * 1024 * 1024; // 2MB
  private readonly maxCertificateSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedLogoFormats = ['image/jpeg', 'image/png', 'image/svg+xml'];

  constructor(private prisma: PrismaService) {}

  /**
   * Upload logo for tenant.
   * The file buffer is encoded as a data URL and stored directly in the database,
   * which works in every deployment environment (local, Vercel, etc.).
   */
  async uploadLogo(tenantId: string, file: Express.Multer.File): Promise<UploadResult> {
    this.validateLogoFile(file);

    // Delete old logo filesystem file if one exists from legacy local storage
    await this.deleteOldLogoFile(tenantId);

    // Encode as data URL so the browser can render it without a file server
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: dataUrl },
    });

    return { url: dataUrl, size: file.size };
  }

  /**
   * Upload and encrypt certificate for tenant.
   * The encrypted buffer is base64-encoded and stored in the database,
   * avoiding any filesystem dependency.
   */
  async uploadCertificate(
    tenantId: string,
    file: Express.Multer.File,
    password: string
  ): Promise<UploadResult> {
    this.validateCertificateFile(file);

    // Delete old certificate filesystem file if one exists from legacy local storage
    await this.deleteOldCertificateFile(tenantId);

    const encryptedBuffer = this.encryptBuffer(file.buffer, password);
    const storedValue = `${CERT_BASE64_PREFIX}${encryptedBuffer.toString('base64')}`;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { certificateUrl: storedValue },
    });

    return { url: '', size: file.size };
  }

  /**
   * Delete logo from database (and legacy filesystem file if applicable).
   */
  async deleteLogo(tenantId: string): Promise<void> {
    await this.deleteOldLogoFile(tenantId);
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: null },
    });
  }

  /**
   * Delete certificate from database (and legacy filesystem file if applicable).
   */
  async deleteCertificate(tenantId: string): Promise<void> {
    await this.deleteOldCertificateFile(tenantId);
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { certificateUrl: null, certificateExpiry: null },
    });
  }

  /**
   * Load and decrypt a tenant's certificate as a raw Buffer.
   * Supports both the new base64-in-database format and the legacy filesystem format.
   */
  async loadDecryptedCertificate(tenantId: string, password: string): Promise<Buffer | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { certificateUrl: true },
    });

    if (!tenant?.certificateUrl) return null;

    const encryptedBuffer = this.readCertificateBuffer(tenant.certificateUrl);
    if (!encryptedBuffer) return null;

    return this.decryptBuffer(encryptedBuffer, password);
  }

  /**
   * Decrypt a certificate buffer (used when the caller already holds the raw encrypted bytes).
   */
  decryptCertificate(encryptedBuffer: Buffer, password: string): Buffer {
    return this.decryptBuffer(encryptedBuffer, password);
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Resolve a stored certificateUrl to an encrypted Buffer.
   * Handles the new base64 format and the legacy local-path format.
   */
  private readCertificateBuffer(certificateUrl: string): Buffer | null {
    if (certificateUrl.startsWith(CERT_BASE64_PREFIX)) {
      return Buffer.from(certificateUrl.slice(CERT_BASE64_PREFIX.length), 'base64');
    }

    // Legacy: certificate was stored as a local filesystem path
    const relativePath = certificateUrl.replace(/^\/uploads\//, '');
    const filepath = join(process.cwd(), 'uploads', relativePath);
    if (existsSync(filepath)) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('fs').readFileSync(filepath) as Buffer;
    }

    return null;
  }

  private validateLogoFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    if (file.size > this.maxLogoSize) {
      throw new BadRequestException(
        `El logo no puede superar los ${this.maxLogoSize / 1024 / 1024}MB`
      );
    }

    if (!this.allowedLogoFormats.includes(file.mimetype)) {
      throw new BadRequestException('Formato de logo no permitido. Usa JPG, PNG o SVG');
    }
  }

  private validateCertificateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    if (file.size > this.maxCertificateSize) {
      throw new BadRequestException(
        `El certificado no puede superar los ${this.maxCertificateSize / 1024 / 1024}MB`
      );
    }

    const extension = this.getFileExtension(file.originalname);
    if (!['.pfx', '.p12'].includes(extension.toLowerCase())) {
      throw new BadRequestException('Formato de certificado no permitido. Usa .pfx o .p12');
    }
  }

  /**
   * If the tenant previously stored a logo as a local filesystem path, delete that file.
   * Data-URL values stored in the DB do not need filesystem cleanup.
   */
  private async deleteOldLogoFile(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { logoUrl: true },
    });

    if (tenant?.logoUrl && !tenant.logoUrl.startsWith('data:')) {
      const relativePath = tenant.logoUrl.replace(/^\/uploads\//, '');
      const filepath = join(process.cwd(), 'uploads', relativePath);
      try {
        if (existsSync(filepath)) {
          await unlink(filepath);
        }
      } catch (error) {
        console.error('Error deleting old logo file:', error);
      }
    }
  }

  /**
   * If the tenant previously stored a certificate as a local filesystem path, delete that file.
   * Base64-in-DB values do not need filesystem cleanup.
   */
  private async deleteOldCertificateFile(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { certificateUrl: true },
    });

    if (tenant?.certificateUrl && !tenant.certificateUrl.startsWith(CERT_BASE64_PREFIX)) {
      const relativePath = tenant.certificateUrl.replace(/^\/uploads\//, '');
      const filepath = join(process.cwd(), 'uploads', relativePath);
      try {
        if (existsSync(filepath)) {
          await unlink(filepath);
        }
      } catch (error) {
        console.error('Error deleting old certificate:', error);
        // Don't throw, just log
      }
    }
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot);
  }

  /**
   * Encrypt buffer using AES-256-CBC
   */
  private encryptBuffer(buffer: Buffer, password: string): Buffer {
    try {
      // Generate a key from password using scrypt
      const salt = randomBytes(16);
      const key = scryptSync(password, salt, 32); // 256 bits
      const iv = randomBytes(16);

      const cipher = createCipheriv('aes-256-cbc', key, iv);
      const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

      // Return: salt (16 bytes) + iv (16 bytes) + encrypted data
      return Buffer.concat([salt, iv, encrypted]);
    } catch (error) {
      throw new InternalServerErrorException('Error al encriptar el certificado');
    }
  }

  /**
   * Decrypt buffer using AES-256-CBC
   */
  private decryptBuffer(encryptedBuffer: Buffer, password: string): Buffer {
    try {
      // Extract salt, iv and encrypted data
      const salt = encryptedBuffer.subarray(0, 16);
      const iv = encryptedBuffer.subarray(16, 32);
      const encrypted = encryptedBuffer.subarray(32);

      // Regenerate key from password
      const key = scryptSync(password, salt, 32);

      const decipher = createDecipheriv('aes-256-cbc', key, iv);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      return decrypted;
    } catch (error) {
      throw new BadRequestException('Contraseña incorrecta o archivo corrupto');
    }
  }
}
