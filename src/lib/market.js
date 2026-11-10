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
// `links` lleva a la página del producto donde se solicita; si falta, se usa el sitio oficial.
// Sitios y enlaces verificados el 10 nov 2026 (ver docs/FUENTES.md).
const ENTITIES = {
  '1-1': { name: 'Banco de Bogotá', site: 'https://www.bancodebogota.com', links: { vivienda: 'https://www.bancodebogota.com/personas/creditos/portafolio-vivienda/vivienda', vehiculo: 'https://www.bancodebogota.com/personas/creditos/vehiculo', libre: 'https://www.bancodebogota.com/personas/creditos/libre-inversion', libranza: 'https://www.bancodebogota.com/personas/creditos/libranza', cdt: 'https://cdtdigital.bancodebogota.com.co/index.html' } },
  '1-2': { name: 'Banco Popular', site: 'https://www.bancopopular.com.co', links: { vivienda: 'https://www.bancopopular.com.co/wps/portal/bancopopular/inicio/para-ti/finaciacion-vivienda/financiacion-vivienda', libre: 'https://www.bancopopular.com.co/wps/portal/bancopopular/inicio/para-ti/prestamo-personal-libre-destino', libranza: 'https://www.bancopopular.com.co/wps/portal/bancopopular/inicio/para-ti/credito-prestaya', cdt: 'https://www.bancopopular.com.co/wps/portal/bancopopular/inicio/para-ti/productos-ahorro-inversion/cdt-digital' } },
  '1-6': { name: 'Itaú', site: 'https://banco.itau.co', links: { cdt: 'https://banco.itau.co/web/corporate/inversiones/cdt-virtual' } },
  '1-7': { name: 'Bancolombia', site: 'https://www.bancolombia.com', links: { vivienda: 'https://www.bancolombia.com/personas/creditos/vivienda', vehiculo: 'https://www.bancolombia.com/personas/creditos/vehiculo', libre: 'https://www.bancolombia.com/personas/creditos/consumo/credito-libre-inversion', libranza: 'https://www.bancolombia.com/personas/creditos/consumo/libranza-para-empleados', cdt: 'https://www.bancolombia.com/personas/productos/inversiones/inversion-virtual' } },
  '1-12': { name: 'Banco GNB Sudameris', site: 'https://www.gnbsudameris.com.co', links: { libre: 'https://www.gnbsudameris.com.co/personas/financiacion/credito-de-consumo', libranza: 'https://www.gnbsudameris.com.co/personas/financiacion/credito-de-libranza', cdt: 'https://www.gnbsudameris.com.co/personas/ahorro-e-inversion/cdt' } },
  '1-13': { name: 'BBVA Colombia', site: 'https://www.bbva.com.co', links: { vivienda: 'https://www.bbva.com.co/personas/productos/prestamos/vivienda.html', vehiculo: 'https://www.bbva.com.co/personas/productos/prestamos/vehiculo.html', libre: 'https://www.bbva.com.co/personas/productos/prestamos/consumo.html', libranza: 'https://www.bbva.com.co/personas/productos/prestamos/consumo/libranza.html', cdt: 'https://www.bbva.com.co/personas/productos/inversion/cdt/online.html' } },
  '1-23': { name: 'Banco de Occidente', site: 'https://www.bancodeoccidente.com.co', links: { vivienda: 'https://www.bancodeoccidente.com.co/creditos/hipotecario', vehiculo: 'https://www.bancodeoccidente.com.co/creditos/carros', libre: 'https://www.bancodeoccidente.com.co/creditos/prestamo-personal', libranza: 'https://www.bancodeoccidente.com.co/creditos/libranza', cdt: 'https://www.bancodeoccidente.com.co/inversion/cdt' } },
  '1-30': { name: 'Banco Caja Social', site: 'https://www.bancocajasocial.com', links: { vivienda: 'https://www.bancocajasocial.com/creditos-de-vivienda/credito-hipotecario/', vehiculo: 'https://www.bancocajasocial.com/creditos/credito-de-vehiculo-o-moto/', libre: 'https://www.bancocajasocial.com/creditos/credito-de-libre-inversion/', libranza: 'https://www.bancocajasocial.com/creditos/credito-de-libranza/', cdt: 'https://www.bancocajasocial.com/inversion/cdt-tasa-fija/' } },
  '1-39': { name: 'Davivienda', site: 'https://www.davivienda.com', links: { vivienda: 'https://www.davivienda.com/personas/creditos/credito-de-vivienda-inmuebles', vehiculo: 'https://www.davivienda.com/personas/creditos/credito-de-vehiculo', libre: 'https://www.davivienda.com/personas/creditos/credito-de-consumo', libranza: 'https://www.davivienda.com/personas/credito-de-consumo/credito-de-libranza', cdt: 'https://www.davivienda.com/personas/inversiones/cdt' } },
  '1-42': { name: 'Davibank', site: 'https://www.davibank.com', links: { vivienda: 'https://www.davibank.com/personas/hipotecario/compra-de-inmuebles/compra-de-vivienda', vehiculo: 'https://www.davibank.com/personas/vehiculos', libre: 'https://www.davibank.com/personas/prestamos/sin-garantia/libre-inversion', cdt: 'https://www.davibank.com/cdt' } },
  '1-43': { name: 'Banco Agrario', site: 'https://www.bancoagrario.gov.co', links: { vivienda: 'https://www.bancoagrario.gov.co/soluciones-vivienda', libre: 'https://www.bancoagrario.gov.co/personas/asalariado-independiente-pensionado/credito-libre-destinacion', libranza: 'https://www.bancoagrario.gov.co/personas/asalariado-independiente-pensionado/libranza-libre-inversion' } },
  '1-49': { name: 'Banco AV Villas', site: 'https://www.avvillas.com.co', links: { vivienda: 'https://www.avvillas.com.co/credito-hipotecario', libre: 'https://www.avvillas.com.co/credito-libre-inversion-en-linea', libranza: 'https://www.avvillas.com.co/productos-en-oficina/prestamos/credito-libranza', cdt: 'https://www.avvillas.com.co/cdt-en-linea' } },
  '1-51': { name: 'Bancien (Ban100)', site: 'https://www.ban100.com.co', links: { libre: 'https://www.ban100.com.co/productos/credito-de-consumo', libranza: 'https://www.ban100.com.co/landing-libranza', cdt: 'https://www.ban100.com.co/productos/cdt' } },
  '1-52': { name: 'Bancamía', site: 'https://www.bancamia.com.co', links: { cdt: 'https://www.bancamia.com.co/productos/cdt/' } },
  '1-53': { name: 'Banco W', site: 'https://www.bancow.com.co', links: { cdt: 'https://cdtdigital.bancow.com.co/' } },
  '1-54': { name: 'Bancoomeva', site: 'https://www.bancoomeva.com.co', links: { vivienda: 'https://www.bancoomeva.com.co/publicaciones/163515/credito-de-vivienda-tradicional/', vehiculo: 'https://www.bancoomeva.com.co/publicaciones/163517/vehiculo/', libre: 'https://www.bancoomeva.com.co/publicaciones/163538/credito-de-libre-inversion/', libranza: 'https://www.bancoomeva.com.co/publicaciones/164211/credito-de-libranza/', cdt: 'https://www.bancoomeva.com.co/publicaciones/163534/cdt/' } },
  '1-55': { name: 'Banco Finandina', site: 'https://www.bancofinandina.com', links: { vehiculo: 'https://www.bancofinandina.com/productos/credito-vehiculo', libre: 'https://www.bancofinandina.com/productos/creditos/credito-libre-inversion', libranza: 'https://www.bancofinandina.com/productos/creditos/libranza', cdt: 'https://www.bancofinandina.com/productos/cdts' } },
  '1-56': { name: 'Banco Falabella', site: 'https://www.bancofalabella.com.co', links: { libre: 'https://www.bancofalabella.com.co/creditos/credito-libre-inversion', cdt: 'https://www.bancofalabella.com.co/cdt' } },
  '1-57': { name: 'Banco Pichincha', site: 'https://www.bancopichincha.com.co', links: { libranza: 'https://www.bancopichincha.com.co/web/personas/credito-de-libranza', cdt: 'https://www.bancopichincha.com.co/web/personas/cdt' } },
  '1-58': { name: 'Banco Coopcentral', site: 'https://www.coopcentral.com.co' },
  '1-59': { name: 'Banco Santander', site: 'https://www.santander.com.co', links: { vehiculo: 'https://www.santander.com.co/pg/credito-vehiculo.html', cdt: 'https://www.santander.com.co/pg/cdt.html' } },
  '1-60': { name: 'Banco Mundo Mujer', site: 'https://www.bmm.com.co', links: { libre: 'https://www.bmm.com.co/creditos/libre-inversion' } },
  '1-62': { name: 'Mibanco', site: 'https://www.mibanco.com.co', links: { vivienda: 'https://www.mibanco.com.co/creditos-vivienda', cdt: 'https://www.mibanco.com.co/inversion/cdt' } },
  '1-63': { name: 'Banco Serfinanza', site: 'https://www.bancoserfinanza.com', links: { libre: 'https://bancoserfinanza.com/personas/credito-de-libranza/', libranza: 'https://bancoserfinanza.com/personas/credito-de-libranza/' } },
  '1-65': { name: 'Lulo Bank', site: 'https://www.lulobank.com', links: { libre: 'https://www.lulobank.com/features/pide-tu-credito', cdt: 'https://www.lulobank.com/features/cdt' } },
  '1-67': { name: 'Banco Unión', site: 'https://www.bancounion.com', links: { libre: 'https://www.bancounion.com/publicaciones/549/creditos/', libranza: 'https://www.bancounion.com/publicaciones/449/cumple-tus-planes-con-tu-credito-de-libranza/', cdt: 'https://www.bancounion.com/publicaciones/482/cdt/' } },
  '1-68': { name: 'Banco Contactar', site: 'https://bancocontactar.com', links: { cdt: 'https://bancocontactar.com/cdt-productivo-online/' } },
  '2-11': { name: 'Corficolombiana', site: 'https://www.corfi.com/es/' },
  '4-26': { name: 'Tuya', site: 'https://www.tuya.com.co', links: { cdt: 'https://www.tuya.com.co/cdt' } },
  '4-31': { name: 'GM Financial', site: 'https://www.gmfinancial.com.co', links: { vehiculo: 'https://www.gmfinancial.com.co/es-co/inicio/productos/particulares.html' } },
  '4-46': { name: 'Coltefinanciera', site: 'https://www.coltefinanciera.com.co', links: { libre: 'https://www.coltefinanciera.com.co/creditos/creditodo-libre-inversion/', libranza: 'https://www.coltefinanciera.com.co/creditos/libranza', cdt: 'https://www.coltefinanciera.com.co/cdt/' } },
  '4-108': { name: 'Iris', site: 'https://iris.com.co', links: { cdt: 'https://iris.com.co/cdt/' } },
  '4-117': { name: 'Credifamilia', site: 'https://credifamilia.com', links: { vivienda: 'https://credifamilia.com/credito/hipotecario', libre: 'https://credifamilia.com/credito/consumo', cdt: 'https://credifamilia.com/inversion/cdt-certificado-de-deposito-a-termino' } },
  '4-118': { name: 'Crezcamos', site: 'https://crezcamos.com', links: { libre: 'https://crezcamos.com/prestamos-en-linea/credito-de-libre-inversion/', libranza: 'https://crezcamos.com/prestamos-en-linea/credito-de-libranza/', cdt: 'https://crezcamos.com/certificado-deposito-a-termino/' } },
  '4-120': { name: 'La Hipotecaria', site: 'https://www.lahipotecaria.com/colombia/', links: { vivienda: 'https://www.lahipotecaria.com/colombia/prestamos-hipotecarios/', libranza: 'https://app.lahipotecaria.com/surveys/credito-de-libranza', cdt: 'https://cdts.lahipotecaria.com/' } },
  '4-121': { name: 'Financiera Juriscoop', site: 'https://www.financierajuriscoop.com.co', links: { libre: 'https://www.financierajuriscoop.com.co/personas/portafolio/creditos/credito-de-libre-inversion', libranza: 'https://www.financierajuriscoop.com.co/personas/portafolio/creditos/credito-de-libranza', cdt: 'https://www.financierajuriscoop.com.co/personas/portafolio/ahorro-e-inversion/cdt' } },
  '4-122': { name: 'RCI Colombia (Mobilize)', site: 'https://www.mobilize-fs.com.co', links: { vehiculo: 'https://www.mobilize-fs.com.co/financiamiento-vehiculos/' } },
  '4-124': { name: 'RappiPay', site: 'https://www.rappipay.co', links: { libre: 'https://www.rappipay.co/rappiprestamo/' } },
  '4-127': { name: 'Bold', site: 'https://bold.co', links: { cdt: 'https://bold.co/cf/cdt' } },
  '4-128': { name: 'Nu Colombia', site: 'https://nu.com.co', links: { libre: 'https://nu.com.co/prestamos', cdt: 'https://nu.com.co/cdt' } },
  '4-129': { name: 'KOA', site: 'https://koa.co' },
  '4-130': { name: 'Nequi', site: 'https://www.nequi.com.co', links: { libre: 'https://www.nequi.com.co/personas/creditos' } },
  '4-132': { name: 'Plata', site: 'https://plata.co', links: { cdt: 'https://plata.co/es/cdt' } },
  '22-8': { name: 'Fondo Nacional del Ahorro', site: 'https://www.fna.gov.co', links: { vivienda: 'https://www.fna.gov.co/personas/vivienda/credito-hipotecario' } },
  '32-1': { name: 'Cooperativa Financiera de Antioquia', site: 'https://www.cfa.com.co', links: { libre: 'https://www.cfa.com.co/personas/creditos-de-consumo/', cdt: 'https://www.cfa.com.co/personas/cdts/' } },
  '32-2': { name: 'JFK Cooperativa Financiera', site: 'https://www.jfk.com.co', links: { libre: 'https://www.jfk.com.co/credito/', libranza: 'https://www.jfk.com.co/credito-de-libranza/' } },
  '32-4': { name: 'Cotrafa', site: 'https://www.cotrafa.com.co', links: { vivienda: 'https://www.cotrafa.com.co/personas/creditos/credito-de-vivienda/', libre: 'https://www.cotrafa.com.co/personas/creditos/credito-de-libre-inversion/', libranza: 'https://www.cotrafa.com.co/personas/creditos/credito-de-libranza/', cdt: 'https://www.cotrafa.com.co/personas/ahorros/cdt/' } },
  '32-5': { name: 'Confiar', site: 'https://www.confiar.coop', links: { vivienda: 'https://www.confiar.coop/personas/productos/credito/credito-para-comprar-vivienda', libre: 'https://www.confiar.coop/personas/productos/credito/credito-de-libre-inversion', libranza: 'https://www.confiar.coop/personas/productos/credito/credito-de-libre-inversion', cdt: 'https://www.confiar.coop/personas/productos/ahorro/invierte-con-proposito-con-el-cdt-y-dat' } },
};

const tidyName = (raw) =>
  String(raw ?? '')
    .replace(/["“”]/g, '')
    .replace(/\s*\(.*$/, '')
    .replace(/\s+S\.?\s?A\.?$/i, '')
    .trim();

// Logos guardados en public/logos (íconos oficiales de cada entidad); si falta, se usan iniciales.
const NO_LOGO = new Set(['1-58']);

const describeEntity = (tipo, codigo, rawName, productId) => {
  const key = `${tipo}-${codigo}`;
  const known = ENTITIES[key];
  const name = known ? known.name : tidyName(rawName);
  const productUrl = known?.links?.[productId] ?? null;
  return {
    key,
    name,
    type: ENTITY_TYPES[tipo] ?? 'Entidad vigilada',
    logo: known && !NO_LOGO.has(key) ? `${import.meta.env.BASE_URL}logos/${key}.png` : null,
    // Página del producto donde se solicita; si no existe, el sitio oficial.
    url: productUrl ?? known?.site ?? null,
    direct: Boolean(productUrl),
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

/** Solo se muestran las 5 mejores por producto. */
export const TOP_N = 5;

const esc = (s) => String(s).replace(/'/g, "''");

async function fetchCredit(product, variant, signal) {
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
      limit: '12',
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
        ...describeEntity(r.tipo_entidad, r.codigo_entidad, r.nombre, product.id),
        rate: round2(parseFloat(r.tasa_pond)),
        credits: Math.round(parseFloat(r.creditos)),
        amount: parseFloat(r.monto),
      }))
      .filter((r) => Number.isFinite(r.rate) && r.rate > 0)
      .slice(0, TOP_N),
  };
}

async function fetchDeposit(product, variant, signal) {
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
      limit: '12',
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
        ...describeEntity(r.tipoentidad, r.codigoentidad, r.nombre, product.id),
        rate: round2(parseFloat(r.tasa_pond)),
        lastReport: r.ultima,
      }))
      .filter((r) => Number.isFinite(r.rate) && r.rate > 0)
      .slice(0, TOP_N),
  };
}

const cache = new Map();

/** Devuelve las tasas del producto/variante; se cachea durante la visita. */
export function fetchMarketRates(product, variant, signal) {
  const key = `${product.id}:${variant.id}`;
  if (cache.has(key)) return cache.get(key);
  const promise = (product.kind === 'deposit' ? fetchDeposit(product, variant, signal) : fetchCredit(product, variant, signal)).catch(
    (err) => {
      cache.delete(key);
      throw err;
    },
  );
  cache.set(key, promise);
  return promise;
}
