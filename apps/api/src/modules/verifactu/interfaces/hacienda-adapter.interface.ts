// ============================================================
// IHaciendaAdapter — Contrato común para todas las integraciones fiscales
//
// Cada Hacienda (AEAT España, Hacienda Foral de Navarra, etc.) implementa
// esta interfaz. El orquestador (VerifactuService) trabaja exclusivamente
// contra esta abstracción y nunca conoce qué Hacienda está usando.
// ============================================================

export const HACIENDA_ADAPTER = Symbol('HACIENDA_ADAPTER');

export interface IHaciendaAdapter {
  /**
   * Genera el XML de la factura según el formato exigido por la Hacienda correspondiente.
   */
  generateXml(tenantId: string, invoiceId: string): Promise<string>;

  /**
   * Firma el XML con el certificado digital del tenant.
   * Cada Hacienda puede requerir un formato de firma distinto.
   */
  signXml(xml: string, tenantId: string): Promise<string>;

  /**
   * Envía el XML firmado a la Hacienda por primera vez.
   * Registra el resultado en el log y actualiza el estado de la factura.
   */
  sendToHacienda(tenantId: string, invoiceId: string, signedXml: string): Promise<void>;

  /**
   * Reintenta el envío de una factura que quedó en estado ERROR.
   * Puede registrar el intento con una acción distinta en el log (RETRY).
   */
  retrySubmission(tenantId: string, invoiceId: string, signedXml: string): Promise<void>;

  /**
   * Genera la URL del código QR normativo que debe aparecer en la factura impresa.
   * El formato de la URL varía según la Hacienda.
   */
  generateQrUrl(tenantId: string, invoiceId: string): Promise<string>;
}
