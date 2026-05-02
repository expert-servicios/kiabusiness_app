import Link from 'next/link';

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#061321] via-[#0a1b2d] to-[#061321]">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081723]/90 p-8 shadow-2xl shadow-black/20">
          <div className="mb-8 text-center">
            <span className="font-serif text-3xl font-bold tracking-[0.18em] text-white">EXPERT</span>
            <h1 className="mt-4 font-serif text-2xl font-bold text-white">Crear cuenta</h1>
            <p className="mt-2 text-sm text-white/70">El acceso se crea automáticamente con el enlace mágico. Usa tu email y recibirás el enlace de acceso.</p>
          </div>
          <div className="space-y-6 rounded-3xl bg-[#0d243d] p-6">
            <p className="text-sm text-white/70">Para registrarte, utiliza el formulario de acceso y te enviaremos un enlace directo.</p>
            <Link href="/auth/login" className="block rounded-lg bg-[#d7a33a] px-4 py-3 text-center font-semibold text-[#061321] transition hover:bg-[#f0bf54]">
              Ir a iniciar sesión
            </Link>
          </div>
          <p className="mt-6 text-center text-sm text-white/60">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="font-semibold text-[#d7a33a] hover:text-[#f0bf54]">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
