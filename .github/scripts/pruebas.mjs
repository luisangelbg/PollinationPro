// PollinationPro — corre en un navegador sin ventana las pruebas (tests/index.html) y la validación contra R
// (validation/index.html) y falla si alguna no pasa. No usa ningún paquete: solo Node (22 o posterior, por su
// WebSocket integrado) y el navegador Chrome que ya trae el equipo.
//   node .github/scripts/pruebas.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const chrome = process.env.CHROME || 'google-chrome';
const port = 9333;
const raiz = resolve(process.cwd());
const perfil = mkdtempSync(join(tmpdir(), 'pollinationpro-'));
const espera = ms => new Promise(r => setTimeout(r, ms));

const navegador = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
  `--remote-debugging-port=${port}`, `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' });

async function pagina() {
  for (let i = 0; i < 150; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const p = lista.find(t => t.type === 'page');
      if (p) return p;
    } catch { /* el navegador aún no abre el puerto */ }
    await espera(200);
  }
  throw new Error('el navegador no respondió');
}

function protocolo(ws) {
  let id = 0;
  const pendientes = new Map();
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pendientes.has(m.id)) { pendientes.get(m.id)(m); pendientes.delete(m.id); }
  });
  return (method, params = {}) => new Promise(res => { const i = ++id; pendientes.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
}

/* abre una página del repositorio y espera a que deje su resultado en una variable global */
async function correr(cdp, archivo, variable, minutos) {
  await cdp('Page.navigate', { url: pathToFileURL(join(raiz, archivo)).href });
  const expresion = `(async () => { for (let i = 0; i < ${minutos * 240} && !window.${variable}; i++) await new Promise(r => setTimeout(r, 250));
    const fallas = [...document.querySelectorAll('.t.bad')].map(n => n.textContent).slice(0, 40);
    return JSON.stringify({ r: window.${variable} || null, fallas }); })()`;
  const res = await cdp('Runtime.evaluate', { expression: expresion, awaitPromise: true, returnByValue: true });
  if (res.result && res.result.exceptionDetails) throw new Error(archivo + ': ' + JSON.stringify(res.result.exceptionDetails).slice(0, 600));
  return JSON.parse(res.result.result.value);
}

let codigo = 0;
const resumen = [];
try {
  const p = await pagina();
  const ws = new WebSocket(p.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', () => rej(new Error('no se pudo conectar con el navegador'))); });
  const cdp = protocolo(ws);
  await cdp('Page.enable');

  const t = await correr(cdp, 'tests/index.html', 'TEST_RESULT', 5);
  if (!t.r) { codigo = 1; resumen.push('Pruebas: no terminaron'); }
  else {
    resumen.push(`Pruebas: ${t.r.pass} correctas, ${t.r.fail} fallidas`);
    if (t.r.fail > 0 || t.r.pass === 0) { codigo = 1; t.fallas.forEach(f => resumen.push('  ' + f)); }
  }

  const v = await correr(cdp, 'validation/index.html', 'VAL_RESULT', 10);
  if (!v.r) { codigo = 1; resumen.push('Validación contra R: no terminó'); }
  else {
    resumen.push(`Validación contra R: ${v.r.total} comparaciones, ${v.r.bad} en desacuerdo`);
    if (v.r.bad > 0 || v.r.total === 0) { codigo = 1; resumen.push(String(v.r.text).split('Desacuerdos')[1] || ''); }
  }
  ws.close();
} catch (e) {
  codigo = 1;
  resumen.push('Error: ' + (e && e.message || e));
} finally {
  navegador.kill();
}

console.log(resumen.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### PollinationPro\n\n' + resumen.map(l => '- ' + l).join('\n') + '\n');
process.exit(codigo);
