import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as forge from 'node-forge';

@Injectable()
export class VerifactuSignerService {
  constructor(private config: ConfigService) {}

  /**
   * Sign XML with digital certificate (XAdES)
   * In production, this would use the tenant's uploaded certificate
   */
  async signXml(
    xml: string,
    certificatePath?: string,
    certificatePassword?: string
  ): Promise<string> {
    // For now, we'll return the XML unsigned
    // In production, implement XAdES signature with node-forge or xadesjs

    // TODO: Implement XAdES signature
    // 1. Load certificate from certificatePath with certificatePassword
    // 2. Create XAdES signature
    // 3. Embed signature in XML
    // 4. Return signed XML

    // Placeholder: return unsigned XML
    // In real implementation, use libraries like xadesjs or node-forge
    return xml;
  }

  /**
   * Verify certificate validity
   */
  async verifyCertificate(certificateData: Buffer, password: string): Promise<boolean> {
    try {
      // Parse PKCS12 certificate
      const p12Asn1 = forge.asn1.fromDer(certificateData.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Get certificate bags
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const pkcs8ShroudedKeyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

      if (!certBags || !pkcs8ShroudedKeyBags) {
        return false;
      }

      // Get first certificate
      const certBagOid = forge.pki.oids.certBag;
      if (!certBagOid) {
        return false;
      }
      const certBag = certBags[certBagOid]?.[0];
      if (!certBag?.cert) {
        return false;
      }

      const certificate = certBag.cert;

      // Check certificate validity dates
      const now = new Date();
      const notBefore = certificate.validity.notBefore;
      const notAfter = certificate.validity.notAfter;

      if (now < notBefore || now > notAfter) {
        return false;
      }

      return true;
    } catch (error) {
      throw new BadRequestException('Certificado inválido o contraseña incorrecta');
    }
  }

  /**
   * Extract certificate info (for display purposes)
   */
  async getCertificateInfo(
    certificateData: Buffer,
    password: string
  ): Promise<{
    subject: string;
    issuer: string;
    validFrom: Date;
    validTo: Date;
    serialNumber: string;
  }> {
    try {
      const p12Asn1 = forge.asn1.fromDer(certificateData.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBagOid = forge.pki.oids.certBag;
      if (!certBagOid) {
        throw new Error('No se pudo obtener el OID del certificado');
      }
      const certBag = certBags[certBagOid]?.[0];

      if (!certBag?.cert) {
        throw new Error('No se pudo extraer el certificado');
      }

      const cert = certBag.cert;

      return {
        subject: cert.subject.getField('CN')?.value || '',
        issuer: cert.issuer.getField('CN')?.value || '',
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter,
        serialNumber: cert.serialNumber,
      };
    } catch (error) {
      throw new BadRequestException('Error al leer el certificado');
    }
  }
}
