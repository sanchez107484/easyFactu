import type { Metadata } from 'next';
import { brandConfig } from '@easyfactura/brand-config';
import { LegalPageWrapper } from '@/components/legal/LegalPageWrapper';
import { LegalSection } from '@/components/legal/LegalSection';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: `Conoce cómo ${brandConfig.app.name} trata tus datos personales conforme al RGPD y la LOPDGDD.`,
};

export default function PoliticaPrivacidadPage() {
  const { name, legalEntity, nif, address, supportEmail } = brandConfig.app;

  return (
    <LegalPageWrapper
      title="Política de Privacidad"
      subtitle="Cómo recopilamos, usamos y protegemos tus datos personales."
      lastUpdated="14 de abril de 2026"
    >
      <LegalSection number="1." heading="Responsable del tratamiento">
        <dl className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
          <div className="flex gap-2">
            <dt className="min-w-32 font-medium text-slate-700">Responsable:</dt>
            <dd>{legalEntity}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="min-w-32 font-medium text-slate-700">NIF/CIF:</dt>
            <dd>{nif}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="min-w-32 font-medium text-slate-700">Dirección:</dt>
            <dd>{address}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="min-w-32 font-medium text-slate-700">Email:</dt>
            <dd>
              <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
                {supportEmail}
              </a>
            </dd>
          </div>
        </dl>
        <p className="mt-3">
          Esta política se aplica al tratamiento de datos personales realizado a través del sitio
          web y la plataforma {name}.
        </p>
      </LegalSection>

      <LegalSection number="2." heading="Normativa aplicable">
        <p>El tratamiento de datos personales se realiza conforme a:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>Reglamento General de Protección de Datos (RGPD)</li>
          <li>
            Ley Orgánica de Protección de Datos y Garantía de Derechos Digitales (LOPDGDD)
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="3." heading="Datos personales que recopilamos">
        <p>Podemos recopilar los siguientes datos:</p>

        <h3 className="mt-5 font-semibold text-slate-700">Datos de registro</h3>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>nombre y apellidos</li>
          <li>correo electrónico</li>
          <li>teléfono</li>
          <li>contraseña</li>
        </ul>

        <h3 className="mt-5 font-semibold text-slate-700">
          Datos fiscales introducidos en el software
        </h3>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>nombre fiscal</li>
          <li>NIF/CIF</li>
          <li>dirección</li>
          <li>datos de clientes y proveedores</li>
          <li>facturas emitidas</li>
        </ul>

        <h3 className="mt-5 font-semibold text-slate-700">Datos técnicos</h3>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>dirección IP</li>
          <li>navegador y sistema operativo</li>
          <li>actividad dentro de la plataforma</li>
        </ul>
      </LegalSection>

      <LegalSection number="4." heading="Finalidad del tratamiento">
        <p>Los datos se utilizan para:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>crear y gestionar cuentas de usuario</li>
          <li>proporcionar el servicio de facturación</li>
          <li>gestionar soporte y atención al cliente</li>
          <li>enviar comunicaciones relacionadas con el servicio</li>
          <li>cumplir obligaciones legales</li>
          <li>mejorar la plataforma</li>
        </ul>
      </LegalSection>

      <LegalSection number="5." heading="Base legal">
        <p>La base legal del tratamiento es:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>ejecución del contrato de servicio</li>
          <li>cumplimiento de obligaciones legales</li>
          <li>interés legítimo para mejorar el servicio</li>
          <li>consentimiento del usuario cuando sea necesario</li>
        </ul>
      </LegalSection>

      <LegalSection number="6." heading="Conservación de los datos">
        <p>Los datos se conservarán:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>mientras exista una relación contractual</li>
          <li>durante los plazos legales aplicables</li>
          <li>hasta que el usuario solicite su eliminación cuando sea posible</li>
        </ul>
      </LegalSection>

      <LegalSection number="7." heading="Destinatarios de los datos">
        <p>Los datos podrán ser comunicados a:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>proveedores tecnológicos necesarios para el funcionamiento del servicio</li>
          <li>administraciones públicas cuando exista obligación legal</li>
          <li>sistemas de cumplimiento fiscal cuando la normativa lo requiera</li>
        </ul>
        <p className="mt-3 font-medium text-slate-700">
          Los datos no serán vendidos a terceros.
        </p>
      </LegalSection>

      <LegalSection number="8." heading="Derechos del usuario">
        <p>El usuario puede ejercer los siguientes derechos:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>acceso</li>
          <li>rectificación</li>
          <li>supresión</li>
          <li>limitación del tratamiento</li>
          <li>portabilidad</li>
          <li>oposición</li>
        </ul>
        <p className="mt-3">
          Para ejercerlos puede enviar una solicitud a{' '}
          <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
            {supportEmail}
          </a>
          . También puede presentar reclamación ante la{' '}
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Agencia Española de Protección de Datos
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection number="9." heading="Seguridad">
        <p>
          {name} aplica medidas técnicas y organizativas adecuadas para proteger los datos
          personales frente a accesos no autorizados, pérdida o alteración.
        </p>
      </LegalSection>

      <LegalSection number="10." heading="Cambios en la política">
        <p>
          {name} podrá modificar esta política para adaptarla a cambios legislativos o mejoras del
          servicio. Se notificará a los usuarios de cambios sustanciales.
        </p>
      </LegalSection>
    </LegalPageWrapper>
  );
}
