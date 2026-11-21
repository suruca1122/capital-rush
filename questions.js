const { accountGens, massGens, ivaGens } = require('./content');

// Generador de preguntas de matemática financiera con datos aleatorios.
// Convenciones: año comercial de 360 días, 1 año = 12 meses.

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------- Formato numérico español ----------
function fmtNum(x, dec = 2) {
  const neg = x < 0;
  const fixed = Math.abs(x).toFixed(dec);
  let [ent, frac] = fixed.split('.');
  ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '−' : '') + ent + (frac ? ',' + frac : '');
}
const eur = (x) => fmtNum(x, 2) + '\u00a0€';
const pct = (r, dec = 2) => fmtNum(r * 100, dec) + '\u00a0%';
const pctShort = (r) => {
  // muestra el tipo sin decimales sobrantes: 0.035 -> "3,5 %"
  const v = Math.round(r * 100 * 10000) / 10000;
  return String(v).replace('.', ',') + '\u00a0%';
};
const dec = (r) => String(Math.round(r * 1e6) / 1e6).replace('.', ',');

function fmtValue(v, unit) {
  switch (unit) {
    case 'eur': return eur(v);
    case 'pct': return pct(v, 2);
    case 'pct3': return pct(v, 3);
    case 'years': return fmtNum(v, Number.isInteger(Math.round(v * 10) / 10) ? 0 : 1) + '\u00a0años';
    case 'months': return fmtNum(v, Number.isInteger(Math.round(v * 10) / 10) ? 0 : 1) + '\u00a0meses';
    case 'days': return fmtNum(v, 0) + ' días';
    default: return fmtNum(v);
  }
}

// ---------- Tiempo ----------
// Devuelve {n (en años), txt, unit, raw}
function randomTime(allowDays = true) {
  const t = pick(allowDays ? ['y', 'm', 'm', 'd'] : ['y', 'm']);
  if (t === 'y') { const v = rnd(1, 6); return { n: v, txt: v === 1 ? '1 año' : `${v} años`, unit: 'años', raw: v, frac: `${v}` }; }
  if (t === 'm') { const v = pick([3, 4, 5, 6, 8, 9, 10, 15, 18, 20]); return { n: v / 12, txt: `${v} meses`, unit: 'meses', raw: v, frac: `${v}/12` }; }
  const v = pick([30, 45, 60, 75, 90, 120, 135, 150, 180, 210, 240, 270]);
  return { n: v / 360, txt: `${v} días`, unit: 'días', raw: v, frac: `${v}/360` };
}
const capital = () => rnd(4, 120) * 250;            // 1.000 € – 30.000 €
const nominal = () => rnd(10, 300) * 100;           // 1.000 € – 30.000 €
const rate = () => pick([0.02, 0.025, 0.03, 0.035, 0.04, 0.045, 0.05, 0.055, 0.06, 0.065, 0.07, 0.075, 0.08]);

// ---------- Construcción de opciones ----------
function buildOptions(answer, unit, candidates) {
  const ans = fmtValue(answer, unit);
  const seen = new Set([ans]);
  const out = [];
  const tryAdd = (v) => {
    if (out.length >= 3 || !isFinite(v) || v <= 0) return;
    const s = fmtValue(v, unit);
    if (seen.has(s)) return;
    // descartar opciones demasiado parecidas a la correcta (difíciles de distinguir)
    if (Math.abs(v - answer) / Math.abs(answer) < 0.01) return;
    seen.add(s); out.push(s);
  };
  shuffle(candidates).forEach(tryAdd);
  const factors = shuffle([0.9, 1.1, 0.95, 1.05, 0.85, 1.15, 0.8, 1.2, 0.93, 1.07, 1.25, 0.75]);
  for (const f of factors) {
    if (out.length >= 3) break;
    let v = answer * f;
    if (unit === 'days') v = Math.round(v / 5) * 5;
    if (unit === 'months' || unit === 'years') v = Math.round(v);
    tryAdd(v);
  }
  let k = 1;
  while (out.length < 3 && k < 50) { tryAdd(answer + k * (unit === 'eur' ? 37 : 1)); tryAdd(answer - k); k++; }
  const options = shuffle([ans, ...out]);
  return { options, correctIndex: options.indexOf(ans) };
}

const sup = (x) => `<sup>${x}</sup>`;

// =====================================================================
// INTERÉS SIMPLE
// =====================================================================
const simple = [
  // Capital final
  () => {
    const C0 = capital(), i = rate(), t = randomTime();
    const Cn = C0 * (1 + i * t.n);
    return {
      text: `Invertimos <b>${eur(C0)}</b> al <b>${pctShort(i)} anual</b> en régimen de interés simple durante <b>${t.txt}</b>. ¿Qué capital final obtendremos?`,
      answer: Cn, unit: 'eur',
      candidates: [C0 * Math.pow(1 + i, t.n), C0 * i * t.n, C0 * (1 + i * t.n * 360 / 365), C0 * (1 + i * t.raw) > C0 * 3 ? C0 * (1 - i * t.n) : C0 * (1 + i * t.raw)],
      formula: `C<sub>n</sub> = C<sub>0</sub> · (1 + i · n)`,
      steps: `C<sub>n</sub> = ${eur(C0)} · (1 + ${dec(i)} · ${t.frac}) = <b>${eur(Cn)}</b>`,
    };
  },
  // Intereses
  () => {
    const C0 = capital(), i = rate(), t = randomTime();
    const I = C0 * i * t.n;
    return {
      text: `¿Qué <b>intereses</b> genera un capital de <b>${eur(C0)}</b> colocado al <b>${pctShort(i)} anual simple</b> durante <b>${t.txt}</b>?`,
      answer: I, unit: 'eur',
      candidates: [C0 * (Math.pow(1 + i, t.n) - 1), C0 * i, C0 * i * t.n * 360 / 365, I * 2, I / 2],
      formula: `I = C<sub>0</sub> · i · n`,
      steps: `I = ${eur(C0)} · ${dec(i)} · ${t.frac} = <b>${eur(I)}</b>`,
    };
  },
  // Capital inicial
  () => {
    const Cn = capital() + rnd(0, 99), i = rate(), t = randomTime();
    const C0 = Cn / (1 + i * t.n);
    return {
      text: `¿Qué capital debemos invertir hoy al <b>${pctShort(i)} anual simple</b> para disponer de <b>${eur(Cn)}</b> dentro de <b>${t.txt}</b>?`,
      answer: C0, unit: 'eur',
      candidates: [Cn * (1 - i * t.n), Cn / Math.pow(1 + i, t.n), Cn * Math.pow(1 - i, t.n), Cn / (1 + i)],
      formula: `C<sub>0</sub> = C<sub>n</sub> / (1 + i · n)`,
      steps: `C<sub>0</sub> = ${eur(Cn)} / (1 + ${dec(i)} · ${t.frac}) = <b>${eur(C0)}</b>`,
    };
  },
  // Tipo de interés
  () => {
    const C0 = capital(), i = rate(), t = randomTime(false);
    const Cn = Math.round(C0 * (1 + i * t.n) * 100) / 100;
    return {
      text: `Un capital de <b>${eur(C0)}</b> se ha convertido en <b>${eur(Cn)}</b> en <b>${t.txt}</b> (interés simple). ¿A qué <b>tipo de interés anual</b> se invirtió?`,
      answer: i, unit: 'pct', advanced: true,
      candidates: [Math.pow(Cn / C0, 1 / t.n) - 1, (Cn / C0 - 1), (Cn / C0 - 1) / t.raw, i / 2 + 0.01],
      formula: `i = (C<sub>n</sub> / C<sub>0</sub> − 1) / n`,
      steps: `i = (${eur(Cn)} / ${eur(C0)} − 1) / ${t.frac} = <b>${pct(i)}</b>`,
    };
  },
  // Tiempo
  () => {
    const C0 = capital(), i = rate(), m = pick([3, 4, 6, 8, 9, 10, 15, 18, 20, 24, 30]);
    const n = m / 12;
    const Cn = Math.round(C0 * (1 + i * n) * 100) / 100;
    return {
      text: `¿Cuántos <b>meses</b> deben pasar para que <b>${eur(C0)}</b>, al <b>${pctShort(i)} anual simple</b>, se conviertan en <b>${eur(Cn)}</b>?`,
      answer: m, unit: 'months', advanced: true,
      candidates: [Math.log(Cn / C0) / Math.log(1 + i) * 12, m + 2, m - 1, m * 2, m + 6],
      formula: `n = (C<sub>n</sub> / C<sub>0</sub> − 1) / i`,
      steps: `n = (${eur(Cn)} / ${eur(C0)} − 1) / ${dec(i)} = ${fmtNum(n, 4)} años · 12 = <b>${m} meses</b>`,
    };
  },
];

// =====================================================================
// INTERÉS COMPUESTO
// =====================================================================
const compound = [
  // Capital final
  () => {
    const C0 = capital(), i = rate(), n = rnd(2, 10);
    const Cn = C0 * Math.pow(1 + i, n);
    return {
      text: `Depositamos <b>${eur(C0)}</b> al <b>${pctShort(i)} anual compuesto</b> durante <b>${n} años</b>. ¿Cuál será el capital final?`,
      answer: Cn, unit: 'eur',
      candidates: [C0 * (1 + i * n), C0 * Math.pow(1 + i, n - 1), C0 * Math.pow(1 + i, n + 1), Cn - C0],
      formula: `C<sub>n</sub> = C<sub>0</sub> · (1 + i)${sup('n')}`,
      steps: `C<sub>n</sub> = ${eur(C0)} · (1 + ${dec(i)})${sup(n)} = <b>${eur(Cn)}</b>`,
    };
  },
  // Intereses
  () => {
    const C0 = capital(), i = rate(), n = rnd(2, 10);
    const I = C0 * (Math.pow(1 + i, n) - 1);
    return {
      text: `¿Cuántos <b>intereses</b> generan <b>${eur(C0)}</b> al <b>${pctShort(i)} anual</b> en capitalización compuesta durante <b>${n} años</b>?`,
      answer: I, unit: 'eur',
      candidates: [C0 * i * n, C0 * Math.pow(1 + i, n), C0 * (Math.pow(1 + i, n - 1) - 1), C0 * (Math.pow(1 + i, n + 1) - 1)],
      formula: `I = C<sub>0</sub> · [(1 + i)${sup('n')} − 1]`,
      steps: `I = ${eur(C0)} · [(1 + ${dec(i)})${sup(n)} − 1] = <b>${eur(I)}</b>`,
    };
  },
  // Capital inicial
  () => {
    const Cn = capital() + rnd(0, 99), i = rate(), n = rnd(2, 10);
    const C0 = Cn * Math.pow(1 + i, -n);
    return {
      text: `¿Cuánto hay que invertir hoy al <b>${pctShort(i)} anual compuesto</b> para tener <b>${eur(Cn)}</b> dentro de <b>${n} años</b>?`,
      answer: C0, unit: 'eur',
      candidates: [Cn / (1 + i * n), Cn * Math.pow(1 - i, n), Cn * Math.pow(1 + i, -(n - 1)), Cn * (1 - i * n)],
      formula: `C<sub>0</sub> = C<sub>n</sub> · (1 + i)${sup('−n')}`,
      steps: `C<sub>0</sub> = ${eur(Cn)} · (1 + ${dec(i)})${sup('−' + n)} = <b>${eur(C0)}</b>`,
    };
  },
  // Tipo
  () => {
    const C0 = capital(), i = rate(), n = rnd(2, 8);
    const Cn = Math.round(C0 * Math.pow(1 + i, n) * 100) / 100;
    return {
      text: `<b>${eur(C0)}</b> se han convertido en <b>${eur(Cn)}</b> en <b>${n} años</b> a interés compuesto. ¿Cuál fue el <b>tipo de interés anual</b>?`,
      answer: i, unit: 'pct', advanced: true,
      candidates: [(Cn / C0 - 1) / n, Cn / C0 - 1, Math.pow(Cn / C0, 1 / (n + 1)) - 1, Math.pow(Cn / C0, 1 / (n - 1)) - 1],
      formula: `i = (C<sub>n</sub> / C<sub>0</sub>)${sup('1/n')} − 1`,
      steps: `i = (${eur(Cn)} / ${eur(C0)})${sup('1/' + n)} − 1 = <b>${pct(i)}</b>`,
    };
  },
  // Tiempo (logaritmos)
  () => {
    const C0 = capital(), i = rate(), n = rnd(2, 12);
    const Cn = Math.round(C0 * Math.pow(1 + i, n) * 100) / 100;
    return {
      text: `¿Cuántos <b>años</b> tardan <b>${eur(C0)}</b> en convertirse en <b>${eur(Cn)}</b> al <b>${pctShort(i)} anual compuesto</b>?`,
      answer: n, unit: 'years', advanced: true,
      candidates: [(Cn / C0 - 1) / i, n + 1, n - 1, n + 2, n * 2],
      formula: `n = log(C<sub>n</sub> / C<sub>0</sub>) / log(1 + i)`,
      steps: `n = log(${eur(Cn)} / ${eur(C0)}) / log(${fmtNum(1 + i, 3)}) = <b>${n} años</b>`,
    };
  },
  // Capitalización fraccionada
  () => {
    const C0 = capital(), j = pick([0.03, 0.04, 0.05, 0.06, 0.08, 0.09, 0.1, 0.12]);
    const [m, per] = pick([[12, 'mensual'], [4, 'trimestral'], [2, 'semestral']]);
    const n = rnd(1, 5);
    const Cn = C0 * Math.pow(1 + j / m, m * n);
    return {
      text: `Invertimos <b>${eur(C0)}</b> durante <b>${n === 1 ? '1 año' : n + ' años'}</b> a un tipo <b>nominal del ${pctShort(j)}</b> con capitalización <b>${per}</b>. ¿Qué capital final obtenemos?`,
      answer: Cn, unit: 'eur', advanced: true,
      candidates: [C0 * Math.pow(1 + j, n), C0 * Math.pow(1 + j / m, n), C0 * (1 + j * n), C0 * Math.pow(1 + j / m, m * n - 1)],
      formula: `C<sub>n</sub> = C<sub>0</sub> · (1 + j<sub>m</sub>/m)${sup('m·n')}`,
      steps: `C<sub>n</sub> = ${eur(C0)} · (1 + ${dec(j)}/${m})${sup(m * n)} = <b>${eur(Cn)}</b>`,
    };
  },
  // TAE
  () => {
    const j = pick([0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.1, 0.12]);
    const [m, per] = pick([[12, 'mensual'], [4, 'trimestral'], [2, 'semestral']]);
    const tae = Math.pow(1 + j / m, m) - 1;
    return {
      text: `Un banco ofrece un tipo <b>nominal anual del ${pctShort(j)}</b> con capitalización <b>${per}</b>. ¿Cuál es el <b>tipo efectivo anual (TAE)</b>?`,
      answer: tae, unit: 'pct3', advanced: true,
      candidates: [j, j / m, Math.pow(1 + j, 1 / m) - 1, Math.pow(1 + j / m, m - 1) - 1, j * 1.1],
      formula: `i = (1 + j<sub>m</sub>/m)${sup('m')} − 1`,
      steps: `i = (1 + ${dec(j)}/${m})${sup(m)} − 1 = <b>${pct(tae, 3)}</b>`,
    };
  },
  // Tipo equivalente
  () => {
    const i = pick([0.04, 0.05, 0.06, 0.08, 0.09, 0.1, 0.12]);
    const [m, per] = pick([[12, 'mensual'], [4, 'trimestral'], [2, 'semestral']]);
    const im = Math.pow(1 + i, 1 / m) - 1;
    return {
      text: `¿Qué tipo de interés <b>${per}</b> es <b>equivalente</b> a un <b>${pctShort(i)} efectivo anual</b> en capitalización compuesta?`,
      answer: im, unit: 'pct3', advanced: true,
      candidates: [i / m, Math.pow(1 + i, m) - 1, i * m / 10, (Math.pow(1 + i, 1 / m) - 1) * m],
      formula: `i<sub>m</sub> = (1 + i)${sup('1/m')} − 1`,
      steps: `i<sub>${m}</sub> = (1 + ${dec(i)})${sup('1/' + m)} − 1 = <b>${pct(im, 3)}</b>`,
    };
  },
];

// =====================================================================
// DESCUENTO SIMPLE
// =====================================================================
const simpleDiscount = [
  // Comercial: efectivo
  () => {
    const N = nominal(), d = rate(), t = randomTime();
    const E = N * (1 - d * t.n);
    return { dtype: 'c',
      text: `Descontamos una letra de nominal <b>${eur(N)}</b> que vence dentro de <b>${t.txt}</b>, con <b>descuento comercial simple</b> al <b>${pctShort(d)} anual</b>. ¿Qué <b>efectivo</b> recibimos?`,
      answer: E, unit: 'eur',
      candidates: [N / (1 + d * t.n), N * d * t.n, N * Math.pow(1 - d, t.n), N * (1 - d * t.n * 360 / 365)],
      formula: `E = N · (1 − d · n)`,
      steps: `E = ${eur(N)} · (1 − ${dec(d)} · ${t.frac}) = <b>${eur(E)}</b>`,
    };
  },
  // Comercial: descuento
  () => {
    const N = nominal(), d = rate(), t = randomTime();
    const D = N * d * t.n;
    return { dtype: 'c',
      text: `Calcula el <b>descuento comercial simple</b> de un efecto de <b>${eur(N)}</b> que vence en <b>${t.txt}</b>, si el tipo de descuento es del <b>${pctShort(d)} anual</b>.`,
      answer: D, unit: 'eur',
      candidates: [N * d * t.n / (1 + d * t.n), N * (1 - d * t.n), N * d, D * 360 / 365],
      formula: `D<sub>c</sub> = N · d · n`,
      steps: `D<sub>c</sub> = ${eur(N)} · ${dec(d)} · ${t.frac} = <b>${eur(D)}</b>`,
    };
  },
  // Racional: efectivo
  () => {
    const N = nominal(), i = rate(), t = randomTime();
    const E = N / (1 + i * t.n);
    return { dtype: 'r',
      text: `Un pagaré de <b>${eur(N)}</b> vence dentro de <b>${t.txt}</b>. Se descuenta con <b>descuento racional simple</b> al <b>${pctShort(i)} anual</b>. ¿Qué <b>efectivo</b> se obtiene?`,
      answer: E, unit: 'eur',
      candidates: [N * (1 - i * t.n), N * (1 + i * t.n), N * Math.pow(1 + i, -t.n), N - N / (1 + i * t.n)],
      formula: `E = N / (1 + i · n)`,
      steps: `E = ${eur(N)} / (1 + ${dec(i)} · ${t.frac}) = <b>${eur(E)}</b>`,
    };
  },
  // Racional: descuento
  () => {
    const N = nominal(), i = rate(), t = randomTime();
    const D = N * i * t.n / (1 + i * t.n);
    return { dtype: 'r',
      text: `¿Cuál es el <b>descuento racional simple</b> de un efecto de <b>${eur(N)}</b> que vence en <b>${t.txt}</b>, al <b>${pctShort(i)} anual</b>?`,
      answer: D, unit: 'eur',
      candidates: [N * i * t.n, N / (1 + i * t.n), N * i * t.n * (1 + i * t.n), N * (1 - Math.pow(1 + i, -t.n)) * 1.02],
      formula: `D<sub>r</sub> = N · i · n / (1 + i · n)`,
      steps: `D<sub>r</sub> = ${eur(N)} · ${dec(i)} · ${t.frac} / (1 + ${dec(i)} · ${t.frac}) = <b>${eur(D)}</b>`,
    };
  },
  // Comercial: nominal a partir del efectivo
  () => {
    const E = nominal() + rnd(0, 99), d = rate(), t = randomTime();
    const N = E / (1 - d * t.n);
    return { dtype: 'c',
      text: `Al descontar un efecto con <b>descuento comercial simple</b> al <b>${pctShort(d)}</b> y <b>${t.txt}</b> antes de su vencimiento, hemos recibido <b>${eur(E)}</b>. ¿Cuál era su <b>nominal</b>?`,
      answer: N, unit: 'eur', advanced: true,
      candidates: [E * (1 + d * t.n), E / (1 + d * t.n), E * (1 - d * t.n), E / Math.pow(1 - d, t.n) * 1.01],
      formula: `N = E / (1 − d · n)`,
      steps: `N = ${eur(E)} / (1 − ${dec(d)} · ${t.frac}) = <b>${eur(N)}</b>`,
    };
  },
  // Comercial: tipo de descuento
  () => {
    const N = nominal(), d = rate(), t = randomTime();
    const E = Math.round(N * (1 - d * t.n) * 100) / 100;
    return { dtype: 'c',
      text: `Una letra de <b>${eur(N)}</b> que vence en <b>${t.txt}</b> se descuenta (descuento comercial simple) y se reciben <b>${eur(E)}</b>. ¿Cuál es el <b>tipo de descuento anual</b>?`,
      answer: d, unit: 'pct', advanced: true,
      candidates: [(N / E - 1) / t.n, (1 - E / N), (1 - E / N) / t.raw > 0.005 ? (1 - E / N) / t.raw : d + 0.01, d + 0.005],
      formula: `d = (1 − E / N) / n`,
      steps: `d = (1 − ${eur(E)} / ${eur(N)}) / ${t.frac} = <b>${pct(d)}</b>`,
    };
  },
  // Racional: nominal a partir del efectivo
  () => {
    const E = nominal() + rnd(0, 99), i = rate(), t = randomTime();
    const N = E * (1 + i * t.n);
    return { dtype: 'r',
      text: `Al descontar un efecto con <b>descuento racional simple</b> al <b>${pctShort(i)}</b> y <b>${t.txt}</b> antes de su vencimiento, hemos recibido <b>${eur(E)}</b>. ¿Cuál era su <b>nominal</b>?`,
      answer: N, unit: 'eur', advanced: true,
      candidates: [E / (1 - i * t.n), E * (1 - i * t.n), E / (1 + i * t.n), E * Math.pow(1 + i, t.n) * 1.01],
      formula: `N = E · (1 + i · n)`,
      steps: `N = ${eur(E)} · (1 + ${dec(i)} · ${t.frac}) = <b>${eur(N)}</b>`,
    };
  },
  // Racional: tipo de interés
  () => {
    const N = nominal(), i = rate(), t = randomTime();
    const E = Math.round(N / (1 + i * t.n) * 100) / 100;
    return { dtype: 'r',
      text: `Un efecto de <b>${eur(N)}</b> que vence en <b>${t.txt}</b> se descuenta con <b>descuento racional simple</b> y se reciben <b>${eur(E)}</b>. ¿Qué <b>tipo de interés anual</b> se aplicó?`,
      answer: i, unit: 'pct', advanced: true,
      candidates: [(1 - E / N) / t.n, N / E - 1, i + 0.005, i - 0.005 > 0.005 ? i - 0.005 : i + 0.01],
      formula: `i = (N / E − 1) / n`,
      steps: `i = (${eur(N)} / ${eur(E)} − 1) / ${t.frac} = <b>${pct(i)}</b>`,
    };
  },
];

// =====================================================================
// DESCUENTO COMPUESTO
// =====================================================================
const compoundDiscount = [
  // Racional: efectivo
  () => {
    const N = nominal(), i = rate(), n = rnd(2, 8);
    const E = N * Math.pow(1 + i, -n);
    return { dtype: 'r',
      text: `Un efecto de <b>${eur(N)}</b> vence dentro de <b>${n} años</b>. Se descuenta con <b>descuento racional compuesto</b> al <b>${pctShort(i)} anual</b>. ¿Qué <b>efectivo</b> se recibe?`,
      answer: E, unit: 'eur',
      candidates: [N * Math.pow(1 - i, n), N / (1 + i * n), N * (1 - i * n), N * Math.pow(1 + i, -(n - 1))],
      formula: `E = N · (1 + i)${sup('−n')}`,
      steps: `E = ${eur(N)} · (1 + ${dec(i)})${sup('−' + n)} = <b>${eur(E)}</b>`,
    };
  },
  // Racional: descuento
  () => {
    const N = nominal(), i = rate(), n = rnd(2, 8);
    const D = N * (1 - Math.pow(1 + i, -n));
    return { dtype: 'r',
      text: `Calcula el <b>descuento racional compuesto</b> de un capital de <b>${eur(N)}</b> que vence dentro de <b>${n} años</b>, al <b>${pctShort(i)} anual</b>.`,
      answer: D, unit: 'eur',
      candidates: [N * (1 - Math.pow(1 - i, n)), N * i * n, N * Math.pow(1 + i, -n), N * i * n / (1 + i * n)],
      formula: `D = N · [1 − (1 + i)${sup('−n')}]`,
      steps: `D = ${eur(N)} · [1 − (1 + ${dec(i)})${sup('−' + n)}] = <b>${eur(D)}</b>`,
    };
  },
  // Comercial: efectivo
  () => {
    const N = nominal(), d = rate(), n = rnd(2, 8);
    const E = N * Math.pow(1 - d, n);
    return { dtype: 'c',
      text: `Se descuenta un efecto de <b>${eur(N)}</b> que vence en <b>${n} años</b> con <b>descuento comercial compuesto</b> al <b>${pctShort(d)} anual</b>. ¿Qué <b>efectivo</b> se obtiene?`,
      answer: E, unit: 'eur',
      candidates: [N * Math.pow(1 + d, -n), N * (1 - d * n), N * Math.pow(1 - d, n - 1), N * (1 - Math.pow(1 - d, n))],
      formula: `E = N · (1 − d)${sup('n')}`,
      steps: `E = ${eur(N)} · (1 − ${dec(d)})${sup(n)} = <b>${eur(E)}</b>`,
    };
  },
  // Comercial: descuento
  () => {
    const N = nominal(), d = rate(), n = rnd(2, 8);
    const D = N * (1 - Math.pow(1 - d, n));
    return { dtype: 'c',
      text: `¿Cuál es el <b>descuento comercial compuesto</b> de un efecto de <b>${eur(N)}</b> con vencimiento a <b>${n} años</b>, al <b>${pctShort(d)} anual</b>?`,
      answer: D, unit: 'eur',
      candidates: [N * (1 - Math.pow(1 + d, -n)), N * d * n, N * Math.pow(1 - d, n), N * (1 - Math.pow(1 - d, n - 1))],
      formula: `D = N · [1 − (1 − d)${sup('n')}]`,
      steps: `D = ${eur(N)} · [1 − (1 − ${dec(d)})${sup(n)}] = <b>${eur(D)}</b>`,
    };
  },
  // Racional: nominal
  () => {
    const E = nominal() + rnd(0, 99), i = rate(), n = rnd(2, 8);
    const N = E * Math.pow(1 + i, n);
    return { dtype: 'r',
      text: `Descontando un efecto <b>${n} años</b> antes de su vencimiento (<b>descuento racional compuesto</b> al <b>${pctShort(i)}</b>) hemos recibido <b>${eur(E)}</b>. ¿Cuál era el <b>nominal</b>?`,
      answer: N, unit: 'eur', advanced: true,
      candidates: [E * (1 + i * n), E / Math.pow(1 - i, n), E * Math.pow(1 + i, n - 1), E / (1 - i * n)],
      formula: `N = E · (1 + i)${sup('n')}`,
      steps: `N = ${eur(E)} · (1 + ${dec(i)})${sup(n)} = <b>${eur(N)}</b>`,
    };
  },
  // Racional: tipo
  () => {
    const N = nominal(), i = rate(), n = rnd(2, 6);
    const E = Math.round(N * Math.pow(1 + i, -n) * 100) / 100;
    return { dtype: 'r',
      text: `Un efecto de <b>${eur(N)}</b> que vence dentro de <b>${n} años</b> se descuenta (<b>racional compuesto</b>) y se reciben <b>${eur(E)}</b>. ¿Qué <b>tipo de interés anual</b> se aplicó?`,
      answer: i, unit: 'pct', advanced: true,
      candidates: [(N / E - 1) / n, 1 - Math.pow(E / N, 1 / n), N / E - 1, Math.pow(N / E, 1 / (n + 1)) - 1],
      formula: `i = (N / E)${sup('1/n')} − 1`,
      steps: `i = (${eur(N)} / ${eur(E)})${sup('1/' + n)} − 1 = <b>${pct(i)}</b>`,
    };
  },
  // Comercial: nominal
  () => {
    const E = nominal() + rnd(0, 99), d = rate(), n = rnd(2, 8);
    const N = E / Math.pow(1 - d, n);
    return { dtype: 'c',
      text: `Descontando un efecto <b>${n} años</b> antes de su vencimiento (<b>descuento comercial compuesto</b> al <b>${pctShort(d)}</b>) hemos recibido <b>${eur(E)}</b>. ¿Cuál era el <b>nominal</b>?`,
      answer: N, unit: 'eur', advanced: true,
      candidates: [E * Math.pow(1 + d, n), E / (1 - d * n), E / Math.pow(1 - d, n - 1), E * (1 + d * n)],
      formula: `N = E / (1 − d)${sup('n')}`,
      steps: `N = ${eur(E)} / (1 − ${dec(d)})${sup(n)} = <b>${eur(N)}</b>`,
    };
  },
  // Comercial: tipo de descuento
  () => {
    const N = nominal(), d = rate(), n = rnd(2, 6);
    const E = Math.round(N * Math.pow(1 - d, n) * 100) / 100;
    return { dtype: 'c',
      text: `Un efecto de <b>${eur(N)}</b> que vence dentro de <b>${n} años</b> se descuenta (<b>comercial compuesto</b>) y se reciben <b>${eur(E)}</b>. ¿Cuál es el <b>tipo de descuento anual</b>?`,
      answer: d, unit: 'pct', advanced: true,
      candidates: [Math.pow(N / E, 1 / n) - 1, (1 - E / N) / n, 1 - E / N, 1 - Math.pow(E / N, 1 / (n + 1))],
      formula: `d = 1 − (E / N)${sup('1/n')}`,
      steps: `d = 1 − (${eur(E)} / ${eur(N)})${sup('1/' + n)} = <b>${pct(d)}</b>`,
    };
  },
];

const TOPICS = {
  simple: { name: 'Interés simple', icon: '📈', color: '#00e5ff', gens: simple },
  compound: { name: 'Interés compuesto', icon: '🚀', color: '#ff2bd6', gens: compound },
  sdiscount: { name: 'Descuento simple', icon: '✂️', color: '#ffd400', gens: simpleDiscount },
  cdiscount: { name: 'Descuento compuesto', icon: '💎', color: '#39ff88', gens: compoundDiscount },
  pgc: { name: 'Cuentas del PGC Pymes', icon: '📒', color: '#ff9f1c', gens: accountGens, group: 'cont' },
  masses: { name: 'Masas patrimoniales', icon: '⚖️', color: '#b388ff', gens: massGens, group: 'cont' },
  iva: { name: 'Operaciones de IVA', icon: '🧾', color: '#ff5d73', gens: ivaGens, group: 'cont' },
};

// Probamos cada generador una vez para saber cuáles son "avanzados"
for (const t of Object.values(TOPICS)) {
  t.gens = t.gens.map((g) => { const s = g(new Set()); return { g, advanced: !!s.advanced, dtype: s.dtype || null }; });
  t.group = t.group || 'fin';
}

// discountTypes: { sdiscount: 'both'|'commercial'|'rational', cdiscount: ... }
function generateQuestion(topics, difficulty = 'mix', avoid = [], used = new Set(), discountTypes = {}) {
  const keys = topics && topics.length ? topics : Object.keys(TOPICS);
  for (let tries = 0; tries < 30; tries++) {
    const key = pick(keys);
    const topic = TOPICS[key];
    let pool = topic.gens;
    // descuento: solo comercial ('c'), solo racional ('r') o ambos
    const dt = discountTypes[key] || 'both';
    if (dt === 'commercial') pool = pool.filter((x) => !x.dtype || x.dtype === 'c');
    else if (dt === 'rational') pool = pool.filter((x) => !x.dtype || x.dtype === 'r');
    const adv = pool.filter((x) => x.advanced), basic = pool.filter((x) => !x.advanced);
    if (difficulty === 'basic' && basic.length) pool = basic;
    else if (difficulty === 'advanced' && adv.length) pool = adv.concat(basic.slice(0, 1));
    const idx = Math.floor(Math.random() * pool.length);
    const sig = key + ':' + topic.gens.indexOf(pool[idx]);
    // en los temas numéricos evitamos repetir el mismo tipo de pregunta seguido
    if (topic.group === 'fin' && avoid.includes(sig) && tries < 25) continue;
    const q = pool[idx].g(used);
    let options = q.options, correctIndex = q.correctIndex;
    if (!options) ({ options, correctIndex } = buildOptions(q.answer, q.unit, q.candidates));
    return {
      sig,
      topic: key, topicName: topic.name, topicIcon: topic.icon, topicColor: topic.color, group: topic.group,
      text: q.text, options, correctIndex,
      formula: q.formula, steps: q.steps,
    };
  }
}

module.exports = { generateQuestion, TOPICS };
