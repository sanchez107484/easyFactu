'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight, Send, ChevronDown } from 'lucide-react';
import { useState } from 'react';

// ─── Contact reasons ─────────────────────────────────────────────────────────
const REASONS = [
  { value: '', label: 'Selecciona el motivo de contacto' },
  { value: 'soporte', label: '🛠️ Soporte técnico o problema con el software' },
  { value: 'ventas', label: '💼 Información sobre planes y precios' },
  { value: 'migracion', label: '📦 Migración desde otro software' },
  { value: 'verifactu', label: '📋 Dudas sobre VeriFactu o Ley Antifraude' },
  { value: 'empresa', label: '🏢 Consulta para empresa o pyme' },
  { value: 'partnership', label: '🤝 Partnership o colaboración' },
  { value: 'otro', label: '💬 Otro motivo' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ContactoFaqItems — accordion FAQ items with open/close state
// ─────────────────────────────────────────────────────────────────────────────
interface FaqEntry {
  q: string;
  a: string;
}

function FaqItem({ q, a }: FaqEntry) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-xl border-2 bg-white px-5 transition-colors ${open ? 'border-blue-200' : 'border-slate-100'}`}
    >
      <button
        className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-slate-900 transition-colors hover:text-blue-600"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          className={`ml-4 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 pb-4' : 'max-h-0'}`}
      >
        <p className="text-sm leading-relaxed text-slate-500">{a}</p>
      </div>
    </div>
  );
}

export function ContactoFaqItems({ faqs }: { faqs: FaqEntry[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <FaqItem key={i} q={faq.q} a={faq.a} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ContactoForm — contact form with validation and submission state
// ─────────────────────────────────────────────────────────────────────────────
type FormState = 'idle' | 'loading' | 'success' | 'error';

export function ContactoForm() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    empresa: '',
    razon: '',
    mensaje: '',
    privacidad: false,
  });
  const [formState, setFormState] = useState<FormState>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Introduce un email válido.';
    if (!form.razon) e.razon = 'Selecciona el motivo de contacto.';
    if (!form.mensaje.trim() || form.mensaje.trim().length < 20)
      e.mensaje = 'El mensaje debe tener al menos 20 caracteres.';
    if (!form.privacidad) e.privacidad = 'Debes aceptar la política de privacidad.';
    return e;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (errors[name])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setFormState('loading');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY,
          subject: `[NovaFactura] Nueva consulta — ${form.razon}`,
          from_name: form.nombre,
          nombre: form.nombre,
          email: form.email,
          empresa: form.empresa || '(no indicada)',
          motivo: form.razon,
          mensaje: form.mensaje,
          replyto: form.email,
          botcheck: '',
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setFormState('success');
    } catch {
      setFormState('error');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <Send className="h-3.5 w-3.5" />
          Formulario de contacto
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Cuéntanos qué necesitas
        </h2>
        <p className="mt-2 text-slate-500">
          Rellena el formulario y te respondemos en menos de 2 horas.
        </p>
      </div>

      {formState === 'success' ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-green-200 bg-green-50 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-green-900">¡Mensaje enviado!</h3>
          <p className="mb-6 text-green-700">
            Hemos recibido tu consulta. Te responderemos en menos de 2 horas en horario laboral.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <button
              onClick={() => {
                setFormState('idle');
                setForm({
                  nombre: '',
                  email: '',
                  empresa: '',
                  razon: '',
                  mensaje: '',
                  privacidad: false,
                });
              }}
              className="rounded-xl border-2 border-green-200 bg-white px-5 py-2.5 text-sm font-semibold text-green-800 transition-all hover:border-green-300"
            >
              Enviar otra consulta
            </button>
            <Link
              href="/precios"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700"
            >
              Ver planes y precios
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Row: nombre + empresa */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                autoComplete="name"
                placeholder="Laura García"
                value={form.nombre}
                onChange={handleChange}
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-300 focus:border-blue-500 ${
                  errors.nombre
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              />
              {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}
            </div>
            <div>
              <label
                htmlFor="empresa"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Empresa <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                id="empresa"
                name="empresa"
                type="text"
                autoComplete="organization"
                placeholder="Mi empresa S.L."
                value={form.empresa}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-300 hover:border-slate-300 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email de contacto <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="laura@miempresa.com"
              value={form.email}
              onChange={handleChange}
              className={`w-full rounded-xl border-2 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-300 focus:border-blue-500 ${
                errors.email
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          {/* Motivo */}
          <div>
            <label htmlFor="razon" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Motivo de contacto <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="razon"
                name="razon"
                value={form.razon}
                onChange={handleChange}
                className={`w-full appearance-none rounded-xl border-2 px-4 py-3 pr-10 text-sm outline-none transition-colors focus:border-blue-500 ${
                  form.razon ? 'text-slate-900' : 'text-slate-400'
                } ${errors.razon ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value} disabled={r.value === ''}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            {errors.razon && <p className="mt-1 text-xs text-red-600">{errors.razon}</p>}
          </div>

          {/* Mensaje */}
          <div>
            <label htmlFor="mensaje" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Mensaje <span className="text-red-500">*</span>
            </label>
            <textarea
              id="mensaje"
              name="mensaje"
              rows={5}
              placeholder="Cuéntanos con detalle tu consulta para poder ayudarte mejor..."
              value={form.mensaje}
              onChange={handleChange}
              className={`w-full resize-none rounded-xl border-2 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-300 focus:border-blue-500 ${
                errors.mensaje
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.mensaje ? <p className="text-xs text-red-600">{errors.mensaje}</p> : <span />}
              <span
                className={`text-xs ${form.mensaje.length < 20 ? 'text-slate-400' : 'text-green-600'}`}
              >
                {form.mensaje.length} / 20 mín.
              </span>
            </div>
          </div>

          {/* Privacy */}
          <div>
            <label className="flex cursor-pointer items-start gap-3">
              <div className="relative mt-0.5">
                <input
                  name="privacidad"
                  type="checkbox"
                  checked={form.privacidad}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                    form.privacidad
                      ? 'border-blue-600 bg-blue-600'
                      : errors.privacidad
                        ? 'border-red-400 bg-red-50'
                        : 'border-slate-300 bg-white'
                  }`}
                >
                  {form.privacidad && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-600">
                He leído y acepto la{' '}
                <Link
                  href="/privacidad"
                  className="text-blue-600 underline underline-offset-2 hover:no-underline"
                >
                  política de privacidad
                </Link>
                . Mis datos serán usados exclusivamente para responder a esta consulta.
              </span>
            </label>
            {errors.privacidad && (
              <p className="ml-8 mt-1 text-xs text-red-600">{errors.privacidad}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={formState === 'loading'}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            {formState === 'loading' ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Enviar consulta
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {formState === 'error' && (
            <p className="text-center text-sm text-red-600">
              Ha ocurrido un error al enviar. Inténtalo de nuevo o escríbenos a{' '}
              <a href="mailto:soporte@novafactura.es" className="underline">
                soporte@novafactura.es
              </a>
              .
            </p>
          )}
        </form>
      )}
    </div>
  );
}
