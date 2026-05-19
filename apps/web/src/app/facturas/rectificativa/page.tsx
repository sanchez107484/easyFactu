import type { Metadata } from 'next';
import {
  NovafacturaFacturaRectificativaPage,
  novafacturaFacturaRectificativaMetadata,
} from '@/landing/novafactura/factura-rectificativa-page';

export const metadata: Metadata = novafacturaFacturaRectificativaMetadata;

export default function FacturaRectificativaPage() {
  return <NovafacturaFacturaRectificativaPage />;
}
