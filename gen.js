/* Числа и задачи. Точна аритметика с обикновени дроби.
   Всичко зависи от името на отбора: един отбор винаги получава същите числа. */
const G = (() => {
  const MINUS = '−';
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  class Q {
    constructor(n, d = 1) { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); this.n = n / g; this.d = d / g; }
    mul(o) { return new Q(this.n * o.n, this.d * o.d); }
    div(o) { return new Q(this.n * o.d, this.d * o.n); }
    add(o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
    neg() { return new Q(-this.n, this.d); }
    inv() { return new Q(this.d, this.n); }
    eq(o) { return !!o && this.n === o.n && this.d === o.d; }
    get v() { return this.n / this.d; }
  }
  const q = (n, d = 1) => new Q(n, d);
  const term = d => { while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
  const decs = d => { let k = 0, p = 1; while (p % d) { p *= 10; k++; } return k; };
  const N = (x, s) => ({ q: x, s: s || (x.d === 1 ? 'i' : term(x.d) && decs(x.d) <= 2 ? 'd' : 'f') });

  function decStr(x) {
    const k = decs(x.d), val = Math.abs(x.n) * (10 ** k) / x.d, s = String(val).padStart(k + 1, '0');
    return k ? s.slice(0, -k) + ',' + s.slice(-k) : s;
  }
  const fr = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
  function show(m) {
    const x = m.q, sg = x.n < 0 ? MINUS : '', a = Math.abs(x.n);
    if (x.d === 1) return sg + a;
    if (m.s === 'd' && term(x.d)) return sg + decStr(x);
    if (m.s === 'm' && a > x.d) return sg + Math.floor(a / x.d) + fr(a % x.d, x.d);
    return sg + fr(a, x.d);
  }
  const opnd = m => (m.q.n < 0 ? `(${show(m)})` : show(m));
  const val = x => show(N(x));                         // стойност в най-естествения вид
  const plain = x => x.d === 1 ? (x.n < 0 ? MINUS : '') + Math.abs(x.n)
    : (x.n < 0 ? MINUS : '') + (term(x.d) && decs(x.d) <= 3 ? decStr(x) : `${Math.abs(x.n)}/${x.d}`);

  // Приема: −2,5  -2.5  -5/2  −2 1/2  (−3)
  function parse(str) {
    let s = String(str || '').trim().replace(/[−–—]/g, '-').replace(/\s+/g, ' ').replace(/,/g, '.'), m;
    if ((m = s.match(/^\((.*)\)$/))) s = m[1].trim();
    let sign = 1; if (s[0] === '-') { sign = -1; s = s.slice(1).trim(); } else if (s[0] === '+') s = s.slice(1).trim();
    if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/))) return +m[3] ? q(sign * (+m[1] * +m[3] + +m[2]), +m[3]) : null;
    if ((m = s.match(/^(\d+)\/(\d+)$/))) return +m[2] ? q(sign * +m[1], +m[2]) : null;
    if ((m = s.match(/^(\d*)\.?(\d*)$/)) && (m[1] || m[2])) return q(sign * +(m[1] + m[2]), 10 ** m[2].length);
    return null;
  }
  const same = (a, b) => !!a && !!b && a.eq(b);

  function hash(s) { let h = 2166136261 >>> 0; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const POOL = [[2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [8, 1], [9, 1], [12, 1],
    [1, 2, 'd'], [1, 4, 'd'], [1, 5, 'd'], [2, 5, 'd'], [3, 5, 'd'], [4, 5, 'd'], [6, 5, 'd'], [3, 2, 'd'], [5, 2, 'd'], [3, 4, 'd'], [5, 4, 'd'],
    [1, 2, 'f'], [1, 3, 'f'], [2, 3, 'f'], [3, 4, 'f'], [1, 4, 'f'], [2, 5, 'f'], [3, 5, 'f'], [5, 6, 'f'], [3, 2, 'f'], [4, 3, 'f'], [5, 4, 'f'], [5, 3, 'f'],
    [3, 2, 'm'], [5, 2, 'm'], [7, 3, 'm'], [5, 4, 'm'], [5, 3, 'm']];
  const ALPH = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ'.split('');
  const WORDS = ['РЕАКТОР', 'ДЕЛИТЕЛ', 'ЧАСТНО', 'ОБРАТНО', 'ДЕЛИМО', 'МОДУЛ', 'ЗНАЦИ', 'ДРОБИ', 'ЕНЕРГИЯ', 'ФОРМУЛА'];

  function make(team) {
    const R = mulberry(hash((team || 'отбор').trim().toLowerCase()));
    const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
    const pick = a => a[Math.floor(R() * a.length)];
    const sg = () => (R() < 0.5 ? -1 : 1);
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const rnum = (nonInt) => { let p; do p = pick(POOL); while (nonInt && p[1] === 1); return N(q(sg() * p[0], p[1]), p[2]); };
    const okVal = (x, lim = 20) => x.n !== 0 && (x.d === 1 ? Math.abs(x.n) <= lim * 2 : term(x.d) ? decs(x.d) <= 2 && Math.abs(x.v) <= lim : x.d <= 6 && Math.abs(x.n) <= lim);

    /* 1. Бушоните: 6 израза и 9 бушона-стойности (3 са капани със сгрешен знак) */
    function fuses() {
      const forms = [
        (a, b, c) => [a.q.mul(b.q).div(c.q), `${opnd(a)} · ${opnd(b)} : ${opnd(c)}`],
        (a, b, c) => [a.q.div(b.q).mul(c.q), `${opnd(a)} : ${opnd(b)} · ${opnd(c)}`],
        (a, b, c) => [a.q.div(b.q.mul(c.q)), `${opnd(a)} : [${opnd(b)} · ${opnd(c)}]`],
        (a, b, c) => [a.q.mul(b.q).mul(c.q), `${opnd(a)} · ${opnd(b)} · ${opnd(c)}`]];
      for (;;) {
        const slots = [];
        for (let t = 0; slots.length < 6 && t < 4000; t++) {
          const a = rnum(), b = rnum(R() < 0.6), c = rnum();
          if (![a, b, c].some(x => x.q.d > 1) || ![a, b, c].some(x => x.q.n < 0)) continue;
          const [v, html] = pick(forms)(a, b, c);
          if (!okVal(v, 15) || v.d > 5 || slots.some(s => s.v.eq(v) || s.v.eq(v.neg()))) continue;
          slots.push({ v, html });
        }
        if (slots.length < 6) continue;
        const tiles = slots.map((s, i) => ({ v: s.v, ok: i }));
        shuffle([0, 1, 2, 3, 4, 5]).slice(0, 3).forEach(i => tiles.push({ v: slots[i].v.neg(), ok: -1 }));
        return { slots, tiles: shuffle(tiles).map((t, id) => ({ ...t, id, html: val(t.v) })) };
      }
    }

    /* 2. Дъската → комбинацията на сейфа (три цели числа от −20 до 19) */
    function safe() {
      for (;;) {
        const xs = [sg() * ri(2, 19), sg() * ri(2, 19), sg() * ri(2, 19)].map(v => Math.max(-20, Math.min(19, v)));
        if (new Set(xs).size < 3) continue;
        const a1 = rnum(true), b1 = q(xs[0]).mul(a1.q);
        const a2 = rnum(true), b2 = q(xs[1]).div(a2.q);
        let e3;
        if (R() < 0.5) { const a = rnum(true), b = sg() * ri(2, 15), c = q(xs[2]).mul(a.q).add(q(b)); if (!okVal(c, 40)) continue;
          e3 = { html: `${opnd(a)} · x ${b < 0 ? MINUS : '+'} ${Math.abs(b)} = ${val(c)}`, a, b, c, kind: 'lin' }; }
        else { const a = rnum(true), b = rnum(), c = q(xs[2]).div(a.q).mul(b.q); if (!okVal(c, 40)) continue;
          e3 = { html: `x : ${opnd(a)} · ${opnd(b)} = ${val(c)}`, a, b, c, kind: 'chain' }; }
        if (!okVal(b1, 40) || !okVal(b2, 40)) continue;
        return { xs, eqs: [{ html: `${opnd(a1)} · x = ${val(b1)}` }, { html: `x : ${opnd(a2)} = ${val(b2)}` }, e3] };
      }
    }

    /* 3. Шифърът в дневника → криптекса */
    function exprFor(t) {
      for (;;) {
        const b = rnum(), c = rnum(), f = R() < 0.5;
        const a = f ? q(t).mul(c.q).div(b.q) : q(t).mul(b.q).div(c.q);
        if (a.n === 0 || !(a.d === 1 ? Math.abs(a.n) <= 60 : term(a.d) ? decs(a.d) <= 1 && Math.abs(a.v) <= 40 : a.d <= 6 && Math.abs(a.n) <= 30)) continue;
        if (a.d === 1 && b.q.d === 1 && c.q.d === 1) continue;
        const A = N(a);
        return f ? `${opnd(A)} · ${opnd(b)} : ${opnd(c)}` : `${opnd(A)} : ${opnd(b)} · ${opnd(c)}`;
      }
    }
    function cipher() {
      const word = pick(WORDS);
      const vals = shuffle([...Array(61)].map((_, i) => i - 30).filter(v => v)).slice(0, ALPH.length);
      const map = {}; ALPH.forEach((L, i) => (map[L] = vals[i]));
      return { word, table: ALPH.map(L => ({ L, v: map[L] })).sort((a, b) => a.v - b.v), items: word.split('').map(L => ({ L, v: map[L], html: exprFor(map[L]) })) };
    }

    /* 4. Машината в терминала: 4 стъпки, търси се входът A */
    function machine() {
      for (;;) {
        const x = sg() * ri(2, 12); let v = q(x), ok = true; const steps = [], vals = [v], first = R() < 0.5;
        for (let i = 0; i < 4; i++) {
          const o = (i % 2 === 0) === first ? '·' : ':', k = rnum(i % 2 === 1);
          v = o === '·' ? v.mul(k.q) : v.div(k.q);
          if (v.d > 12 || Math.abs(v.n) > 240) { ok = false; break; }
          steps.push({ o, k, html: `${o} ${opnd(k)}` }); vals.push(v);
        }
        if (ok && okVal(v, 40)) return { x, steps, vals, y: v };
      }
    }

    /* 5. Колбите: четири уравнения; C = произведението на четирите неизвестни */
    function flasks() {
      for (;;) {
        const xs = [q(sg() * ri(2, 6)), q(sg() * pick([1, 3, 5, 1, 3]), pick([2, 4, 3])), q(sg() * ri(2, 6)), q(sg() * ri(2, 8))];
        const C = xs.reduce((p, x) => p.mul(x));
        if (xs[1].d === 1 || C.d !== 1 || Math.abs(C.n) > 72 || Math.abs(C.n) < 2) continue;
        const a1 = N(q(sg() * pick([2, 3, 4, 6, 8, 12, 15]), 10), 'd'), b1 = a1.q.mul(xs[0]);
        const a2 = rnum(true), b2 = xs[1].div(a2.q);
        const b3 = rnum(true), a3 = xs[2].mul(b3.q);
        const a4 = rnum(true), d4 = sg() * ri(2, 12), c4 = a4.q.mul(xs[3]).add(q(d4));
        if (![b1, b2, a3, c4].every(x => okVal(x, 30))) continue;
        return { C, xs, list: [
          { kind: 'Неизвестен множител', html: `${opnd(a1)} · x = ${val(b1)}` },
          { kind: 'Неизвестно делимо', html: `x : ${opnd(a2)} = ${val(b2)}` },
          { kind: 'Неизвестен делител', html: `${val(a3)} : x = ${show(b3)}` },
          { kind: 'Две стъпки', html: `${opnd(a4)} · x ${d4 < 0 ? MINUS : '+'} ${Math.abs(d4)} = ${val(c4)}`, a: a4, d: d4, c: c4 }] };
      }
    }

    /* 6. UV стената: път през мрежа 5×4 с произведение T; B е последното число по пътя */
    function grid(A, C) {
      const GP = [[1, 2, 'd'], [2, 1], [3, 1], [4, 1], [3, 2, 'f'], [2, 3, 'f'], [1, 1], [5, 1], [1, 3, 'f'], [3, 4, 'f'], [4, 3, 'f'], [5, 2, 'd'], [6, 1]];
      const cand = [];
      for (const p of GP) for (const s of [-1, 1]) { const b = q(s * p[0], p[1]), K = q(A).mul(b).div(C); if (K.d === 1 && Math.abs(K.n) >= 2 && Math.abs(K.n) <= 99 && !b.eq(C) && !b.eq(C.neg())) cand.push(N(b, p[2])); }
      if (!cand.length) return null;
      for (let t = 0; t < 3000; t++) {
        const cells = [...Array(5)].map(() => [...Array(4)].map(() => { const p = pick(GP); return N(q(sg() * p[0], p[1]), p[2]); }));
        const path = [ri(0, 3)]; for (let r = 1; r < 5; r++) path.push(Math.max(0, Math.min(3, path[r - 1] + ri(-1, 1))));
        cells[4][path[4]] = pick(cand);
        const T = path.reduce((p, c, r) => p.mul(cells[r][c].q), q(1));
        if (T.d !== 1 || Math.abs(T.n) > 60) continue;
        const B = cells[4][path[4]].q, K = q(A).mul(B).div(C);
        if (B.eq(C) || B.eq(C.neg())) continue;
        if (K.d !== 1 || Math.abs(K.n) < 2 || Math.abs(K.n) > 99) continue;
        let hits = 0;
        const walk = (r, c, p) => { p = p.mul(cells[r][c].q); if (r === 4) { if (p.eq(T)) hits++; return; } for (const dc of [-1, 0, 1]) { const n = c + dc; if (n >= 0 && n < 4) walk(r + 1, n, p); } };
        for (let c = 0; c < 4; c++) walk(0, c, q(1));
        if (hits === 1) return { cells, path, T, B, K };
      }
      return null;
    }

    /* 7. Лазерната защита: 7 израза ↔ 7 стойности */
    function wires() {
      for (;;) {
        const P = [];
        { const w = ri(1, 3), [n, d] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5]]), s = sg(), m = q(s * (w * d + n), d);
          P.push({ l: `реципрочното на ${show(N(m, 'm'))}`, v: m.inv() }); }
        { const a = rnum(true), b = rnum(true); P.push({ l: `${opnd(a)} : ${opnd(b)}`, v: a.q.div(b.q) }); }
        { const a = N(q(sg() * pick([2, 4, 6, 8, 12, 15, 25]), 10), 'd'), b = N(q(sg() * ri(1, 8), pick([3, 7, 9])), 'f'); if (b.q.d === 1) continue; P.push({ l: `${opnd(a)} · ${opnd(b)}`, v: a.q.mul(b.q) }); }
        { const bs = pick([[-2, 1], [-1, 2], [-3, 1], [-1, 3]]), n = ri(3, 4), b = N(q(bs[0], bs[1]), 'f'); P.push({ l: Array(n).fill(opnd(b)).join(' · '), v: [...Array(n)].reduce(p => p.mul(b.q), q(1)) }); }
        { P.push({ l: `0 : ${opnd(N(q(-ri(11, 49), 10), 'd'))}`, v: q(0) }); }
        { const a = rnum(), b = rnum(true), c = rnum(); P.push({ l: `${opnd(a)} : ${opnd(b)} · ${opnd(c)}`, v: a.q.div(b.q).mul(c.q) }); }
        { const x = N(q(sg() * pick([1, 1, 3]), pick([4, 5, 2, 8])), 'd'); P.push({ l: `реципрочното на ${show(x)}`, v: x.q.inv() }); }
        if (P.some(p => p.v.n !== 0 && !(Math.abs(p.v.n) <= 30 && p.v.d <= 12))) continue;
        if (P.some((p, i) => P.findIndex(o => o.v.eq(p.v)) !== i)) continue;
        P.forEach(p => (p.r = val(p.v)));
        return { pairs: P, left: shuffle(P.map((_, i) => i)), right: shuffle(P.map((_, i) => i)) };
      }
    }

    const fu = fuses(), sa = safe(), ci = cipher(), ma = machine(), wi = wires();
    let fl, gr;
    do { fl = flasks(); gr = grid(ma.x, fl.C); } while (!gr);
    return { fuses: fu, safe: sa, cipher: ci, machine: ma, flasks: fl, grid: gr, wires: wi, A: q(ma.x), B: gr.B, C: fl.C, K: gr.K };
  }

  return { make, parse, same, q, N, show, opnd, val, plain, MINUS };
})();
