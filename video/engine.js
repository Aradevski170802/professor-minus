'use strict';
/* Мисия: Намери Х — двигател на анимирания урок (сцена, анимации, говорител, плейър) */
const V = (() => {
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), layer = $('#layer'), screen = $('#screen'), player = $('#player');
  const st = { gen: 0, instant: false, scale: 1, playing: false, started: false, pos: 0, ctx: {}, voice: null, rate: 1, cc: true, music: true, t0: 0, loops: new Set() };
  const pend = new Set();
  class Abort extends Error {}
  const alive = g => { if (g !== st.gen) throw new Abort('abort'); };
  const cancelAll = () => { for (const f of [...pend]) f(); };
  const EASE = 'cubic-bezier(.2,.8,.2,1)', BACK = 'cubic-bezier(.3,1.55,.5,1)', INOUT = 'cubic-bezier(.65,0,.35,1)';
  const easeIO = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const lerp = (a, b, p) => a + (b - a) * p;

  /* ---------- мащаб ---------- */
  function fit() { st.scale = screen.clientWidth / 1920; stage.style.transform = `scale(${st.scale})`; }
  addEventListener('resize', fit); fit();

  /* ---------- фон ---------- */
  const bg = $('#bg'), bx = bg.getContext('2d');
  const THEMES = [
    [[110, 70, 255], [255, 60, 200], [40, 190, 255]],
    [[60, 120, 255], [150, 70, 255], [40, 220, 200]],
    [[255, 120, 60], [255, 60, 150], [120, 80, 255]],
    [[40, 200, 140], [40, 140, 255], [160, 90, 255]],
  ];
  let cur = THEMES[0].map(c => c.slice()), target = THEMES[0];
  const blobs = [{ x: .18, y: .28, r: .55, sp: .00011, ph: 0 }, { x: .84, y: .74, r: .6, sp: .00008, ph: 2 }, { x: .62, y: .12, r: .45, sp: .00013, ph: 4 }];
  const GL = ['×', ':', '−', '+', '=', 'x', '½', '·', '¾', 'y', '%', '7', '0,5', '−3'];
  const newG = init => ({ x: Math.random() * 960, y: init ? Math.random() * 540 : 570, s: 12 + Math.random() * 26, v: 5 + Math.random() * 12, ch: GL[Math.random() * GL.length | 0], a: .04 + Math.random() * .07, w: (Math.random() - .5) * .3, r: Math.random() * 6 });
  const glyphs = Array.from({ length: 26 }, () => newG(true));
  let tp = performance.now();
  function drawBg(t) {
    const dt = Math.min(.05, (t - tp) / 1000); tp = t;
    for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) cur[i][k] += (target[i][k] - cur[i][k]) * Math.min(1, dt * 1.5);
    bx.globalCompositeOperation = 'source-over';
    bx.fillStyle = '#050816'; bx.fillRect(0, 0, 960, 540);
    bx.globalCompositeOperation = 'lighter';
    blobs.forEach((b, i) => {
      const x = (b.x + Math.sin(t * b.sp + b.ph) * .13) * 960, y = (b.y + Math.cos(t * b.sp * 1.3 + b.ph) * .12) * 540;
      const g = bx.createRadialGradient(x, y, 0, x, y, b.r * 960);
      const c = cur[i].map(Math.round).join(',');
      g.addColorStop(0, `rgba(${c},.30)`); g.addColorStop(.5, `rgba(${c},.09)`); g.addColorStop(1, `rgba(${c},0)`);
      bx.fillStyle = g; bx.fillRect(0, 0, 960, 540);
    });
    bx.globalCompositeOperation = 'source-over';
    bx.strokeStyle = 'rgba(140,160,255,.055)'; bx.lineWidth = 1; bx.beginPath();
    for (let x = 0; x <= 960; x += 40) { bx.moveTo(x + .5, 0); bx.lineTo(x + .5, 540); }
    for (let y = 0; y <= 540; y += 40) { bx.moveTo(0, y + .5); bx.lineTo(960, y + .5); }
    bx.stroke();
    bx.fillStyle = '#c4cdff';
    for (const g of glyphs) {
      g.y -= g.v * dt; g.x += g.w; g.r += dt * .2;
      if (g.y < -40) Object.assign(g, newG(false));
      bx.globalAlpha = g.a; bx.font = `600 ${g.s}px Onest, sans-serif`;
      bx.save(); bx.translate(g.x, g.y); bx.rotate(Math.sin(g.r) * .4); bx.fillText(g.ch, 0, 0); bx.restore();
    }
    bx.globalAlpha = 1;
    const v = bx.createRadialGradient(480, 270, 180, 480, 270, 620);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)');
    bx.fillStyle = v; bx.fillRect(0, 0, 960, 540);
    requestAnimationFrame(drawBg);
  }
  requestAnimationFrame(drawBg);
  const theme = i => { target = THEMES[i % THEMES.length]; if (st.instant) cur = target.map(c => c.slice()); };

  /* ---------- звук ---------- */
  const SND = {
    ctx: null,
    init() {
      if (this.ctx) { this.ctx.resume?.(); return; }
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      const ctx = this.ctx = new C();
      this.out = ctx.createGain(); this.out.gain.value = .8; this.out.connect(ctx.destination);
      const len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      this.rev = ctx.createConvolver(); this.rev.buffer = ir;
      const rg = ctx.createGain(); rg.gain.value = .45; this.rev.connect(rg).connect(this.out);
      this.mus = ctx.createGain(); this.mus.gain.value = st.music ? .055 : 0;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
      this.mus.connect(lp); lp.connect(this.out); lp.connect(this.rev);
      this.music();
    },
    tone(f, dur, o = {}) {
      const c = this.ctx; if (!c) return; const t = c.currentTime + (o.at || 0);
      const os = c.createOscillator(), g = c.createGain();
      os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t);
      if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.vol || .2, t + (o.a || .008));
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      os.connect(g); g.connect(o.dest || this.out); if (o.wet) g.connect(this.rev);
      os.start(t); os.stop(t + dur + .05);
    },
    noise(dur, f0, f1, vol = .25, q = 1.2) {
      const c = this.ctx; if (!c) return; const t = c.currentTime;
      const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = c.createBufferSource(); s.buffer = b;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
      bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * .4); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      s.connect(bp).connect(g); g.connect(this.out); g.connect(this.rev); s.start(t);
    },
    whoosh() { if (!st.instant) this.noise(.7, 250, 3200, .22); },
    swoosh() { if (!st.instant) this.noise(.35, 1800, 500, .1, 2); },
    pop() { if (!st.instant) this.tone(520, .12, { to: 880, vol: .09, wet: 1 }); },
    tick() { if (!st.instant) this.tone(1900, .03, { type: 'square', vol: .03 }); },
    ding() { if (st.instant) return; this.tone(880, .5, { vol: .12, wet: 1 }); this.tone(1318.5, .9, { vol: .1, at: .11, wet: 1 }); this.tone(1760, 1.1, { vol: .05, at: .22, wet: 1 }); },
    thud() { if (st.instant) return; this.tone(120, .4, { to: 50, vol: .35 }); this.noise(.25, 400, 120, .15); },
    stamp() { if (st.instant) return; this.tone(90, .3, { to: 40, vol: .4 }); this.noise(.12, 2500, 800, .3, .8); },
    sparkle() { if (st.instant) return; [1568, 1976, 2349, 3136].forEach((f, i) => this.tone(f, .35, { vol: .035, at: i * .06, wet: 1 })); },
    engine(dur) { if (st.instant || !this.ctx) return; this.tone(70, dur, { type: 'sawtooth', to: 110, vol: .035, a: .3 }); },
    music() {
      const c = this.ctx;
      const CH = [[110, 164.81, 196, 261.63], [87.31, 130.81, 220, 329.63], [130.81, 196, 246.94, 329.63], [98, 146.83, 246.94, 293.66]];
      const PEN = [440, 523.25, 587.33, 659.25, 783.99, 880];
      let k = 0;
      const chord = () => {
        const t = c.currentTime;
        CH[k++ % 4].forEach((f, i) => {
          [0, 3].forEach(det => {
            const o = c.createOscillator(), g = c.createGain();
            o.type = i ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = det ? 7 : -5;
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(i ? .16 : .28, t + 1.6); g.gain.linearRampToValueAtTime(0, t + 5.4);
            o.connect(g).connect(this.mus); o.start(t); o.stop(t + 5.6);
          });
        });
      };
      const pluck = () => { if (Math.random() < .55) this.tone(PEN[Math.random() * PEN.length | 0], 1.2, { vol: .2, dest: this.mus }); };
      chord(); setInterval(chord, 4800); setInterval(pluck, 600);
    },
    duck(on) { if (!this.ctx) return; this.mus.gain.setTargetAtTime(st.music ? (on ? .022 : .055) : 0, this.ctx.currentTime, .3); },
  };

  /* ---------- примитиви ---------- */
  function setStyle(el, f) { for (const k in f) if (k !== 'offset' && k !== 'easing' && k !== 'composite') el.style[k] = f[k]; }
  function wait(ms) {
    if (st.instant) return Promise.resolve();
    const g = st.gen;
    return new Promise(r => { const fin = () => { clearTimeout(id); pend.delete(fin); r(); }; const id = setTimeout(fin, ms); pend.add(fin); }).then(() => alive(g));
  }
  function anim(el, frames, o = {}) {
    if (!el) return Promise.resolve();
    if (st.instant || o.dur === 0) { setStyle(el, frames[frames.length - 1]); return Promise.resolve(); }
    const g = st.gen;
    const a = el.animate(frames, { duration: o.dur ?? 650, easing: o.ease ?? EASE, delay: o.delay ?? 0, fill: 'both' });
    return new Promise(r => { const fin = () => { pend.delete(fin); r(); }; pend.add(fin); a.finished.then(fin, fin); })
      .then(() => { try { a.commitStyles(); } catch (e) { setStyle(el, frames[frames.length - 1]); } a.cancel(); alive(g); });
  }
  const soft = p => p.catch(e => { if (!(e instanceof Abort)) console.error(e); });
  function tween(dur, fn, ease = easeIO) {
    if (st.instant) { fn(1); return Promise.resolve(); }
    const g = st.gen;
    return new Promise(res => {
      const t0 = performance.now(); let done = false;
      const fin = () => { if (done) return; done = true; pend.delete(fin); res(); };
      pend.add(fin);
      const step = now => { if (done) return; const p = Math.min(1, (now - t0) / dur); fn(ease(p), p); p < 1 ? requestAnimationFrame(step) : fin(); };
      requestAnimationFrame(step);
    }).then(() => alive(g));
  }
  function loop(fn) {
    const L = { t: 0, on: true }; let prev = performance.now();
    const step = now => { if (!L.on) return; const dt = Math.min(.05, (now - prev) / 1000); prev = now; if (st.playing || !st.started) L.t += dt; fn(L.t, dt); requestAnimationFrame(step); };
    st.loops.add(L); requestAnimationFrame(step); fn(0, 0); return L;
  }
  const stopLoops = () => { for (const L of st.loops) L.on = false; st.loops.clear(); };

  const FX = {
    fade: [{ opacity: 0 }, { opacity: 1 }],
    up: [{ opacity: 0, translate: '0 50px' }, { opacity: 1, translate: '0 0' }],
    down: [{ opacity: 0, translate: '0 -50px' }, { opacity: 1, translate: '0 0' }],
    pop: [{ opacity: 0, scale: '.55' }, { opacity: 1, scale: '1' }],
    zoom: [{ opacity: 0, scale: '1.35', filter: 'blur(10px)' }, { opacity: 1, scale: '1', filter: 'blur(0px)' }],
    left: [{ opacity: 0, translate: '-160px 0' }, { opacity: 1, translate: '0 0' }],
    right: [{ opacity: 0, translate: '160px 0' }, { opacity: 1, translate: '0 0' }],
    drop: [{ opacity: 0, translate: '0 -500px', rotate: '-8deg' }, { opacity: 1, translate: '0 0', rotate: '0deg' }],
  };
  function enter(el, fx = 'up', o = {}) {
    if (fx === 'none') return Promise.resolve();
    return anim(el, FX[fx] || FX.up, { dur: o.dur ?? (fx === 'pop' || fx === 'drop' ? 750 : 700), ease: fx === 'pop' || fx === 'drop' ? BACK : EASE, delay: o.delay || 0 });
  }
  function add(html, o = {}) {
    const el = document.createElement('div');
    el.className = 'ob ' + (o.center === false ? '' : 'c ') + (o.cls || '');
    el.innerHTML = html;
    if (o.x != null) el.style.left = o.x + 'px';
    if (o.y != null) el.style.top = o.y + 'px';
    if (o.w) el.style.width = o.w + 'px';
    if (o.h) el.style.height = o.h + 'px';
    if (o.size) el.style.fontSize = o.size + 'px';
    if (o.rot) el.style.rotate = o.rot + 'deg';
    if (o.style) el.style.cssText += o.style;
    (o.parent || layer).appendChild(el);
    if (o.sound) SND[o.sound]?.();
    el.ready = soft(enter(el, o.fx || 'up', o));
    return el;
  }
  async function show(html, o) { const el = add(html, o); await el.ready; alive(st.gen); return el; }
  function out(el, fx = 'fade', o = {}) {
    if (!el) return Promise.resolve();
    if (st.instant) { el.remove(); return Promise.resolve(); }
    const fr = { fade: [{ opacity: 1 }, { opacity: 0 }], down: [{ opacity: 1 }, { opacity: 0, translate: '0 60px' }], up: [{ opacity: 1 }, { opacity: 0, translate: '0 -60px' }], shrink: [{ opacity: 1, scale: '1' }, { opacity: 0, scale: '.6' }], left: [{ opacity: 1 }, { opacity: 0, translate: '-200px 0' }] }[fx];
    const a = el.animate(fr, { duration: o.dur ?? 450, easing: EASE, fill: 'forwards' });
    return new Promise(r => { const fin = () => { pend.delete(fin); el.remove(); r(); }; pend.add(fin); a.finished.then(fin, fin); });
  }
  async function clear(fx = 'fade') {
    const kids = [...layer.children];
    if (st.instant) { kids.forEach(k => k.remove()); return; }
    const g = st.gen;
    await Promise.all(kids.map(k => out(k, fx, { dur: 380 })));
    alive(g);
  }
  function svg(inner, o = {}) {
    const NS = 'http://www.w3.org/2000/svg';
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('class', 'svgs ob ' + (o.cls || ''));
    s.setAttribute('viewBox', '0 0 1920 1080');
    s.innerHTML = inner;
    (o.parent || layer).appendChild(s);
    s.ready = soft(enter(s, o.fx || 'fade', o));
    return s;
  }
  function draw(path, dur = 900, delay = 0) {
    const L = path.getTotalLength ? path.getTotalLength() : 1000;
    path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
    return anim(path, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { dur, delay, ease: INOUT });
  }
  function rectOf(el) {
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(), k = st.scale;
    return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k };
  }
  const union = rs => { const x = Math.min(...rs.map(r => r.x)), y = Math.min(...rs.map(r => r.y)); return { x, y, w: Math.max(...rs.map(r => r.x + r.w)) - x, h: Math.max(...rs.map(r => r.y + r.h)) - y }; };

  /* ---------- конфети ---------- */
  const cf = $('#confetti'), cx = cf.getContext('2d'); let parts = [], cfOn = false;
  const COLS = ['#ffd23f', '#ff4fd8', '#3fd8ff', '#3dffa2', '#9b7bff', '#fff'];
  function burst(x, y, n = 70, spread = 1) {
    if (st.instant) return;
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = (6 + Math.random() * 16) * spread; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 8, s: 6 + Math.random() * 10, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: COLS[i % COLS.length], life: 1 }); }
    if (!cfOn) { cfOn = true; requestAnimationFrame(cfStep); }
  }
  function cfStep() {
    cx.clearRect(0, 0, 1920, 1080);
    parts = parts.filter(p => p.life > 0 && p.y < 1150);
    for (const p of parts) {
      p.vy += .45; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= .006;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = Math.min(1, p.life * 2); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore();
    }
    if (parts.length) requestAnimationFrame(cfStep); else { cfOn = false; cx.clearRect(0, 0, 1920, 1080); }
  }
  function ring(x, y, color = '#3dffa2') {
    if (st.instant) return;
    const el = add('', { x, y, fx: 'none', style: `width:40px;height:40px;border-radius:50%;border:5px solid ${color};box-shadow:0 0 30px ${color};pointer-events:none` });
    anim(el, [{ scale: '1', opacity: 1 }, { scale: '9', opacity: 0 }], { dur: 900 }).then(() => el.remove(), () => el.remove());
  }

  /* ---------- уравнения ---------- */
  const OPS = new Set(['=', '−', '+', '·', ':', '≠', '→', '⇒', '≈', '<', '>']);
  function parse(spec) {
    const cnt = {};
    return spec.trim().split(/\s+/).map(raw => {
      let s = raw.replace(/-/g, '−'), cls = '';
      const pre = { '!': 'hl', '%': 'ok', '&': 'bad', '~': 'dim', '^': 'cy', '$': 'pk' };
      while (pre[s[0]] && s.length > 1) { cls += ' ' + pre[s[0]]; s = s.slice(1); }
      let key = null; const at = s.indexOf('@'); if (at > 0) { key = s.slice(at + 1); s = s.slice(0, at); }
      if (!key) { cnt[s] = (cnt[s] || 0) + 1; key = s + '#' + (cnt[s] - 1); }
      let html = s, type = 'num'; let m;
      if (OPS.has(s)) type = 'op';
      else if (s === '(' || s === ')') type = 'par';
      else if (s === '□') { type = 'box'; html = ''; }
      else if (s === '✓') type = 'check';
      else if ((m = s.match(/^(−?)(\d+)_(\d+)\/(\d+)$/))) { type = 'num fr'; html = `${m[1] ? '<span class="sg">−</span>' : ''}<span class="w">${m[2]}</span><span class="fb"><span class="n">${m[3]}</span><span class="d">${m[4]}</span></span>`; }
      else if ((m = s.match(/^(−?)(\d+)\/(\d+)$/))) { type = 'num fr'; html = `${m[1] ? '<span class="sg">−</span>' : ''}<span class="fb"><span class="n">${m[2]}</span><span class="d">${m[3]}</span></span>`; }
      else if ((m = s.match(/^(−?)([a-zA-Z])(?:_(\d))?$/))) { type = 'var'; html = `${m[1] ? '<span style="font-style:normal;font-family:Onest">−</span>' : ''}${m[2]}${m[3] ? `<span class="sub">${m[3]}</span>` : ''}`; }
      else if (/[а-яА-Я]/.test(s)) { type = 'txt2'; html = s.replace(/~/g, ' '); }
      html = html.replace(/~/g, ' ');
      return { key, text: s, cls: 'tk ' + type + cls, html };
    });
  }
  function mkTok(t) { const el = document.createElement('span'); el.className = t.cls; el.innerHTML = t.html; el.dataset.k = t.key; el.dataset.t = t.text; return el; }

  class Eq {
    constructor(spec, o = {}) {
      this.o = Object.assign({ x: 960, y: 400, size: 84, align: 'eq', fx: 'up' }, o);
      this.el = document.createElement('div'); this.el.className = 'eq';
      this.el.style.fontSize = this.o.size + 'px';
      (o.parent || layer).appendChild(this.el);
      this.frames = []; this.map = new Map(); this.order = [];
      for (const t of parse(spec)) { const el = mkTok(t); this.map.set(t.key, el); this.order.push(t.key); this.el.appendChild(el); }
      this.place();
      this.ready = soft(this.intro());
    }
    place() {
      const { x, y, align } = this.o;
      this.el.style.top = y + 'px';
      const eqTok = align === 'eq' && this.order.map(k => this.map.get(k)).find(e => e.dataset.t === '=');
      if (align === 'center' || (align === 'eq' && !eqTok)) { this.el.classList.add('center'); this.el.style.left = x + 'px'; }
      else if (align === 'left') { this.el.classList.remove('center'); this.el.style.left = x + 'px'; }
      else { this.el.classList.remove('center'); this.el.style.left = (x - (eqTok.offsetLeft + eqTok.offsetWidth / 2)) + 'px'; }
    }
    async intro() {
      const src = this.o.from;
      if (st.instant) return;
      const g = st.gen;
      if (src && src.map) {
        const ps = [];
        this.order.forEach((k, i) => {
          const el = this.map.get(k), se = src.map.get(k);
          if (se && se.isConnected) {
            const a = rectOf(se), b = rectOf(el);
            ps.push(anim(el, [{ translate: `${a.x - b.x}px ${a.y - b.y}px`, opacity: .9 }, { translate: '0px 0px', opacity: 1 }], { dur: 850, ease: INOUT, delay: i * 25 }));
          } else ps.push(anim(el, [{ opacity: 0, scale: '.4' }, { opacity: 1, scale: '1' }], { dur: 600, ease: BACK, delay: 480 + i * 30 }));
        });
        SND.swoosh();
        await Promise.all(ps);
      } else if (this.o.fx === 'type') {
        const els = this.order.map(k => this.map.get(k)); els.forEach(e => e.style.opacity = 0);
        for (const e of els) { SND.tick(); await anim(e, [{ opacity: 0, translate: '0 30px', scale: '.6' }, { opacity: 1, translate: '0 0', scale: '1' }], { dur: 260, ease: BACK }); }
      } else if (this.o.fx !== 'none') await enter(this.el, this.o.fx);
      alive(g);
    }
    key(k) {
      k = String(k).replace(/-/g, '−');
      if (this.map.has(k)) return k;
      if (this.map.has(k + '#0')) return k + '#0';
      return this.order.find(q => this.map.get(q).dataset.t === k);
    }
    els(a, b = a) {
      const i = this.order.indexOf(this.key(a)), j = this.order.indexOf(this.key(b));
      if (i < 0 || j < 0) return [];
      return this.order.slice(Math.min(i, j), Math.max(i, j) + 1).map(k => this.map.get(k));
    }
    tok(k) { return this.map.get(this.key(k)); }
    rect(a, b) { return union(this.els(a, b).map(rectOf)); }
    async to(spec, o = {}) {
      this.unframe();
      const next = parse(spec);
      const old = new Map(); if (!st.instant) for (const [k, el] of this.map) old.set(k, rectOf(el));
      const nm = new Map(), els = [], order = [];
      for (const t of next) {
        let el = this.map.get(t.key);
        if (el) { el.className = t.cls; delete el.dataset.fresh; } else { el = mkTok(t); el.dataset.fresh = '1'; }
        nm.set(t.key, el); els.push(el); order.push(t.key);
      }
      const gone = [...this.map].filter(([k]) => !nm.has(k));
      this.el.replaceChildren(...els); this.map = nm; this.order = order; this.place();
      if (st.instant) return;
      const g = st.gen, ps = [], D = o.dur ?? 850;
      const into = o.into && this.tok(o.into), ir = into && rectOf(into);
      for (const [k, el] of gone) {
        const r = old.get(k);
        el.style.cssText = `position:absolute;left:${r.x}px;top:${r.y}px;font-size:${this.o.size}px;margin:0;font-weight:600`;
        el.classList.add('ob'); layer.appendChild(el);
        const fr = ir ? [{ translate: '0 0', opacity: 1, scale: '1' }, { translate: `${ir.x + ir.w / 2 - r.x - r.w / 2}px ${ir.y + ir.h / 2 - r.y - r.h / 2}px`, opacity: 0, scale: '.5' }]
          : [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `0 ${o.goneDy ?? -40}px` }];
        ps.push(anim(el, fr, { dur: ir ? D * .7 : D * .5, ease: INOUT }).finally(() => el.remove()));
      }
      els.forEach((el, i) => {
        if (el.dataset.fresh) ps.push(anim(el, [{ opacity: 0, scale: '.3' }, { opacity: 1, scale: '1' }], { dur: 650, ease: BACK, delay: ir ? D * .55 : D * .4 + i * 20 }));
        else { const a = old.get(order[i]), b = rectOf(el); if (a && (Math.abs(a.x - b.x) > .5 || Math.abs(a.y - b.y) > .5)) ps.push(anim(el, [{ translate: `${a.x - b.x}px ${a.y - b.y}px` }, { translate: '0px 0px' }], { dur: D, ease: INOUT })); }
      });
      if (o.sound !== false) SND.swoosh();
      await Promise.all(ps);
      alive(g);
    }
    async frame(a, b = a, o = {}) {
      const r = this.rect(a, b), pad = o.pad ?? 14, c = o.color || '';
      const f = add('', { cls: 'frame ' + c, x: r.x - pad, y: r.y - pad * .7, w: r.w + pad * 2, h: r.h + pad * 1.4, center: false, fx: 'none' });
      this.frames.push(f);
      let t;
      if (o.tag) {
        const above = !!o.above;
        t = add(o.tag, { cls: 'tag ' + c + (above ? ' above' : ' below'), x: r.x + r.w / 2, y: above ? r.y - pad - 88 : r.y + r.h + pad + 30, center: false, fx: 'none' });
        this.frames.push(t);
      }
      SND.pop();
      await Promise.all([anim(f, [{ opacity: 0, scale: '1.25' }, { opacity: 1, scale: '1' }], { dur: 500, ease: BACK }),
        t && anim(t, [{ opacity: 0, translate: `0 ${o.above ? -20 : 20}px` }, { opacity: 1, translate: '0 0' }], { dur: 500, delay: 150 })]);
      return f;
    }
    unframe() { for (const f of this.frames) soft(out(f, 'fade', { dur: 250 })); this.frames = []; }
    cls(a, b, c) { for (const e of this.els(a, b)) { e.classList.remove('hl', 'ok', 'bad', 'dim', 'cy', 'pk'); if (c) e.classList.add(c); } }
    async pulse(a, b = a) { await Promise.all(this.els(a, b).map(e => anim(e, [{ scale: '1' }, { scale: '1.3' }, { scale: '1' }], { dur: 600 }))); }
    async win(a, b = a) {
      this.cls(a, b, 'ok');
      if (st.instant) return;
      const r = this.rect(a, b); SND.ding(); ring(r.x + r.w / 2, r.y + r.h / 2); burst(r.x + r.w / 2, r.y + r.h / 2, 60, .8);
      await this.pulse(a, b);
    }
    async out(fx = 'fade') { this.unframe(); await out(this.el, fx); }
    move(o) {
      const a = st.instant ? null : rectOf(this.el);
      Object.assign(this.o, o);
      if (o.size) this.el.style.fontSize = o.size + 'px';
      this.place();
      if (st.instant) return Promise.resolve();
      const b = rectOf(this.el);
      return anim(this.el, [{ translate: `${a.x - b.x}px ${a.y - b.y}px`, scale: `${a.w / b.w}` }, { translate: '0px 0px', scale: '1' }], { dur: 800, ease: INOUT });
    }
  }
  const eq = (spec, o) => new Eq(spec, o);

  class Board {
    constructor(o = {}) { this.o = Object.assign({ x: 960, y: 250, gap: 128, max: 820, size: 80 }, o); this.lines = []; }
    get last() { return this.lines[this.lines.length - 1]; }
    async line(spec, o = {}) {
      const prev = this.last;
      let y = prev ? prev.o.y + (o.gap ?? this.o.gap) : this.o.y;
      if (y > this.o.max) { await this.shift(y - this.o.max); y = this.o.max; }
      this.lines.forEach(l => l.unframe());
      const e = new Eq(spec, Object.assign({ x: this.o.x, y, size: this.o.size, from: o.from === undefined ? prev : o.from }, o));
      this.lines.push(e); await e.ready; return e;
    }
    async shift(dy) {
      const g = st.gen;
      await Promise.all(this.lines.map(l => {
        const ny = l.o.y - dy;
        l.unframe(); l.o.y = ny;
        if (ny < (this.o.top ?? this.o.y - 40)) { this.lines = this.lines.filter(q => q !== l); return out(l.el, 'up'); }
        const oy = parseFloat(l.el.style.top); l.el.style.top = ny + 'px';
        return anim(l.el, [{ translate: `0 ${oy - ny}px` }, { translate: '0 0' }], { dur: 650, ease: INOUT });
      }));
      if (!st.instant) alive(g);
    }
    async clear() { const ls = this.lines; this.lines = []; await Promise.all(ls.map(l => l.out())); }
  }
  const board = o => new Board(o);

  /* ---------- глава ---------- */
  async function chapter(num, title) {
    const el = add(`<div class="streak"></div><div class="num">${num}</div><div style="position:relative"><div class="lbl">Глава ${num}</div><div class="ttl">${title}</div></div>`, { cls: 'chap', center: false, fx: 'none' });
    st.ctx.card = el;
    if (st.instant) return;
    SND.whoosh();
    const g = st.gen;
    await Promise.all([anim(el, [{ opacity: 0 }, { opacity: 1 }], { dur: 500 }),
      anim(el.querySelector('.num'), [{ opacity: 0, scale: '1.6' }, { opacity: 1, scale: '1' }], { dur: 1100 }),
      anim(el.querySelector('.ttl'), [{ opacity: 0, translate: '0 70px', filter: 'blur(12px)' }, { opacity: 1, translate: '0 0', filter: 'blur(0)' }], { dur: 900, delay: 200 })]);
    alive(g);
  }
  async function chapterOut() { const el = st.ctx.card; st.ctx.card = null; if (el) await out(el, 'fade', { dur: 500 }); }

  /* ---------- говорител ---------- */
  const synth = window.speechSynthesis;
  let voices = [];
  const keep = [];
  const shown = s => s.replace(/\[\[(.*?)\|\|(.*?)\]\]/g, '$1');
  const spoken = s => s.replace(/\[\[(.*?)\|\|(.*?)\]\]/g, '$2').replace(/\s*[—–]\s*/g, ', ');
  /* записан глас: audio/<хеш>.mp3 за всяко изречение + audio/index.json с продължителностите */
  const hash = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
  const REC = { map: {}, ok: false };
  const AUD = new Audio(); AUD.preload = 'auto';
  const SILENT = (() => { const n = 400, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0))); w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true); return URL.createObjectURL(new Blob([b], { type: 'audio/wav' })); })();
  const useRec = () => st.mode === 'rec' && REC.ok;
  const recDur = s => REC.map[hash(spoken(s))];
  const est = s => { const r = useRec() && recDur(s); return r ? (r * 1000 + 170) / st.rate : (spoken(s).split(/\s+/).length * 400 + 450) / st.rate; };
  const pre = new Set();
  const prefetch = list => { if (!REC.ok) return; for (const s of list) { const h = hash(spoken(s)); if (REC.map[h] && !pre.has(h)) { pre.add(h); fetch('audio/' + h + '.mp3').catch(() => {}); } } };
  const split = t => !t ? [] : Array.isArray(t) ? t : t.match(/[^.!?…]+[.!?…]+["“”»]?|[^.!?…]+$/g).map(s => s.trim()).filter(Boolean);
  const sub = $('#sub');
  const showSub = s => { sub.textContent = s ? shown(s) : ''; };
  function rankVoice(v) { return (/natural|online|neural/i.test(v.name) ? 10 : 0) + (/borislav/i.test(v.name) ? 3 : 0) + (/kalina/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1); }
  const vname = v => v.name.replace(/^Microsoft /, '').replace(/ - .*$/, '');
  function loadVoices() {
    voices = synth ? synth.getVoices().filter(v => /^bg/i.test(v.lang) || /bulgar/i.test(v.name)).sort((a, b) => rankVoice(b) - rankVoice(a)) : [];
    const saved = localStorage.getItem('missionx-voice2');
    if (!st.voiceSet) {
      const sv = voices.find(v => v.name === saved);
      if (saved === 'none') { st.mode = 'none'; st.voice = null; }
      else if (sv) { st.mode = 'tts'; st.voice = sv; }
      else if (REC.ok) { st.mode = 'rec'; st.voice = null; }
      else if (voices[0]) { st.mode = 'tts'; st.voice = voices[0]; }
      else { st.mode = 'none'; st.voice = null; }
    }
    const sel = $('#selVoice');
    sel.innerHTML = (REC.ok ? '<option value="rec">Бит (записан глас)</option>' : '') + voices.map(v => `<option value="${v.name}">${vname(v)} (глас на браузъра)</option>`).join('') + '<option value="none">Без глас (само субтитри)</option>';
    sel.value = st.mode === 'rec' ? 'rec' : st.voice ? st.voice.name : 'none';
    const n = $('#voiceNote');
    if (REC.ok) { n.className = 'vnote'; n.innerHTML = 'Говорител: <b>Детектив Бит</b> 🔊 Пуснете звука.'; }
    else if (voices.length) { n.className = 'vnote'; n.innerHTML = `Говорител: <b>${vname(voices[0])}</b> 🔊 Пуснете звука.`; }
    else { n.className = 'vnote warn'; n.innerHTML = 'В този браузър няма български глас, затова видеото ще върви със субтитри. За говорител отворете страницата в <b>Microsoft Edge</b> (или в Chrome на телефон с Android).'; }
  }
  loadVoices();
  if (synth) { synth.onvoiceschanged = loadVoices; setTimeout(loadVoices, 600); setTimeout(loadVoices, 2000); }
  fetch('audio/index.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => {
    if (!j || !j.clips || !Object.keys(j.clips).length) return;
    REC.map = j.clips; REC.ok = true; loadVoices(); if (chapters.length) build();
  }).catch(() => {});
  $('#selVoice').onchange = e => {
    const v = e.target.value; st.voiceSet = true; localStorage.setItem('missionx-voice2', v);
    st.voice = voices.find(x => x.name === v) || null; st.mode = v === 'rec' ? 'rec' : st.voice ? 'tts' : 'none';
    build(); if (st.playing) playFrom(st.pos);
  };
  $('#selRate').onchange = e => { st.rate = +e.target.value; build(); if (st.playing) playFrom(st.pos); };

  function sayAll(sents, onStart) {
    const g = st.gen;
    return new Promise(res => {
      let finished = false, next = 0, wd;
      const startUpTo = i => { while (next <= i && next < sents.length) { onStart(next); next++; } };
      const fin = () => { if (finished) return; finished = true; pend.delete(fin); clearTimeout(wd); BOT.talk(false); SND.duck(false); if (g === st.gen) startUpTo(sents.length - 1); res(); };
      pend.add(fin);
      if (!sents.length) return fin();
      if (useRec()) {
        prefetch(sents);
        let i = 0;
        const step = () => {
          if (finished) return;
          clearTimeout(wd); AUD.onended = AUD.onerror = null;
          if (i >= sents.length) return fin();
          const s = sents[i], k = i++; startUpTo(k); showSub(s);
          const h = hash(spoken(s)), d = REC.map[h];
          if (!d) { BOT.talk(false); SND.duck(false); wd = setTimeout(step, est(s)); return; }
          let moved = false;
          const nxt = gap => { if (moved || finished) return; moved = true; BOT.talk(false); clearTimeout(wd); wd = setTimeout(step, gap); };
          AUD.onended = () => nxt(170);
          AUD.onerror = () => nxt(est(s));
          wd = setTimeout(() => nxt(0), d * 1000 / st.rate + 5000);
          AUD.src = 'audio/' + h + '.mp3'; AUD.defaultPlaybackRate = st.rate; AUD.playbackRate = st.rate;
          BOT.talk(true); SND.duck(true);
          AUD.play().catch(() => nxt(est(s)));
        };
        return step();
      }
      if (st.mode !== 'tts' || !st.voice || !synth) {
        let i = 0;
        const step = () => { if (finished) return; if (i >= sents.length) return fin(); startUpTo(i); showSub(sents[i]); wd = setTimeout(step, est(sents[i])); i++; };
        return step();
      }
      wd = setTimeout(fin, sents.reduce((a, s) => a + est(s), 0) * 2.2 + 6000);
      sents.forEach((s, i) => {
        const u = new SpeechSynthesisUtterance(spoken(s));
        u.voice = st.voice; u.lang = st.voice.lang; u.rate = st.rate;
        u.onstart = () => { if (finished) return; startUpTo(i); showSub(s); BOT.talk(true); SND.duck(true); };
        u.onend = () => { if (i === sents.length - 1) fin(); else BOT.talk(false); };
        u.onerror = e => { if (i === sents.length - 1 || e.error === 'interrupted' || e.error === 'canceled' || e.error === 'not-allowed') fin(); };
        keep.push(u); if (keep.length > 40) keep.shift();
        synth.speak(u);
      });
    }).then(() => alive(g));
  }

  /* ---------- робот ---------- */
  const BOT = {
    el: null, x: 150, y: 900, s: .8,
    mount(html) { const d = document.createElement('div'); d.id = 'bot'; d.innerHTML = html; $('#botWrap').appendChild(d); this.el = d; this.apply(); },
    apply() { if (this.el) this.el.style.transform = `translate(${this.x - 130}px, ${this.y - 160}px) scale(${this.s})`; },
    async at(x, y, s = this.s, dur = 1000) {
      const a = { x: this.x, y: this.y, s: this.s };
      if (st.instant || !this.el || dur <= 0) { Object.assign(this, { x, y, s }); this.apply(); return; }
      await tween(dur, p => { this.x = lerp(a.x, x, p); this.y = lerp(a.y, y, p) - Math.sin(p * Math.PI) * 60; this.s = lerp(a.s, s, p); this.apply(); });
    },
    corner(dur) { return this.at(150, 905, .78, dur); },
    talk(on) { this.el?.classList.toggle('talk', !!on); },
    mood(m) { if (!this.el) return; this.el.classList.toggle('joy', m === 'joy'); },
    pose(p) { if (!this.el) return; this.el.classList.remove('point', 'wave'); if (p && !st.instant) { void this.el.offsetWidth; this.el.classList.add(p); } else if (p === 'point') this.el.classList.add(p); },
    hide(h) { if (this.el) this.el.style.opacity = h ? 0 : 1; },
  };

  /* ---------- плейър ---------- */
  const chapters = [];
  let flat = [], total = 0;
  function build() {
    flat = []; total = 0;
    chapters.forEach((c, ci) => { c.start = total; c.beats.forEach((b, bi) => { const d = split(b.say).reduce((a, s) => a + est(s), 0) + (b.pause ?? 350) + (b.extra ?? 0); flat.push({ ci, bi, b, d, t: total }); total += d; }); c.dur = total - c.start; });
    const segs = $('#barSegs');
    segs.innerHTML = chapters.map((c, i) => `<div class="seg" style="flex:${c.dur}" data-i="${i}"><i></i></div>`).join('');
    $('#chMenu').innerHTML = chapters.map((c, i) => `<button data-i="${i}"><b>${i || '▶'}</b>${c.title}<span class="d">${fmt(c.dur)}</span></button>`).join('');
    $('#startChapters').innerHTML = chapters.map((c, i) => i ? `<li><button data-i="${i}">${i}. ${c.title}</button></li>` : '').join('');
  }
  const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  async function enterChapter(ci) {
    const g = st.gen;
    stopLoops();
    if (st.instant) layer.replaceChildren(); else { await clear(); alive(g); }
    st.ctx = {}; showSub('');
    const c = chapters[ci];
    theme(c.theme ?? ci);
    BOT.mood(''); BOT.pose('');
    if (c.setup) await c.setup(st.ctx);
  }
  async function runBeat(b, g, inst) {
    const ctx = st.ctx, sents = split(b.say), cues = b.on || [];
    if (inst) {
      if (b.act) await b.act(ctx);
      for (const c of cues) if (c) await c(ctx);
      if (b.after) await b.after(ctx);
      return;
    }
    let chain = Promise.resolve();
    const push = f => { chain = chain.then(() => { alive(g); return f(ctx); }); chain.catch(() => {}); };
    if (b.act) push(b.act);
    if (!sents.length) showSub('');
    await sayAll(sents, i => { if (cues[i]) push(cues[i]); });
    for (let s = sents.length; s < cues.length; s++) if (cues[s]) push(cues[s]);
    await chain; alive(g);
    if (b.after) { await b.after(ctx); alive(g); }
    await wait(b.pause ?? 350);
  }
  async function rebuild(i, inclusive) {
    const g = st.gen;
    st.instant = true;
    try {
      const { ci, bi } = flat[i];
      await enterChapter(ci);
      const last = inclusive ? bi : bi - 1;
      for (let b = 0; b <= last; b++) { alive(g); await runBeat(chapters[ci].beats[b], g, true); }
    } finally { if (g === st.gen) st.instant = false; }
    alive(g);
  }
  function stopAll() { st.gen++; cancelAll(); st.instant = false; if (synth) synth.cancel(); AUD.onended = AUD.onerror = null; AUD.pause(); BOT.talk(false); SND.duck(false); }
  async function playFrom(i) {
    stopAll(); const g = st.gen;
    st.pos = i; st.playing = true; st.started = true; $('#endOv').hidden = true; ui();
    try {
      await rebuild(i, false);
      if (synth && st.voice) await wait(120);
      for (let k = i; k < flat.length; k++) {
        if (k !== i && flat[k].bi === 0) await enterChapter(flat[k].ci);
        alive(g);
        st.pos = k; st.t0 = performance.now(); ui();
        if (flat[k + 1]) prefetch(split(flat[k + 1].b.say));
        await runBeat(flat[k].b, g, false);
      }
      alive(g);
      st.playing = false; st.pos = flat.length - 1; st.done = true; ui();
      $('#endOv').hidden = false; SND.sparkle();
    } catch (e) { if (!(e instanceof Abort)) { console.error(e); st.playing = false; ui(); } }
  }
  async function showAt(i) {
    stopAll(); st.playing = false; st.pos = i; st.started = true; ui();
    try { await rebuild(i, true); } catch (e) { if (!(e instanceof Abort)) console.error(e); }
    showSub(''); ui();
  }
  function pause() { if (!st.playing) return; stopAll(); st.playing = false; ui(); }
  function toggle() { if (!st.started) return start(); st.playing ? pause() : playFrom(st.pos); }
  function seek(i) { i = Math.max(0, Math.min(flat.length - 1, i)); st.playing ? playFrom(i) : showAt(i); }
  function start(i = 0) { SND.init(); if (useRec()) { AUD.src = SILENT; AUD.play().catch(() => {}); } $('#startOv').hidden = true; $('#endOv').hidden = true; playFrom(i); }

  function ui() {
    player.classList.toggle('playing', st.playing);
    const f = flat[st.pos]; if (!f) return;
    $('#chName').textContent = chapters[f.ci].title;
    [...$('#chMenu').children].forEach((b, i) => b.classList.toggle('cur', i === f.ci));
  }
  function tick() {
    const f = flat[st.pos];
    if (f) {
      const el = st.playing ? Math.min(f.d, performance.now() - st.t0) : (st.done ? f.d : 0);
      const t = f.t + el;
      $('#time').textContent = `${fmt(t)} / ${fmt(total)}`;
      [...$('#barSegs').children].forEach((s, i) => { const c = chapters[i]; s.firstChild.style.width = Math.max(0, Math.min(1, (t - c.start) / c.dur)) * 100 + '%'; });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ---------- контроли ---------- */
  const tAt = e => { const r = $('#bar').getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * total; };
  const beatAt = t => { let i = 0; while (i + 1 < flat.length && flat[i + 1].t <= t) i++; return i; };
  $('#bar').addEventListener('click', e => { if (!st.started) { SND.init(); $('#startOv').hidden = true; } seek(beatAt(tAt(e))); });
  $('#bar').addEventListener('mousemove', e => { const t = tAt(e), f = flat[beatAt(t)]; const tip = $('#barTip'); tip.textContent = `${fmt(t)} · ${chapters[f.ci].title}`; tip.style.left = (e.clientX - $('#bar').getBoundingClientRect().left) + 'px'; });
  $('#bPlay').onclick = toggle;
  $('#bPrev').onclick = () => { if (!st.started) return; seek(st.pos - 1); };
  $('#bNext').onclick = () => { if (!st.started) return; seek(st.pos + 1); };
  $('#btnStart').onclick = () => start(0);
  $('#btnReplay').onclick = () => { st.done = false; start(0); };
  $('#startChapters').onclick = e => { const b = e.target.closest('button'); if (b) start(flat.findIndex(f => f.ci === +b.dataset.i)); };
  $('#chMenu').onclick = e => { const b = e.target.closest('button'); if (!b) return; $('#chMenu').hidden = true; const i = flat.findIndex(f => f.ci === +b.dataset.i); if (!st.started) start(i); else playFrom(i); };
  $('#bCh').onclick = e => { e.stopPropagation(); $('#setMenu').hidden = true; $('#chMenu').hidden = !$('#chMenu').hidden; };
  $('#bSet').onclick = e => { e.stopPropagation(); $('#chMenu').hidden = true; $('#setMenu').hidden = !$('#setMenu').hidden; };
  document.addEventListener('click', e => { if (!e.target.closest('.pop') && !e.target.closest('#bCh,#bSet')) { $('#chMenu').hidden = true; $('#setMenu').hidden = true; } });
  const setCC = on => { st.cc = on; sub.classList.toggle('off', !on); $('#bCC').classList.toggle('on', on); $('#bCC').classList.toggle('off', !on); };
  const setMusic = on => { st.music = on; $('#bMusic').classList.toggle('off', !on); SND.duck(false); localStorage.setItem('missionx-music', on ? '1' : '0'); };
  $('#bCC').onclick = () => setCC(!st.cc);
  $('#bMusic').onclick = () => setMusic(!st.music);
  if (localStorage.getItem('missionx-music') === '0') setMusic(false);
  $('#bFull').onclick = () => document.fullscreenElement ? document.exitFullscreen() : player.requestFullscreen?.();
  $('#screen').addEventListener('click', e => { if (st.started && !e.target.closest('#ctrl')) toggle(); });
  addEventListener('keydown', e => {
    if (e.target.closest('select')) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'k') { e.preventDefault(); toggle(); }
    else if (k === 'arrowright') seek(st.pos + 1);
    else if (k === 'arrowleft') seek(st.pos - 1);
    else if (k === 'f' || k === 'ф') $('#bFull').click();
    else if (k === 'c' || k === 'ц') setCC(!st.cc);
    else if (k === 'm' || k === 'м') setMusic(!st.music);
  });
  let idleT;
  const wake = () => { player.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => player.classList.add('idle'), 2600); };
  addEventListener('mousemove', wake); addEventListener('touchstart', wake); wake();

  return {
    st, SND, BOT, add, show, out, clear, svg, draw, anim, tween, loop, wait, eq, board, chapter, chapterOut, burst, ring, rectOf, theme, lerp, EASE, BACK, INOUT, soft,
    chapters, init() { build(); showAt(1).then(() => { st.started = false; }); },
    dev: { get flat() { return flat; }, lines() { const o = [], seen = new Set(); chapters.forEach((c, ci) => c.beats.forEach(b => split(b.say).forEach(s => { const t = spoken(s), h = hash(t); if (!seen.has(h)) { seen.add(h); o.push({ h, c: ci, t }); } }))); return o; }, rec: REC, showAt, playFrom, pause, get total() { return total; } },
  };
})();
