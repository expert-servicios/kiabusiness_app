export interface KiaPageContext {
  task: string;
  proactive: string;
  quickReplies: string[];
}

const PAGE_CONTEXTS: Array<{ pattern: RegExp; context: KiaPageContext }> = [
  {
    pattern: /^\/dashboard\/empresa\/nueva(?:\/|$)/,
    context: {
      task: 'creating_company',
      proactive: 'Veo que estás añadiendo una empresa. Puedo ayudarte a revisar sus datos fiscales y la información necesaria antes de guardarla.',
      quickReplies: ['Revisar datos de empresa', 'Qué datos necesito', 'Ayuda fiscal'],
    },
  },
  {
    pattern: /^\/dashboard\/empresa(?:\/|$)/,
    context: {
      task: 'editing_company',
      proactive: 'Estoy aquí para ayudarte a revisar los datos de la empresa, su información fiscal o cualquier dato que quieras completar.',
      quickReplies: ['Revisar datos de empresa', 'Comprobar datos fiscales', 'Qué falta por completar'],
    },
  },
  {
    pattern: /^\/dashboard\/informes\/[^/]+(?:\/|$)/,
    context: {
      task: 'viewing_report',
      proactive: 'Puedes preguntarme por las cifras de este informe. También puedo ayudarte a interpretar resultados o detectar posibles anomalías.',
      quickReplies: ['Explicar este informe', 'Revisar anomalías', 'Qué debo vigilar'],
    },
  },
  {
    pattern: /^\/dashboard\/informes(?:\/|$)/,
    context: {
      task: 'browsing_reports',
      proactive: 'Puedo ayudarte con tus informes de empresa y, cuando los datos estén disponibles, preparar una vista útil de ventas, gastos, bancos y alertas.',
      quickReplies: ['Generar informe', 'Explicar mis cifras', 'Revisar anomalías'],
    },
  },
  {
    pattern: /^\/dashboard\/estado-empresa(?:\/|$)/,
    context: {
      task: 'company_status_dashboard',
      proactive: 'Puedo explicarte el Estado de empresa, revisar qué requiere atención y ayudarte a interpretar la información disponible.',
      quickReplies: ['Explicar el estado', 'Qué requiere atención', 'Generar informe'],
    },
  },
  {
    pattern: /^\/dashboard\/integraciones\/holded(?:\/|$)/,
    context: {
      task: 'holded_integration',
      proactive: 'Te ayudo a revisar o conectar Holded desde el Panel Cliente seguro. No hace falta enviar claves ni credenciales por el chat.',
      quickReplies: ['Comprobar conexión', 'Conectar Holded', 'Qué datos se sincronizan'],
    },
  },
  {
    pattern: /^\/dashboard\/expedientes\/[^/]+(?:\/|$)/,
    context: {
      task: 'viewing_case',
      proactive: 'Puedo revisar contigo el estado de este expediente, los documentos pendientes y el siguiente paso útil.',
      quickReplies: ['Estado del expediente', 'Documentos pendientes', 'Siguiente paso'],
    },
  },
  {
    pattern: /^\/dashboard\/expedientes(?:\/|$)/,
    context: {
      task: 'browsing_cases',
      proactive: 'Puedo ayudarte a revisar tus expedientes y decirte qué está pendiente o cuál es el siguiente paso.',
      quickReplies: ['Ver mis expedientes', 'Documentos pendientes', 'Qué tengo que hacer'],
    },
  },
  {
    pattern: /^\/dashboard\/suscripciones(?:\/|$)/,
    context: {
      task: 'viewing_subscriptions',
      proactive: 'Puedo explicarte tu cobertura actual, comparar opciones y revisar qué necesitas para aprovechar mejor el servicio.',
      quickReplies: ['Ver mi plan', 'Comparar opciones', 'Revisar Holded'],
    },
  },
  {
    pattern: /^\/dashboard\/?$/,
    context: {
      task: 'dashboard_home',
      proactive: 'Estoy preparada para ayudarte con tus expedientes, empresas, Holded, informes o servicios. ¿Qué necesitas revisar?',
      quickReplies: ['Ver mis expedientes', 'Estado de Holded', 'Consulta fiscal'],
    },
  },
];

const DEFAULT_CONTEXT: KiaPageContext = {
  task: 'browsing_portal',
  proactive: 'Estoy aquí para ayudarte con lo que estés haciendo en EXPERT. Cuéntame qué necesitas y te guío paso a paso.',
  quickReplies: ['Ver mis expedientes', 'Estado de Holded', 'Necesito ayuda'],
};

/**
 * Presentation/context helper only. It does not grant tools or permissions;
 * server-side auth, membership and company isolation remain authoritative.
 */
export function getKiaPageContext(pathname: string): KiaPageContext {
  for (const item of PAGE_CONTEXTS) {
    if (item.pattern.test(pathname)) return item.context;
  }
  return DEFAULT_CONTEXT;
}
