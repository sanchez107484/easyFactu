'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Package,
  Wrench,
  Euro,
  Tag,
  FileText,
  Hash,
  Ruler,
  AlertCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useProduct, useDeleteProduct } from '@/hooks/use-products';
import { ProductType } from '@easyfactura/shared-types';
import { cn } from '@/lib/utils';

// ==================== SUB-COMPONENTS ====================

interface ReadOnlyFieldProps {
  label: string;
  value?: string | null;
  icon?: React.ElementType;
  placeholder?: string;
}

function ReadOnlyField({
  label,
  value,
  icon: Icon,
  placeholder = 'No especificado',
}: ReadOnlyFieldProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label}
      </p>
      <div className="h-11 flex items-center px-3 rounded-lg border bg-muted/30 text-sm">
        {value ? (
          value
        ) : (
          <span className="text-muted-foreground italic text-xs">{placeholder}</span>
        )}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: ProductType }) {
  const isService = type === ProductType.SERVICE;
  const Icon = isService ? Wrench : Package;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold',
        isService
          ? 'bg-product-100 text-product-700 dark:bg-product-900/30 dark:text-product-400'
          : 'bg-product-100 text-product-700 dark:bg-product-900/30 dark:text-product-400',
      )}
    >
      <Icon className="h-3 w-3" />
      {isService ? 'Servicio' : 'Producto'}
    </span>
  );
}

function ViewSkeleton() {
  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ==================== PAGE ====================

export default function VerProductoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: product, isLoading, error } = useProduct(id);
  const deleteMutation = useDeleteProduct();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/dashboard/productos');
  };

  if (isLoading) return <ViewSkeleton />;

  if (error || !product) {
    return (
      <div className="pb-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/productos">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Detalle del producto</h1>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold">No se encontró el producto</p>
          <p className="text-sm text-muted-foreground">
            Puede que haya sido eliminado o que no exista.
          </p>
          <Link href="/dashboard/productos">
            <Button variant="outline" className="mt-2">
              Volver al catálogo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const unitPrice = Number(product.unitPrice) || 0;
  const taxRate = Number(product.taxRate) || 0;
  const taxAmount = unitPrice * (taxRate / 100);
  const pvp = unitPrice + taxAmount;
  const isService = product.type === ProductType.SERVICE;

  const TAX_LABEL: Record<string, string> = {
    '0': '0% — Exento / No sujeto',
    '4': '4% — Superreducido',
    '10': '10% — Reducido',
    '21': '21% — General',
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/productos">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <TypeBadge type={product.type as ProductType} />
              {product.reference && (
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                  {product.reference}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará <strong>{product.name}</strong> de tu catálogo. Esta acción no se
                  puede deshacer. Las facturas ya creadas no se verán afectadas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Sí, eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Link href={`/dashboard/productos/${id}/editar`}>
            <Button size="sm">
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Editar producto
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sección 1: Tipo */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30">
              <h2 className="text-sm font-semibold">Tipo de elemento</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([ProductType.SERVICE, ProductType.PRODUCT] as const).map((type) => {
                  const active = product.type === type;
                  const Icon = type === ProductType.SERVICE ? Wrench : Package;
                  const label = type === ProductType.SERVICE ? 'Servicio' : 'Producto';
                  const description =
                    type === ProductType.SERVICE
                      ? 'Consultoría, diseño, desarrollo, asesoría…'
                      : 'Artículo físico, material, mercancía…';
                  const tip =
                    type === ProductType.SERVICE
                      ? 'Ideal para facturar por horas o proyectos'
                      : 'Ideal si vendes bienes tangibles';
                  return (
                    <div
                      key={type}
                      className={cn(
                        'relative flex flex-col gap-2 rounded-xl border-2 p-5',
                        active ? 'border-primary bg-primary/5' : 'border-border opacity-40',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                            active
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p
                            className={cn(
                              'font-semibold text-sm',
                              active ? 'text-primary' : 'text-foreground',
                            )}
                          >
                            {label}
                          </p>
                          <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground pl-[52px]">{tip}</p>
                      {active && (
                        <div className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sección 2: Información básica */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30">
              <h2 className="text-sm font-semibold">Información básica</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Datos que aparecen en tus facturas
              </p>
            </div>
            <div className="p-6 space-y-5">
              <ReadOnlyField label="Nombre" value={product.name} icon={Tag} />

              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Descripción
                </p>
                <div
                  className={cn(
                    'min-h-[4.5rem] px-3 py-2.5 rounded-lg border bg-muted/30 text-sm',
                    !product.description && 'flex items-center',
                  )}
                >
                  {product.description ? (
                    <p className="whitespace-pre-wrap">{product.description}</p>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Sin descripción</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadOnlyField
                  label="Referencia / Código"
                  value={product.reference}
                  icon={Hash}
                  placeholder="Sin referencia"
                />
                <ReadOnlyField
                  label="Unidad de medida"
                  value={product.unit}
                  icon={Ruler}
                  placeholder={isService ? 'hora, proyecto, mes…' : 'ud., kg, caja…'}
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Precio */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30">
              <h2 className="text-sm font-semibold">Precio e impuestos</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                    {product.unit ? `Precio por ${product.unit}` : 'Precio sin IVA'}
                  </p>
                  <div className="h-11 flex items-center px-3 rounded-lg border bg-muted/30 text-sm font-medium tabular-nums">
                    {unitPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tipo de IVA</p>
                  <div className="h-11 flex items-center px-3 rounded-lg border bg-muted/30 text-sm">
                    {TAX_LABEL[String(taxRate)] ?? `${taxRate}%`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden sticky top-4">
            <div className="px-5 py-4 border-b bg-muted/30">
              <p className="text-sm font-semibold">Resumen del precio</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Precio base</span>
                <span className="font-medium tabular-nums">
                  {unitPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA ({taxRate}%)</span>
                <span className="font-medium tabular-nums text-muted-foreground">
                  +{taxAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-sm">Total al cliente</span>
                  <span className="text-2xl font-extrabold tabular-nums text-primary">
                    {pvp.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Precio final con todos los impuestos
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 space-y-2 border-t pt-4">
              <Link href={`/dashboard/productos/${id}/editar`} className="block">
                <Button className="w-full h-11 font-semibold">
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar producto
                </Button>
              </Link>
              <Link href="/dashboard/productos" className="block">
                <Button variant="ghost" className="w-full">
                  Volver al catálogo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
