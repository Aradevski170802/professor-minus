/* Генератор на задачите. Всичко зависи от името на отбора:
   един и същ отбор винаги получава същите числа, различните отбори — различни. */
const G = (() => {
  const MINUS = '−';
  const r6 = v => Math.round(v * 1e6) / 1e6;
  const dec = v => { for (let k = 0; k < 7; k++) { const s = r6(v * 10 ** k); if (Math.abs(s - Math.round(s)) < 1e-9) return k; } return 9; };
  const fmt = v => { v = r6(v); return (v < 0 ? MINUS : '') + String(Math.abs(v)).replace('.', ','); };
  const op = v => (v < 0 ? `(${fmt(v)})` : fmt(v));
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  function frac(n, d) {
    const g = gcd(n, d); n /= g; d /= g; if (d < 0) { n = -n; d = -d; }
    if (d === 1) return fmt(n);
    return `${n < 0 ? MINUS : ''}<span class="fr"><span>${Math.abs(n)}</span><span>${d}</span></span>`;
  }
  const fracOp = (n, d) => (n * d < 0 ? `(${frac(n, d)})` : frac(n, d));

  // Приема "−2,5", "-2.5", "-5/2", "(−3)"
  function parse(str) {
    let s = String(str || '').trim().replace(/[−–—]/g, '-').replace(/\s+/g, '').replace(/,/g, '.');
    const m = s.match(/^\((.*)\)$/); if (m) s = m[1];
    if (/^[-+]?\d+(\.\d+)?\/[-+]?\d+(\.\d+)?$/.test(s)) { const [a, b] = s.split('/').map(Number); return b === 0 ? NaN : a / b; }
    if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return Number(s);
    return NaN;
  }
  const same = (a, b) => Number.isFinite(a) && Math.abs(a - b) < 1e-6;

  function hash(s) { let h = 2166136261 >>> 0; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const ALPH = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЮЯ'.split('');
  const WORDS = ['ЧАСТНО', 'МИНУС', 'ДРОБИ', 'ЗНАЦИ', 'ДЕЛИМО', 'ПРОБА', 'КОРЕН'];

  function make(team) {
    const R = mulberry(hash((team || 'отбор').trim().toLowerCase()));
    const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
    const pick = a => a[Math.floor(R() * a.length)];
    const sg = () => (R() < 0.5 ? -1 : 1);
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

    // 1. Електрическото табло: знакът на резултата (+, − или 0)
    function signs() {
      const pool = [2, 3, 4, 5, 6, 7, 8, 9, 0.5, 1.5, 2.5, 0.2, 1.2, 0.4];
      for (;;) {
        const zeroAt = ri(0, 5), lamps = [];
        for (let i = 0; i < 6; i++) {
          const k = ri(2, 4), nums = [], ops = [];
          for (let j = 0; j < k; j++) { nums.push(sg() * pick(pool)); if (j) ops.push(R() < 0.55 ? '·' : ':'); }
          if (i === zeroAt) { const c = [0]; for (let j = 1; j < k; j++) if (ops[j - 1] === '·') c.push(j); nums[pick(c)] = 0; }
          const neg = nums.filter(n => n < 0).length;
          const ans = nums.includes(0) ? '0' : (neg % 2 ? '−' : '+');
          let html = op(nums[0]); for (let j = 1; j < k; j++) html += ` ${ops[j - 1]} ${op(nums[j])}`;
          lamps.push({ html, ans, neg });
        }
        const minus = lamps.filter(l => l.ans === '−').length;
        if (minus >= 1 && minus <= 4 && lamps.some(l => l.ans === '+')) return { lamps, digit: minus };
      }
    }

    // израз със стойност t (цяло число, различно от 0)
    function expr(t) {
      const ds = []; for (let d = 2; d < Math.abs(t); d++) if (t % d === 0) ds.push(d);
      const types = ds.length ? ['mul', 'mul3', 'div', 'dmul', 'ddiv'] : ['div', 'dmul', 'ddiv'];
      const ty = pick(types);
      if (ty === 'mul') { const a = sg() * pick(ds); return `${op(a)} · ${op(t / a)}`; }
      if (ty === 'mul3') { const a = sg() * pick(ds); return `${op(-1)} · ${op(-a)} · ${op(t / a)}`; }
      if (ty === 'div') { const m = sg() * ri(2, 6); return `${op(t * m)} : ${op(m)}`; }
      if (ty === 'dmul') { const a = pick([0.5, -0.5, 0.25, -0.25, 0.2, -0.2]); return `${op(a)} · ${op(r6(t / a))}`; }
      const b = pick([0.5, -0.5, 0.2, -0.2, 0.4, -0.4]); return `${op(r6(t * b))} : ${op(b)}`;
    }

    // 2. Шифърът в книгата
    function cipher() {
      const word = pick(WORDS);
      const vals = shuffle([...Array(41)].map((_, i) => i - 20).filter(v => v)).slice(0, ALPH.length);
      const map = {}; ALPH.forEach((L, i) => (map[L] = vals[i]));
      const table = ALPH.map(L => ({ L, v: map[L] })).sort((a, b) => a.v - b.v);
      const items = word.split('').map(L => ({ L, v: map[L], html: expr(map[L]) }));
      return { word, table, items };
    }

    // 3. Машината: търси се входното число
    function machine() {
      for (;;) {
        const x = sg() * ri(2, 9); let v = x, ok = true; const steps = [], vals = [x];
        for (let i = 0; i < 3; i++) {
          const o = R() < 0.5 ? '·' : ':';
          const k = o === '·' ? sg() * pick([2, 3, 4, 5, 1.5, 0.5]) : sg() * pick([2, 4, 5, 0.5, 0.2, 0.25]);
          v = r6(o === '·' ? v * k : v / k);
          if (dec(v) > 2 || Math.abs(v) > 300) { ok = false; break; }
          steps.push({ o, k }); vals.push(v);
        }
        if (ok && steps.some(s => s.o === '·') && steps.some(s => s.o === ':')) return { x, steps, vals, y: v, digit: Math.abs(x) };
      }
    }

    // 4. Колбите: неизвестен множител, делимо, делител и двустъпково уравнение
    function flasks() {
      const out = [];
      { const a = sg() * ri(2, 9), x = sg() * pick([2, 3, 4, 5, 6, 7, 8, 9, 0.5, 1.5, 2.5]); out.push({ kind: 'неизвестен множител', html: `${op(a)} · x = ${fmt(r6(a * x))}`, x }); }
      { const a = sg() * pick([2, 3, 4, 5, 0.5, 0.2]), b = sg() * pick([2, 3, 4, 5, 6, 1.5, 2.5]); out.push({ kind: 'неизвестно делимо', html: `x : ${op(a)} = ${fmt(b)}`, x: r6(a * b) }); }
      { const x = sg() * pick([2, 3, 4, 5, 6, 0.5, 1.5]), b = sg() * ri(2, 9); out.push({ kind: 'неизвестен делител', html: `${fmt(r6(x * b))} : x = ${fmt(b)}`, x }); }
      { const c = sg() * ri(2, 6), x = sg() * ri(1, 9), d = sg() * ri(2, 15), e = c * x + d;
        out.push({ kind: 'две стъпки', html: `${op(c)} · x ${d < 0 ? MINUS : '+'} ${Math.abs(d)} = ${fmt(e)}`, x, c, d, e }); }
      return { list: out, digit: Math.abs(out[3].x) };
    }

    // 5. Скритият под портрета израз (UV светлина)
    function uv() {
      const d = ri(2, 9);
      for (;;) {
        const b = sg() * pick([2, 3, 4, 5, 6, 0.5, 2.5, 1.5]), c = sg() * pick([2, 3, 4, 5, 0.5, 0.4, 1.5, 1.2]);
        const a = r6((d * c) / b), negs = (a < 0) + (b < 0) + (c < 0);
        if (a && dec(a) <= 1 && Math.abs(a) <= 60 && Math.abs(a) !== 1 && negs === 2)
          return { d, a, b, c, html: `${op(a)} · ${op(b)} : ${op(c)}` };
      }
    }

    // 6. Кабелите на изхода: израз ↔ стойност
    function wires() {
      for (;;) {
        const P = [];
        { const [p, q] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 7], [5, 6], [3, 7], [5, 8]]); const s = sg();
          P.push({ l: `реципрочното на ${frac(s * p, q)}`, r: frac(s * q, p), v: (s * q) / p }); }
        { const a = ri(2, 9), b = ri(2, 9); P.push({ l: `${op(-a)} · ${op(-b)}`, r: fmt(a * b), v: a * b }); }
        { const res = sg() * ri(2, 9), b = sg() * pick([1.2, 0.6, 0.8, 2.5, 1.5]); P.push({ l: `${op(r6(res * b))} : ${op(b)}`, r: fmt(res), v: res }); }
        { let n1, d1, n2, d2, n, d;
          do { n1 = ri(1, 5); d1 = ri(2, 7); n2 = ri(1, 7); d2 = ri(2, 9); n = n1 * n2; d = d1 * d2; const g = gcd(n, d); n /= g; d /= g; }
          while (gcd(n1, d1) !== 1 || gcd(n2, d2) !== 1 || d > 12 || d === 1 || n1 === d1 || n2 === d2);
          const s1 = sg(), s2 = sg();
          P.push({ l: `${fracOp(s1 * n1, d1)} · ${fracOp(s2 * n2, d2)}`, r: frac(s1 * s2 * n, d), v: (s1 * s2 * n) / d }); }
        { P.push({ l: `0 : ${op(-ri(2, 9))}`, r: '0', v: 0 }); }
        { const c = ri(3, 6); P.push({ l: Array(c).fill(op(-1)).join(' · '), r: fmt(c % 2 ? -1 : 1), v: c % 2 ? -1 : 1 }); }
        const vs = P.map(p => p.v);
        if (vs.every((v, i) => vs.findIndex(w => Math.abs(w - v) < 1e-9) === i)) {
          const left = shuffle(P.map((_, i) => i)), right = shuffle(P.map((_, i) => i));
          return { pairs: P, left, right };
        }
      }
    }

    const s = signs(), c = cipher(), m = machine(), f = flasks(), u = uv(), w = wires();
    return { signs: s, cipher: c, machine: m, flasks: f, uv: u, wires: w, code: `${s.digit}${m.digit}${f.digit}${u.d}` };
  }

  return { make, parse, same, fmt, op, frac, r6 };
})();
