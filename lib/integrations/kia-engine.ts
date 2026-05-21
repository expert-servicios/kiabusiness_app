/**
 * Kia Engine — EXPERT virtual assistant flow processor.
 *
 * Pure logic (no I/O). The webhook calls processKiaStep() and
 * executes the returned replies + side-effects.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type KiaLang     = 'es' | 'ru';
export type KiaPriority = 'normal' | 'high' | 'urgent' | 'critical';

export interface KiaSession {
  phone_number : string;
  client_id    : string | null;
  lang         : KiaLang;
  flow         : string;   // welcome | new_client | existing | consult | human
  step         : string;   // varies by flow
  service_id   : string | null;
  precal_step  : number;
  data         : Record<string, string>;
  name         : string | null;
  email        : string | null;
  priority     : KiaPriority;
  escalated    : boolean;
}

type L10n = { es: string; ru: string };

// ── Language detection ────────────────────────────────────────────────────────

export function detectLanguage(text: string): KiaLang {
  if (/[А-Яа-яЁё]/.test(text)) return 'ru';
  return 'es';
}

// ── Lead extraction ───────────────────────────────────────────────────────────

export function extractLeadInfo(text: string): { name: string | null; email: string | null } {
  const emailMatch = text.match(/[\w.+%-]+@[\w-]+\.[a-zA-Z]{2,}/);
  const email      = emailMatch?.[0] ?? null;
  const cleaned    = text.replace(email ?? '', '').replace(/[,;|]/g, ' ').trim();
  const words      = cleaned.split(/\s+/).filter((w) => w.length > 1 && !/^[\d+()]+$/.test(w)).slice(0, 5);
  const name       = words.length >= 1 ? words.join(' ').slice(0, 80) : null;
  return { name, email };
}

// ── Service definitions ───────────────────────────────────────────────────────

export interface KiaServiceDef {
  id          : string;
  label       : L10n;
  area        : string;
  category    : string;
  docs        : string[];
  precalFlow ?: string;
  autoEscalate?: boolean;
}

export const SERVICES: Record<string, KiaServiceDef> = {
  // FISCAL
  svc_irpf: {
    id: 'svc_irpf', label: { es: 'Renta (IRPF)', ru: 'Декларация НДФЛ (IRPF)' },
    area: 'fiscal', category: 'declaraciones-impuestos', precalFlow: 'irpf',
    docs: [
      'DNI / NIE en vigor',
      'Número de referencia o Cl@ve PIN',
      'Borrador de la renta (si tienes acceso a la Sede Electrónica)',
      'Certificado de ingresos del empleador',
      'Extracto bancario (si tienes inversiones, alquiler o cuentas en el extranjero)',
    ],
  },
  svc_autonomo_gestion: {
    id: 'svc_autonomo_gestion', label: { es: 'Autónomo / IVA trimestral', ru: 'Самозанятый / НДС квартально' },
    area: 'fiscal', category: 'declaraciones-impuestos',
    docs: [
      'DNI / NIE en vigor',
      'Alta en Hacienda y RETA (modelo 036/037)',
      'Facturas emitidas del trimestre',
      'Facturas recibidas (gastos deducibles)',
      'Extracto bancario del trimestre',
    ],
  },
  svc_no_residente: {
    id: 'svc_no_residente', label: { es: 'No Residente (IRNR)', ru: 'Нерезидент (IRNR)' },
    area: 'fiscal', category: 'declaraciones-impuestos',
    docs: [
      'Pasaporte o NIE en vigor',
      'Escritura de la propiedad en España',
      'Certificado de residencia fiscal del país de residencia',
      'Recibos del IBI del año a declarar',
    ],
  },
  svc_modelo_151: {
    id: 'svc_modelo_151', label: { es: 'Modelo 151 / Ley Beckham', ru: 'Модель 151 / Закон Бекхэма' },
    area: 'fiscal', category: 'declaraciones-impuestos', docs: [], autoEscalate: true,
  },
  svc_modelo_720: {
    id: 'svc_modelo_720', label: { es: 'Modelo 720 (bienes en extranjero)', ru: 'Модель 720 (имущество за рубежом)' },
    area: 'fiscal', category: 'declaraciones-impuestos', docs: [], autoEscalate: true,
  },

  // EMPRESA
  svc_alta_autonomo: {
    id: 'svc_alta_autonomo', label: { es: 'Alta de Autónomo', ru: 'Регистрация самозанятого' },
    area: 'empresa', category: 'empresas-autonomos', precalFlow: 'alta_autonomo',
    docs: [
      'DNI / NIE en vigor',
      'Certificado digital o Cl@ve PIN (si tienes)',
      'Actividad prevista (descripción o epígrafe IAE)',
      'Fecha de inicio de actividad prevista',
    ],
  },
  svc_constitucion_sl: {
    id: 'svc_constitucion_sl', label: { es: 'Constitución de SL', ru: 'Открытие SL' },
    area: 'empresa', category: 'empresas-autonomos', autoEscalate: true,
    docs: [
      'DNI / NIE de todos los socios',
      '3 opciones de nombre para la sociedad',
      'Capital social (mínimo 3.000 €)',
      'Actividad principal (CNAE o descripción)',
      'Domicilio social en España',
    ],
  },
  svc_gestion_mensual: {
    id: 'svc_gestion_mensual', label: { es: 'Gestión mensual empresa', ru: 'Ежемесячное бухгалтерское обслуживание' },
    area: 'empresa', category: 'empresas-autonomos', docs: [], autoEscalate: true,
  },

  // HOLDED
  svc_holded_starter: {
    id: 'svc_holded_starter', label: { es: 'Pack Starter / Onboarding Holded', ru: 'Стартовый пакет Holded' },
    area: 'holded', category: 'holded',
    docs: [
      'Acceso a tu cuenta de Holded (o la creamos nueva)',
      'Datos fiscales de la empresa (NIF, razón social, actividad)',
      'Datos bancarios para conectar (si quieres)',
    ],
  },
  svc_holded_migracion: {
    id: 'svc_holded_migracion', label: { es: 'Migración completa a Holded', ru: 'Полная миграция на Holded' },
    area: 'holded', category: 'holded', docs: [], autoEscalate: true,
  },
  svc_holded_formacion: {
    id: 'svc_holded_formacion', label: { es: 'Formación Holded (por horas)', ru: 'Обучение Holded (почасово)' },
    area: 'holded', category: 'holded',
    docs: [
      'Acceso a tu cuenta de Holded',
      'Lista de módulos o áreas que quieres aprender',
    ],
  },

  // CERTIFICADO
  svc_certificado_fisica: {
    id: 'svc_certificado_fisica', label: { es: 'Certificado Digital (persona física)', ru: 'ЭЦП для физлица' },
    area: 'certificado', category: 'certificado-digital', precalFlow: 'certificado',
    docs: ['DNI / NIE en vigor', 'Datos del solicitante (nombre completo, NIF)'],
  },
  svc_certificado_empresa: {
    id: 'svc_certificado_empresa', label: { es: 'Certificado Digital (empresa)', ru: 'ЭЦП для юрлица' },
    area: 'certificado', category: 'certificado-digital',
    docs: [
      'DNI / NIE del representante legal',
      'CIF de la empresa',
      'Escritura de constitución o poder de representación',
    ],
  },

  // TRÁFICO
  svc_trafico: {
    id: 'svc_trafico', label: { es: 'Gestión Tráfico / Capitanía', ru: 'ГИБДД / Капитанство' },
    area: 'trafico', category: 'trafico-capitania-maritima',
    docs: [
      'DNI / NIE en vigor',
      'Permiso de circulación o ficha técnica (si aplica)',
      'Carnet de conducir (si aplica)',
      'Descripción del trámite a realizar',
    ],
  },

  // EXTRANJERÍA
  svc_residencia: {
    id: 'svc_residencia', label: { es: 'Residencia / Renovación (TIE)', ru: 'ВНЖ / Продление (TIE)' },
    area: 'extranjeria', category: 'extranjeria-nacionalidad',
    docs: [
      'Pasaporte completo (todas las páginas)',
      'TIE / NIE actual (si es renovación)',
      'Empadronamiento actualizado (máx. 3 meses)',
      'Contrato de trabajo o medios económicos suficientes',
      'Seguro médico privado sin copago con cobertura en España',
      'Foto reciente en fondo blanco (tamaño carné)',
    ],
  },
  svc_arraigo: {
    id: 'svc_arraigo', label: { es: 'Arraigo / Reagrupación Familiar', ru: 'Укоренение / Воссоединение семьи' },
    area: 'extranjeria', category: 'extranjeria-nacionalidad',
    docs: [
      'Pasaporte en vigor',
      'Empadronamiento histórico (últimos 2-3 años según tipo)',
      'Contrato de trabajo o informe arraigo social / familiar',
      'Medios económicos suficientes (nóminas o extracto bancario)',
    ],
  },
  svc_nacionalidad: {
    id: 'svc_nacionalidad', label: { es: 'Nacionalidad Española', ru: 'Испанское гражданство' },
    area: 'extranjeria', category: 'extranjeria-nacionalidad', autoEscalate: true,
    docs: [
      'Pasaporte en vigor',
      'TIE / NIE vigente',
      'Empadronamiento histórico (residencia continuada)',
      'Antecedentes penales del país de origen (apostillado y traducido)',
      'Certificado de nacimiento (apostillado y traducido)',
    ],
  },

  // NOTARÍA
  svc_notaria_compraventa: {
    id: 'svc_notaria_compraventa', label: { es: 'Compraventa de inmueble', ru: 'Купля-продажа недвижимости' },
    area: 'notaria', category: 'notaria-propiedades', autoEscalate: true,
    docs: [
      'DNI / NIE de todos los intervinientes',
      'Escritura de propiedad actual',
      'Nota simple del Registro de la Propiedad (máx. 3 meses)',
      'Últimos recibos del IBI pagados',
    ],
  },
  svc_notaria_herencia: {
    id: 'svc_notaria_herencia', label: { es: 'Herencia / Sucesión', ru: 'Наследство / Наследование' },
    area: 'notaria', category: 'notaria-propiedades', docs: [], autoEscalate: true,
  },

  // ── Escalate-only catch-all stubs (appear in menus, always go to human) ──────
  svc_fiscal_no_se: {
    id: 'svc_fiscal_no_se', label: { es: 'No sé qué necesito (fiscal)', ru: 'Не знаю, что нужно (налоги)' },
    area: 'fiscal', category: 'declaraciones-impuestos', docs: [], autoEscalate: true,
  },
  svc_extranjeria_no_se: {
    id: 'svc_extranjeria_no_se', label: { es: 'No sé qué necesito (extranjería)', ru: 'Не знаю, что нужно (ВНЖ)' },
    area: 'extranjeria', category: 'extranjeria-nacionalidad', docs: [], autoEscalate: true,
  },
  svc_empresa_no_se: {
    id: 'svc_empresa_no_se', label: { es: 'No sé qué necesito (empresa)', ru: 'Не знаю, что нужно (бизнес)' },
    area: 'empresa', category: 'empresas-autonomos', docs: [], autoEscalate: true,
  },
  svc_trafico_maritimo: {
    id: 'svc_trafico_maritimo', label: { es: 'Embarcación / Capitanía', ru: 'Судно / Капитанство' },
    area: 'trafico', category: 'trafico-capitania-maritima', docs: [], autoEscalate: true,
  },
  svc_trafico_no_se: {
    id: 'svc_trafico_no_se', label: { es: 'No sé / Otro (tráfico)', ru: 'Не знаю / Другое (транспорт)' },
    area: 'trafico', category: 'trafico-capitania-maritima', docs: [], autoEscalate: true,
  },
  svc_notaria_no_se: {
    id: 'svc_notaria_no_se', label: { es: 'Otro trámite notarial', ru: 'Другой нотариальный вопрос' },
    area: 'notaria', category: 'notaria-propiedades', docs: [], autoEscalate: true,
  },
};

// ── Precalification flows ─────────────────────────────────────────────────────

export interface PrecalOption {
  id          : string;
  label       : L10n;
  escalate   ?: boolean;
  priority   ?: KiaPriority;
  noteForData?: string;
}

export interface PrecalQuestion {
  key    : string;
  text   : L10n;
  type   : 'buttons' | 'text';
  options?: PrecalOption[];
}

export const PRECAL_FLOWS: Record<string, PrecalQuestion[]> = {
  irpf: [
    {
      key: 'tipo',
      text: { es: '¿La declaración es para persona física, autónomo o empresa?', ru: 'Для кого оформить декларацию?' },
      type: 'buttons',
      options: [
        { id: 'fisica',   label: { es: 'Persona física', ru: 'Физлицо' } },
        { id: 'autonomo', label: { es: 'Autónomo',       ru: 'Самозанятый' } },
        { id: 'empresa',  label: { es: 'Empresa (IS)',   ru: 'Компания (IS)' } },
      ],
    },
    {
      key: 'requerimiento',
      text: { es: '¿Has recibido algún requerimiento o notificación de Hacienda? ⚠️', ru: 'Получали ли вы требование или уведомление от налоговой? ⚠️' },
      type: 'buttons',
      options: [
        { id: 'si', label: { es: 'Sí, tengo uno', ru: 'Да, есть' }, escalate: true, priority: 'urgent' },
        { id: 'no', label: { es: 'No',            ru: 'Нет' } },
      ],
    },
    {
      key: 'rentas_extranjero',
      text: { es: '¿Tienes rentas, bienes o cuentas bancarias fuera de España?', ru: 'Есть ли доходы, имущество или счета за пределами Испании?' },
      type: 'buttons',
      options: [
        { id: 'si', label: { es: 'Sí', ru: 'Да' }, escalate: true },
        { id: 'no', label: { es: 'No', ru: 'Нет' } },
      ],
    },
    {
      key: 'urgencia',
      text: { es: '¿Necesitas presentarla antes del cierre de la campaña?', ru: 'Нужно ли подать до окончания кампании?' },
      type: 'buttons',
      options: [
        { id: 'si', label: { es: 'Sí, es urgente',   ru: 'Да, срочно'    }, priority: 'high' },
        { id: 'no', label: { es: 'No, sin urgencia', ru: 'Нет, не срочно' } },
      ],
    },
  ],

  alta_autonomo: [
    {
      key: 'certificado',
      text: { es: '¿Tienes certificado digital o Cl@ve PIN activo?', ru: 'Есть ли цифровой сертификат или Cl@ve PIN?' },
      type: 'buttons',
      options: [
        { id: 'si', label: { es: 'Sí, lo tengo', ru: 'Да, есть' } },
        { id: 'no', label: { es: 'No lo tengo',  ru: 'Нет' }, noteForData: 'needs_cert_digital' },
      ],
    },
    {
      key: 'actividad',
      text: { es: '¿Cuál será tu actividad principal? Cuéntame brevemente 😊', ru: 'Какой будет ваш основной вид деятельности? Опишите кратко 😊' },
      type: 'text',
    },
    {
      key: 'trimestral',
      text: { es: '¿Quieres que también gestionemos tus impuestos trimestrales (IVA e IRPF)?', ru: 'Нужно ли вести квартальные налоги (НДС и НДФЛ)?' },
      type: 'buttons',
      options: [
        { id: 'si_trimestral', label: { es: 'Sí, todo incluido', ru: 'Да, всё вместе' } },
        { id: 'solo_alta',     label: { es: 'Solo el alta',      ru: 'Только регистрация' } },
      ],
    },
  ],

  certificado: [
    {
      key: 'urgencia',
      text: { es: '¿Lo necesitas con urgencia?', ru: 'Это срочно?' },
      type: 'buttons',
      options: [
        { id: 'si', label: { es: 'Sí, urgente',     ru: 'Да, срочно'     }, priority: 'high' },
        { id: 'no', label: { es: 'No, tengo tiempo', ru: 'Нет, не срочно' } },
      ],
    },
    {
      key: 'intentos',
      text: { es: '¿Ya intentaste obtenerlo antes?', ru: 'Вы уже пытались получить его раньше?' },
      type: 'buttons',
      options: [
        { id: 'si', label: { es: 'Sí, tuve problemas', ru: 'Да, были трудности' } },
        { id: 'no', label: { es: 'No, primera vez',    ru: 'Нет, первый раз'   } },
      ],
    },
  ],
};

// ── Menus ─────────────────────────────────────────────────────────────────────

const FOOTER = 'EXPERT Asesoría 💼';

interface BtnMenu { type: 'buttons'; body: string; buttons: { id: string; title: string }[] }
interface ListMenu { type: 'list'; body: string; buttonText: string; sections: { title: string; rows: { id: string; title: string; description?: string }[] }[] }
type AnyMenu = BtnMenu | ListMenu;

const WELCOME_MENU: Record<KiaLang, BtnMenu> = {
  es: { type: 'buttons', body: '¡Hola! 👋 Soy *Kia*, el asistente virtual de EXPERT.\n\n¿Qué necesitas hacer hoy?', buttons: [{ id: 'btn_new', title: 'Contratar servicio' }, { id: 'btn_existing', title: 'Ya soy cliente' }, { id: 'btn_consult', title: 'Consulta / Presupuesto' }] },
  ru: { type: 'buttons', body: 'Привет! 👋 Я *Kia*, виртуальный помощник EXPERT.\n\nЧем могу помочь?', buttons: [{ id: 'btn_new', title: 'Нужна услуга' }, { id: 'btn_existing', title: 'Я клиент' }, { id: 'btn_consult', title: 'Консультация' }] },
};

const AREA_LIST_MENU: Record<KiaLang, ListMenu> = {
  es: { type: 'list', body: '¿Qué área te interesa? 👇', buttonText: 'Ver áreas', sections: [{ title: 'ÁREAS DE SERVICIO', rows: [{ id: 'area_fiscal', title: '💰 Fiscalidad', description: 'IRPF, autónomo, no residente…' }, { id: 'area_extranjeria', title: '🌍 Extranjería', description: 'Residencia, arraigo, nacionalidad…' }, { id: 'area_empresa', title: '🏢 Empresa / Autónomo', description: 'Altas, SL, gestión mensual…' }, { id: 'area_holded', title: '⚡ Holded ERP', description: 'Onboarding, formación, migración…' }, { id: 'area_certificado', title: '🔐 Certificado Digital', description: 'Persona física o empresa' }, { id: 'area_trafico', title: '🚗 Tráfico / Capitanía', description: 'Transferencias, trámites…' }, { id: 'area_notaria', title: '🏠 Notaría / Propiedades', description: 'Compraventa, herencia…' }] }] },
  ru: { type: 'list', body: 'Какое направление вас интересует? 👇', buttonText: 'Выбрать', sections: [{ title: 'НАПРАВЛЕНИЯ', rows: [{ id: 'area_fiscal', title: '💰 Налоги', description: 'НДФЛ, НДС, нерезиденты…' }, { id: 'area_extranjeria', title: '🌍 ВНЖ и гражданство', description: 'Разрешение, укоренение…' }, { id: 'area_empresa', title: '🏢 Бизнес / Самозанятый', description: 'Регистрация, обслуживание…' }, { id: 'area_holded', title: '⚡ Holded ERP', description: 'Настройка, обучение, миграция…' }, { id: 'area_certificado', title: '🔐 ЭЦП', description: 'Физлицо или юрлицо' }, { id: 'area_trafico', title: '🚗 ГИБДД / Капитанство', description: 'Оформление, переводы…' }, { id: 'area_notaria', title: '🏠 Нотариат / Недвижимость', description: 'Купля-продажа, наследство…' }] }] },
};

const SERVICE_MENUS: Record<string, Record<KiaLang, AnyMenu>> = {
  fiscal: {
    es: { type: 'list', body: '¿Qué trámite fiscal necesitas?', buttonText: 'Ver servicios', sections: [{ title: 'FISCAL', rows: [{ id: 'svc_irpf', title: '📋 Renta (IRPF)', description: 'Declaración anual personal' }, { id: 'svc_autonomo_gestion', title: '📊 Autónomo / IVA trimestral', description: 'Gestión trimestral' }, { id: 'svc_no_residente', title: '🌐 No Residente (IRNR)', description: 'Inmuebles en España' }, { id: 'svc_modelo_151', title: '⭐ Modelo 151 / Beckham', description: 'Régimen especial' }, { id: 'svc_modelo_720', title: '🌍 Modelo 720', description: 'Bienes en extranjero' }, { id: 'svc_fiscal_no_se', title: '❓ No sé cuál necesito', description: 'Te orientamos sin compromiso' }] }] },
    ru: { type: 'list', body: 'Какой налоговый вопрос вас интересует?', buttonText: 'Выбрать', sections: [{ title: 'НАЛОГИ', rows: [{ id: 'svc_irpf', title: '📋 Декларация НДФЛ (IRPF)', description: 'Годовая личная декларация' }, { id: 'svc_autonomo_gestion', title: '📊 Самозанятый / НДС', description: 'Квартальные налоги' }, { id: 'svc_no_residente', title: '🌐 Нерезидент (IRNR)', description: 'Недвижимость в Испании' }, { id: 'svc_modelo_151', title: '⭐ Модель 151 / Бекхэм', description: 'Специальный налоговый режим' }, { id: 'svc_modelo_720', title: '🌍 Модель 720', description: 'Имущество за рубежом' }, { id: 'svc_fiscal_no_se', title: '❓ Не знаю, что нужно', description: 'Бесплатная ориентация' }] }] },
  },
  extranjeria: {
    es: { type: 'list', body: '¿Qué trámite de extranjería necesitas?', buttonText: 'Ver servicios', sections: [{ title: 'EXTRANJERÍA Y NACIONALIDAD', rows: [{ id: 'svc_residencia', title: '📄 Residencia / Renovación', description: 'TIE, permisos…' }, { id: 'svc_arraigo', title: '👨‍👩‍👧 Arraigo / Reagrupación', description: 'Social, familiar…' }, { id: 'svc_nacionalidad', title: '🇪🇸 Nacionalidad Española', description: 'Expediente completo' }, { id: 'svc_extranjeria_no_se', title: '❓ No sé cuál necesito', description: 'Te orientamos' }] }] },
    ru: { type: 'list', body: 'Какое разрешение или документ вас интересует?', buttonText: 'Выбрать', sections: [{ title: 'ВНЖ И ГРАЖДАНСТВО', rows: [{ id: 'svc_residencia', title: '📄 ВНЖ / Продление (TIE)', description: 'Разрешение на проживание' }, { id: 'svc_arraigo', title: '👨‍👩‍👧 Укоренение / Воссоединение', description: 'Социальное, семейное…' }, { id: 'svc_nacionalidad', title: '🇪🇸 Гражданство Испании', description: 'Полное оформление' }, { id: 'svc_extranjeria_no_se', title: '❓ Не знаю, что нужно', description: 'Ориентация без обязательств' }] }] },
  },
  empresa: {
    es: { type: 'list', body: '¿Qué necesitas para tu empresa o actividad?', buttonText: 'Ver opciones', sections: [{ title: 'INICIO DE ACTIVIDAD', rows: [{ id: 'svc_alta_autonomo', title: '👤 Alta de Autónomo', description: 'Hacienda + RETA' }, { id: 'svc_constitucion_sl', title: '🏢 Constituir una SL', description: 'Sociedad Limitada desde 3.000 €' }] }, { title: 'GESTIÓN CONTINUA', rows: [{ id: 'svc_gestion_mensual', title: '📅 Gestión mensual', description: 'Contabilidad, impuestos, laboral' }] }, { title: 'OTROS', rows: [{ id: 'svc_empresa_no_se', title: '❓ No sé qué necesito', description: 'Te orientamos sin compromiso' }] }] },
    ru: { type: 'list', body: 'Что нужно для вашего бизнеса?', buttonText: 'Выбрать', sections: [{ title: 'НАЧАЛО ДЕЯТЕЛЬНОСТИ', rows: [{ id: 'svc_alta_autonomo', title: '👤 Регистрация самозанятого', description: 'Hacienda + RETA' }, { id: 'svc_constitucion_sl', title: '🏢 Открытие SL', description: 'ООО от 3.000 €' }] }, { title: 'ПОСТОЯННОЕ ОБСЛУЖИВАНИЕ', rows: [{ id: 'svc_gestion_mensual', title: '📅 Бухгалтерское обслуживание', description: 'Учёт, налоги, зарплаты' }] }, { title: 'ПРОЧЕЕ', rows: [{ id: 'svc_empresa_no_se', title: '❓ Не знаю, что нужно', description: 'Бесплатная ориентация' }] }] },
  },
  holded: {
    es: { type: 'buttons', body: 'Somos *Partner Oficial de Holded* ⚡\n\n¿Qué necesitas?', buttons: [{ id: 'svc_holded_starter', title: 'Pack Starter' }, { id: 'svc_holded_formacion', title: 'Formación por horas' }, { id: 'svc_holded_migracion', title: 'Migración completa' }] },
    ru: { type: 'buttons', body: 'Мы *официальный партнёр Holded* ⚡\n\nЧто нужно?', buttons: [{ id: 'svc_holded_starter', title: 'Стартовый пакет' }, { id: 'svc_holded_formacion', title: 'Обучение (почасово)' }, { id: 'svc_holded_migracion', title: 'Полная миграция' }] },
  },
  certificado: {
    es: { type: 'buttons', body: '¿El certificado digital es para ti o para tu empresa?', buttons: [{ id: 'svc_certificado_fisica', title: 'Para mí (persona)' }, { id: 'svc_certificado_empresa', title: 'Para mi empresa' }] },
    ru: { type: 'buttons', body: 'ЭЦП для кого?', buttons: [{ id: 'svc_certificado_fisica', title: 'Для меня (физлицо)' }, { id: 'svc_certificado_empresa', title: 'Для моей компании' }] },
  },
  trafico: {
    es: { type: 'buttons', body: '¿Qué gestión de tráfico o capitanía necesitas?', buttons: [{ id: 'svc_trafico', title: 'Vehículo / Matric.' }, { id: 'svc_trafico_maritimo', title: 'Embarcación' }, { id: 'svc_trafico_no_se', title: 'No sé / Otro' }] },
    ru: { type: 'buttons', body: 'Какое оформление нужно?', buttons: [{ id: 'svc_trafico', title: 'Транспортное средство' }, { id: 'svc_trafico_maritimo', title: 'Судно / Яхта' }, { id: 'svc_trafico_no_se', title: 'Не знаю / Другое' }] },
  },
  notaria: {
    es: { type: 'buttons', body: '¿Qué trámite de notaría necesitas?', buttons: [{ id: 'svc_notaria_compraventa', title: 'Compraventa inmueble' }, { id: 'svc_notaria_herencia', title: 'Herencia / Sucesión' }, { id: 'svc_notaria_no_se', title: 'Otro / No sé' }] },
    ru: { type: 'buttons', body: 'Какой нотариальный вопрос?', buttons: [{ id: 'svc_notaria_compraventa', title: 'Купля-продажа' }, { id: 'svc_notaria_herencia', title: 'Наследство' }, { id: 'svc_notaria_no_se', title: 'Другое / Не знаю' }] },
  },
};

const EXISTING_MENU: Record<KiaLang, ListMenu> = {
  es: { type: 'list', body: '¿Qué necesitas, {name}? 😊', buttonText: 'Ver opciones', sections: [{ title: 'YA SOY CLIENTE', rows: [{ id: 'ex_docs', title: '📎 Enviar documentación', description: 'Adjunta archivos al expediente' }, { id: 'ex_estado', title: '🔍 Estado del expediente', description: 'Consultar tu trámite' }, { id: 'ex_requerimiento', title: '⚠️ Tengo un requerimiento', description: 'Urgente — te atendemos ya' }, { id: 'ex_factura', title: '🧾 Necesito una factura', description: 'Solicitar recibo o factura' }, { id: 'ex_humano', title: '💬 Hablar con el equipo', description: 'Conectar con una persona' }] }] },
  ru: { type: 'list', body: 'Чем могу помочь, {name}? 😊', buttonText: 'Выбрать', sections: [{ title: 'Я КЛИЕНТ', rows: [{ id: 'ex_docs', title: '📎 Отправить документы', description: 'Прикрепить файлы к делу' }, { id: 'ex_estado', title: '🔍 Статус дела', description: 'Узнать о ходе дела' }, { id: 'ex_requerimiento', title: '⚠️ Есть требование', description: 'Срочно — ответим сразу' }, { id: 'ex_factura', title: '🧾 Нужна счёт-фактура', description: 'Запросить квитанцию' }, { id: 'ex_humano', title: '💬 Связаться с командой', description: 'Подключить специалиста' }] }] },
};

const CONSULT_MENU: Record<KiaLang, BtnMenu> = {
  es: { type: 'buttons', body: '¿En qué podemos ayudarte? 😊', buttons: [{ id: 'co_no_se', title: 'No sé qué necesito' }, { id: 'co_urgente', title: 'Caso urgente' }, { id: 'co_cita', title: 'Reservar consulta' }] },
  ru: { type: 'buttons', body: 'Чем могу помочь? 😊', buttons: [{ id: 'co_no_se', title: 'Не знаю, что нужно' }, { id: 'co_urgente', title: 'Срочный вопрос' }, { id: 'co_cita', title: 'Записаться на консультацию' }] },
};

// ── Reply types ───────────────────────────────────────────────────────────────

export type KiaReply =
  | { type: 'text';    body: string }
  | { type: 'buttons'; body: string; footer?: string; buttons: { id: string; title: string }[] }
  | { type: 'list';    body: string; footer?: string; buttonText: string; sections: { title: string; rows: { id: string; title: string; description?: string }[] }[] };

function menuToReply(menu: AnyMenu, footer = FOOTER): KiaReply {
  if (menu.type === 'buttons') return { type: 'buttons', body: menu.body, footer, buttons: menu.buttons };
  return { type: 'list', body: menu.body, footer, buttonText: menu.buttonText, sections: menu.sections };
}

// ── Side effects ──────────────────────────────────────────────────────────────

export interface KiaSideEffects {
  escalate      ?: boolean;
  priority      ?: KiaPriority;
  createCase    ?: boolean;
  saveLead      ?: boolean;
  sendDocsEmail ?: boolean;
  aiResponded   ?: boolean;
  needsAiFallback?: boolean;
}

export interface KiaStepResult {
  replies    : KiaReply[];
  updates    : Partial<KiaSession>;
  sideEffects: KiaSideEffects;
}

// ── Helper builders ───────────────────────────────────────────────────────────

function welcome(lang: KiaLang, name?: string | null): KiaReply {
  const m = WELCOME_MENU[lang];
  const body = name
    ? m.body.replace('¿Qué necesitas', `Encantada de verte de nuevo, *${name}* 😊\n\n¿Qué necesitas`).replace('Чем могу помочь?', `Рада вас видеть снова, *${name}* 😊\n\nЧем могу помочь?`)
    : m.body;
  return { type: 'buttons', body, footer: FOOTER, buttons: m.buttons };
}

function humanEscalate(lang: KiaLang, name?: string | null, reason?: string): KiaReply {
  const named = name ? `, *${name}*` : '';
  const body = lang === 'ru'
    ? `Спасибо${named} 😊 Судя по ситуации, лучше всего это рассмотрит команда EXPERT, чтобы дать вам правильный ответ. Передаю ваше дело специалисту.${reason ? `\n\n_${reason}_` : ''}`
    : `Gracias${named} 😊 Con lo que me indicas, es mejor que lo revise el equipo de EXPERT para darte la respuesta correcta. Dejo tu caso preparado.${reason ? `\n\n_${reason}_` : ''}`;
  return { type: 'text', body };
}

function leadCapture(lang: KiaLang, name?: string | null): KiaReply {
  const named = name ? `, *${name}*` : '';
  const body = lang === 'ru'
    ? `Почти готово${named}! 😊 Чтобы оформить заявку, укажи своё *полное имя* и *электронную почту*.`
    : `¡Casi listo${named}! 😊 Para abrir tu expediente, indícame tu *nombre completo* y tu *correo electrónico*.`;
  return { type: 'text', body };
}

function unsureCta(lang: KiaLang, name?: string | null): KiaReply {
  const named = name ? `, *${name}*` : '';
  const body = lang === 'ru'
    ? `Не переживайте${named}! 😊 Иногда сложно сразу определиться. Можно записаться на *бесплатный звонок 15 мин* — команда EXPERT разберётся вместе с вами.`
    : `¡No te preocupes${named}! 😊 A veces es difícil saber por dónde empezar. Puedes reservar una *llamada gratuita de 15 min* con el equipo de EXPERT y te orientamos sin compromiso.`;
  return {
    type: 'buttons', body, footer: FOOTER,
    buttons: [
      { id: 'btn_book_call',  title: lang === 'ru' ? 'Reservar llamada' : 'Reservar llamada' },
      { id: 'btn_write_here', title: lang === 'ru' ? 'Escríbeme aquí'   : 'Escríbeme aquí'   },
    ],
  };
}

function bookingConfirm(lang: KiaLang): KiaReply {
  const body = lang === 'ru'
    ? `📅 *Записаться на звонок 15 мин (бесплатно):*\nhttps://expertconsulting.es/cita\n\nКоманда EXPERT свяжется с вами лично. ¡До встречи! 💼`
    : `📅 *Reservar llamada gratuita de 15 min:*\nhttps://expertconsulting.es/cita\n\nEl equipo de EXPERT te atenderá personalmente. ¡Hasta pronto! 💼`;
  return { type: 'text', body };
}

function privacyNotice(lang: KiaLang): KiaReply {
  const body = lang === 'ru'
    ? '👋 Привет! Я *Kia* — виртуальный ИИ-ассистент EXPERT Asesoría. Я автоматизированная система, *не живой сотрудник*.\n\n🔒 *Ваши данные под защитой.* Используем только предоставленные данные для обработки вашего запроса. Подробнее: https://expertconsulting.es/privacidad'
    : '👋 ¡Hola! Soy *Kia*, la asistente virtual IA de EXPERT Asesoría. Soy un sistema automatizado, *no una persona*.\n\n🔒 *Tus datos, protegidos.* Solo usaremos los que compartas para gestionar tu consulta o trámite. Más info: https://expertconsulting.es/privacidad';
  return { type: 'text', body };
}

// ── Auto-escalate service IDs ─────────────────────────────────────────────────

const AUTO_ESCALATE = new Set([
  'svc_modelo_151', 'svc_modelo_720',
  'svc_constitucion_sl', 'svc_gestion_mensual',
  'svc_holded_migracion',
  'svc_nacionalidad',
  'svc_notaria_compraventa', 'svc_notaria_herencia',
]);

// "No sé / No estoy segur@" stubs — offer 15-min call instead of blind escalation
const UNSURE_CTA = new Set([
  'svc_fiscal_no_se', 'svc_extranjeria_no_se', 'svc_empresa_no_se',
  'svc_trafico_maritimo', 'svc_trafico_no_se', 'svc_notaria_no_se',
]);

// Service page paths (relative to https://expertconsulting.es/servicios/)
const SERVICE_PAGE: Partial<Record<string, string>> = {
  svc_irpf:                'declaraciones-impuestos/irpf',
  svc_autonomo_gestion:    'declaraciones-impuestos/irpf',
  svc_no_residente:        'declaraciones-impuestos/no-residentes',
  svc_modelo_151:          'declaraciones-impuestos/modelo-151',
  svc_modelo_720:          'declaraciones-impuestos/modelo-720',
  svc_alta_autonomo:       'empresas-autonomos/alta-autonomo',
  svc_constitucion_sl:     'empresas-autonomos/constitucion-sl',
  svc_gestion_mensual:     'empresas-autonomos/plan-avanzado',
  svc_holded_starter:      'holded/holded-starter',
  svc_holded_formacion:    'holded/formacion-holded',
  svc_holded_migracion:    'holded/holded-migracion-sin-inventario',
  svc_certificado_fisica:  'certificado-digital/certificado-digital-persona-fisica',
  svc_certificado_empresa: 'certificado-digital/certificado-digital-entidad',
  svc_trafico:             'trafico-capitania-maritima/transferencia-vehiculo',
  svc_residencia:          'extranjeria-nacionalidad/renovacion-residencia',
  svc_arraigo:             'extranjeria-nacionalidad/arraigo-social',
  svc_nacionalidad:        'extranjeria-nacionalidad/nacionalidad-espanola',
  svc_notaria_compraventa: 'notaria-propiedades/compraventa-inmueble',
  svc_notaria_herencia:    'notaria-propiedades/herencia',
};

function getServicePageUrl(svcId: string): string | null {
  const path = SERVICE_PAGE[svcId];
  return path ? `https://expertconsulting.es/servicios/${path}` : null;
}

// ── Sensitive-topic keywords — trigger immediate escalation ───────────────────

const SENSITIVE_KEYWORDS_ES = [
  'requerimiento', 'requerida por hacienda', 'acta de inspección', 'expediente sancionador',
  'sanción fiscal', 'sancionado', 'sancionada', 'denegación', 'denegado', 'denegada',
  'recurso de alzada', 'recurso contencioso', 'inspección fiscal', 'inspección tributaria',
  'multa fiscal', 'embargo', 'delito fiscal', 'fraude fiscal', 'paralización de actividad',
];

const SENSITIVE_KEYWORDS_RU = [
  'налоговое требование', 'требование от hacienda', 'штраф налоговой', 'санкция налоговой',
  'отказ в выдаче', 'апелляция решения', 'налоговая проверка', 'заморозка счетов',
  'уголовное дело', 'мошенничество',
];

function hasSensitiveTrigger(text: string, lang: KiaLang): boolean {
  const lower = text.toLowerCase();
  const keywords = lang === 'ru' ? SENSITIVE_KEYWORDS_RU : SENSITIVE_KEYWORDS_ES;
  return keywords.some((kw) => lower.includes(kw));
}

function sensitiveEscalate(lang: KiaLang, name?: string | null): KiaReply {
  const named = name ? `, *${name}*` : '';
  const body = lang === 'ru'
    ? `⚠️ Понимаю${named}. Эта ситуация требует срочного внимания специалиста. Немедленно передаю ваш случай команде EXPERT — кто-то свяжется с вами как можно скорее.`
    : `⚠️ Entendido${named}. Esta situación requiere atención urgente de un especialista. Dejo tu caso preparado para el equipo de EXPERT, que se pondrá en contacto contigo cuanto antes.`;
  return { type: 'text', body };
}

const AREA_MAP: Record<string, string> = {
  area_fiscal: 'fiscal', area_extranjeria: 'extranjeria', area_empresa: 'empresa',
  area_holded: 'holded', area_certificado: 'certificado',
  area_trafico: 'trafico', area_notaria: 'notaria',
};

const COMMANDS = ['/inicio', '/start', '/menu', '/cancelar', '/servicios', '/humano', '/ayuda', '/estado'];

// ── Main processor ────────────────────────────────────────────────────────────

export function processKiaStep(
  session    : KiaSession,
  msgBody    : string,
  buttonId   : string | null,
  clientName?: string | null,
): KiaStepResult {
  const lang = session.lang;
  const name = session.name ?? clientName ?? null;
  const interaction = buttonId ?? '';

  // Commands — any point in the conversation
  const cmd = COMMANDS.find((c) => msgBody.toLowerCase().trim() === c || msgBody.toLowerCase().trim().startsWith(c + ' '));
  if (cmd) {
    if (cmd === '/humano') {
      return {
        replies : [humanEscalate(lang, name)],
        updates : { flow: 'human', step: 'escalated', escalated: true },
        sideEffects: { escalate: true },
      };
    }
    // All other commands → restart
    return {
      replies : [welcome(lang, name)],
      updates : { flow: 'welcome', step: 'waiting_intent', service_id: null, precal_step: 0, data: {}, escalated: false },
      sideEffects: {},
    };
  }

  // Global button shortcuts — work from any flow/step
  if (interaction === 'btn_book_call') {
    return {
      replies    : [bookingConfirm(lang)],
      updates    : { flow: 'welcome', step: 'waiting_intent' },
      sideEffects: {},
    };
  }
  if (interaction === 'btn_write_here') {
    return {
      replies    : [humanEscalate(lang, name)],
      updates    : { flow: 'human', step: 'escalated', escalated: true },
      sideEffects: { escalate: true },
    };
  }

  // Sensitive-topic detection: escalate immediately if not already in human flow
  if (!session.escalated && session.flow !== 'human' && hasSensitiveTrigger(msgBody, lang)) {
    return {
      replies    : [sensitiveEscalate(lang, name)],
      updates    : { flow: 'human', step: 'escalated', escalated: true, priority: 'urgent' },
      sideEffects: { escalate: true, priority: 'urgent' },
    };
  }

  // Language update from typed text (≥4 chars)
  const detectedLang = msgBody.length >= 4 ? detectLanguage(msgBody) : lang;
  const langChanged  = detectedLang !== lang;

  const { flow, step } = session;

  // ── WELCOME ───────────────────────────────────────────────────────────────

  if (flow === 'welcome' && step === 'init') {
    const l = langChanged ? detectedLang : lang;
    if (name) {
      // Known contact — skip capture
      return {
        replies : [privacyNotice(l), welcome(l, name)],
        updates : { flow: 'welcome', step: 'waiting_intent', lang: l },
        sideEffects: {},
      };
    }
    // New/unknown contact — ask name first
    const askName: KiaReply = {
      type: 'text',
      body: l === 'ru'
        ? '🙋 Как вас зовут? Напишите, пожалуйста, имя и фамилию.'
        : '🙋 ¿Cómo te llamas? Escríbenos tu nombre y apellido.',
    };
    return {
      replies : [privacyNotice(l), askName],
      updates : { flow: 'welcome', step: 'asking_name', lang: l },
      sideEffects: {},
    };
  }

  if (flow === 'welcome' && step === 'asking_name') {
    const l = langChanged ? detectedLang : lang;
    const rawName = msgBody.replace(/[^\w\sáéíóúÁÉÍÓÚüÜñÑА-Яа-яЁё.'-]/g, ' ').trim().slice(0, 80);
    if (rawName.length < 2) {
      return {
        replies : [{ type: 'text', body: l === 'ru' ? 'Повторите, пожалуйста, только текстом 🙂' : 'Disculpa, ¿cómo te llamas? Solo escríbenos tu nombre 🙂' }],
        updates : { lang: l },
        sideEffects: {},
      };
    }
    return {
      replies : [{ type: 'text', body: l === 'ru' ? `Encantados, *${rawName}* 😊 ¿Y su email? (para enviarte información si la necesitas)\nO responde "пропустить" para continuar.` : `Encantado/a, *${rawName}* 😊 ¿Y tu email? (para enviarte información si la necesitas)\nO escribe "omitir" para continuar.` }],
      updates : { step: 'asking_email', name: rawName, lang: l },
      sideEffects: {},
    };
  }

  if (flow === 'welcome' && step === 'asking_email') {
    const l = langChanged ? detectedLang : lang;
    const currentName = session.name ?? name;
    const emailMatch  = msgBody.match(/[\w.+%-]+@[\w-]+\.[a-zA-Z]{2,}/);
    const capturedEmail = emailMatch?.[0] ?? null;
    const wantsSkip = /^(no|sin|omit|skip|пропустить|нет|no\s+tengo|не\s+даю)$/i.test(msgBody.trim());
    if (!capturedEmail && !wantsSkip) {
      return {
        replies : [{ type: 'text', body: l === 'ru' ? 'No encuentro el email. Escríbelo así: nombre@ejemplo.com\nO "пропустить" para continuar.' : 'No veo un email válido. Escríbelo así: nombre@ejemplo.com\nO escribe "omitir" para continuar.' }],
        updates : { lang: l },
        sideEffects: {},
      };
    }
    return {
      replies    : [welcome(l, currentName)],
      updates    : { flow: 'welcome', step: 'waiting_intent', email: capturedEmail, lang: l },
      sideEffects: { saveLead: true },
    };
  }

  if (flow === 'welcome' && step === 'waiting_intent') {
    const l = langChanged ? detectedLang : lang;
    if (interaction === 'btn_new') {
      return { replies: [menuToReply(AREA_LIST_MENU[l])], updates: { flow: 'new_client', step: 'waiting_area', lang: l }, sideEffects: {} };
    }
    if (interaction === 'btn_existing') {
      const m = EXISTING_MENU[l];
      return { replies: [menuToReply({ ...m, body: m.body.replace('{name}', name ?? (l === 'ru' ? 'клиент' : 'cliente')) })], updates: { flow: 'existing', step: 'waiting_option', lang: l }, sideEffects: {} };
    }
    if (interaction === 'btn_consult') {
      return { replies: [menuToReply(CONSULT_MENU[l])], updates: { flow: 'consult', step: 'waiting_option', lang: l }, sideEffects: {} };
    }
    // Free text in welcome menu → AI handles it contextually instead of repeating the menu
    return { replies: [], updates: { lang: l }, sideEffects: { needsAiFallback: true } };
  }

  // ── NEW CLIENT — area ─────────────────────────────────────────────────────

  if (flow === 'new_client' && step === 'waiting_area') {
    const area = AREA_MAP[interaction];
    if (!area) return { replies: [menuToReply(AREA_LIST_MENU[lang])], updates: {}, sideEffects: {} };
    const svcMenu = SERVICE_MENUS[area]?.[lang];
    if (!svcMenu) return { replies: [welcome(lang, name)], updates: { flow: 'welcome', step: 'waiting_intent' }, sideEffects: {} };
    return { replies: [menuToReply(svcMenu)], updates: { step: `waiting_service:${area}`, data: { ...session.data, area } }, sideEffects: {} };
  }

  // ── NEW CLIENT — service selection ────────────────────────────────────────

  if (flow === 'new_client' && step.startsWith('waiting_service:')) {
    const svcId = interaction;
    if (!svcId) {
      const area = step.split(':')[1] ?? '';
      const m = SERVICE_MENUS[area]?.[lang];
      return { replies: m ? [menuToReply(m)] : [menuToReply(AREA_LIST_MENU[lang])], updates: {}, sideEffects: {} };
    }

    // Auto-escalate (complex services → human directly)
    if (AUTO_ESCALATE.has(svcId)) {
      const svc = SERVICES[svcId];
      const pageUrl = getServicePageUrl(svcId);
      const note = svc
        ? (lang === 'ru' ? `Запрос по *${svc.label.ru}* передаётся специалисту.` : `Tu solicitud de *${svc.label.es}* la revisará un especialista.`)
        : undefined;
      const replies: KiaReply[] = [humanEscalate(lang, name, note)];
      if (pageUrl) {
        const infoNote = lang === 'ru'
          ? `🌐 *Информация об услуге:* ${pageUrl}`
          : `🌐 *Más información:* ${pageUrl}`;
        replies.push({ type: 'text', body: infoNote });
      }
      return {
        replies,
        updates: { flow: 'human', step: 'escalated', escalated: true, service_id: svcId },
        sideEffects: { escalate: true, saveLead: true },
      };
    }

    // "No estoy segur@" stubs → 15-min call CTA
    if (UNSURE_CTA.has(svcId)) {
      return {
        replies    : [unsureCta(lang, name)],
        updates    : { flow: 'consult', step: 'unsure_cta', service_id: svcId },
        sideEffects: {},
      };
    }

    const svc = SERVICES[svcId];
    if (!svc) return { replies: [humanEscalate(lang, name)], updates: { flow: 'human', step: 'escalated', escalated: true }, sideEffects: { escalate: true } };

    // Has precal flow?
    if (svc.precalFlow && PRECAL_FLOWS[svc.precalFlow]?.length) {
      const q = PRECAL_FLOWS[svc.precalFlow][0];
      const qBody = q.text[lang];
      const reply: KiaReply = q.type === 'text'
        ? { type: 'text', body: qBody }
        : { type: 'buttons', body: qBody, footer: FOOTER, buttons: (q.options ?? []).map((o) => ({ id: o.id, title: o.label[lang].slice(0, 20) })) };
      return { replies: [reply], updates: { step: 'precal', service_id: svcId, precal_step: 0 }, sideEffects: {} };
    }

    // No precal → lead capture
    return { replies: [leadCapture(lang, name)], updates: { step: 'lead_capture', service_id: svcId }, sideEffects: {} };
  }

  // ── PRECALIFICATION ───────────────────────────────────────────────────────

  if (flow === 'new_client' && step === 'precal') {
    const svcId = session.service_id ?? '';
    const svc = SERVICES[svcId];
    const questions = svc?.precalFlow ? (PRECAL_FLOWS[svc.precalFlow] ?? []) : [];
    const qi = session.precal_step;
    const currentQ = questions[qi];

    if (!currentQ) {
      return { replies: [leadCapture(lang, name)], updates: { step: 'lead_capture' }, sideEffects: {} };
    }

    const answer = interaction || msgBody.trim();
    const newData: Record<string, string> = { ...session.data, [currentQ.key]: answer };
    let newPriority: KiaPriority = session.priority;
    let shouldEscalate = false;
    let escalateNote = '';

    if (currentQ.type === 'buttons') {
      const opt = (currentQ.options ?? []).find((o) => o.id === interaction);
      if (opt?.escalate) {
        shouldEscalate = true;
        escalateNote = lang === 'ru'
          ? `Ситуация требует консультации специалиста (${svc?.label.ru ?? ''}).`
          : `Situación que requiere revisión del equipo (${svc?.label.es ?? ''}).`;
      }
      if (opt?.priority) newPriority = opt.priority;
      if (opt?.noteForData) newData[`_flag_${opt.noteForData}`] = 'true';
    }

    if (shouldEscalate) {
      return {
        replies: [humanEscalate(lang, name, escalateNote)],
        updates: { flow: 'human', step: 'escalated', escalated: true, data: newData, priority: newPriority },
        sideEffects: { escalate: true, saveLead: true, priority: newPriority },
      };
    }

    const nextQi = qi + 1;
    if (nextQi < questions.length) {
      const nextQ = questions[nextQi];
      const nextBody = nextQ.text[lang];
      const nextReply: KiaReply = nextQ.type === 'text'
        ? { type: 'text', body: nextBody }
        : { type: 'buttons', body: nextBody, footer: FOOTER, buttons: (nextQ.options ?? []).map((o) => ({ id: o.id, title: o.label[lang].slice(0, 20) })) };
      return { replies: [nextReply], updates: { precal_step: nextQi, data: newData, priority: newPriority }, sideEffects: {} };
    }

    return { replies: [leadCapture(lang, name)], updates: { step: 'lead_capture', data: newData, priority: newPriority }, sideEffects: {} };
  }

  // ── LEAD CAPTURE ─────────────────────────────────────────────────────────

  if (flow === 'new_client' && step === 'lead_capture') {
    const { name: n, email } = extractLeadInfo(msgBody);
    const finalName = n ?? name;
    const displayName = finalName ?? (lang === 'ru' ? 'клиент' : 'cliente');
    const svc = session.service_id ? SERVICES[session.service_id] : null;
    const svcLabel = svc ? svc.label[lang] : (lang === 'ru' ? 'ваш запрос' : 'tu consulta');
    const topDocs = svc?.docs.slice(0, 5).map((d) => `• ${d}`).join('\n') ?? '';
    const emailNote = email
      ? (lang === 'ru' ? `\n\nТакже отправлю полный список на *${email}*.` : `\n\nTambién te envío el listado completo a *${email}*.`)
      : '';

    const pageUrl = session.service_id ? getServicePageUrl(session.service_id) : null;
    const pageNote = pageUrl
      ? (lang === 'ru' ? `\n\n🌐 *Страница услуги:* ${pageUrl}` : `\n\n🌐 *Más información:* ${pageUrl}`)
      : '';
    const confirmBody = lang === 'ru'
      ? `✅ *${displayName}*, ваша заявка по *${svcLabel}* принята!\n\n*Документы, которые понадобятся:*\n${topDocs}${emailNote}${pageNote}\n\nЕсли есть вопросы — пишите! EXPERT 💼`
      : `✅ ¡Perfecto, *${displayName}*! He abierto tu expediente de *${svcLabel}*.\n\n*Documentos que necesitaremos:*\n${topDocs}${emailNote}${pageNote}\n\n¿Tienes dudas? Estoy aquí. EXPERT 💼`;

    const replies: KiaReply[] = [{ type: 'text', body: confirmBody }];

    // Suggest cert digital if needed
    if (session.service_id === 'svc_alta_autonomo' && session.data['_flag_needs_cert_digital'] === 'true') {
      const tip = lang === 'ru'
        ? '💡 *Совет:* для регистрации самозанятого удобнее иметь ЭЦП. Если хотите, оформим его одновременно.'
        : '💡 *Apunte:* para el alta de autónomo es muy útil tener certificado digital. Si quieres, lo gestionamos al mismo tiempo.';
      replies.push({ type: 'text', body: tip });
    }

    return {
      replies,
      updates: { step: 'done', name: finalName ?? session.name, email: email ?? session.email },
      sideEffects: { createCase: true, saveLead: true, sendDocsEmail: !!email },
    };
  }

  // ── EXISTING CLIENT ───────────────────────────────────────────────────────

  if (flow === 'existing' && step === 'waiting_option') {
    if (interaction === 'ex_docs') {
      const body = lang === 'ru'
        ? '📎 Отлично! Отправьте документы прямо в этот чат. Пожалуйста, укажите, к какому делу они относятся.'
        : '📎 Perfecto. Envíame los documentos por aquí. Indica también a qué trámite corresponden para ubicarlos correctamente.';
      return { replies: [{ type: 'text', body }], updates: { step: 'awaiting_docs' }, sideEffects: {} };
    }
    if (interaction === 'ex_estado') {
      const body = lang === 'ru'
        ? '🔍 ¿Por qué trámite consultas? Indica el servicio o tu número de expediente.'
        : '🔍 ¿Sobre qué trámite quieres consultar? Indícame el nombre del servicio o tu número de expediente.';
      return { replies: [{ type: 'text', body }], updates: { flow: 'human', step: 'awaiting_estado' }, sideEffects: { escalate: false } };
    }
    if (interaction === 'ex_requerimiento') {
      const body = lang === 'ru'
        ? '⚠️ Спасибо, что сообщили! Пожалуйста, отправьте требование в PDF или фото. Особо обратим внимание на дату уведомления и срок ответа.'
        : '⚠️ Gracias por avisar. Envíame el requerimiento en PDF o foto. Revisaremos especialmente la fecha de notificación y el plazo para responder.';
      return {
        replies: [{ type: 'text', body }],
        updates: { flow: 'human', step: 'escalated', escalated: true, priority: 'urgent' },
        sideEffects: { escalate: true, priority: 'urgent' },
      };
    }
    // ex_factura, ex_humano
    const body = lang === 'ru'
      ? `Спасибо, *${name ?? 'клиент'}* 😊 Передаю вас команде EXPERT. Кто-то свяжется с вами в ближайшее время.`
      : `Gracias, *${name ?? 'cliente'}* 😊 Te pongo en contacto con el equipo de EXPERT. Alguien te atenderá cuanto antes.`;
    return { replies: [{ type: 'text', body }], updates: { flow: 'human', step: 'escalated', escalated: true }, sideEffects: { escalate: true } };
  }

  // ── UNSURE CTA ────────────────────────────────────────────────────────────

  if (step === 'unsure_cta') {
    // btn_book_call / btn_write_here already handled globally above;
    // free-text → AI fallback
    return { replies: [], updates: {}, sideEffects: { needsAiFallback: true } };
  }

  // ── CONSULT ───────────────────────────────────────────────────────────────

  if (flow === 'consult' && step === 'waiting_option') {
    if (interaction === 'co_urgente') {
      const body = lang === 'ru'
        ? '⚠️ Понял! Расскажите кратко: что произошло и какой срок? Передаю команде немедленно.'
        : '⚠️ Entendido. Cuéntame brevemente qué ha pasado y qué plazo tienes. Lo paso al equipo enseguida.';
      return {
        replies: [{ type: 'text', body }],
        updates: { flow: 'human', step: 'escalated', escalated: true, priority: 'urgent' },
        sideEffects: { escalate: true, priority: 'urgent' },
      };
    }
    if (interaction === 'co_cita') {
      const body = lang === 'ru'
        ? '📅 Para reservar tu consulta entra en: https://expertconsulting.es/cita\n\nO cuéntame el tema y te ayudo a preparar la sesión.'
        : '📅 Para reservar tu consulta entra en: https://expertconsulting.es/cita\n\nO si prefieres, cuéntame el tema y te ayudo a preparar la sesión.';
      return { replies: [{ type: 'text', body }], updates: { step: 'done' }, sideEffects: {} };
    }
    // co_no_se → hand off to AI
    const body = lang === 'ru'
      ? '😊 Никаких проблем. Расскажите в двух словах, что нужно сделать или какая ситуация, и я помогу найти правильный путь.'
      : '😊 Sin problema. Cuéntame en una frase qué necesitas hacer o qué situación tienes, y te ayudo a encontrar el camino correcto.';
    return { replies: [{ type: 'text', body }], updates: { step: 'free_consult' }, sideEffects: { needsAiFallback: false } };
  }

  // ── STATES THAT DELEGATE TO AI ────────────────────────────────────────────

  if (['done', 'awaiting_docs', 'awaiting_estado', 'free_consult'].includes(step)) {
    return { replies: [], updates: {}, sideEffects: { needsAiFallback: true } };
  }

  // ── HUMAN ESCALATED — bot suppressed ─────────────────────────────────────

  if (flow === 'human' || session.escalated) {
    return { replies: [], updates: {}, sideEffects: {} };
  }

  // ── FALLBACK — restart ────────────────────────────────────────────────────

  return { replies: [welcome(lang, name)], updates: { flow: 'welcome', step: 'waiting_intent' }, sideEffects: {} };
}
