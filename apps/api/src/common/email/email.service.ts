import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { brandConfig } from '@easyfactura/brand-config';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly defaultFrom: string;
  private readonly isDev: boolean;
  private readonly appName = brandConfig.app.name;
  private readonly supportEmail = brandConfig.app.supportEmail;
  private readonly appUrl: string;
  private readonly brandColors = brandConfig.colors;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    this.defaultFrom =
      this.configService.get<string>('EMAIL_FROM') ??
      `${brandConfig.app.name} <noreply@${brandConfig.app.domain}>`;
    this.appUrl = this.configService.get<string>('FRONTEND_URL') ?? brandConfig.app.url;

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
      this.logger.warn('RESEND_API_KEY no configurada — los emails se loguearán en consola');
    }
  }

  async sendAgencyInvitation(opts: {
    to: string;
    inviteeName?: string;
    agencyName: string;
    agencyNif: string;
    invitationToken: string;
    expiresAt: Date;
  }): Promise<void> {
    const invitationUrl = `${this.appUrl}/invitacion/${opts.invitationToken}`;

    const html = this.buildAgencyInvitationHtml({
      ...opts,
      invitationUrl,
    });

    await this.send({
      to: opts.to,
      subject: `${opts.agencyName} te invita a gestionar tu facturación en ${this.appName}`,
      html,
    });
  }

  async sendAccountActivation(opts: {
    to: string;
    businessName: string;
    agencyName: string;
    activationToken: string;
    expiresAt: Date;
  }): Promise<void> {
    const activationUrl = `${this.appUrl}/activar-cuenta/${opts.activationToken}`;

    const html = this.buildAccountActivationHtml({ ...opts, activationUrl });

    await this.send({
      to: opts.to,
      subject: `${opts.agencyName} ha creado tu cuenta en ${this.appName} — actívala ahora`,
      html,
    });
  }

  async sendDirectClientWelcome(opts: {
    to: string;
    clientName: string;
    agencyName: string;
    loginUrl: string;
  }): Promise<void> {
    const html = this.buildDirectClientWelcomeHtml(opts);

    await this.send({
      to: opts.to,
      subject: `Tu asesoría ${opts.agencyName} ha configurado tu cuenta en ${this.appName}`,
      html,
    });
  }

  async sendPasswordReset(opts: {
    to: string;
    firstName: string;
    resetToken: string;
  }): Promise<void> {
    const resetUrl = `${this.appUrl}/nueva-contrasena?token=${opts.resetToken}`;

    const html = this.buildPasswordResetHtml({ ...opts, resetUrl });

    await this.send({
      to: opts.to,
      subject: 'Recupera tu contraseña de ' + this.appName,
      html,
    });
  }

  async sendEmailVerification(opts: {
    to: string;
    firstName: string;
    verifyToken: string;
  }): Promise<void> {
    const verifyUrl = `${this.appUrl}/verificar-email?token=${opts.verifyToken}`;

    const html = this.buildEmailVerificationHtml({ ...opts, verifyUrl });

    await this.send({
      to: opts.to,
      subject: 'Verifica tu email en ' + this.appName,
      html,
    });
  }

  async sendClientRejectedInvitationNotification(opts: {
    to: string;
    agencyName: string;
    clientName: string;
    clientEmail: string;
  }): Promise<void> {
    const html = this.buildBaseLayout(`
      <h1 style="color:#1e1e2e;font-size:24px;font-weight:700;margin:0 0 8px;">
        Invitación rechazada
      </h1>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
        <strong>${opts.clientName}</strong> (${opts.clientEmail}) ha rechazado tu invitación para
        unirse a <strong>${opts.agencyName}</strong> en NovaFactura.
      </p>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0;">
        Si lo deseas, podrás enviar una nueva invitación pasado el período de espera establecido.
      </p>
    `);

    await this.send({
      to: opts.to,
      subject: `${opts.clientName} ha rechazado tu invitación en ${this.appName}`,
      html,
    });
  }

  async sendClientAcceptedInvitationNotification(opts: {
    to: string;
    agencyName: string;
    clientName: string;
    clientNif: string;
  }): Promise<void> {
    const html = this.buildBaseLayout(`
      <h1 style="color:#1e1e2e;font-size:24px;font-weight:700;margin:0 0 8px;">
        ¡${opts.clientName} ha aceptado tu invitación!
      </h1>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
        El cliente <strong>${opts.clientName}</strong> (NIF: ${opts.clientNif}) ha aceptado vincularse
        a <strong>${opts.agencyName}</strong> y ahora forma parte de tu cartera en NovaFactura.
      </p>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0;">
        Ya puedes acceder a su cuenta desde el panel de asesoría y gestionar su facturación.
      </p>
    `);

    await this.send({
      to: opts.to,
      subject: `${opts.clientName} ha aceptado tu invitación en ${this.appName}`,
      html,
    });
  }

  async sendClientActivatedNotification(opts: {
    to: string | string[];
    agencyName: string;
    clientBusinessName: string;
    clientNif: string;
    dashboardUrl: string;
  }): Promise<void> {
    const html = this.buildBaseLayout(`
      <h1 style="color:#1e1e2e;font-size:24px;font-weight:700;margin:0 0 8px;">
        ${opts.clientBusinessName} ha activado su cuenta
      </h1>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
        El cliente <strong>${opts.clientBusinessName}</strong> (NIF: ${opts.clientNif}) ha verificado
        su email y activado su cuenta en NovaFactura a través de <strong>${opts.agencyName}</strong>.
      </p>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Ya puedes acceder a su panel de facturación.
      </p>
      ${this.buildButton('Ver dashboard del cliente', opts.dashboardUrl)}
    `);

    await this.send({
      to: opts.to,
      subject: `${opts.clientBusinessName} ha activado su cuenta en ${this.appName}`,
      html,
    });
  }

  async sendPlanChangeNotification(opts: {
    to: string | string[];
    firstName: string;
    fromPlanName: string;
    toPlanName: string;
    changeDate: string;
  }): Promise<void> {
    const formattedDate = new Date(opts.changeDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isUpgrade =
      opts.toPlanName.toLowerCase().includes('pro') &&
      !opts.fromPlanName.toLowerCase().includes('pro');

    const dashboardUrl = `${this.appUrl}/dashboard`;
    const { highlight, highlightBg, highlightBorder } = this.brandColors;

    const basicFeatures = [
      'VeriFactu (obligatorio AEAT)',
      'Facturas ilimitadas',
      'Clientes y productos ilimitados',
      'Presupuestos y proformas',
      'Rectificativas y abonos',
      'Facturación recurrente',
      'Plantillas personalizadas',
    ];

    const proFeatures = [
      'Gestión avanzada de gastos',
      'Análisis de rentabilidad',
      'Gestión de proveedores',
      'Lectura inteligente de gastos',
      'Automatizaciones con IA',
      'Informes profesionales en segundos',
      'Soporte prioritario',
    ];

    const featuresHtml = isUpgrade
      ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin:24px 0;">
          <h3 style="color:#166534;font-size:16px;font-weight:700;margin:0 0 16px;">
            ✓ Lo que desbloqueas con ${opts.toPlanName}
          </h3>
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            ${proFeatures
              .map(
                (feature) => `
              <tr>
                <td style="padding:6px 0;color:#374151;font-size:14px;">
                  <span style="color:#22c55e;margin-right:8px;">✦</span>${feature}
                </td>
              </tr>
            `
              )
              .join('')}
          </table>
          <p style="color:#166534;font-size:13px;margin:16px 0 0;padding-top:16px;border-top:1px solid #bbf7d0;">
            <strong>Gratis hasta 2027</strong> — Sin compromiso. Cancela cuando quieras.
          </p>
        </div>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td>
              <a href="${dashboardUrl}" style="display:inline-block;background:#22c55e;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
                Empezar a usar ${opts.toPlanName} →
              </a>
            </td>
          </tr>
        </table>
      `
      : '';

    const downgradeNotice = !isUpgrade
      ? `
        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:24px;margin:24px 0;">
          <h3 style="color:#92400e;font-size:16px;font-weight:700;margin:0 0 12px;">
            ⚠️ Lo que ya no tendrás disponible
          </h3>
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            ${proFeatures
              .map(
                (feature) => `
              <tr>
                <td style="padding:4px 0;color:#78350f;font-size:14px;text-decoration:line-through;opacity:0.7;">
                  <span style="margin-right:8px;">✦</span>${feature}
                </td>
              </tr>
            `
              )
              .join('')}
          </table>
          <p style="color:#92400e;font-size:13px;margin:16px 0 0;">
            Si crees que esto es un error, contacta con nuestro equipo de soporte.
          </p>
        </div>
      `
      : '';

    const html = this.buildBaseLayout(`
      <div style="text-align:center;margin-bottom:32px;">
        ${
          isUpgrade
            ? `
          <div style="display:inline-block;background:linear-gradient(135deg,${highlight},${highlight});color:#ffffff;font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;margin-bottom:16px;box-shadow:0 2px 8px ${highlightBg};">
            NUEVO PLAN ACTIVADO
          </div>
        `
            : `
          <div style="display:inline-block;background:#f3f4f6;color:#6b7280;font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;margin-bottom:16px;">
            PLAN ACTUALIZADO
          </div>
        `
        }
        <h1 style="color:#1e1e2e;font-size:28px;font-weight:700;margin:0 0 8px;">
          ${isUpgrade ? '¡Bienvenido a ' + opts.toPlanName + '!' : 'Tu plan ha cambiado'}
        </h1>
        <p style="color:#6b7280;font-size:15px;margin:0;">
          Hola <strong>${opts.firstName}</strong>, tu plan se ha actualizado correctamente.
        </p>
      </div>

      <!-- Plan comparison -->
      <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <tr>
          <td style="padding:24px;text-align:center;border-right:1px solid #e5e7eb;background:#f9fafb;">
            <p style="color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;margin:0 0 8px;">Plan anterior</p>
            <p style="color:#6b7280;font-size:16px;font-weight:700;margin:0;">${opts.fromPlanName}</p>
          </td>
          <td style="padding:24px;text-align:center;background:${isUpgrade ? '#f0fdf4' : highlightBg};border-left:1px solid ${isUpgrade ? '#bbf7d0' : highlightBorder};">
            <p style="color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;margin:0 0 8px;">Plan nuevo</p>
            <p style="color:${isUpgrade ? '#166534' : highlight};font-size:16px;font-weight:700;margin:0;">${opts.toPlanName}</p>
          </td>
        </tr>
      </table>

      ${isUpgrade ? featuresHtml : downgradeNotice}

      <!-- Features included in basic -->
      <div style="background:#f9fafb;border-radius:12px;padding:24px;margin:24px 0;">
        <h3 style="color:#374151;font-size:14px;font-weight:700;margin:0 0 12px;">
          ✓ Incluido en tu plan
        </h3>
        <table cellpadding="0" cellspacing="0" style="width:100%;">
          ${basicFeatures
            .map(
              (feature) => `
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:14px;">
                <span style="color:${highlight};margin-right:8px;">✓</span>${feature}
              </td>
            </tr>
          `
            )
            .join('')}
        </table>
      </div>

      <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:24px 0 0;padding-top:24px;border-top:1px solid #e5e7eb;">
        Fecha del cambio: ${formattedDate}<br />
        <a href="${dashboardUrl}" style="color:${highlight};">Ir a mi dashboard →</a>
      </p>
    `);

    await this.send({
      to: opts.to,
      subject: isUpgrade
        ? `¡Bienvenido a ${opts.toPlanName}! - ${this.appName}`
        : `Tu plan ha cambiado a ${opts.toPlanName} - ${this.appName}`,
      html,
    });
  }

  // ─── Private send ──────────────────────────────────────────────────────────

  private async send(opts: SendEmailOptions): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`[EMAIL] Resend no configurado. Email no enviado. To: ${opts.to} | Subject: ${opts.subject}`);
      return;
    }

    try {
      const { error, data } = await this.resend.emails.send({
        from: opts.from ?? this.defaultFrom,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
      });

      if (error) {
        this.logger.error(`[EMAIL] Error al enviar email a ${opts.to}: ${error.message}`);
      } else {
        this.logger.log(`[EMAIL] Email enviado correctamente a ${opts.to}. ID: ${data?.id}`);
      }
    } catch (err) {
      this.logger.error(`[EMAIL] Excepción al enviar email a ${opts.to}`, err);
    }
  }

  // ─── HTML templates ────────────────────────────────────────────────────────

  private buildAccountActivationHtml(opts: {
    businessName: string;
    agencyName: string;
    activationUrl: string;
    expiresAt: Date;
  }): string {
    const expiryDate = opts.expiresAt.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const content = `
      <h1 style="color:#1e1e2e;font-size:24px;font-weight:700;margin:0 0 8px;">Tu cuenta está lista</h1>
      <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">
        Tu asesoría <strong style="color:#1e1e2e;">${opts.agencyName}</strong> ha creado una cuenta en ${this.appName} para <strong style="color:#1e1e2e;">${opts.businessName}</strong>.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
        Solo necesitas crear tu contraseña para empezar. El proceso dura menos de un minuto y después podrás gestionar tu facturación directamente.
      </p>
      ${this.buildButton('Activar mi cuenta', opts.activationUrl)}
      <p style="color:#9ca3af;font-size:13px;margin:0 0 8px;">
        Este enlace caduca el <strong>${expiryDate}</strong>.
      </p>
      <p style="color:#9ca3af;font-size:13px;margin:0;">
        Si no esperabas este mensaje, puedes ignorarlo. No se realizará ningún cargo ni acción sin tu confirmación.
      </p>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        O copia este enlace en tu navegador:<br />
        <span style="color:#3B82F6;word-break:break-all;">${opts.activationUrl}</span>
      </p>`;

    return this.buildBaseLayout(content);
  }

  private buildBaseLayout(content: string, logoUrl?: string): string {
    const logoSrc = logoUrl ?? (this.appUrl ? `${this.appUrl}${brandConfig.logos.email}` : null);
    const { highlight } = this.brandColors;
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.appName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              ${
                logoSrc
                  ? `<img src="${logoSrc}" alt="${this.appName}" height="40" style="height:40px;object-fit:contain;" />`
                  : `<span style="font-size:24px;font-weight:700;color:${highlight};letter-spacing:0.5px;">${this.appName}</span>`
              }
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border-top:4px solid ${highlight};">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                ${this.appName} · Facturación para autónomos y pymes<br />
                Si no esperabas este email, puedes ignorarlo de forma segura.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private buildButton(text: string, url: string): string {
    const { highlight } = this.brandColors;
    return `<table cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td style="background:${highlight};border-radius:8px;padding:12px 28px;">
          <a href="${url}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${text}</a>
        </td>
      </tr>
    </table>`;
  }

  private buildAgencyInvitationHtml(opts: {
    to: string;
    inviteeName?: string;
    agencyName: string;
    agencyNif: string;
    invitationUrl: string;
    expiresAt: Date;
  }): string {
    const greeting = opts.inviteeName ? `Hola, ${opts.inviteeName}` : 'Hola';
    const expiryDate = opts.expiresAt.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const content = `
      <h1 style="color:#1e1e2e;font-size:24px;font-weight:700;margin:0 0 8px;">${greeting}</h1>
      <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">
        <strong style="color:#1e1e2e;">${opts.agencyName}</strong> (${opts.agencyNif}) te invita a que vinculen tu facturación a través de ${this.appName}.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
        Al aceptar, tu asesoría podrá ayudarte a gestionar tus facturas directamente desde la plataforma, sin que pierdas el control de tu cuenta.
      </p>
      ${this.buildButton('Aceptar invitación', opts.invitationUrl)}
      <p style="color:#9ca3af;font-size:13px;margin:0;">
        Esta invitación caduca el <strong>${expiryDate}</strong>. Si no esperabas este mensaje, ignóralo.
      </p>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        O copia este enlace en tu navegador:<br />
        <span style="color:#3B82F6;word-break:break-all;">${opts.invitationUrl}</span>
      </p>`;

    return this.buildBaseLayout(content);
  }

  private buildDirectClientWelcomeHtml(opts: {
    clientName: string;
    agencyName: string;
    loginUrl: string;
  }): string {
    const content = `
      <h1 style="color:#1e1e2e;font-size:24px;font-weight:700;margin:0 0 8px;">Bienvenido a ${this.appName}</h1>
      <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">
        Tu asesoría <strong style="color:#1e1e2e;">${opts.agencyName}</strong> ha creado y configurado tu espacio de facturación.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
        Desde ${this.appName} podrás ver y gestionar todas tus facturas. Tu asesoría ya tiene acceso para ayudarte.
      </p>
      ${this.buildButton('Acceder a mi cuenta', opts.loginUrl)}
      <p style="color:#9ca3af;font-size:13px;margin:0;">
        Si tienes dudas, contacta con tu asesoría o escríbenos a ${this.supportEmail}
      </p>`;

    return this.buildBaseLayout(content);
  }

  private buildPasswordResetHtml(opts: { firstName: string; resetUrl: string }): string {
    const content = `
      <h1 style="color:#1e1e2e;font-size:24px;font-weight:700;margin:0 0 8px;">Recupera tu contraseña</h1>
      <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">
        Hola, <strong style="color:#1e1e2e;">${opts.firstName}</strong>. Recibimos una solicitud para restablecer la contraseña de tu cuenta.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
        Haz clic en el botón para crear una nueva contraseña. El enlace caduca en <strong>1 hora</strong>.
      </p>
      ${this.buildButton('Restablecer contraseña', opts.resetUrl)}
      <p style="color:#9ca3af;font-size:13px;margin:0;">
        Si no solicitaste este cambio, puedes ignorar este email de forma segura. Tu contraseña no cambiará.
      </p>`;

    return this.buildBaseLayout(content);
  }

  private buildEmailVerificationHtml(opts: { firstName: string; verifyUrl: string }): string {
    const content = `
      <h1 style="color:#1e1e2e;font-size:24px;font-weight:700;margin:0 0 8px;">Verifica tu email</h1>
      <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">
        Hola, <strong style="color:#1e1e2e;">${opts.firstName}</strong>. Solo un paso más para activar tu cuenta en ${this.appName}.
      </p>
      ${this.buildButton('Verificar mi email', opts.verifyUrl)}
      <p style="color:#9ca3af;font-size:13px;margin:0;">
        Si no creaste esta cuenta, puedes ignorar este email.
      </p>`;

    return this.buildBaseLayout(content);
  }
}
