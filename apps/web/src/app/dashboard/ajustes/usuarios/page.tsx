'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users as UsersIcon, Shield, User, Pencil, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth-store';
import { useUpdateProfile } from '@/hooks/use-profile';

const profileSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio').max(100),
  lastName: z.string().min(1, 'Los apellidos son obligatorios').max(100),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function AjustesUsuariosPage() {
  const user = useAuthStore((s) => s.user);
  const currentTenant = useAuthStore((s) => s.currentTenant);
  const tenants = useAuthStore((s) => s.tenants);
  const updateProfile = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);

  const currentTenantRole = tenants.find((t) => t.tenant.id === currentTenant?.id);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
  });

  async function handleSubmit(data: ProfileFormData) {
    await updateProfile.mutateAsync(data);
    setIsEditing(false);
  }

  function handleCancelEdit() {
    form.reset({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' });
    setIsEditing(false);
  }

  return (
    <div className="space-y-6">
      {/* Usuario actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tu Cuenta
          </CardTitle>
          <CardDescription>Información de tu usuario en esta empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <>
              {isEditing ? (
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                    <Label>Email</Label>
                    <Input value={user.email} disabled className="bg-muted" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      El email no se puede modificar
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={updateProfile.isPending}
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {user.firstName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentTenantRole && (
                      <Badge variant={currentTenantRole.isOwner ? 'default' : 'outline'}>
                        {currentTenantRole.isOwner ? 'Propietario' : currentTenantRole.role}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-muted-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Multi-usuario - Próximamente */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription>Invita a colaboradores y gestiona sus permisos</CardDescription>
            </div>
            <Badge variant="secondary">Próximamente</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Pronto podrás invitar a otros usuarios como asesores o administradores, asignarles
              roles específicos y controlar qué datos pueden ver o modificar.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
