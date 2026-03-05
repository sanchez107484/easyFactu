import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Express } from 'express';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly maxLogoSize = 2 * 1024 * 1024; // 2MB
  private readonly maxCertificateSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedLogoFormats = ['image/jpeg', 'image/png', 'image/svg+xml'];
  private readonly allowedCertificateFormats = [
    'application/x-pkcs12',
    'application/pkcs12',
    'application/octet-stream', // .pfx/.p12 can be served as this
  ];

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    // Define upload directory (relative to project root)
    this.uploadDir = this.configService.get('UPLOAD_DIR') || join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      if (!existsSync(this.uploadDir)) {
        await mkdir(this.uploadDir, { recursive: true });
      }
      // Create subdirectories
      const subdirs = ['logos', 'certificates'];
      for (const subdir of subdirs) {
        const path = join(this.uploadDir, subdir);
        if (!existsSync(path)) {
          await mkdir(path, { recursive: true });
        }
      }
    } catch (error) {
      console.error('Error creating upload directories:', error);
    }
  }

  /**
   * Upload logo for tenant
   */
  async uploadLogo(tenantId: string, file: Express.Multer.File): Promise<UploadResult> {
    // Validate file
    this.validateLogoFile(file);

    // Delete old logo if exists
    await this.deleteOldLogo(tenantId);

    // Generate unique filename
    const extension = this.getFileExtension(file.originalname);
    const filename = `${tenantId}-${Date.now()}${extension}`;
    const filepath = join(this.uploadDir, 'logos', filename);

    // Save file
    await writeFile(filepath, file.buffer);

    // Update tenant in database
    const url = `/uploads/logos/${filename}`;
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: url },
    });

    return {
      url,
      path: filepath,
      size: file.size,
    };
  }

  /**
   * Upload and encrypt certificate for tenant
   */
  async uploadCertificate(
    tenantId: string,
    file: Express.Multer.File,
    password: string
  ): Promise<UploadResult> {
    // Validate file
    this.validateCertificateFile(file);

    // Delete old certificate if exists
    await this.deleteOldCertificate(tenantId);

    // Encrypt file content
    const encryptedBuffer = this.encryptBuffer(file.buffer, password);

    // Generate unique filename
    const extension = this.getFileExtension(file.originalname);
    const filename = `${tenantId}-${Date.now()}.enc${extension}`;
    const filepath = join(this.uploadDir, 'certificates', filename);

    // Save encrypted file
    await writeFile(filepath, encryptedBuffer);

    // Update tenant in database
    const url = `/uploads/certificates/${filename}`;
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        certificateUrl: url,
        // TODO: Extract certificate expiry date from the .pfx/.p12 file
        // This requires parsing the certificate with node-forge
      },
    });

    return {
      url,
      path: filepath,
      size: file.size,
    };
  }

  /**
   * Delete logo file from filesystem and database
   */
  async deleteLogo(tenantId: string): Promise<void> {
    await this.deleteOldLogo(tenantId);
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: null },
    });
  }

  /**
   * Delete certificate file from filesystem and database
   */
  async deleteCertificate(tenantId: string): Promise<void> {
    await this.deleteOldCertificate(tenantId);
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        certificateUrl: null,
        certificateExpiry: null,
      },
    });
  }

  /**
   * Decrypt certificate for use (e.g., signing invoices)
   */
  decryptCertificate(encryptedBuffer: Buffer, password: string): Buffer {
    return this.decryptBuffer(encryptedBuffer, password);
  }

  // ==================== PRIVATE METHODS ====================

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

  private async deleteOldLogo(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { logoUrl: true },
    });

    if (tenant?.logoUrl) {
      const relativePath = tenant.logoUrl.replace(/^\/uploads\//, '');
      const filepath = join(this.uploadDir, relativePath);
      try {
        if (existsSync(filepath)) {
          await unlink(filepath);
        }
      } catch (error) {
        console.error('Error deleting old logo:', error);
        // Don't throw, just log
      }
    }
  }

  private async deleteOldCertificate(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { certificateUrl: true },
    });

    if (tenant?.certificateUrl) {
      const relativePath = tenant.certificateUrl.replace(/^\/uploads\//, '');
      const filepath = join(this.uploadDir, relativePath);
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
