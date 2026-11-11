// Renderiza las escenas de scene.js en Chrome sin interfaz y guarda WebP con fondo transparente.
//
// Uso (desde la raíz del proyecto):
//   npm i --no-save three@0.170.0 puppeteer-core@24
//   CHROME_PATH="/ruta/a/Chrome" node scripts/3d/render.mjs public/3d hero vivienda vehiculo libre libranza cdt percent
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const [outDir, ...scenes] = process.argv.slice(2);
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

for (const name of scenes) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error(`[${name}]`, e.message));
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.host !== 'render.local') return req.abort();
    const file = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) return req.respond({ status: 404, body: '' });
    req.respond({ status: 200, contentType: types[path.extname(file)] ?? 'application/octet-stream', body: fs.readFileSync(file) });
  });
  await page.goto(`http://render.local/scripts/3d/render.html?scene=${name}`);
  await page.waitForFunction(() => window.__result || window.__error, { timeout: 240_000 });
  const result = await page.evaluate(() => window.__result ?? { error: window.__error });
  if (result.error) {
    console.error(name, 'falló:', result.error);
  } else {
    fs.writeFileSync(path.join(outDir, `${name}.webp`), Buffer.from(result.webp.split(',')[1], 'base64'));
    console.log(name, 'ok', result.info);
  }
  await page.close();
}
await browser.close();
