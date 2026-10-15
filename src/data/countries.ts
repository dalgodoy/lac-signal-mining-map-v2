export interface CountryMetadata {
  code: string;
  name: string;
  flag: string;
  subregion: 'southern_cone' | 'andes' | 'central_america_caribbean' | 'north_america' | 'regional' | 'other';
  aliases: string[];
}

export interface SubRegionPreset {
  id: string;
  label: string;
  description: string;
  codes: string[];
}

export const LATAM_COUNTRIES: Record<string, CountryMetadata> = {
  AR: {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    subregion: 'southern_cone',
    aliases: ['argentina', 'arg', 'ar'],
  },
  BO: {
    code: 'BO',
    name: 'Bolivia',
    flag: '🇧🇴',
    subregion: 'andes',
    aliases: ['bolivia', 'bol', 'bo'],
  },
  BR: {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    subregion: 'southern_cone',
    aliases: ['brazil', 'brasil', 'bra', 'br'],
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    subregion: 'southern_cone',
    aliases: ['chile', 'chl', 'cl'],
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    subregion: 'andes',
    aliases: ['colombia', 'col', 'co'],
  },
  CR: {
    code: 'CR',
    name: 'Costa Rica',
    flag: '🇨🇷',
    subregion: 'central_america_caribbean',
    aliases: ['costa rica', 'costarica', 'cri', 'cr'],
  },
  CU: {
    code: 'CU',
    name: 'Cuba',
    flag: '🇨🇺',
    subregion: 'central_america_caribbean',
    aliases: ['cuba', 'cub', 'cu'],
  },
  DO: {
    code: 'DO',
    name: 'Dominican Republic',
    flag: '🇩🇴',
    subregion: 'central_america_caribbean',
    aliases: ['dominican republic', 'republica dominicana', 'rep dominicana', 'rep. dominicana', 'dom', 'do'],
  },
  EC: {
    code: 'EC',
    name: 'Ecuador',
    flag: '🇪🇨',
    subregion: 'andes',
    aliases: ['ecuador', 'ecu', 'ec'],
  },
  SV: {
    code: 'SV',
    name: 'El Salvador',
    flag: '🇸🇻',
    subregion: 'central_america_caribbean',
    aliases: ['el salvador', 'elsalvador', 'slv', 'sv'],
  },
  GT: {
    code: 'GT',
    name: 'Guatemala',
    flag: '🇬🇹',
    subregion: 'central_america_caribbean',
    aliases: ['guatemala', 'gtm', 'gt'],
  },
  HN: {
    code: 'HN',
    name: 'Honduras',
    flag: '🇭🇳',
    subregion: 'central_america_caribbean',
    aliases: ['honduras', 'hnd', 'hn'],
  },
  JM: {
    code: 'JM',
    name: 'Jamaica',
    flag: '🇯🇲',
    subregion: 'central_america_caribbean',
    aliases: ['jamaica', 'jam', 'jm'],
  },
  MX: {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    subregion: 'north_america',
    aliases: ['mexico', 'méxico', 'mex', 'mx'],
  },
  NI: {
    code: 'NI',
    name: 'Nicaragua',
    flag: '🇳🇮',
    subregion: 'central_america_caribbean',
    aliases: ['nicaragua', 'nic', 'ni'],
  },
  PA: {
    code: 'PA',
    name: 'Panama',
    flag: '🇵🇦',
    subregion: 'central_america_caribbean',
    aliases: ['panama', 'panamá', 'pan', 'pa'],
  },
  PY: {
    code: 'PY',
    name: 'Paraguay',
    flag: '🇵🇾',
    subregion: 'southern_cone',
    aliases: ['paraguay', 'pry', 'py'],
  },
  PE: {
    code: 'PE',
    name: 'Peru',
    flag: '🇵🇪',
    subregion: 'andes',
    aliases: ['peru', 'perú', 'per', 'pe'],
  },
  PR: {
    code: 'PR',
    name: 'Puerto Rico',
    flag: '🇵🇷',
    subregion: 'central_america_caribbean',
    aliases: ['puerto rico', 'puertorico', 'pri', 'pr'],
  },
  TT: {
    code: 'TT',
    name: 'Trinidad and Tobago',
    flag: '🇹🇹',
    subregion: 'central_america_caribbean',
    aliases: ['trinidad and tobago', 'trinidad & tobago', 'trinidad y tobago', 'tto', 'tt'],
  },
  UY: {
    code: 'UY',
    name: 'Uruguay',
    flag: '🇺🇾',
    subregion: 'southern_cone',
    aliases: ['uruguay', 'ury', 'uy'],
  },
  VE: {
    code: 'VE',
    name: 'Venezuela',
    flag: '🇻🇪',
    subregion: 'andes',
    aliases: ['venezuela', 'ven', 've'],
  },
  CB: {
    code: 'CB',
    name: 'Caribbean',
    flag: '🏝️',
    subregion: 'central_america_caribbean',
    aliases: ['caribbean', 'caribe', 'cb'],
  },
  LAC: {
    code: 'LAC',
    name: 'Latin America',
    flag: '🌎',
    subregion: 'regional',
    aliases: ['latin america', 'latinoamerica', 'latinoamérica', 'regional', 'lac', 'lam'],
  },
};

export const SUBREGION_PRESETS: SubRegionPreset[] = [
  {
    id: 'southern_cone',
    label: 'Southern Cone',
    description: 'Argentina, Brazil, Chile, Paraguay, Uruguay',
    codes: ['AR', 'BR', 'CL', 'PY', 'UY'],
  },
  {
    id: 'andes',
    label: 'Andes',
    description: 'Bolivia, Colombia, Ecuador, Peru, Venezuela',
    codes: ['BO', 'CO', 'EC', 'PE', 'VE'],
  },
  {
    id: 'central_america_caribbean',
    label: 'Central America & Caribbean',
    description: 'Costa Rica, Caribbean, Cuba, Panama, etc.',
    codes: ['CR', 'CB', 'CU', 'DO', 'SV', 'GT', 'HN', 'JM', 'NI', 'PA', 'PR', 'TT'],
  },
];

/**
 * Normalizes a country string or code and returns the matching CountryMetadata.
 */
export function getCountryInfo(raw: string): CountryMetadata {
  if (!raw) {
    return {
      code: 'LAC',
      name: 'Regional',
      flag: '🌎',
      subregion: 'regional',
      aliases: [],
    };
  }

  const clean = raw.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const upperCode = raw.trim().toUpperCase();

  // Direct code match
  if (LATAM_COUNTRIES[upperCode]) {
    return LATAM_COUNTRIES[upperCode];
  }

  // Match by aliases or names
  for (const info of Object.values(LATAM_COUNTRIES)) {
    if (info.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === clean) {
      return info;
    }
    if (info.aliases.some((alias) => alias.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === clean)) {
      return info;
    }
  }

  // Partial match
  for (const info of Object.values(LATAM_COUNTRIES)) {
    if (clean.includes(info.name.toLowerCase())) {
      return info;
    }
  }

  // Dynamic fallback for any unlisted territory
  const fallbackCode = (raw.trim().replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'GL').toUpperCase();
  return {
    code: fallbackCode,
    name: raw.trim(),
    flag: '🌐',
    subregion: 'other',
    aliases: [clean],
  };
}

/**
 * Convert any raw country name or string to canonical ISO code.
 */
export function countryNameToCode(countryName: string): string {
  return getCountryInfo(countryName).code;
}

/**
 * Check if a country matches any of the selected country codes.
 */
export function matchesSelectedCountries(countryName: string, selectedCodes: string[]): boolean {
  if (!selectedCodes || selectedCodes.length === 0) return true;
  const code = countryNameToCode(countryName);
  return selectedCodes.includes(code);
}

/**
 * Standard country codes present in the default community dataset.
 */
export const DEFAULT_COMMUNITY_COUNTRY_CODES: string[] = [
  'AR', 'BO', 'BR', 'CB', 'CL', 'CO', 'CR', 'LAC', 'MX', 'PE', 'VE'
];

/**
 * Extract unique country codes from any list of initiatives.
 */
export function extractUniqueCountryCodes(items: { country?: string }[]): string[] {
  const codes = new Set<string>();
  items.forEach((item) => {
    if (item.country && item.country.trim()) {
      codes.add(countryNameToCode(item.country.trim()));
    }
  });
  return Array.from(codes);
}

