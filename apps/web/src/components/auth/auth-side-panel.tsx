import Link from 'next/link';
import Image from 'next/image';
import { brandConfig } from '@easyfactura/brand-config';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield, Zap, Users, Clock, BadgeCheck, Star } from 'lucide-react';

interface AuthSidePanelProps {
  variant?: 'login' | 'register';
}

const benefits = [
  {
    icon: Shield,
    title: 'VeriFactu automático',
    description: 'Cumplimiento garantizado con Hacienda',
  },
  {
    icon: Clock,
    title: '6 meses gratis',
    description: 'Sin tarjeta de crédito requerida',
  },
  {
    icon: Zap,
    title: 'Facturas en 60 segundos',
    description: 'Sin conocimientos técnicos',
  },
  {
    icon: Users,
    title: '+3.000 profesionales',
    description: 'Ya confían en nosotros',
  },
];

const testimonial = {
  text: `Llevaba meses preocupada por VeriFactu. Con ${brandConfig.app.name} me despreocupé en 10 minutos. Lo mejor es que es completamente gratis.`,
  author: 'Laura García',
  role: 'Diseñadora freelance',
  rating: 5,
};

export function AuthSidePanel({ variant = 'login' }: AuthSidePanelProps) {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-10 text-white lg:flex lg:p-12">
      {/* Background pattern */}
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

      {/* Decorative circles */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/5" />

      {/* Content */}
      <div className="relative z-10">
        {/* Logo */}
        <Link href="/" className="inline-block">
          <div className="flex items-center gap-3">
            <Image
              src={brandConfig.logos.main}
              alt={brandConfig.app.name}
              width={180}
              height={50}
              className="brightness-0 invert"
              style={{ width: 'auto', height: '40px' }}
            />
          </div>
        </Link>

        {/* Badge */}
        <div className="mt-6">
          <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/20">
            <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />
            Certificado VeriFactu
          </Badge>
        </div>

        {/* Main heading */}
        <div className="mt-10">
          <h1 className="text-3xl font-bold leading-tight xl:text-4xl">
            {variant === 'login'
              ? 'Bienvenido de nuevo'
              : 'Empieza a facturar cumpliendo con Hacienda'}
          </h1>
          <p className="mt-4 text-lg text-white/80">
            {variant === 'login'
              ? 'Accede a tu cuenta y continúa gestionando tu facturación de forma segura.'
              : `Únete a más de 3.000 profesionales que ya cumplen con VeriFactu automáticamente con ${brandConfig.app.name}.`}
          </p>
        </div>

        {/* Benefits list */}
        {variant === 'register' && (
          <div className="mt-10 space-y-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <benefit.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-white/70">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Testimonial */}
      <div className="relative z-10 mt-auto">
        <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
          {/* Stars */}
          <div className="mb-3 flex gap-1">
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>

          {/* Quote */}
          <blockquote className="text-sm leading-relaxed text-white/90">
            &ldquo;{testimonial.text}&rdquo;
          </blockquote>

          {/* Author */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
              {testimonial.author.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{testimonial.author}</div>
              <div className="text-sm text-white/60">{testimonial.role}</div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/60">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            SSL Seguro
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            RGPD
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Servidores EU
          </span>
        </div>
      </div>
    </div>
  );
}
