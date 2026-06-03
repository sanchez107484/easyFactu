import type { Metadata } from 'next';
import Link from 'next/link';
import { Linkedin, Mail } from 'lucide-react';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { brandConfig } from '@easyfactura/brand-config';
import { TeamMemberAvatar } from '@/components/team/TeamMemberAvatar';

interface TeamMember {
  slug: string;
  name: string;
  role: string;
  bio: string[];
  credentials: string[];
  linkedinUrl: string;
  email: string;
  imageUrl: string;
  expertise: string[];
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    slug: 'luis-fernando',
    name: 'Luis Fernando Sánchez',
    role: 'Fundador & CEO',
    bio: [
      'Emprendedor tecnológico con más de 8 años de experiencia en el desarrollo de software empresarial y SaaS. Fundador de NovaFactura, la plataforma de facturación inteligente que ayuda a autónomos y PYMEs a cumplir con VeriFactu sin complicaciones.',
      'Ingeniero de software especializado en aplicaciones fiscales y de gestión empresarial. Ha liderado proyectos de digitalización para múltiples sectores, desde hostelería hasta servicios profesionales, ayudando a cientos de negocios a optimizar sus procesos administrativos.',
      'Su visión es clara: democratizar el acceso a herramientas de facturación profesional, eliminando las barreras técnicas y económicas que tradicionalmente han existido para autónomos y pequeñas empresas.',
    ],
    credentials: [
      'Ingeniero de Software con 8+ años de experiencia',
      'Especialista en SaaS y aplicaciones fiscales',
      'Fundador de múltiples proyectos tecnológicos exitosos',
      'Experto en VeriFactu y normativa fiscal española',
      'Arquitecto de software para plataformas de facturación',
    ],
    linkedinUrl: 'https://www.linkedin.com/in/luis-fernando-s%C3%A1nchez-merino-524b4118a/',
    email: 'luis@novafactura.es',
    imageUrl: '/team/luis-fernando.jpg',
    expertise: [
      'Desarrollo de SaaS (Software as a Service)',
      'Integración con sistemas de la AEAT',
      'VeriFactu y normativa fiscal',
      'Arquitectura de aplicaciones empresariales',
      'Optimización de procesos administrativos',
    ],
  },
];

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const member = TEAM_MEMBERS.find((m) => m.slug === params.slug);

  if (!member) {
    return {
      title: 'Autor no encontrado',
    };
  }

  return {
    title: `${member.name} — ${member.role} | ${brandConfig.app.name}`,
    description: member.bio[0],
    alternates: {
      canonical: `${brandConfig.app.url}/autor/${member.slug}`,
    },
    openGraph: {
      title: `${member.name} — ${member.role}`,
      description: member.bio[0],
      url: `${brandConfig.app.url}/autor/${member.slug}`,
      type: 'profile',
      images: member.imageUrl ? [`${brandConfig.app.url}${member.imageUrl}`] : undefined,
    },
  };
}

export default function AuthorPage({ params }: { params: { slug: string } }) {
  const member = TEAM_MEMBERS.find((m) => m.slug === params.slug);

  if (!member) {
    notFound();
  }

  // Schema.org Person — E-E-A-T signal
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: member.name,
    jobTitle: member.role,
    url: `${brandConfig.app.url}/autor/${member.slug}`,
    sameAs: [member.linkedinUrl, ...(brandConfig.app.sameAs || [])],
    email: member.email,
    worksFor: {
      '@type': 'Organization',
      name: brandConfig.app.name,
      url: brandConfig.app.url,
      sameAs: brandConfig.app.sameAs,
    },
    knowsAbout: member.expertise,
  };

  // Breadcrumb schema
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: brandConfig.app.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Autor',
        item: `${brandConfig.app.url}/autor`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: member.name,
        item: `${brandConfig.app.url}/autor/${member.slug}`,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-indigo-50/50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            {/* Breadcrumb */}
            <nav className="mb-8 text-sm text-slate-600">
              <Link href="/" className="hover:text-indigo-600">
                Inicio
              </Link>
              <span className="mx-2">/</span>
              <span className="font-medium text-slate-900">{member.name}</span>
            </nav>

            <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
              {/* Avatar */}
              <div className="shrink-0">
                <div className="relative h-48 w-48 overflow-hidden rounded-2xl border-4 border-white shadow-xl">
                  <TeamMemberAvatar imageUrl={member.imageUrl} name={member.name} size="lg" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                  {member.name}
                </h1>
                <p className="mb-4 text-xl font-medium text-indigo-600">{member.role}</p>

                {/* Contact Links */}
                <div className="flex items-center justify-center gap-3 md:justify-start">
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a
                    href={`mailto:${member.email}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                    aria-label="Email"
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Biography */}
        <section className="border-b py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="mb-8 text-3xl font-bold text-slate-900">Biografía</h2>
            <div className="space-y-4">
              {member.bio.map((paragraph, i) => (
                <p key={i} className="text-lg leading-relaxed text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Credentials */}
        <section className="border-b bg-slate-50 py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="mb-8 text-3xl font-bold text-slate-900">Credenciales</h2>
            <ul className="space-y-3">
              {member.credentials.map((credential, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg
                    className="mt-1 h-5 w-5 shrink-0 text-indigo-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-lg text-slate-700">{credential}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Expertise */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="mb-8 text-3xl font-bold text-slate-900">Áreas de especialización</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {member.expertise.map((area, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-indigo-200 hover:shadow-md"
                >
                  <span className="font-medium text-slate-900">{area}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-indigo-50 py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">¿Tienes alguna pregunta?</h2>
            <p className="mb-8 text-lg text-slate-600">
              Estoy siempre disponible para ayudarte con tus dudas sobre facturación y VeriFactu.
            </p>
            <a
              href={`mailto:${member.email}`}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <Mail className="h-5 w-5" />
              Enviar email
            </a>
          </div>
        </section>
      </main>

      <FooterLanding />
    </div>
  );
}
