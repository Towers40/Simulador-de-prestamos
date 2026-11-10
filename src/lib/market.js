// Tasas del mercado colombiano desde la fuente oficial: Superintendencia Financiera de
// Colombia (SFC), publicadas como datos abiertos en datos.gov.co (API Socrata con CORS).
// Se consultan en vivo desde el navegador; no hay valores escritos a mano.

const API = 'https://www.datos.gov.co/resource';

export const SOURCES = {
  credit: {
    dataset: 'qzsc-9esp',
    name: 'Tasas de interés activas por tipo de crédito',
    page: 'https://www.datos.gov.co/d/qzsc-9esp',
    cadence: 'semanal',
  },
  deposit: {
    dataset: 'axk9-g2nh',
    name: 'Tasas de interés de captación',
    page: 'https://www.datos.gov.co/d/axk9-g2nh',
    cadence: 'diaria',
  },
};

export const MARKET_PRODUCTS = [
  {
    id: 'vivienda',
    label: 'Vivienda',
    kind: 'credit',
    description: 'Crédito hipotecario para comprar vivienda, en pesos.',
    defaultVariant: 'novis',
    variants: [
      { id: 'novis', label: 'No VIS', product: 'Adquisición de vivienda no vis (colocación en pesos)', minCredits: 10 },
      { id: 'vis', label: 'VIS', product: 'Adquisición de vivienda vis (colocación en pesos)', minCredits: 10 },
    ],
  },
  {
    id: 'vehiculo',
    label: 'Vehículo',
    kind: 'credit',
    description: 'Crédito para comprar carro o moto.',
    variants: [{ id: 'all', product: 'Vehículo', minCredits: 20 }],
  },
  {
    id: 'libre',
    label: 'Libre inversión',
    kind: 'credit',
    description: 'Crédito de consumo para usar en lo que quieras.',
    variants: [{ id: 'all', product: 'Libre inversión', minCredits: 20 }],
  },
  {
    id: 'libranza',
    label: 'Libranza',
    kind: 'credit',
    description: 'Crédito que se descuenta directamente de tu nómina o pensión.',
    variants: [{ id: 'all', product: 'Libranza otros', minCredits: 20 }],
  },
  {
    id: 'cdt',
    label: 'Inversión (CDT)',
    kind: 'deposit',
    description: 'Certificados de depósito a término: lo que te paga la entidad por tu ahorro.',
    defaultVariant: '360',
    variants: [
      { id: '90', label: '90 días', subcuenta: 70 },
      { id: '180', label: '180 días', subcuenta: 110 },
      { id: '360', label: '360 días', subcuenta: 130 },
    ],
  },
];

const ENTITY_TYPES = {
  1: 'Banco',
  2: 'Corporación financiera',
  4: 'Compañía de financiamiento',
  22: 'Entidad oficial',
  32: 'Cooperativa financiera',
};

// Clave: `${tipo_entidad}-${codigo_entidad}` (códigos SFC, iguales en ambos conjuntos).
// Sitios oficiales verificados el 10 nov 2026.
const ENTITIES = {
  '1-1': ['Banco de Bogotá', 'https://www.bancodebogota.com'],
  '1-2': ['Banco Popular', 'https://www.bancopopular.com.co'],
  '1-6': ['Itaú', 'https://banco.itau.co'],
  '1-7': ['Bancolombia', 'https://www.bancolombia.com'],
  '1-12': ['Banco GNB Sudameris', 'https://www.gnbsudameris.com.co'],
  '1-13': ['BBVA Colombia', 'https://www.bbva.com.co'],
  '1-23': ['Banco de Occidente', 'https://www.bancodeoccidente.com.co'],
  '1-30': ['Banco Caja Social', 'https://www.bancocajasocial.com'],
  '1-39': ['Davivienda', 'https://www.davivienda.com'],
  '1-42': ['Davibank', 'https://www.davibank.com'],
  '1-43': ['Banco Agrario', 'https://www.bancoagrario.gov.co'],
  '1-49': ['Banco AV Villas', 'https://www.avvillas.com.co'],
  '1-51': ['Bancien (Ban100)', 'https://www.ban100.com.co'],
  '1-52': ['Bancamía', 'https://www.bancamia.com.co'],
  '1-53': ['Banco W', 'https://www.bancow.com.co'],
  '1-54': ['Bancoomeva', 'https://www.bancoomeva.com.co'],
  '1-55': ['Banco Finandina', 'https://www.bancofinandina.com'],
  '1-56': ['Banco Falabella', 'https://www.bancofalabella.com.co'],
  '1-57': ['Banco Pichincha', 'https://www.bancopichincha.com.co'],
  '1-58': ['Banco Coopcentral', 'https://www.coopcentral.com.co'],
  '1-59': ['Banco Santander', 'https://www.santander.com.co'],
  '1-60': ['Banco Mundo Mujer', 'https://www.bmm.com.co'],
  '1-62': ['Mibanco', 'https://www.mibanco.com.co'],
  '1-63': ['Banco Serfinanza', 'https://www.bancoserfinanza.com'],
  '1-65': ['Lulo Bank', 'https://www.lulobank.com'],
  '1-67': ['Banco Unión', 'https://www.bancounion.com'],
  '1-68': ['Banco Contactar', 'https://bancocontactar.com'],
  '2-11': ['Corficolombiana', 'https://www.corfi.com'],
  '4-26': ['Tuya', 'https://www.tuya.com.co'],
  '4-31': ['GM Financial', 'https://www.gmfinancial.com.co'],
  '4-46': ['Coltefinanciera', 'https://www.coltefinanciera.com.co'],
  '4-108': ['Iris', 'https://iris.com.co'],
  '4-117': ['Credifamilia', 'https://credifamilia.com'],
  '4-118': ['Crezcamos', 'https://crezcamos.com'],
  '4-120': ['La Hipotecaria', 'https://www.lahipotecaria.com/colombia/'],
  '4-121': ['Financiera Juriscoop', 'https://www.financierajuriscoop.com.co'],
  '4-122': ['RCI Colombia (Mobilize)', 'https://www.mobilize-fs.com.co'],
  '4-124': ['RappiPay', 'https://www.rappipay.co'],
  '4-127': ['Bold', 'https://bold.co'],
  '4-128': ['Nu Colombia', 'https://nu.com.co'],
  '4-129': ['KOA', 'https://koa.co'],
  '4-130': ['Nequi', 'https://www.nequi.com.co'],
  '4-132': ['Plata', 'https://plata.co'],
  '22-8': ['Fondo Nacional del Ahorro', 'https://www.fna.gov.co'],
  '32-1': ['Cooperativa Financiera de Antioquia', 'https://www.cfa.com.co'],
  '32-2': ['JFK Cooperativa Financiera', 'https://www.jfk.com.co'],
  '32-4': ['Cotrafa', 'https://www.cotrafa.com.co'],
  '32-5': ['Confiar', 'https://www.confiar.coop'],
};

const tidyName = (raw) =>
  String(raw ?? '')
    .replace(/["“”]/g, '')
    .replace(/\s*\(.*$/, '')
    .replace(/\s+S\.?\s?A\.?$/i, '')
    .trim();

const describeEntity = (tipo, codigo, rawName) => {
  const key = `${tipo}-${codigo}`;
  const known = ENTITIES[key];
  const name = known ? known[0] : tidyName(rawName);
  return {
    key,
    name,
    type: ENTITY_TYPES[tipo] ?? 'Entidad vigilada',
    url: known ? known[1] : null,
    // Si llega una entidad nueva sin sitio verificado, se ofrece una búsqueda (marcada como tal).
    searchUrl: known ? null : `https://www.google.com/search?q=${encodeURIComponent(`${name} Colombia sitio oficial`)}`,
  };
};

export const buildQueryUrl = (dataset, params) => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) search.set(`$${k}`, v);
  return `${API}/${dataset}.json?${search.toString()}`;
};

async function soql(dataset, params, signal) {
  const url = buildQueryUrl(dataset, params);
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`La fuente respondió ${res.status}`);
  return { url, rows: await res.json() };
}

const round2 = (n) => Math.round(n * 100) / 100;

const esc = (s) => String(s).replace(/'/g, "''");

async function fetchCredit(variant, signal) {
  const { dataset } = SOURCES.credit;
  const base = `producto_de_cr_dito='${esc(variant.product)}' AND tipo_de_persona='Natural'`;
  const latest = await soql(dataset, { select: 'max(fecha_corte) as fecha', where: base }, signal);
  const date = latest.rows[0]?.fecha;
  if (!date) throw new Error('La fuente no tiene datos para este producto.');

  const { url, rows } = await soql(
    dataset,
    {
      select:
        'tipo_entidad, codigo_entidad, max(nombre_entidad) as nombre, sum(numero_de_creditos) as creditos, ' +
        'sum(montos_desembolsados) as monto, sum(tasa_efectiva_promedio * montos_desembolsados) / sum(montos_desembolsados) as tasa_pond',
      where: `fecha_corte='${date}' AND ${base} AND montos_desembolsados > 0`,
      group: 'tipo_entidad, codigo_entidad',
      having: `sum(numero_de_creditos) >= ${variant.minCredits}`,
      order: 'tasa_pond ASC',
      limit: '60',
    },
    signal,
  );

  return {
    kind: 'credit',
    fetchedAt: new Date(),
    date,
    queryUrl: url,
    minCredits: variant.minCredits,
    rows: rows
      .map((r) => ({
        ...describeEntity(r.tipo_entidad, r.codigo_entidad, r.nombre),
        rate: round2(parseFloat(r.tasa_pond)),
        credits: Math.round(parseFloat(r.creditos)),
        amount: parseFloat(r.monto),
      }))
      .filter((r) => Number.isFinite(r.rate) && r.rate > 0),
  };
}

async function fetchDeposit(variant, signal) {
  const { dataset } = SOURCES.deposit;
  const base = `uca=1 AND subcuenta=${variant.subcuenta}`;
  const latest = await soql(dataset, { select: 'max(fechacorte) as fecha', where: base }, signal);
  const date = latest.rows[0]?.fecha;
  if (!date) throw new Error('La fuente no tiene datos para este plazo.');

  // Promedio ponderado de los últimos 7 días para incluir entidades que no emiten a diario.
  const since = new Date(new Date(date.slice(0, 10) + 'T00:00:00Z').getTime() - 7 * 86_400_000).toISOString().slice(0, 10);

  const { url, rows } = await soql(
    dataset,
    {
      select:
        'tipoentidad, codigoentidad, max(nombreentidad) as nombre, sum(tasa * monto) / sum(monto) as tasa_pond, max(fechacorte) as ultima',
      // Se excluyen las entidades oficiales de segundo piso (no atienden al público).
      where: `${base} AND monto > 0 AND tipoentidad != 22 AND fechacorte > '${since}T00:00:00'`,
      group: 'tipoentidad, codigoentidad',
      order: 'tasa_pond DESC',
      limit: '60',
    },
    signal,
  );

  return {
    kind: 'deposit',
    fetchedAt: new Date(),
    date,
    since,
    queryUrl: url,
    rows: rows
      .map((r) => ({
        ...describeEntity(r.tipoentidad, r.codigoentidad, r.nombre),
        rate: round2(parseFloat(r.tasa_pond)),
        lastReport: r.ultima,
      }))
      .filter((r) => Number.isFinite(r.rate) && r.rate > 0),
  };
}

const cache = new Map();

/** Devuelve las tasas del producto/variante; se cachea durante la visita. */
export function fetchMarketRates(product, variant, signal) {
  const key = `${product.id}:${variant.id}`;
  if (cache.has(key)) return cache.get(key);
  const promise = (product.kind === 'deposit' ? fetchDeposit(variant, signal) : fetchCredit(variant, signal)).catch(
    (err) => {
      cache.delete(key);
      throw err;
    },
  );
  cache.set(key, promise);
  return promise;
}
