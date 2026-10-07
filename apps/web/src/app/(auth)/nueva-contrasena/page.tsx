'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { brandConfig } from '@easyfactura/brand-config';
import { PasswordStrength } from '@/components/auth/password-strength';
import { authApi } from '@/lib/api/auth-api';
import { getErrorMessage } from '@/lib/api-client';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function NuevaContrasenaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const watchPassword = form.watch('password');

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    try {
      await authApi.resetPassword(token, data.password);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold">Enlace incompleto</h1>
        <p className="text-sm text-muted-foreground">
          Este enlace no contiene el token necesario. Solicita un nuevo enlace de recuperación.
        </p>
        <Link href="/recuperar-password">
          <Button variant="outline">Solicitar nuevo enlace</Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-xl font-bold">¡Contraseña actualizada!</h1>
        <p className="text-sm text-muted-foreground">Redirigiendo al inicio de sesión…</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Nueva contraseña</h1>
          <p className="text-sm text-muted-foreground">Elige una contraseña segura para tu cuenta</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      className="pl-9 pr-10"
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                {watchPassword && <PasswordStrength password={watchPassword} />}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repetir contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repite la nueva contraseña"
                      className="pl-9 pr-10"
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : (
              <>
                Guardar nueva contraseña
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        ¿Recuerdas tu contraseña?{' '}
        <Link href="/login" className="text-primary underline underline-offset-2">
          Iniciar sesión
        </Link>
      </p>
    </>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50/40 to-background px-4 py-12 dark:from-indigo-950/20">
      <div className="mb-8">
        <Link href="/">
          <Image
            src={brandConfig.logos.main}
            alt={brandConfig.app.name}
            width={180}
            height={50}
            className="object-contain"
            style={{ width: 'auto', height: '44px' }}
          />
        </Link>
      </div>
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">{children}</div>
    </div>
  );
}

export default function NuevaContrasenaPage() {
  return (
    <PageShell>
      <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />}>
        <NuevaContrasenaContent />
      </Suspense>
    </PageShell>
  );
}
