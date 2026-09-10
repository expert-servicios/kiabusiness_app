import type { KiaAvatarState } from './kia-avatar-state';

export interface KiaSurfaceGuidance {
  state: KiaAvatarState;
  title: string;
  message: string;
}

export function resolveCaseListGuidance(activeCount: number, closedCount: number): KiaSurfaceGuidance {
  if (activeCount > 0) {
    return {
      state: 'seguimiento',
      title: activeCount === 1 ? 'Tienes 1 expediente activo' : `Tienes ${activeCount} expedientes activos`,
      message: 'Puedes abrir cada expediente para revisar su estado, documentación pendiente y nuevas comunicaciones.',
    };
  }

  if (closedCount > 0) {
    return {
      state: 'exito',
      title: 'Tus expedientes visibles están finalizados',
      message: 'Puedes consultar el histórico cuando lo necesites o contratar un nuevo servicio desde tu panel.',
    };
  }

  return {
    state: 'ayuda',
    title: 'Estoy aquí para ayudarte con tus expedientes',
    message: 'Cuando contrates un servicio, podrás seguir aquí su estado, documentación y mensajes.',
  };
}

export type KiaOnboardingStep = 'profile' | 'company' | 'done';

export function resolveOnboardingGuidance(input: {
  step: KiaOnboardingStep;
  loading: boolean;
  hasError: boolean;
  companySkipped: boolean;
}): KiaSurfaceGuidance {
  if (input.hasError) {
    return {
      state: 'aviso',
      title: 'Necesito que revises un dato',
      message: 'Comprueba el aviso del formulario. No avanzaré hasta que el dato requerido quede correctamente informado.',
    };
  }

  if (input.loading) {
    return {
      state: 'pensando',
      title: 'Estoy guardando la información',
      message: 'Un momento. Mantengo tus datos y el siguiente paso separados para evitar avanzar con una operación incompleta.',
    };
  }

  if (input.step === 'done') {
    return {
      state: 'exito',
      title: 'Configuración inicial completada',
      message: input.companySkipped
        ? 'Tu perfil está listo. Podrás añadir la entidad fiscal más adelante antes de contratar una suscripción mensual.'
        : 'Tu perfil y tu entidad están preparados. El siguiente paso será contratar el servicio o plan que necesites.',
    };
  }

  if (input.step === 'company') {
    if (input.companySkipped) {
      return {
        state: 'duda',
        title: 'Puedes continuar sin añadir la entidad ahora',
        message: 'Ten en cuenta que necesitarás una entidad fiscal antes de contratar una suscripción mensual. Puedes volver y añadirla en este paso.',
      };
    }

    return {
      state: 'explicacion',
      title: 'Ahora identificamos la entidad fiscal',
      message: 'Estos datos permiten separar correctamente cada empresa y mantener sus expedientes, facturación e integraciones en su propio ámbito.',
    };
  }

  return {
    state: 'bienvenida',
    title: 'Te acompaño en la configuración inicial',
    message: 'Empezamos por tus datos básicos. Después podrás añadir la entidad fiscal que utilizarás en EXPERT.',
  };
}
