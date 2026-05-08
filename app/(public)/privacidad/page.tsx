import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | EXPERT ESTUDIOS PROFESIONALES',
  description: 'Política de privacidad de EXPERT ESTUDIOS PROFESIONALES, SLU — cómo recogemos, usamos y protegemos tus datos personales.',
  openGraph: {
    type: 'website',
    url: 'https://kseniailicheva.com/privacidad',
    title: 'Política de Privacidad | EXPERT',
    description: 'Política de privacidad de EXPERT ESTUDIOS PROFESIONALES, SLU.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES'
  }
};

const LAST_UPDATED = '8 de mayo de 2026';

export default function PrivacidadPage() {
  return (
    <main className="bg-[#F8F6F1] px-6 py-16">
      <div className="mx-auto max-w-3xl">

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">Legal</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#0D1B2A]">Política de Privacidad</h1>
        <p className="mt-3 text-sm text-[#23364D]">Última actualización: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 text-[#23364D]">

          {/* 1 */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">1. Responsable del tratamiento</h2>
            <div className="mt-4 space-y-1 text-sm leading-7">
              <p><strong>Razón social:</strong> EXPERT ESTUDIOS PROFESIONALES, SLU</p>
              <p><strong>CIF:</strong> B44991776</p>
              <p><strong>Domicilio:</strong> C/ Pintor Agrassot, 19 — 03110 Mutxamel (Alicante), España</p>
              <p><strong>Correo electrónico:</strong> <a href="mailto:soy@kseniailicheva.com" className="text-[#D4A017] underline underline-offset-4">soy@kseniailicheva.com</a></p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">2. Datos que recogemos y finalidad</h2>
            <div className="mt-4 space-y-4 text-sm leading-7">
              <div>
                <h3 className="font-semibold text-[#0D1B2A]">2.1 Formularios de contacto y solicitud de servicios</h3>
                <p>Cuando envías un formulario (contacto, solicitud de presupuesto, plan gratuito Holded o formulario B2B) recogemos nombre, dirección de correo electrónico, teléfono y la información que incluyes en el mensaje. Estos datos se usan para responder a tu solicitud, preparar presupuestos y gestionar la prestación del servicio contratado.</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0D1B2A]">2.2 Cuenta de usuario (área privada)</h3>
                <p>Para acceder al área privada de cliente puedes registrarte con email y contraseña, o mediante <strong>Iniciar sesión con Google</strong> (Google Sign-In / OAuth 2.0). En ambos casos almacenamos tu dirección de correo electrónico y nombre para identificarte y prestarte el servicio.</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0D1B2A]">2.3 Pagos</h3>
                <p>Los pagos se procesan a través de <strong>Stripe</strong>. No almacenamos datos de tarjeta en nuestros servidores. Stripe actúa como encargado del tratamiento conforme a su propia política de privacidad.</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0D1B2A]">2.4 Analítica web</h3>
                <p>Utilizamos <strong>Google Tag Manager</strong> y <strong>Google Analytics 4</strong> para analizar el uso del sitio web de forma agregada y mejorar la experiencia de usuario. Estos servicios recopilan datos como tipo de dispositivo, sistema operativo, idioma del navegador, páginas visitadas, duración de la sesión y ubicación geográfica aproximada (nivel de país/región). No se recopilan datos que permitan identificar directamente a una persona.</p>
              </div>
            </div>
          </section>

          {/* 3 — Google específico */}
          <section className="rounded-2xl border border-[#D4A017]/30 bg-white p-7">
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">3. Uso de datos de Google (Google API Services)</h2>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#D4A017]">Sección requerida por la Google API Services User Data Policy</p>

            <div className="mt-5 space-y-5 text-sm leading-7">

              <div>
                <h3 className="font-semibold text-[#0D1B2A]">3.1 Datos de Google a los que accedemos</h3>
                <p>Cuando el usuario elige autenticarse mediante <strong>Iniciar sesión con Google</strong>, nuestra aplicación solicita únicamente los siguientes datos a través de la API de Google OAuth 2.0:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li><strong>Dirección de correo electrónico</strong> — para identificar la cuenta y comunicarnos contigo.</li>
                  <li><strong>Nombre completo</strong> — para personalizar la experiencia dentro del área privada.</li>
                  <li><strong>Foto de perfil</strong> (avatar público de Google) — mostrada opcionalmente en la interfaz del área privada.</li>
                </ul>
                <p className="mt-2">No solicitamos acceso a Gmail, Google Drive, Google Calendar, Google Contacts ni a ningún otro servicio de Google más allá de la autenticación básica (<code>openid</code>, <code>email</code>, <code>profile</code>).</p>
              </div>

              <div>
                <h3 className="font-semibold text-[#0D1B2A]">3.2 Cómo usamos los datos de Google</h3>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>El correo electrónico se usa exclusivamente para <strong>autenticar al usuario</strong>, enviar comunicaciones transaccionales relacionadas con el servicio (confirmaciones de pago, actualizaciones de expedientes, notificaciones operativas) y gestionar la relación contractual.</li>
                  <li>El nombre se usa para <strong>personalizar la interfaz</strong> del área privada y encabezar las comunicaciones por correo.</li>
                  <li>La foto de perfil se muestra solo en la interfaz del área privada y no se procesa ni comparte de ninguna otra forma.</li>
                  <li>Los datos de Google <strong>no se utilizan para publicidad, perfiles de comportamiento ni entrenamientos de modelos de inteligencia artificial</strong>.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-[#0D1B2A]">3.3 Almacenamiento de los datos de Google</h3>
                <p>Los datos obtenidos mediante Google Sign-In se almacenan en <strong>Supabase</strong> (base de datos PostgreSQL alojada en servidores dentro de la Unión Europea). Solo se conservan mientras la cuenta esté activa. El usuario puede solicitar la eliminación de su cuenta y todos sus datos en cualquier momento escribiendo a <a href="mailto:soy@kseniailicheva.com" className="text-[#D4A017] underline underline-offset-4">soy@kseniailicheva.com</a>.</p>
              </div>

              <div>
                <h3 className="font-semibold text-[#0D1B2A]">3.4 Transferencia y compartición de datos de Google</h3>
                <p>Los datos obtenidos a través de Google Sign-In <strong>no se comparten con terceros</strong> salvo los encargados del tratamiento estrictamente necesarios para prestar el servicio (Supabase para almacenamiento, Resend para envío de emails transaccionales). Ningún encargado tiene autorización para usar estos datos para fines propios.</p>
                <p className="mt-2">El uso de la información recibida de las APIs de Google cumple con la <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline underline-offset-4">Google API Services User Data Policy</a>, incluidas las restricciones de uso limitado.</p>
              </div>

            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">4. Base legal del tratamiento</h2>
            <div className="mt-4 space-y-2 text-sm leading-7">
              <p><strong>Consentimiento (art. 6.1.a RGPD):</strong> para el envío de comunicaciones comerciales y analítica web (cuando el usuario lo acepta).</p>
              <p><strong>Ejecución de un contrato (art. 6.1.b RGPD):</strong> para gestionar el servicio contratado, el área privada y los expedientes.</p>
              <p><strong>Interés legítimo (art. 6.1.f RGPD):</strong> para el análisis agregado del uso del sitio web con fines de mejora.</p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">5. Conservación de los datos</h2>
            <p className="mt-4 text-sm leading-7">Los datos se conservan durante el tiempo necesario para la finalidad que motivó su recogida y, en todo caso, durante los plazos legalmente exigidos (por ejemplo, 5 años para datos contables según la Ley General Tributaria). Los datos de cuentas inactivas se eliminan previa comunicación al usuario.</p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">6. Encargados del tratamiento (terceros)</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0D1B2A] text-[#F8F6F1]">
                    <th className="px-4 py-3 text-left font-semibold">Proveedor</th>
                    <th className="px-4 py-3 text-left font-semibold">Finalidad</th>
                    <th className="px-4 py-3 text-left font-semibold">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8cbb5]">
                  {[
                    ['Supabase', 'Base de datos y autenticación', 'UE (Frankfurt)'],
                    ['Stripe', 'Procesamiento de pagos', 'EEUU (cláusulas contractuales tipo)'],
                    ['Resend', 'Envío de emails transaccionales', 'EEUU (cláusulas contractuales tipo)'],
                    ['Google LLC', 'Autenticación OAuth, analítica web (GA4)', 'EEUU (cláusulas contractuales tipo)'],
                    ['Holded Technologies', 'Software de facturación y contabilidad', 'UE (España)'],
                    ['Vercel', 'Alojamiento del sitio web', 'EEUU (cláusulas contractuales tipo)'],
                  ].map(([p, f, u]) => (
                    <tr key={p} className="bg-white even:bg-[#F8F6F1]">
                      <td className="px-4 py-3 font-medium text-[#0D1B2A]">{p}</td>
                      <td className="px-4 py-3">{f}</td>
                      <td className="px-4 py-3">{u}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">7. Cookies y tecnologías de seguimiento</h2>
            <div className="mt-4 space-y-2 text-sm leading-7">
              <p>Este sitio utiliza cookies técnicas necesarias para el funcionamiento del área privada y cookies analíticas de Google Analytics 4 (cargadas a través de Google Tag Manager) para medir el uso del sitio de forma agregada.</p>
              <p>Las cookies analíticas solo se activan si el usuario acepta su uso. Puedes consultar y gestionar tus preferencias de cookies en cualquier momento desde el banner de cookies del sitio.</p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">8. Tus derechos</h2>
            <div className="mt-4 space-y-2 text-sm leading-7">
              <p>De acuerdo con el RGPD (Reglamento UE 2016/679) y la LOPDGDD, puedes ejercitar los siguientes derechos:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li><strong>Acceso:</strong> conocer qué datos tratamos sobre ti.</li>
                <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
                <li><strong>Supresión:</strong> solicitar la eliminación de tus datos.</li>
                <li><strong>Limitación:</strong> restringir el tratamiento en determinadas circunstancias.</li>
                <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado.</li>
                <li><strong>Oposición:</strong> oponerte al tratamiento basado en interés legítimo.</li>
                <li><strong>Retirar el consentimiento</strong> en cualquier momento, sin que afecte a la licitud del tratamiento previo.</li>
              </ul>
              <p className="mt-2">Para ejercitar cualquiera de estos derechos, escribe a <a href="mailto:soy@kseniailicheva.com" className="text-[#D4A017] underline underline-offset-4">soy@kseniailicheva.com</a> indicando el derecho que deseas ejercitar y adjuntando una copia de tu DNI o documento identificativo equivalente. Responderemos en el plazo máximo de 30 días.</p>
              <p>Si consideras que el tratamiento de tus datos no es conforme a la normativa, puedes presentar una reclamación ante la <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline underline-offset-4">Agencia Española de Protección de Datos (AEPD)</a>.</p>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">9. Cambios en esta política</h2>
            <p className="mt-4 text-sm leading-7">Podemos actualizar esta política para reflejar cambios en nuestras prácticas o en la normativa aplicable. Cuando realicemos cambios relevantes, lo notificaremos a los usuarios registrados por correo electrónico. La fecha de última actualización figura al inicio de este documento.</p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">10. Contacto</h2>
            <p className="mt-4 text-sm leading-7">Para cualquier consulta sobre esta política de privacidad o sobre el tratamiento de tus datos personales, puedes contactar con nosotros en <a href="mailto:soy@kseniailicheva.com" className="text-[#D4A017] underline underline-offset-4">soy@kseniailicheva.com</a> o en nuestra dirección postal: C/ Pintor Agrassot, 19 — 03110 Mutxamel (Alicante), España.</p>
          </section>

        </div>
      </div>
    </main>
  );
}
