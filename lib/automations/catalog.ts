export interface AutomationDef {
  key: string;
  title: string;
  trigger: string;
  action: string;
  channel: string;
  group: 'Expedientes' | 'Admin';
}

export const AUTOMATION_CATALOG: AutomationDef[] = [
  {
    key: 'case.pendiente_cliente',
    title: 'Documentación requerida',
    trigger: 'Expediente → "Pendiente cliente"',
    action: 'Email al cliente solicitando los documentos necesarios',
    channel: 'Email cliente',
    group: 'Expedientes',
  },
  {
    key: 'case.en_revision',
    title: 'Documentación recibida',
    trigger: 'Expediente → "En revisión"',
    action: 'Email al cliente confirmando que hemos recibido su documentación',
    channel: 'Email cliente',
    group: 'Expedientes',
  },
  {
    key: 'case.listo_para_presentar',
    title: 'Trámite iniciado',
    trigger: 'Expediente → "Listo para presentar"',
    action: 'Email al cliente informando que el trámite está en curso',
    channel: 'Email cliente',
    group: 'Expedientes',
  },
  {
    key: 'case.presentado',
    title: 'Enviado al organismo',
    trigger: 'Expediente → "Presentado"',
    action: 'Email al cliente confirmando el envío ante el organismo competente',
    channel: 'Email cliente',
    group: 'Expedientes',
  },
  {
    key: 'case.finalizado',
    title: 'Expediente entregado',
    trigger: 'Expediente → "Finalizado"',
    action: 'Email al cliente con la confirmación de entrega del expediente',
    channel: 'Email cliente',
    group: 'Expedientes',
  },
  {
    key: 'case.review_request',
    title: 'Solicitud de valoración',
    trigger: 'Expediente → "Finalizado"',
    action: 'Email al cliente con enlace de un solo uso para dejar su valoración',
    channel: 'Email cliente',
    group: 'Expedientes',
  },
  {
    key: 'admin.daily_summary',
    title: 'Resumen diario',
    trigger: 'Cada día a las 08:30 UTC',
    action: 'Email al administrador con alertas operativas: expedientes bloqueados, presupuestos pendientes, leads nuevos y jobs Holded fallidos',
    channel: 'Email admin',
    group: 'Admin',
  },
];
