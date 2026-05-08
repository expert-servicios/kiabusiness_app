const facts = [
  'España tiene más de 3,3 millones de autónomos. ¡Eres parte de una comunidad enorme que mueve la economía del país!',
  'El 62% de las pymes españolas que digitalizan su gestión contable recuperan más de 5 horas semanales de trabajo administrativo. Eso son 260 horas al año... o 32 días completos.',
  'La palabra "empresa" viene del latín medieval "imprehendere" — que significa atreverse a emprender. Así que si tienes una empresa, eres, por definición, una persona valiente.',
  'Hacienda procesa más de 22 millones de declaraciones de IRPF cada campaña. De todas ellas, el 70% resulta a devolver. ¿Revisaste bien tus deducciones?',
  'El Régimen Beckham (Ley de Impatriados) permite tributar a un tipo fijo del 24% en lugar de hasta el 47%. David Beckham lo usó al fichar por el Real Madrid en 2003. Buen precedente.',
  'En España existen más de 1,5 millones de sociedades mercantiles activas. Las SLU (Sociedad Limitada Unipersonal) son las favoritas de los emprendedores: capital mínimo de 3.000 € y un solo socio.',
  'El plazo de prescripción fiscal en España es de 4 años. Después de ese período, Hacienda ya no puede reclamar deudas de ejercicios anteriores. Por eso conservar facturas durante ese tiempo es fundamental.',
  'Holded tiene más de 80.000 empresas usando su plataforma en España. Los clientes que migran desde Excel o programas de escritorio reportan un ahorro medio del 40% en tiempo de gestión contable.',
  'El modelo 303 de IVA se presenta 4 veces al año. En 2025, la AEAT recibió más de 18 millones de liquidaciones de IVA. La puntualidad en los pagos te evita recargos de entre el 5% y el 20%.',
  'Las empresas con contabilidad ordenada y al día tienen un 35% más de probabilidades de obtener financiación bancaria en condiciones favorables. Los bancos también leen balances.',
  'El arraigo social en España se puede solicitar después de 3 años de permanencia. Cada año se conceden más de 100.000 autorizaciones de residencia por esta vía.',
  'VeriFactu será obligatorio para autónomos y pymes a partir de julio de 2026. Los sistemas de facturación deberán encadenar cada factura con un hash digital. El papel, definitivamente, tiene los días contados.',
  'España tiene convenios para evitar la doble imposición con más de 90 países. Esto significa que si pagas impuestos en otro país, puedes deducirlos en tu declaración española. La globalización también tiene ventajas fiscales.',
  'El certificado digital tiene una vida útil de 2-3 años. Renovarlo antes de que caduque te evita tener que pasar de nuevo por la verificación de identidad presencial. Ponlo ya en el calendario.',
  'La tarifa plana de autónomos (80 €/mes en 2025) aplica durante los primeros 12 meses. Si tus rendimientos no superan el SMI, se puede prorrogar. Más de 500.000 autónomos la disfrutan cada año.',
  'El Impuesto de Sociedades en España tiene un tipo general del 25%. Para empresas de nueva creación, es del 15% durante los dos primeros ejercicios con base imponible positiva. Arrancar tiene sus ventajas.',
  'Los emprendedores en España dedican de media 120 horas al año a tareas administrativas y fiscales que podrían delegar. A 50 €/hora de coste de oportunidad, son 6.000 € de valor perdido cada año.',
  'El 85% de los expedientes de extranjería que se presentan correctamente en el primer intento se resuelven en el plazo legal. La documentación completa marca la diferencia.',
  'Una empresa bien organizada digitalmente vale entre un 20% y un 40% más en una operación de compraventa que una similar con contabilidad desordenada. Tu gestión de hoy es la valoración de mañana.',
  'En España, el 94% de las empresas son microempresas (menos de 10 empleados). El reto no es crecer rápido, sino crecer de forma sostenible con la estructura legal y fiscal adecuada desde el principio.',
];

export function getRandomFunFact(): string {
  return facts[Math.floor(Math.random() * facts.length)];
}
