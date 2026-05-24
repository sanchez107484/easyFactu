import type { Metadata } from 'next';
import { brandConfig } from '@easyfactura/brand-config';
import { LegalPageWrapper } from '@/components/legal/LegalPageWrapper';
import { LegalSection } from '@/components/legal/LegalSection';

export const metadata: Metadata = {
  title: 'Contrato de Tratamiento de Datos',
  description: `Acuerdo de encargo de tratamiento (DPA) entre ${brandConfig.app.name} y sus clientes, conforme al artículo 28 del RGPD.`,
  alternates: { canonical: `${brandConfig.app.url}/tratamiento-datos` },
};

export default function TratamientoDatosPage() {
  const { name, legalEntity, nif, address, supportEmail } = brandConfig.app;

  return (
    <LegalPageWrapper
      title="Contrato de Tratamiento de Datos"
      subtitle="Acuerdo de encargo de tratamiento (DPA) conforme al artículo 28 del RGPD."
      lastUpdated="14 de abril de 2026"
    >
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        Este documento regula el tratamiento de datos personales realizado por {name} en nombre de
        sus clientes, en calidad de encargado del tratamiento conforme al artículo 28 del Reglamento
        General de Protección de Datos (RGPD).
      </div>

      <LegalSection number="1." heading="Partes">
        <p className="font-medium text-slate-700">Responsable del tratamiento</p>
        <p>
          El cliente que utiliza la plataforma {name} y que introduce datos personales en el
          sistema.
        </p>

        <p className="mt-4 font-medium text-slate-700">Encargado del tratamiento</p>
        <dl className="mt-2 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
          <div className="flex gap-2">
            <dt className="min-w-32 font-medium text-slate-700">Razón social:</dt>
            <dd>{legalEntity}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="min-w-32 font-medium text-slate-700">Nombre comercial:</dt>
            <dd>{name}</dd>
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
            <dt className="min-w-32 font-medium text-slate-700">Contacto:</dt>
            <dd>
              <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
                {supportEmail}
              </a>
            </dd>
          </div>
        </dl>
      </LegalSection>

      <LegalSection number="2." heading="Objeto">
        <p>
          El presente contrato regula el tratamiento de datos personales que {name} realiza para
          prestar el servicio de software de facturación.
        </p>
      </LegalSection>

      <LegalSection number="3." heading="Duración">
        <p>
          Este contrato permanecerá vigente mientras el cliente utilice los servicios de {name}.
        </p>
      </LegalSection>

      <LegalSection number="4." heading="Tipo de datos tratados">
        <p>{name} podrá tratar datos como:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>nombre y apellidos</li>
          <li>NIF/CIF</li>
          <li>direcciones</li>
          <li>correos electrónicos</li>
          <li>datos de facturación</li>
          <li>datos de clientes y proveedores</li>
        </ul>
      </LegalSection>

      <LegalSection number="5." heading="Finalidad del tratamiento">
        <p>Los datos serán tratados exclusivamente para:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>prestar el servicio de facturación</li>
          <li>almacenar y gestionar facturas</li>
          <li>permitir el cumplimiento de obligaciones fiscales</li>
        </ul>
        <p className="mt-3 font-medium text-slate-700">
          {name} no utilizará los datos para fines propios.
        </p>
      </LegalSection>

      <LegalSection number="6." heading="Obligaciones del encargado">
        <p>{name} se compromete a:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>tratar los datos únicamente siguiendo instrucciones del cliente</li>
          <li>garantizar la confidencialidad de la información</li>
          <li>aplicar medidas de seguridad adecuadas</li>
          <li>no comunicar los datos a terceros sin autorización</li>
        </ul>
      </LegalSection>

      <LegalSection number="7." heading="Subencargados">
        <p>
          {name} podrá utilizar proveedores tecnológicos para prestar el servicio (por ejemplo,
          alojamiento o almacenamiento). En estos casos se garantizará que dichos proveedores
          cumplen la normativa de protección de datos.
        </p>
      </LegalSection>

      <LegalSection number="8." heading="Seguridad">
        <p>
          {name} aplicará medidas técnicas y organizativas adecuadas para garantizar la seguridad de
          los datos, según lo establecido en el artículo 32 del RGPD.
        </p>
      </LegalSection>

      <LegalSection number="9." heading="Finalización del servicio">
        <p>Cuando finalice la relación contractual, los datos podrán ser:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>eliminados de los sistemas de {name}</li>
          <li>devueltos al cliente si lo solicita expresamente</li>
        </ul>
      </LegalSection>

      <LegalSection number="10." heading="Cumplimiento de normativa de facturación">
        <p>
          {name} es un software diseñado para facilitar la gestión de facturación conforme a la
          normativa vigente. El software puede incorporar funcionalidades destinadas a cumplir con
          sistemas de control fiscal como los exigidos por la legislación española.
        </p>
        <p className="mt-3">No obstante:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>{name} actúa exclusivamente como proveedor tecnológico</li>
          <li>el usuario es responsable de cumplir sus obligaciones fiscales</li>
          <li>
            la veracidad de los datos introducidos en el sistema es responsabilidad del usuario
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="11." heading="Sistemas de facturación verificable">
        <p>
          Cuando la normativa lo requiera, {name} podrá integrar funcionalidades para la
          comunicación de registros de facturación a las administraciones públicas competentes. El
          usuario autoriza a {name} a realizar las comunicaciones técnicas necesarias para el
          funcionamiento de dichas integraciones.
        </p>
      </LegalSection>

      <LegalSection number="12." heading="Responsabilidad del usuario">
        <p>El usuario es responsable de:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>revisar la información enviada a las administraciones</li>
          <li>cumplir la normativa fiscal aplicable a su negocio</li>
          <li>conservar la documentación contable exigida por la ley</li>
        </ul>
      </LegalSection>
    </LegalPageWrapper>
  );
}
