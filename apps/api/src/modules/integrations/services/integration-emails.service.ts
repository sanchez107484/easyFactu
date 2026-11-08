import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { brandConfig } from '@easyfactura/brand-config';
import { EmailService } from '../../../common/email/email.service';
import { INTEGRATIONS_ENV } from '../integrations.constants';

const DEFAULT_ERP_NAME = 'tu ERP';

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function formatSpanishDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

const PARAGRAPH = 'color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;';
const NOTE = 'color:#9ca3af;font-size:13px;margin:0 0 8px;';

/** Emails of the ERP integration: account created by the ERP and consent for an existing account. */
@Injectable()
export class IntegrationEmailsService {
  constructor(
    private readonly email: EmailService,
    private readonly config: ConfigService
  ) {}

  private get erpName(): string {
    return escapeHtml(
      this.config.get<string>(INTEGRATIONS_ENV.ERP_DISPLAY_NAME) ?? DEFAULT_ERP_NAME
    );
  }

  async sendAccountCreated(opts: {
    to: string;
    businessName: string;
    activationUrl: string;
    expiresAt: Date;
  }): Promise<void> {
    const content = `
      <h1 style="color:#1e1e2e;font-size:24px;font-weight:700;margin:0 0 8px;">Tu facturación ya está conectada</h1>
      <p style="${PARAGRAPH}">${this.erpName} ha creado la cuenta de <strong>${escapeHtml(opts.businessName)}</strong> en ${brandConfig.app.name}, con el plan PRO incluido mientras uses ${this.erpName}.</p>
      <p style="${PARAGRAPH}">Crea tu contraseña y acepta las condiciones de uso y el encargo de tratamiento para revisar tus facturas, tu certificado y tus informes.</p>
      ${this.email.buttonHtml('Activar mi cuenta', opts.activationUrl)}
      <p style="${NOTE}">El enlace caduca el <strong>${formatSpanishDate(opts.expiresAt)}</strong>.</p>`;
    await this.email.sendBranded({
      to: opts.to,
      subject: `Activa tu cuenta de ${brandConfig.app.name}, conectada con ${this.config.get<string>(INTEGRATIONS_ENV.ERP_DISPLAY_NAME) ?? DEFAULT_ERP_NAME}`,
      content,
    });
  }

  async sendConsentRequest(opts: {
    to: string;
    businessName: string;
    consentUrl: string;
    expiresAt: Date;
  }): Promise<void> {
    const content = `
      <h1 style="color:#1e1e2e;font-size:24px;font-weight:700;margin:0 0 8px;">${this.erpName} quiere conectar tu cuenta</h1>
      <p style="${PARAGRAPH}">${this.erpName} ha pedido emitir las facturas de <strong>${escapeHtml(opts.businessName)}</strong> desde su programa usando tu cuenta de ${brandConfig.app.name}.</p>
      <p style="${PARAGRAPH}">Si aceptas, tu plan pasa a PRO incluido con ${this.erpName} y el ERP podrá emitir facturas, descargar sus PDF y registrar cobros. Tus facturas actuales no cambian.</p>
      ${this.email.buttonHtml('Revisar y aceptar', opts.consentUrl)}
      <p style="${NOTE}">El enlace caduca el <strong>${formatSpanishDate(opts.expiresAt)}</strong>. Si no lo esperabas, ignóralo: no se conectará nada sin tu aceptación.</p>`;
    await this.email.sendBranded({
      to: opts.to,
      subject: `Solicitud para conectar tu cuenta de ${brandConfig.app.name}`,
      content,
    });
  }
}
