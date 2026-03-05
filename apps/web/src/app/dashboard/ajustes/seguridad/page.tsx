'use client';

import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Key, Smartphone, Monitor, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authApi } from '@/lib/api/auth-api';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Introduce tu contraseña actual'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener mayúsculas, minúsculas y números'),
    confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function AjustesSeguridadPage() {
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente');
      form.reset();
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al cambiar la contraseña';
      toast.error(msg);
    },
  });

  function onSubmit(data: ChangePasswordFormData) {
    changePassword.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  }

  return (
    <div className="space-y-6">
      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Contraseña actual *</Label>
              <Input id="currentPassword" type="password" {...form.register('currentPassword')} />
              {form.formState.errors.currentPassword && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="newPassword">Nueva contraseña *</Label>
              <Input id="newPassword" type="password" {...form.register('newPassword')} />
              <p className="mt-1 text-xs text-muted-foreground">
                Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números
              </p>
              {form.formState.errors.newPassword && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña *</Label>
              <Input id="confirmPassword" type="password" {...form.register('confirmPassword')} />
              {form.formState.errors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={changePassword.isPending} className="gap-2">
                {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Cambiar contraseña
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2FA - Próximamente */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Autenticación en Dos Pasos
              </CardTitle>
              <CardDescription>Añade una capa extra de seguridad a tu cuenta</CardDescription>
            </div>
            <Badge variant="secondary">Próximamente</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              Pronto podrás activar la autenticación en dos pasos mediante una aplicación como
              Google Authenticator o Authy.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Sesiones - Próximamente */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Sesiones Activas
              </CardTitle>
              <CardDescription>Dispositivos con acceso a tu cuenta</CardDescription>
            </div>
            <Badge variant="secondary">Próximamente</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Monitor className="h-4 w-4" />
            <AlertDescription>
              Pronto podrás ver y cerrar las sesiones activas en todos tus dispositivos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
