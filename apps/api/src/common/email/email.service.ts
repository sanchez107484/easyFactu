import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

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

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    this.defaultFrom =
      this.configService.get<string>('EMAIL_FROM') ?? 'NovaFactura <noreply@novafactura.es>';

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
    const invitationUrl = `${this.configService.get('FRONTEND_URL') ?? 'https://app.novafactura.es'}/invitacion/${opts.invitationToken}`;

    const html = this.buildAgencyInvitationHtml({
      ...opts,
      invitationUrl,
    });

    await this.send({
      to: opts.to,
      subject: `${opts.agencyName} te invita a gestionar tu facturación en NovaFactura`,
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
    const activationUrl = `${this.configService.get('FRONTEND_URL') ?? 'https://app.novafactura.es'}/activar-cuenta/${opts.activationToken}`;

    const html = this.buildAccountActivationHtml({ ...opts, activationUrl });

    await this.send({
      to: opts.to,
      subject: `${opts.agencyName} ha creado tu cuenta en NovaFactura — actívala ahora`,
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
      subject: `Tu asesoría ${opts.agencyName} ha configurado tu cuenta en NovaFactura`,
      html,
    });
  }

  async sendPasswordReset(opts: {
    to: string;
    firstName: string;
    resetToken: string;
  }): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL') ?? 'https://app.novafactura.es'}/nueva-contrasena?token=${opts.resetToken}`;

    const html = this.buildPasswordResetHtml({ ...opts, resetUrl });

    await this.send({
      to: opts.to,
      subject: 'Recupera tu contraseña de NovaFactura',
      html,
    });
  }

  async sendEmailVerification(opts: {
    to: string;
    firstName: string;
    verifyToken: string;
  }): Promise<void> {
    const verifyUrl = `${this.configService.get('FRONTEND_URL') ?? 'https://app.novafactura.es'}/verificar-email?token=${opts.verifyToken}`;

    const html = this.buildEmailVerificationHtml({ ...opts, verifyUrl });

    await this.send({
      to: opts.to,
      subject: 'Verifica tu email en NovaFactura',
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
      subject: `${opts.clientName} ha rechazado tu invitación en NovaFactura`,
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
      subject: `${opts.clientName} ha aceptado tu invitación en NovaFactura`,
      html,
    });
  }

  // ─── Private send ──────────────────────────────────────────────────────────

  private async send(opts: SendEmailOptions): Promise<void> {
    if (!this.resend) {
      // Dev mode: log to console instead of sending
      this.logger.debug(
        `[EMAIL] To: ${opts.to} | Subject: ${opts.subject}\n--- HTML preview snipped ---`
      );
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: opts.from ?? this.defaultFrom,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
      });

      if (error) {
        this.logger.error(`Error al enviar email a ${opts.to}: ${error.message}`);
      }
    } catch (err) {
      // Log but don't throw — email failures shouldn't break the main flow
      this.logger.error(`Excepción al enviar email a ${opts.to}`, err);
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
        Tu asesoría <strong style="color:#1e1e2e;">${opts.agencyName}</strong> ha creado una cuenta en NovaFactura para <strong style="color:#1e1e2e;">${opts.businessName}</strong>.
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
        <span style="color:#4f46e5;word-break:break-all;">${opts.activationUrl}</span>
      </p>`;

    return this.buildBaseLayout(content);
  }

  private buildBaseLayout(content: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NovaFactura</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:22px;font-weight:700;color:#4f46e5;letter-spacing:-0.5px;">Nova<span style="color:#1e1e2e;">Factura</span></span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                NovaFactura · Facturación para autónomos y pymes<br />
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
    return `<table cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td style="background:#4f46e5;border-radius:8px;padding:12px 28px;">
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
        <strong style="color:#1e1e2e;">${opts.agencyName}</strong> (${opts.agencyNif}) te invita a que vinculen tu facturación a través de NovaFactura.
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
        <span style="color:#4f46e5;word-break:break-all;">${opts.invitationUrl}</span>
      </p>`;

    return this.buildBaseLayout(content);
  }

  private buildDirectClientWelcomeHtml(opts: {
    clientName: string;
    agencyName: string;
    loginUrl: string;
  }): string {
    const content = `
      <h1 style="color:#1e1e2e;font-size:24px;font-weight:700;margin:0 0 8px;">Bienvenido a NovaFactura</h1>
      <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">
        Tu asesoría <strong style="color:#1e1e2e;">${opts.agencyName}</strong> ha creado y configurado tu espacio de facturación.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
        Desde NovaFactura podrás ver y gestionar todas tus facturas. Tu asesoría ya tiene acceso para ayudarte.
      </p>
      ${this.buildButton('Acceder a mi cuenta', opts.loginUrl)}
      <p style="color:#9ca3af;font-size:13px;margin:0;">
        Si tienes dudas, contacta con tu asesoría o escríbenos a soporte@novafactura.es
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
        Hola, <strong style="color:#1e1e2e;">${opts.firstName}</strong>. Solo un paso más para activar tu cuenta en NovaFactura.
      </p>
      ${this.buildButton('Verificar mi email', opts.verifyUrl)}
      <p style="color:#9ca3af;font-size:13px;margin:0;">
        Si no creaste esta cuenta, puedes ignorar este email.
      </p>`;

    return this.buildBaseLayout(content);
  }
}
