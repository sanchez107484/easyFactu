'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth-api';
import { useAuthStore } from '@/store/auth-store';
import { setAccessToken, setRefreshToken, getErrorMessage } from '@/lib/api-client';
import { brandConfig } from '@easyfactura/brand-config';
import { PasswordStrength } from '@/components/auth/password-strength';
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
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Briefcase,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const activateSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ActivateFormData = z.infer<typeof activateSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ActivarCuentaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  const setFromAuthResponse = useAuthStore((state) => state.setFromAuthResponse);

  // Validate token format on the client before hitting the server.
  // Tokens are 64-char lowercase hex (randomBytes(32).toString('hex')).
  const isValidTokenFormat = /^[a-f0-9]{64}$/.test(token);

  // Validate token on load — only if format is correct.
  // staleTime: Infinity prevents pointless re-fetches on tab focus.
  const {
    data: tokenInfo,
    isLoading: isValidating,
    error: validationError,
  } = useQuery({
    queryKey: ['activation-token', token],
    queryFn: () => authApi.validateActivationToken(token),
    enabled: isValidTokenFormat,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });

  const form = useForm<ActivateFormData>({
    resolver: zodResolver(activateSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const watchPassword = form.watch('password');

  const { mutate: activate, isPending: isActivating } = useMutation({
    mutationFn: (data: ActivateFormData) =>
      authApi.activateAccount({
        token,
        password: data.password,
      }),
    onSuccess: (authData) => {
      // Store tokens first so any subsequent request is authenticated
      setAccessToken(authData.accessToken);
      setRefreshToken(authData.refreshToken);

      // Sync Zustand store directly from the AuthResponse — no extra round-trip to /auth/me
      setFromAuthResponse(authData);

      setIsActivated(true);
      toast.success('¡Cuenta activada! Bienvenido a NovaFactura.');
      setTimeout(() => router.push('/dashboard'), 1800);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const onSubmit = (data: ActivateFormData) => activate(data);

  // ── Loading state ──
  if (isValidTokenFormat && isValidating) {
    return (
      <ActivationLayout>
        <div className="flex flex-col items-center gap-4 py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando enlace...</p>
        </div>
      </ActivationLayout>
    );
  }

  // ── Invalid / expired token (bad format or DB rejected) ──
  if (!isValidTokenFormat || validationError || !tokenInfo) {
    return (
      <ActivationLayout>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Enlace no válido</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Este enlace de activación no existe o ha caducado. Contacta con tu asesoría para que
              te envíen uno nuevo.
            </p>
          </div>
          <Link href="/login">
            <Button variant="outline">Ir al inicio de sesión</Button>
          </Link>
        </div>
      </ActivationLayout>
    );
  }

  // ── Success state ──
  if (isActivated) {
    return (
      <ActivationLayout>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">¡Cuenta activada!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Redirigiendo a tu panel de facturación...
            </p>
          </div>
        </div>
      </ActivationLayout>
    );
  }

  // ── Main form ──
  return (
    <ActivationLayout>
      {/* Account info */}
      <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4 mb-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-lg font-bold">
          {tokenInfo.businessName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{tokenInfo.businessName}</p>
          <p className="text-xs text-muted-foreground">
            {tokenInfo.email}
            {tokenInfo.agencyName ? (
              <>
                {' '}
                ·{' '}
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {tokenInfo.agencyName}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Activa tu cuenta</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {tokenInfo.agencyName
            ? `Tu asesoría ${tokenInfo.agencyName} ha preparado tu espacio de facturación. Solo necesitas crear tu contraseña.`
            : 'Crea tu contraseña para empezar a usar tu cuenta.'}
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
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
                <PasswordStrength password={watchPassword} />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm password */}
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
                      placeholder="Repite la contraseña"
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
            disabled={isActivating || !form.formState.isValid}
          >
            {isActivating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activando cuenta...
              </>
            ) : (
              <>
                Activar mi cuenta
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-primary underline underline-offset-2">
          Iniciar sesión
        </Link>
      </p>
    </ActivationLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────────

function ActivationLayout({ children }: { children: React.ReactNode }) {
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
