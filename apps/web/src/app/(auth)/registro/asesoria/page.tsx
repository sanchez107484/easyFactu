'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { AccountType } from '@easyfactura/shared-types';
import { getErrorMessage } from '@/lib/api-client';
import { brandConfig } from '@easyfactura/brand-config';
import { PasswordStrength } from '@/components/auth/password-strength';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  FileText,
  Loader2,
  CheckCircle2,
  Users,
  LayoutDashboard,
  Shield,
  Gift,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Schema — Para asesorías el NIF de la gestoría es su CIF
// ─────────────────────────────────────────────────────────────────────────────
const registerAgencySchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Introduce un email válido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  businessName: z.string().min(2, 'El nombre de la gestoría es obligatorio'),
  nif: z.string().min(9, 'CIF/NIF inválido').max(9, 'CIF/NIF inválido'),
});

type RegisterAgencyFormData = z.infer<typeof registerAgencySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Side panel content (specific for agencies)
// ─────────────────────────────────────────────────────────────────────────────
const AGENCY_BENEFITS = [
  {
    icon: Gift,
    title: 'Completamente gratis',
    description: 'Para asesorías, para siempre. Sin límites de clientes.',
  },
  {
    icon: LayoutDashboard,
    title: 'Panel centralizado',
    description: 'Todos tus clientes en un solo sitio. Cambia entre ellos en un clic.',
  },
  {
    icon: Shield,
    title: 'VeriFactu por cada NIF',
    description: 'Conformidad fiscal automática para cada uno de tus clientes.',
  },
  {
    icon: Users,
    title: 'Directorio compartido',
    description: 'Crea un cliente una sola vez y reutilízalo en toda tu cartera.',
  },
];

function AgencySidePanel() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-10 text-white lg:flex lg:p-12">
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/5" />

      <div className="relative z-10">
        <Link href="/">
          <Image
            src={brandConfig.logos.white}
            alt={brandConfig.app.name}
            width={160}
            height={48}
            className="object-contain"
            style={{ width: 'auto', height: '40px' }}
          />
        </Link>
      </div>

      <div className="relative z-10 space-y-6">
        <div>
          <Badge className="mb-4 border-indigo-400/30 bg-white/10 text-white">
            Solo para asesorías y gestorías
          </Badge>
          <h2 className="text-3xl font-bold leading-tight">
            Tu herramienta de facturación.
            <br />
            <span className="text-indigo-200">Gratis. Para siempre.</span>
          </h2>
          <p className="mt-3 text-indigo-100">
            Gestiona la facturación de toda tu cartera de clientes desde un único panel con
            VeriFactu integrado.
          </p>
        </div>

        <div className="space-y-4">
          {AGENCY_BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-indigo-200" />
                </div>
                <div>
                  <p className="font-medium text-white">{benefit.title}</p>
                  <p className="text-sm text-indigo-200">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
        <div className="flex gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-yellow-400">
              ★
            </span>
          ))}
        </div>
        <p className="text-sm text-indigo-100 italic">
          "Ahora gestiono 40 autónomos desde una sola pantalla. El cambio entre clientes es
          instantáneo y VeriFactu funciona sin que yo tenga que hacer nada."
        </p>
        <p className="mt-3 text-sm font-medium text-white">Carlos Ruiz</p>
        <p className="text-xs text-indigo-300">Gestoría Ruiz & Asociados, Madrid</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
export default function RegisterAgencyPage() {
  const register = useAuthStore((state) => state.register);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterAgencyFormData>({
    resolver: zodResolver(registerAgencySchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      businessName: '',
      nif: '',
    },
    mode: 'onChange',
  });

  const watchPassword = form.watch('password');

  const onSubmit = async (data: RegisterAgencyFormData) => {
    setIsLoading(true);
    try {
      await register({ ...data, accountType: AccountType.AGENCY });
      toast.success('¡Cuenta de asesoría creada!');
      setTimeout(() => {
        window.location.href = '/dashboard/asesoria';
      }, 500);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-1/2 lg:block">
        <AgencySidePanel />
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col lg:w-1/2">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b p-4 lg:hidden">
          <Link href="/">
            <Image
              src={brandConfig.logos.main}
              alt={brandConfig.app.name}
              width={140}
              height={40}
              className="object-contain"
              style={{ width: 'auto', height: '32px' }}
            />
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Iniciar sesión
            </Button>
          </Link>
        </div>

        {/* Desktop top bar */}
        <div className="hidden items-center justify-between p-6 lg:flex">
          <div className="flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Gift className="h-4 w-4" />
            Gratis para asesorías · Sin límites
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">¿Ya tienes cuenta?</span>
            <Link href="/login">
              <Button variant="outline">Iniciar sesión</Button>
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-6 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Crea tu cuenta de asesoría
              </h1>
              <p className="mt-2 text-muted-foreground">
                Empieza a gestionar tu cartera de clientes en 2 minutos
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Name fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Carlos"
                              className="h-11 pl-10"
                              disabled={isLoading}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ruiz"
                            className="h-11"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Business name */}
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la gestoría / asesoría</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Gestoría Ruiz & Asociados"
                            className="h-11 pl-10"
                            disabled={isLoading}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* NIF */}
                <FormField
                  control={form.control}
                  name="nif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CIF / NIF de la gestoría</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="B12345678"
                            className="h-11 pl-10 uppercase"
                            disabled={isLoading}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de contacto</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="contacto@mipasesoria.com"
                            className="h-11 pl-10"
                            disabled={isLoading}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo 8 caracteres"
                            className="h-11 pl-10 pr-11"
                            disabled={isLoading}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      {watchPassword && <PasswordStrength password={watchPassword} />}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="h-12 w-full bg-indigo-600 text-base hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-5 w-5" />
                  )}
                  {isLoading ? 'Creando cuenta...' : 'Crear cuenta de asesoría'}
                </Button>
              </form>
            </Form>

            {/* Benefits summary */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                Incluido en tu plan de asesoría
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  'Clientes ilimitados',
                  'VeriFactu incluido',
                  'Soporte prioritario',
                  'Acceso completo',
                ].map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              ¿Eres autónomo o empresa?{' '}
              <Link href="/registro" className="text-primary underline-offset-4 hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
