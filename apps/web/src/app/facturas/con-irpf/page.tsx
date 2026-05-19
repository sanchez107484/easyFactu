import type { Metadata } from 'next';
import {
  NovafacturaFacturaIrpfPage,
  novafacturaFacturaIrpfMetadata,
} from '@/landing/novafactura/factura-irpf-page';

export const metadata: Metadata = novafacturaFacturaIrpfMetadata;

export default function FacturaConIrpfPage() {
  return <NovafacturaFacturaIrpfPage />;
}
