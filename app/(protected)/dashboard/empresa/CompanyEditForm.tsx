'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

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

interface Company {
  id: string;
  razon_social: string;
  nombre_comercial: string | null;
  cif_nif: string | null;
  forma_juridica: string;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  codigo_postal: string | null;
  pais: string;
  telefono: string | null;
  email: string | null;
  web: string | null;
}

export function CompanyEditForm({ company }: { company: Company }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    razon_social:     company.razon_social,
    nombre_comercial: company.nombre_comercial ?? '',
    cif_nif:          company.cif_nif ?? '',
    forma_juridica:   company.forma_juridica,
    direccion:        company.direccion ?? '',
    ciudad:           company.ciudad ?? '',
    provincia:        company.provincia ?? '',
    codigo_postal:    company.codigo_postal ?? '',
    pais:             company.pais,
    telefono:         company.telefono ?? '',
    email:            company.email ?? '',
    web:              company.web ?? ''
  });

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al guardar.');
      } else {
        setSaved(true);
        router.refresh();
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c88b25]">Identificación</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label text="Razón social *" />
            <Input required value={form.razon_social} onChange={(e) => set('razon_social', e.target.value)} placeholder="Mi Empresa SL" />
          </div>
          <div>
            <Label text="Nombre comercial" />
            <Input value={form.nombre_comercial} onChange={(e) => set('nombre_comercial', e.target.value)} placeholder="Nombre de marca" />
          </div>
          <div>
            <Label text="CIF / NIF" />
            <Input value={form.cif_nif} onChange={(e) => set('cif_nif', e.target.value)} placeholder="B12345678" />
          </div>
          <div className="sm:col-span-2">
            <Label text="Forma jurídica *" />
            <select
              required
              value={form.forma_juridica}
              onChange={(e) => set('forma_juridica', e.target.value)}
              className="min-h-11 w-full rounded-lg border border-[#d8cbb5] bg-[#f8f4eb] px-3 text-sm text-[#07111d] outline-none transition focus:border-[#d7a33a] focus:ring-2 focus:ring-[#d7a33a]/20"
            >
              {FORMA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c88b25]">Dirección fiscal</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label text="Dirección" />
            <Input value={form.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Calle Mayor, 10" />
          </div>
          <div>
            <Label text="Ciudad" />
            <Input value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} placeholder="Alicante" />
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
            <Input maxLength={5} value={form.codigo_postal} onChange={(e) => set('codigo_postal', e.target.value)} placeholder="03001" />
          </div>
          <div>
            <Label text="País (código ISO)" />
            <Input maxLength={2} value={form.pais} onChange={(e) => set('pais', e.target.value.toUpperCase().slice(0, 2))} placeholder="ES" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c88b25]">Contacto empresa</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label text="Teléfono" />
            <Input type="tel" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="+34 966 000 000" />
          </div>
          <div>
            <Label text="Email empresa" />
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="info@empresa.com" />
          </div>
          <div className="sm:col-span-2">
            <Label text="Web" />
            <Input type="url" value={form.web} onChange={(e) => set('web', e.target.value)} placeholder="https://miempresa.com" />
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#d7a33a] px-6 font-semibold text-[#061321] transition hover:bg-[#f0bf54] disabled:opacity-60"
        >
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
            <Check className="h-4 w-4" />
            Guardado
          </span>
        )}
      </div>
    </form>
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
