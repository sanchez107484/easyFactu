'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useInviteClient } from '@/hooks/use-agency';
import { useAuthStore } from '@/store/auth-store';
import { AccountType } from '@easyfactura/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Mail, Info } from 'lucide-react';

// ==================== SCHEMA ====================

const schema = z.object({
  inviteeEmail: z.string().email('Email no válido'),
  inviteeName: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ==================== PAGE ====================

export default function InvitarClienteAsesoriaPage() {
  const router = useRouter();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const { mutate: inviteClient, isPending } = useInviteClient();

  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  if (!isAgency) {
    router.replace('/dashboard');
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    inviteClient(
      {
        inviteeEmail: data.inviteeEmail,
        inviteeName: data.inviteeName || undefined,
      },
      {
        onSuccess: () => {
          router.push('/dashboard/asesoria/clientes');
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/asesoria/clientes">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Invitar cliente</h1>
          <p className="text-sm text-muted-foreground">
            El cliente recibirá un email para vincular su cuenta
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Si el cliente ya tiene cuenta en NovaFactura, la vinculación se realiza automáticamente
            al aceptar. Si no tiene cuenta, podrá crearla desde el enlace de invitación.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datos del invitado</CardTitle>
            <CardDescription>La invitación es válida durante 7 días.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inviteeEmail">
                Email del cliente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="inviteeEmail"
                type="email"
                placeholder="cliente@empresa.com"
                {...register('inviteeEmail')}
              />
              {errors.inviteeEmail && (
                <p className="text-xs text-destructive">{errors.inviteeEmail.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inviteeName">Nombre (opcional)</Label>
              <Input
                id="inviteeName"
                placeholder="Nombre Apellidos o Empresa S.L."
                {...register('inviteeName')}
              />
              <p className="text-xs text-muted-foreground">
                Aparecerá en el email de invitación para personalizarlo.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Link href="/dashboard/asesoria/clientes">
            <Button variant="outline" disabled={isPending}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar invitación
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
