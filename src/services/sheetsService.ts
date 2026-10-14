import Papa from 'papaparse';
import { Initiative } from '../types';
import { resolveLocationCoordinates, normalizeKey } from '../data/geoCoordinates';
import { DEFAULT_SHEET_ID, DEFAULT_SHEET_GID } from '../data/fallbackData';

export function extractSheetInfo(url: string): { sheetId: string; gid: string } {
  let sheetId = DEFAULT_SHEET_ID;
  let gid = DEFAULT_SHEET_GID;

  const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch && idMatch[1]) {
    sheetId = idMatch[1];
  }

  const gidMatch = url.match(/gid=([0-9]+)/);
  if (gidMatch && gidMatch[1]) {
    gid = gidMatch[1];
  } else {
    gid = '';
  }

  return { sheetId, gid };
}

export function buildCsvExportUrl(sheetId: string, gid?: string): string {
  const gidParam = gid ? `&gid=${gid}` : '';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}&t=${Date.now()}`;
}

export function buildGvizUrl(sheetId: string, gid?: string): string {
  const gidParam = gid ? `&gid=${gid}` : '';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}&t=${Date.now()}`;
}

/**
 * Parses a 2D array of strings (from CSV or Google Sheets GViz table) into Initiative objects.
 */
export function parseRowsToInitiatives(rows: string[][]): Initiative[] {
  if (!rows || rows.length === 0) return [];

  // Determine if row 0 is header
  let startIndex = 0;
  const firstRow = rows[0].map((c) => String(c || '').trim());
  const headerKeys = firstRow.map((c) => normalizeKey(c));

  let countryCol = 0;
  let scopeCol = -1;
  let nameCol = 1;
  let topicCol = 2;
  let catCol = 3;
  let prevCol = -1;
  let linkPrevCol = -1;
  let nextCol = -1;
  let linkNextCol = -1;
  let linkCol = -1;
  let locationCol = -1;
  let latLngCol = -1;
  let noteCol = -1;
  let followUpCol = -1;

  // Check if first row is header
  const isHeader = headerKeys.some(
    (k) =>
      k.includes('country') ||
      k.includes('pais') ||
      k.includes('scope') ||
      k.includes('institution') ||
      k.includes('topic') ||
      k.includes('signal') ||
      k.includes('location')
  );

  if (isHeader) {
    startIndex = 1;
    headerKeys.forEach((key, idx) => {
      if (key === 'scope' || key.includes('alcance')) {
        scopeCol = idx;
      } else if (key.includes('latitud') || key.includes('longitud') || key.includes('coordenad') || key.includes('latlng')) {
        latLngCol = idx;
      } else if (key.includes('country') || key.includes('pais') || key.includes('nacion') || key.includes('region')) {
        countryCol = idx;
      } else if (key.includes('institution') || key.includes('group') || key.includes('event') || key.includes('nombre') || key.includes('iniciativa')) {
        nameCol = idx;
      } else if (key.includes('topic') || key.includes('tema') || key.includes('area')) {
        topicCol = idx;
      } else if (key.includes('signal') || key.includes('type') || key.includes('tipo') || key.includes('categor')) {
        catCol = idx;
      } else if (key.includes('current') || key.includes('actual') || key.includes('previous') || key.includes('anterior') || key.includes('ant')) {
        if (key.includes('link') || key.includes('enlace') || key.includes('url')) {
          linkPrevCol = idx;
        } else {
          prevCol = idx;
        }
      } else if (key.includes('next') || key.includes('siguiente') || key.includes('proxim')) {
        if (key.includes('link') || key.includes('enlace') || key.includes('url')) {
          linkNextCol = idx;
        } else {
          nextCol = idx;
        }
      } else if (key === 'link' || key === 'enlace' || key === 'url' || key === 'web' || key === 'sitio') {
        linkCol = idx;
      } else if (key.includes('location') || key.includes('ubicacion') || key.includes('ciudad') || key.includes('city') || key.includes('sede')) {
        locationCol = idx;
      } else if (key.includes('note') || key.includes('descrip') || key.includes('resumen') || key.includes('short') || key.includes('nota')) {
        noteCol = idx;
      } else if (key.includes('follow') || key.includes('seguimiento')) {
        followUpCol = idx;
      }
    });

    // If general linkCol not found, fallback to any column containing 'link'
    if (linkCol === -1) {
      headerKeys.forEach((key, idx) => {
        if (idx !== linkPrevCol && idx !== linkNextCol && (key.includes('link') || key.includes('url'))) {
          linkCol = idx;
        }
      });
    }
  }

  const initiatives: Initiative[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const rawCountry = (countryCol >= 0 ? row[countryCol] : '')?.trim() || '';
    const scope = (scopeCol >= 0 ? row[scopeCol] : '')?.trim() || '';
    const name = (nameCol >= 0 ? row[nameCol] : '')?.trim() || '';
    const topic = (topicCol >= 0 ? row[topicCol] : '')?.trim() || 'General CS';
    const rawCategory = (catCol >= 0 ? row[catCol] : '')?.trim() || 'General';
    
    let category = rawCategory || 'General';
    const lowerCat = rawCategory.toLowerCase();
    if (lowerCat.includes('non-recurrent') || lowerCat.includes('one-time') || lowerCat.includes('one time') || lowerCat.includes('evento único') || lowerCat.includes('evento unico')) {
      category = 'One-time Event';
    } else if (lowerCat.includes('school') || lowerCat.includes('escuela')) {
      category = 'School';
    } else if (lowerCat.includes('regional')) {
      category = 'Regional Conference';
    } else if (lowerCat.includes('national') || lowerCat.includes('nacional')) {
      category = 'National Conference';
    } else if (lowerCat.includes('society') || lowerCat.includes('sociedad')) {
      category = 'Society';
    } else if (lowerCat.includes('workshop')) {
      category = 'Workshop';
    } else if (rawCategory.length > 0) {
      category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);
    }

    const previousEdition = prevCol >= 0 ? row[prevCol]?.trim() : undefined;
    const linkPreviousEdition = linkPrevCol >= 0 ? row[linkPrevCol]?.trim() : undefined;
    const nextEdition = nextCol >= 0 ? row[nextCol]?.trim() : undefined;
    const linkNextEdition = linkNextCol >= 0 ? row[linkNextCol]?.trim() : undefined;
    
    const rawLink = linkCol >= 0 ? (row[linkCol] || '').trim() : '';
    const locationRaw = locationCol >= 0 ? (row[locationCol] || '').trim() : '';
    const latLngRaw = latLngCol >= 0 ? (row[latLngCol] || '').trim() : '';
    const note = noteCol >= 0 ? (row[noteCol] || '').trim() : '';
    const potentialFollowUp = followUpCol >= 0 ? (row[followUpCol] || '').trim() : undefined;

    // Skip empty dummy rows or separator lines or instruction notes
    if (!rawCountry && !name && !scope) continue;
    const lowerCountry = rawCountry.toLowerCase();
    const lowerName = name.toLowerCase();
    if (
      lowerCountry === 'country / sub-region' || 
      lowerCountry === 'país' || 
      lowerCountry.startsWith('instruction') || 
      lowerCountry.startsWith('instruccion') ||
      lowerName.startsWith('instruction') ||
      lowerName.startsWith('instruccion')
    ) {
      continue;
    }

    // Determine country to display
    const country = rawCountry || (scope ? `${scope}` : 'Latinoamérica');

    // Determine best URL
    let url = '';
    if (rawLink.startsWith('http://') || rawLink.startsWith('https://')) {
      url = rawLink;
    } else if (linkNextEdition && (linkNextEdition.startsWith('http://') || linkNextEdition.startsWith('https://'))) {
      url = linkNextEdition;
    } else if (linkPreviousEdition && (linkPreviousEdition.startsWith('http://') || linkPreviousEdition.startsWith('https://'))) {
      url = linkPreviousEdition;
    }

    const description = note || '';

    // Resolve coordinates: prioritize explicit Latitud/Longitud column first for map placement ONLY
    let lat: number | undefined;
    let lng: number | undefined;
    let cityName = locationRaw || country;

    if (latLngRaw) {
      const coordMatch = latLngRaw.match(/^(-?\d+(\.\d+)?)\s*[,;\s]\s*(-?\d+(\.\d+)?)$/);
      if (coordMatch) {
        const parsedLat = parseFloat(coordMatch[1]);
        const parsedLng = parseFloat(coordMatch[3]);
        if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
          lat = parsedLat;
          lng = parsedLng;
          cityName = locationRaw || country;
        }
      }
    }

    if (lat === undefined || lng === undefined) {
      const loc = resolveLocationCoordinates(locationRaw, rawCountry || scope);
      lat = loc.lat;
      lng = loc.lng;
      cityName = loc.name;
    }

    initiatives.push({
      id: `init-${i}-${normalizeKey(name || country)}`,
      country,
      scope: scope || undefined,
      name: name || 'Iniciativa sin nombre',
      topic: topic || 'General CS',
      category: category.charAt(0).toUpperCase() + category.slice(1),
      description,
      url,
      previousEdition: previousEdition || undefined,
      linkPreviousEdition: linkPreviousEdition || undefined,
      nextEdition: nextEdition || undefined,
      linkNextEdition: linkNextEdition || undefined,
      locationRaw: locationRaw || undefined,
      latitudeLongitudeRaw: latLngRaw || undefined,
      potentialFollowUp,
      suggestedBy: undefined, // Explicitly not exposed
      lat,
      lng,
      cityName,
      rawIndex: i,
    });
  }

  return initiatives;
}

export function parseRawCsvToInitiatives(csvText: string): Initiative[] {
  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });

  return parseRowsToInitiatives(parsed.data || []);
}

/**
 * Loads Google Sheets in real-time via JSONP `<script>` injection.
 * This completely avoids CORS restrictions in all modern browsers.
 */
export function fetchSpreadsheetViaJsonp(sheetId: string, gid?: string): Promise<Initiative[]> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('Window or document not available for JSONP'));
    }

    const callbackName = `gvizCallback_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const script = document.createElement('script');

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Tiempo de espera agotado al conectar con Google Sheets.'));
    }, 12000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any)[callbackName];
    };

    (window as any)[callbackName] = (response: any) => {
      cleanup();
      try {
        if (!response || !response.table) {
          throw new Error('Respuesta de Google Sheets vacía o formato inesperado.');
        }

        const table = response.table;
        const rows: string[][] = [];

        // Check if table.cols has labels
        const colLabels = (table.cols || []).map((col: any) => (col?.label || '').trim());
        const hasColLabels = colLabels.some((l: string) => l.length > 0);

        // Check if row 0 of table.rows already contains the headers
        let row0IsHeader = false;
        if (table.rows && table.rows.length > 0 && table.rows[0]?.c) {
          const firstRowCells = table.rows[0].c.map((cell: any) => cell?.v ? String(cell.v).toLowerCase() : '');
          row0IsHeader = firstRowCells.some((v: string) =>
            v.includes('country') || v.includes('pais') || v.includes('institution') || v.includes('topic')
          );
        }

        if (hasColLabels && !row0IsHeader) {
          rows.push(colLabels);
        }

        if (table.rows && Array.isArray(table.rows)) {
          for (const r of table.rows) {
            if (!r || !r.c) continue;
            const rowValues = r.c.map((cell: any) => {
              if (cell === null || cell === undefined) return '';
              if (cell.f !== undefined && cell.f !== null) return String(cell.f);
              if (cell.v !== undefined && cell.v !== null) return String(cell.v);
              return '';
            });
            rows.push(rowValues);
          }
        }

        const initiatives = parseRowsToInitiatives(rows);
        if (initiatives.length === 0) {
          throw new Error('La planilla se conectó pero no se encontraron filas de iniciativas.');
        }

        resolve(initiatives);
      } catch (err: any) {
        reject(err);
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('No se pudo descargar la planilla de Google Sheets. Verifique la conexión a internet.'));
    };

    const gidParam = gid ? `&gid=${gid}` : '';
    script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${callbackName}${gidParam}&t=${Date.now()}`;
    document.body.appendChild(script);
  });
}

/**
 * Fetches spreadsheet data in real-time from the designated Google Sheet.
 * Tries JSONP first to bypass CORS, then falls back to direct fetch.
 */
export async function fetchSpreadsheetData(sheetId: string, gid?: string): Promise<Initiative[]> {
  // If in browser, JSONP is immune to CORS
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const data = await fetchSpreadsheetViaJsonp(sheetId, gid);
      return data;
    } catch (jsonpErr) {
      console.warn('JSONP fetch did not complete, trying direct CSV fetch:', jsonpErr);
    }
  }

  // Direct fetch fallback
  const gvizUrl = buildGvizUrl(sheetId, gid);
  try {
    const response = await fetch(gvizUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv, text/plain, */*',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    const initiatives = parseRawCsvToInitiatives(csvText);
    
    if (initiatives.length === 0) {
      throw new Error('La planilla se leyó pero no se encontraron filas con iniciativas válidas.');
    }

    return initiatives;
  } catch (directErr: any) {
    try {
      const exportUrl = buildCsvExportUrl(sheetId, gid);
      const response2 = await fetch(exportUrl, { cache: 'no-store' });
      if (!response2.ok) {
        throw new Error(`HTTP Error ${response2.status}`);
      }
      const csvText2 = await response2.text();
      return parseRawCsvToInitiatives(csvText2);
    } catch (fallbackErr: any) {
      throw new Error(`No se pudo conectar a la planilla de Google Sheets. Asegúrese de que tenga permisos públicos ("Cualquier persona con el enlace puede ver"). Detalle: ${directErr.message || fallbackErr.message}`);
    }
  }
}
