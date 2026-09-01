// Country dial codes for phone input selectors. Not exhaustive ISO-3166 —
// covers the countries realistically relevant to EXPERT's Academy audience
// (Spain first as default, Spanish/Latin American and Russian-speaking
// countries prioritized, plus the rest of the EU and other common origins).

export interface CountryDialCode {
  iso2: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const countryDialCodes: CountryDialCode[] = [
  { iso2: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { iso2: 'RU', name: 'Rusia', dialCode: '+7', flag: '🇷🇺' },
  { iso2: 'UA', name: 'Ucrania', dialCode: '+380', flag: '🇺🇦' },
  { iso2: 'BY', name: 'Bielorrusia', dialCode: '+375', flag: '🇧🇾' },
  { iso2: 'KZ', name: 'Kazajistán', dialCode: '+7', flag: '🇰🇿' },
  { iso2: 'MD', name: 'Moldavia', dialCode: '+373', flag: '🇲🇩' },
  { iso2: 'GE', name: 'Georgia', dialCode: '+995', flag: '🇬🇪' },
  { iso2: 'AM', name: 'Armenia', dialCode: '+374', flag: '🇦🇲' },
  { iso2: 'AZ', name: 'Azerbaiyán', dialCode: '+994', flag: '🇦🇿' },
  { iso2: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { iso2: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { iso2: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { iso2: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { iso2: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { iso2: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { iso2: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { iso2: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { iso2: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { iso2: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { iso2: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺' },
  { iso2: 'DO', name: 'República Dominicana', dialCode: '+1', flag: '🇩🇴' },
  { iso2: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
  { iso2: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
  { iso2: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
  { iso2: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮' },
  { iso2: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
  { iso2: 'PA', name: 'Panamá', dialCode: '+507', flag: '🇵🇦' },
  { iso2: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { iso2: 'FR', name: 'Francia', dialCode: '+33', flag: '🇫🇷' },
  { iso2: 'DE', name: 'Alemania', dialCode: '+49', flag: '🇩🇪' },
  { iso2: 'IT', name: 'Italia', dialCode: '+39', flag: '🇮🇹' },
  { iso2: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
  { iso2: 'IE', name: 'Irlanda', dialCode: '+353', flag: '🇮🇪' },
  { iso2: 'NL', name: 'Países Bajos', dialCode: '+31', flag: '🇳🇱' },
  { iso2: 'BE', name: 'Bélgica', dialCode: '+32', flag: '🇧🇪' },
  { iso2: 'CH', name: 'Suiza', dialCode: '+41', flag: '🇨🇭' },
  { iso2: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { iso2: 'PL', name: 'Polonia', dialCode: '+48', flag: '🇵🇱' },
  { iso2: 'RO', name: 'Rumanía', dialCode: '+40', flag: '🇷🇴' },
  { iso2: 'SE', name: 'Suecia', dialCode: '+46', flag: '🇸🇪' },
  { iso2: 'NO', name: 'Noruega', dialCode: '+47', flag: '🇳🇴' },
  { iso2: 'DK', name: 'Dinamarca', dialCode: '+45', flag: '🇩🇰' },
  { iso2: 'FI', name: 'Finlandia', dialCode: '+358', flag: '🇫🇮' },
  { iso2: 'GR', name: 'Grecia', dialCode: '+30', flag: '🇬🇷' },
  { iso2: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { iso2: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
  { iso2: 'MA', name: 'Marruecos', dialCode: '+212', flag: '🇲🇦' },
  { iso2: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
];

export const DEFAULT_DIAL_CODE = countryDialCodes[0]; // España
