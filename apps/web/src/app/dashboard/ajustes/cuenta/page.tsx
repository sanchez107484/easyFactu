'use client';

import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, Key, Loader2, Mail } from 'lucide-react';
import { authApi } from '@/lib/api/auth-api';
import { useAuthStore } from '@/store/auth-store';
import { getApiErrorMessage } from '@/lib/api-error';

// ── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio').max(100),
  lastName: z.string().min(1, 'Los apellidos son obligatorios').max(100),
});

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

type ProfileFormData = z.infer<typeof profileSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ── Sub-components ────────────────────────────────────────────────────────────

function PersonalDataCard() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
  });

  const updateProfile = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updated) => {
      updateUser({ firstName: updated.firstName, lastName: updated.lastName });
      toast.success('Datos actualizados correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  function onSubmit(data: ProfileFormData) {
    updateProfile.mutate(data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Datos personales
        </CardTitle>
        <CardDescription>Actualiza tu nombre y apellidos</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">Nombre *</Label>
              <Input id="firstName" {...form.register('firstName')} />
              {form.formState.errors.firstName && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Apellidos *</Label>
              <Input id="lastName" {...form.register('lastName')} />
              {form.formState.errors.lastName && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              value={user?.email ?? ''}
              disabled
              className="bg-muted/50 text-muted-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">El correo no se puede modificar</p>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={updateProfile.isPending} className="gap-2">
              {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
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
      toast.error(getApiErrorMessage(error));
    },
  });

  function onSubmit(data: ChangePasswordFormData) {
    changePassword.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Contraseña
        </CardTitle>
        <CardDescription>Cambia tu contraseña de acceso</CardDescription>
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

          <Separator />

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
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AjustesCuentaPage() {
  return (
    <div className="space-y-6">
      <PersonalDataCard />
      <ChangePasswordCard />
    </div>
  );
}
