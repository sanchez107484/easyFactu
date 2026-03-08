'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { brandConfig } from '@easyfactura/brand-config';
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
import { ArrowLeft, ArrowRight, Mail, Loader2, CheckCircle2, KeyRound } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────
const resetSchema = z.object({
  email: z.string().email('Introduce un email válido'),
});

type ResetFormData = z.infer<typeof resetSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function RecuperarPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);

    try {
      // Simular llamada a API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success('Instrucciones enviadas a tu email');
    } catch (error) {
      toast.error('Error al enviar el email. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-background p-4">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <Image
          src={brandConfig.logos.main}
          alt={brandConfig.app.name}
          width={180}
          height={50}
          className="object-contain"
          style={{ width: 'auto', height: '44px' }}
        />
      </Link>

      <div className="w-full max-w-md">
        {!isSubmitted ? (
          /* Form State */
          <div className="rounded-2xl border-2 bg-background p-8 shadow-sm">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>

            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold">¿Olvidaste tu contraseña?</h1>
              <p className="mt-2 text-muted-foreground">
                Introduce tu email y te enviaremos instrucciones para restablecerla.
              </p>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de tu cuenta</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="tu@email.com"
                            className="h-12 pl-10"
                            disabled={isLoading}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="h-12 w-full text-base" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar instrucciones
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Back link */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Volver a iniciar sesión
              </Link>
            </div>
          </div>
        ) : (
          /* Success State */
          <div className="rounded-2xl border-2 bg-background p-8 shadow-sm">
            {/* Success icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>

            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold">¡Email enviado!</h1>
              <p className="mt-2 text-muted-foreground">
                Hemos enviado instrucciones para restablecer tu contraseña a:
              </p>
              <p className="mt-2 font-medium">{submittedEmail}</p>
            </div>

            {/* Instructions */}
            <div className="mb-6 space-y-3 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  1
                </span>
                Revisa tu bandeja de entrada (y spam)
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  2
                </span>
                Haz clic en el enlace del email
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  3
                </span>
                Crea tu nueva contraseña
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="h-12 w-full"
                onClick={() => {
                  setIsSubmitted(false);
                  form.reset();
                }}
              >
                Enviar de nuevo
              </Button>
              <Link href="/login" className="block">
                <Button className="h-12 w-full">Volver a iniciar sesión</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Help text */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Necesitas ayuda?{' '}
          <Link href="/contacto" className="text-primary hover:underline">
            Contacta con soporte
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {brandConfig.app.legalEntity}
      </p>
    </div>
  );
}
