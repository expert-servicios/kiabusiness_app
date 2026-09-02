import type { Metadata } from 'next';
import { FounderServiceLanding } from '@/components/services/FounderServiceLanding';
import { NifFounderCheckout } from '@/components/services/NifFounderCheckout';

export const metadata: Metadata = {
  title: 'NIF para socio extranjero sin NIE — Tramitación AEAT | EXPERT',
  description: 'Revisión y tramitación del NIF fiscal para socios extranjeros sin DNI/NIE cuando proceda. 60 € + IVA por persona. Servicio online ante la AEAT.',
  alternates: { canonical: 'https://expertconsulting.es/servicios/empresas-autonomos/nif-socio-extranjero' },
};

export default function NifSocioExtranjeroPage() {
  return (
    <>
      <FounderServiceLanding
        slug="nif-socio-extranjero"
        eyebrow="Trámite fiscal · AEAT"
        title="Obtención de NIF para socios extranjeros sin DNI o NIE"
        intro="Revisamos la situación del socio extranjero y, cuando la vía fiscal sea procedente, preparamos y tramitamos su solicitud de NIF ante la Agencia Tributaria mediante Modelo 030 y la documentación acreditativa correspondiente."
        price="60 € + IVA / persona"
        priceNote="El precio corresponde a una solicitud individual. Antes de presentar verificamos si la persona puede obtener NIF fiscal por esta vía o si su situación exige tramitar NIE."
        checkoutLabel="Contratar 1 NIF"
        includes={[
          'Revisión de la situación del socio extranjero y de la finalidad para la que necesita identificación fiscal en España.',
          'Comprobación previa de si procede solicitar NIF ante la AEAT o si corresponde tramitar NIE por la normativa de extranjería.',
          'Revisión del pasaporte o documento de identidad extranjero y de la documentación justificativa.',
          'Preparación del Modelo 030 y documentación de soporte.',
          'Presentación o asistencia en la presentación por el canal habilitado por la AEAT, cuando resulte aplicable.',
          'Entrega del justificante y del NIF asignado cuando la AEAT resuelva favorablemente.'
        ]}
        steps={[
          { title: 'Comprobamos la vía correcta', text: 'No todo extranjero sin NIE debe solicitar un NIF M. Primero determinamos si el caso encaja en el procedimiento fiscal de la AEAT.' },
          { title: 'Recibimos la documentación', text: 'Solicitamos pasaporte/documento de identidad y los documentos que acrediten la necesidad de disponer de NIF en España.' },
          { title: 'Preparamos Modelo 030', text: 'Cumplimentamos la solicitud y revisamos que identificación, domicilio y motivo estén correctamente documentados.' },
          { title: 'Presentamos y hacemos seguimiento', text: 'Gestionamos el trámite por el canal disponible y te entregamos la documentación acreditativa de la asignación.' }
        ]}
        resources={[
          { label: 'AEAT — Solicitar NIF', href: 'https://sede.agenciatributaria.gob.es/Sede/censos-nif-domicilio-fiscal/solicitar-nif.html', note: 'Información oficial de la Agencia Tributaria sobre asignación de NIF.' },
          { label: 'AEAT — Modelo 030', href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G321.shtml', note: 'Procedimiento censal para personas físicas y solicitud de NIF cuando proceda.' }
        ]}
        notes={[
          'El NIF fiscal no sustituye al NIE cuando la normativa obliga al extranjero a obtener NIE.',
          'La asignación depende de la documentación aportada y del criterio de la AEAT; EXPERT no puede garantizar una resolución favorable si faltan requisitos.',
          'El precio es por persona. Para varios socios se contratan tantas unidades como solicitudes deban tramitarse.',
          'Pueden solicitarse documentos adicionales, traducción o legalización/apostilla según el país y el documento aportado.'
        ]}
        faqs={[
          { q: '¿NIF y NIE son lo mismo?', a: 'No. El NIE es el número de identidad de extranjero asignado por las autoridades competentes de extranjería/policía. La AEAT puede asignar determinados NIF fiscales a extranjeros sin DNI/NIE cuando se cumplen los requisitos fiscales correspondientes.' },
          { q: '¿Sirve para ser socio de una SL española?', a: 'Para intervenir como socio o realizar operaciones con trascendencia tributaria en España la persona debe estar correctamente identificada fiscalmente. Antes de tramitarlo revisamos si en su caso basta la vía de NIF AEAT o corresponde NIE.' },
          { q: '¿Puedo contratar varios socios a la vez?', a: 'Sí. El precio es 60 € + IVA por persona y puedes contratar varias unidades en una misma compra.' },
          { q: '¿El socio tiene que viajar a España?', a: 'No necesariamente. Depende de su situación, documentación y de la vía de identificación que resulte jurídicamente correcta. El objetivo de la revisión previa es precisamente evitar trámites o desplazamientos innecesarios.' }
        ]}
        related={{
          title: '¿Después vais a constituir la SL?',
          text: 'Una vez identificados correctamente todos los socios, podéis realizar la constitución mediante PAE Virtual / CIRCE con nuestra sesión guiada de 2 horas.',
          href: '/servicios/empresas-autonomos/constitucion-sl-circe',
          cta: 'Ver formación CIRCE'
        }}
      />
      <section className="border-t border-[#D4A017]/15 bg-white px-6 py-12">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">¿Necesitas tramitar el NIF de varios socios?</h2>
          <p className="mt-2 text-sm leading-6 text-[#657383]">Selecciona el número de personas y Stripe calculará el total antes del pago.</p>
          <div className="mt-6 text-left"><NifFounderCheckout /></div>
        </div>
      </section>
    </>
  );
}
