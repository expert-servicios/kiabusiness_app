'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';

const serviceCategories = [
  {
    id: 'impuestos',
    title: 'Declaraciones e Impuestos',
    services: [
      { id: 'irpf', name: 'IRPF', description: 'Declaración de la renta personal' },
      { id: 'modelo151', name: 'Modelo 151', description: 'Para trabajadores desplazados' },
      { id: 'noResidentes', name: 'No residentes', description: 'Tributación para no residentes' }
    ]
  },
  {
    id: 'extranjeria',
    title: 'Extranjería y Nacionalidad',
    services: [
      { id: 'nacionalidad', name: 'Nacionalidad española', description: 'Proceso de nacionalización' },
      { id: 'residencias', name: 'Residencias', description: 'Gestión de residencias y permisos' },
      { id: 'renovaciones', name: 'Renovaciones', description: 'Renovación de documentación' }
    ]
  },
  {
    id: 'empresas',
    title: 'Empresas y Autónomos',
    services: [
      { id: 'alta-autonomos', name: 'Alta de autónomos', description: 'Constitución como autónomo' },
      { id: 'constitucion', name: 'Constitución de empresas', description: 'Crear tu sociedad mercantil' },
      { id: 'contabilidad', name: 'Contabilidad e impuestos', description: 'Asesoría fiscal empresarial' }
    ]
  }
];

export default function SolicitarPresupuestoPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, services: selectedServices, description })
      });
      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f8f4eb]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-8 shadow-lg sm:p-12">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#c88b25]/20">
              <Check className="h-8 w-8 text-[#c88b25]" />
            </div>
            <h1 className="text-center font-serif text-2xl font-bold text-[#07111d]">¡Presupuesto solicitado!</h1>
            <p className="mt-4 text-center text-[#29384a]">
              Hemos recibido tu solicitud. Te contactaremos en las próximas 24 horas con un presupuesto personalizado.
            </p>
            <Link
              href="/"
              className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-[#061321] px-6 py-3 font-semibold text-white hover:bg-[#0a1b2d]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-3xl px-6">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#061321] hover:text-[#c88b25]">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="rounded-2xl bg-white p-8 shadow-lg sm:p-12">
          <h1 className="font-serif text-3xl font-bold text-[#07111d]">Solicitar presupuesto</h1>
          <p className="mt-2 text-[#29384a]">Completa el formulario y recibirás un presupuesto personalizado en 24 horas.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Datos personales */}
            <div className="space-y-4">
              <h2 className="font-semibold text-[#07111d]">Tus datos</h2>
              <input
                type="text"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#d8cbb5] px-4 py-3 focus:border-[#c88b25] focus:outline-none"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#d8cbb5] px-4 py-3 focus:border-[#c88b25] focus:outline-none"
                required
              />
            </div>

            {/* Servicios */}
            <div className="space-y-4">
              <h2 className="font-semibold text-[#07111d]">Servicios que necesitas</h2>
              <div className="space-y-5">
                {serviceCategories.map((category) => (
                  <div key={category.id}>
                    <h3 className="mb-3 font-semibold text-[#061321]">{category.title}</h3>
                    <div className="space-y-2">
                      {category.services.map((service) => (
                        <label
                          key={service.id}
                          className="flex items-start gap-3 rounded-lg border border-[#d8cbb5] p-3 hover:border-[#c88b25] hover:bg-white/50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            className="mt-1 h-5 w-5 accent-[#c88b25]"
                          />
                          <div>
                            <p className="font-medium text-[#07111d]">{service.name}</p>
                            <p className="text-sm text-[#29384a]">{service.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-4">
              <h2 className="font-semibold text-[#07111d]">Detalles adicionales</h2>
              <textarea
                placeholder="Cuéntanos más sobre tu situación específica..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-[#d8cbb5] px-4 py-3 focus:border-[#c88b25] focus:outline-none"
              />
            </div>

            {/* Submit */}
            <div className="space-y-4 border-t border-[#d8cbb5] pt-6">
              <button
                type="submit"
                disabled={loading || !email || !name || selectedServices.length === 0}
                className="w-full rounded-lg bg-[#c88b25] px-6 py-3 font-semibold text-[#0D1B2A] transition hover:bg-[#b57a1e] disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Solicitar presupuesto'}
              </button>
              <p className="text-center text-xs text-[#29384a]">
                Te contactaremos en breve. Para una consulta rápida, usa el botón flotante de WhatsApp.
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
