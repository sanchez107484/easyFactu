import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Express } from 'express';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

@Injectable()
export class ExpenseAttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    dto?: { expenseId?: string }
  ) {
    this.validateFile(file);

    if (dto?.expenseId) {
      await this.verifyExpenseOwnership(tenantId, dto.expenseId);
    }

    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const storageKey = `${tenantId}/${randomUUID()}-${this.sanitizeFileName(file.originalname)}`;

    const attachment = await this.prisma.expenseAttachment.create({
      data: {
        tenantId,
        expenseId: dto?.expenseId ?? null,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey,
        content: dataUrl,
      },
    });

    if (dto?.expenseId) {
      await this.prisma.expense.update({
        where: { id: dto.expenseId, tenantId },
        data: { attachmentId: attachment.id },
      });
    }

    return this.toResponse(attachment);
  }

  async findOne(tenantId: string, id: string) {
    const attachment = await this.prisma.expenseAttachment.findFirst({
      where: { id, tenantId },
    });

    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    return this.toResponse(attachment);
  }

  async download(tenantId: string, id: string): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    const attachment = await this.prisma.expenseAttachment.findFirst({
      where: { id, tenantId },
    });

    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    if (!attachment.content) {
      throw new NotFoundException('El contenido del adjunto no está disponible');
    }

    const buffer = this.dataUrlToBuffer(attachment.content);
    return { buffer, mimeType: attachment.mimeType, fileName: attachment.fileName };
  }

  async remove(tenantId: string, id: string) {
    const attachment = await this.prisma.expenseAttachment.findFirst({
      where: { id, tenantId },
    });

    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    // Unlink from any expense before deleting
    await this.prisma.expense.updateMany({
      where: { attachmentId: id, tenantId },
      data: { attachmentId: null },
    });

    await this.prisma.expenseAttachment.delete({
      where: { id },
    });

    return { id, deleted: true };
  }

  private async verifyExpenseOwnership(tenantId: string, expenseId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, tenantId },
      select: { id: true },
    });

    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`El archivo no puede superar los ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Formato no permitido. Usa JPG, PNG, WEBP, GIF o PDF'
      );
    }
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9.\-_]/g, '_').substring(0, 100);
  }

  private dataUrlToBuffer(dataUrl: string): Buffer {
    const base64 = dataUrl.split(',')[1];
    if (!base64) {
      throw new BadRequestException('Contenido del adjunto inválido');
    }
    return Buffer.from(base64, 'base64');
  }

  private toResponse(attachment: {
    id: string;
    tenantId: string;
    expenseId: string | null;
    fileName: string;
    mimeType: string;
    size: number;
    storageKey: string;
    createdAt: Date;
  }) {
    return {
      id: attachment.id,
      expenseId: attachment.expenseId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      storageKey: attachment.storageKey,
      createdAt: attachment.createdAt.toISOString(),
    };
  }
}
