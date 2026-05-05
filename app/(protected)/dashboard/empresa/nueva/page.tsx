'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Check } from 'lucide-react';

const FORMA_OPTIONS = [
  { value: 'autonomo', label: 'Autónomo/a' },
  { value: 'sl', label: 'Sociedad Limitada (SL)' },
  { value: 'sa', label: 'Sociedad Anónima (SA)' },
  { value: 'slne', label: 'SL Nueva Empresa (SLNE)' },
  { value: 'cb', label: 'Comunidad de Bienes (CB)' },
  { value: 'cooperativa', label: 'Cooperativa' },
  { value: 'fundacion', label: 'Fundación' },
  { value: 'otra', label: 'Otra forma jurídica' }
];

const PROVINCIAS = [
  'Álava','Albacete','Alicante','Almería','Asturias','Ávila','Badajoz','Baleares','Barcelona',
  'Burgos','Cáceres','Cádiz','Cantabria','Castellón','Ciudad Real','Córdoba','Cuenca',
  'Girona','Granada','Guadalajara','Gipuzkoa','Huelva','Huesca','Jaén','A Coruña','La Rioja',
  'Las Palmas','León','Lleida','Lugo','Madrid','Málaga','Murcia','Navarra','Ourense',
  'Palencia','Pontevedra','Salamanca','Santa Cruz de Tenerife','Segovia','Sevilla','Soria',
  'Tarragona','Teruel','Toledo','Valencia','Valladolid','Bizkaia','Zamora','Zaragoza','Ceuta','Melilla'
].sort();

export default function NuevaEmpresaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    razon_social: '',
    nombre_comercial: '',
    cif_nif: '',
    forma_juridica: 'autonomo',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigo_postal: '',
    pais: 'ES',
    telefono: '',
    email: '',
    web: ''
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al crear la empresa.');
        return;
      }

      router.push('/dashboard/empresa?created=1');
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-2xl px-6">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#29384a] hover:text-[#07111d]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </Link>

        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-xl bg-[#d7a33a]/10 p-3 text-[#d7a33a]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c88b25]">Nueva empresa</p>
              <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">Datos de facturación</h1>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identificación */}
            <fieldset>
              <legend className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c88b25]">
                Identificación
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label text="Razón social *" />
                  <Input
                    required
                    placeholder="Mi Empresa SL"
                    value={form.razon_social}
                    onChange={(e) => set('razon_social', e.target.value)}
                  />
                </div>
                <div>
                  <Label text="Nombre comercial" />
                  <Input
                    placeholder="Nombre de marca (opcional)"
                    value={form.nombre_comercial}
                    onChange={(e) => set('nombre_comercial', e.target.value)}
                  />
                </div>
                <div>
                  <Label text="CIF / NIF" />
                  <Input
                    placeholder="B12345678"
                    value={form.cif_nif}
                    onChange={(e) => set('cif_nif', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label text="Forma jurídica *" />
                  <select
                    required
                    value={form.forma_juridica}
                    onChange={(e) => set('forma_juridica', e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-[#d8cbb5] bg-[#f8f4eb] px-3 text-sm text-[#07111d] outline-none transition focus:border-[#d7a33a] focus:ring-2 focus:ring-[#d7a33a]/20"
                  >
                    {FORMA_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Dirección fiscal */}
            <fieldset>
              <legend className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c88b25]">
                Dirección fiscal
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label text="Dirección" />
                  <Input
                    placeholder="Calle Mayor, 10, 2ºA"
                    value={form.direccion}
                    onChange={(e) => set('direccion', e.target.value)}
                  />
                </div>
                <div>
                  <Label text="Ciudad" />
                  <Input
                    placeholder="Alicante"
                    value={form.ciudad}
                    onChange={(e) => set('ciudad', e.target.value)}
                  />
                </div>
                <div>
                  <Label text="Provincia" />
                  <select
                    value={form.provincia}
                    onChange={(e) => set('provincia', e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-[#d8cbb5] bg-[#f8f4eb] px-3 text-sm text-[#07111d] outline-none transition focus:border-[#d7a33a] focus:ring-2 focus:ring-[#d7a33a]/20"
                  >
                    <option value="">Seleccionar...</option>
                    {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <Label text="Código postal" />
                  <Input
                    placeholder="03001"
                    maxLength={5}
                    value={form.codigo_postal}
                    onChange={(e) => set('codigo_postal', e.target.value)}
                  />
                </div>
                <div>
                  <Label text="País" />
                  <Input
                    value={form.pais}
                    onChange={(e) => set('pais', e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="ES"
                    maxLength={2}
                  />
                </div>
              </div>
            </fieldset>

            {/* Contacto */}
            <fieldset>
              <legend className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c88b25]">
                Contacto de la empresa
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label text="Teléfono" />
                  <Input
                    type="tel"
                    placeholder="+34 966 000 000"
                    value={form.telefono}
                    onChange={(e) => set('telefono', e.target.value)}
                  />
                </div>
                <div>
                  <Label text="Email empresa" />
                  <Input
                    type="email"
                    placeholder="info@miempresa.com"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label text="Web" />
                  <Input
                    type="url"
                    placeholder="https://miempresa.com"
                    value={form.web}
                    onChange={(e) => set('web', e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d7a33a] px-6 font-semibold text-[#061321] transition hover:bg-[#f0bf54] disabled:opacity-60"
            >
              {loading ? 'Creando empresa…' : (
                <>
                  <Check className="h-4 w-4" />
                  Guardar empresa
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Label({ text }: { text: string }) {
  return <label className="mb-1 block text-xs font-semibold text-[#29384a]">{text}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="min-h-11 w-full rounded-lg border border-[#d8cbb5] bg-[#f8f4eb] px-3 text-sm text-[#07111d] outline-none transition placeholder:text-[#9ca3af] focus:border-[#d7a33a] focus:ring-2 focus:ring-[#d7a33a]/20"
    />
  );
}
