import type { Metadata } from 'next';
import { brandConfig } from '@easyfactura/brand-config';
import { LegalPageWrapper } from '@/components/legal/LegalPageWrapper';
import { LegalSection } from '@/components/legal/LegalSection';

export const metadata: Metadata = {
  title: 'Términos de Uso',
  description: `Condiciones generales de uso de la plataforma ${brandConfig.app.name}.`,
  alternates: { canonical: `${brandConfig.app.url}/terminos-uso` },
};

export default function TerminosUsoPage() {
  const { name } = brandConfig.app;

  return (
    <LegalPageWrapper
      title="Términos de Uso"
      subtitle="Condiciones generales para el acceso y uso del servicio."
      lastUpdated="14 de abril de 2026"
    >
      <LegalSection number="1." heading="Objeto">
        <p>
          Los presentes términos regulan el acceso y uso del software {name}, una plataforma online
          de gestión de facturación y administración empresarial.
        </p>
      </LegalSection>

      <LegalSection number="2." heading="Aceptación de los términos">
        <p>
          Al crear una cuenta o utilizar el servicio, el usuario declara haber leído y aceptado los
          presentes términos.
        </p>
      </LegalSection>

      <LegalSection number="3." heading="Registro de usuario">
        <p>
          Para utilizar la plataforma es necesario crear una cuenta proporcionando información veraz
          y actualizada.
        </p>
        <p>El usuario es responsable de:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>mantener la confidencialidad de su contraseña</li>
          <li>todas las actividades realizadas desde su cuenta</li>
        </ul>
      </LegalSection>

      <LegalSection number="4." heading="Uso del servicio">
        <p>
          El usuario se compromete a utilizar la plataforma únicamente para fines legales y de
          acuerdo con la normativa aplicable.
        </p>
        <p>Queda prohibido:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>usar el sistema para actividades fraudulentas</li>
          <li>introducir información falsa</li>
          <li>intentar acceder a cuentas de otros usuarios</li>
          <li>interferir con el funcionamiento del servicio</li>
        </ul>
      </LegalSection>

      <LegalSection number="5." heading="Datos introducidos por el usuario">
        <p>
          El usuario es responsable de los datos introducidos en el software, incluyendo información
          fiscal, contable o comercial. {name} actúa como proveedor tecnológico de la plataforma.
        </p>
      </LegalSection>

      <LegalSection number="6." heading="Disponibilidad del servicio">
        <p>
          {name} se esfuerza por mantener el servicio disponible de forma continua. No obstante,
          puede haber interrupciones por:
        </p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>mantenimiento programado</li>
          <li>mejoras técnicas</li>
          <li>causas externas o de fuerza mayor</li>
        </ul>
      </LegalSection>

      <LegalSection number="7." heading="Propiedad intelectual">
        <p>
          El software, su código y diseño son propiedad de {name}. El usuario obtiene únicamente una
          licencia de uso limitada y no exclusiva para el periodo de su suscripción.
        </p>
      </LegalSection>

      <LegalSection number="8." heading="Suspensión o cancelación de cuentas">
        <p>{name} podrá suspender cuentas en caso de:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>incumplimiento de los presentes términos</li>
          <li>uso fraudulento del servicio</li>
          <li>actividades ilegales</li>
        </ul>
      </LegalSection>

      <LegalSection number="9." heading="Modificaciones">
        <p>
          {name} podrá modificar los presentes términos. Las modificaciones se publicarán en el
          sitio web con un preaviso razonable para usuarios activos.
        </p>
      </LegalSection>
    </LegalPageWrapper>
  );
}
