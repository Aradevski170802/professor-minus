/* Двигател: състояние, сцена, тъмнина, звук, частици, инвентар, листове, подсказки, таймер, начало и край */
const PUZ = { act: {}, hints: {}, fits: {} };
const E = (() => {
  const $ = s => document.querySelector(s);
  const KEY = 'minus-lab-v2', PIN = '6789';
  let S = null, P = null;
  const fresh = (team, minutes) => ({ team, minutes, room: 1, t: 0, hints: {}, hintCount: 0, mistakes: 0, wrongs: {}, inv: [], sel: null, done: {}, got: {}, warned: {},
    fuseSlots: Array(6).fill(null), book: [], cryptex: null, trials: 2, flasks: ['', '', '', ''], fok: [false, false, false, false], gridPath: [], wires: {}, abc: {}, sound: true, won: false });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const total = () => (S ? S.minutes * 60 : 3000);
  const clock = s => { const a = Math.abs(s); return `${s < 0 ? '-' : ''}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 7-сегментен дисплей ---------- */
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
  const SP = { a: '3,1 15,1 13,3.4 5,3.4', b: '16,2 16,13 13.6,11.6 13.6,4.4', c: '16,15 16,26 13.6,23.6 13.6,16.4', d: '3,27 15,27 13,24.6 5,24.6', e: '2,15 2,26 4.4,23.6 4.4,16.4', f: '2,2 2,13 4.4,11.6 4.4,4.4', g: '3,14 5,12.6 13,12.6 15,14 13,15.4 5,15.4' };
  function seg(txt) {
    let x = 0, o = '';
    for (const ch of String(txt)) {
      if (ch === ':') { o += `<circle cx="${x + 3}" cy="9" r="1.7" class="on"/><circle cx="${x + 3}" cy="19" r="1.7" class="on"/>`; x += 7; continue; }
      const on = SEG[ch] || ''; o += `<g transform="translate(${x} 0)">${'abcdefg'.split('').map(s => `<polygon points="${SP[s]}" class="${on.includes(s) ? 'on' : 'off'}"/>`).join('')}</g>`; x += 20;
    }
    return `<svg class="segsvg" viewBox="-1 0 ${x + 1} 28" aria-hidden="true">${o}</svg>`;
  }

  /* ---------- звук (всичко се синтезира) ---------- */
  let ac = null, master = null, amb = [];
  const audio = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .9; master.connect(ac.destination); } catch (e) {} } if (ac && ac.state === 'suspended') ac.resume(); return ac; };
  function tone(f, d = .12, type = 'sine', at = 0, vol = .07, f2) {
    if (!S || !S.sound || !audio()) return; const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(master); o.start(t); o.stop(t + d + .05);
  }
  function noise(d = .2, at = 0, vol = .1, freq = 1200, q = 1, type = 'bandpass', f2) {
    if (!S || !S.sound || !audio()) return; const t = ac.currentTime + at, len = Math.ceil(ac.sampleRate * d), b = ac.createBuffer(1, len, ac.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; fl.type = type; fl.frequency.setValueAtTime(freq, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d); fl.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(fl).connect(g).connect(master); s.start(t);
  }
  const sfx = {
    click: () => tone(1400, .03, 'square', 0, .025),
    tick: () => { noise(.025, 0, .25, 3500, 4); tone(2400, .02, 'square', 0, .015); },
    key: () => noise(.04, 0, .12, 2500, 2),
    ok: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, .22, 'triangle', i * .09, .06)),
    bad: () => { tone(160, .35, 'sawtooth', 0, .06); tone(110, .4, 'sawtooth', .08, .05); },
    item: () => [880, 1320, 1760].forEach((f, i) => tone(f, .18, 'sine', i * .07, .05)),
    thunk: () => { noise(.12, 0, .4, 300, 1, 'lowpass'); tone(90, .15, 'sine', 0, .12); },
    power: () => { tone(50, 1.4, 'sawtooth', 0, .05, 420); noise(1.2, 0, .05, 800, 1, 'bandpass', 4000); [0, .25, .5, .62].forEach(t => noise(.06, .8 + t, .2, 2000, 3)); },
    slide: () => noise(.7, 0, .15, 400, 1, 'bandpass', 2400),
    door: () => { noise(1.4, 0, .25, 200, .7, 'lowpass', 900); tone(70, 1.2, 'sawtooth', 0, .04, 40); },
    slam: () => { noise(.6, 0, .9, 140, .7, 'lowpass'); tone(55, .6, 'sine', 0, .35, 30); },
    zap: () => { tone(1800, .6, 'sawtooth', 0, .05, 60); noise(.5, 0, .1, 3000, 2, 'bandpass', 300); },
    alarm: () => [0, .5, 1, 1.5].forEach(t => { tone(880, .25, 'square', t, .045); tone(660, .25, 'square', t + .25, .045); }),
    beep: () => tone(1046, .08, 'square', 0, .03),
    type: () => noise(.03, 0, .1, 3200, 3),
    down: () => { tone(420, 2.2, 'sawtooth', 0, .06, 30); noise(2, 0, .12, 2000, 1, 'lowpass', 100); },
    win: () => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, .35, 'triangle', i * .14, .07)),
  };
  function ambience() {
    amb.forEach(n => { try { n.stop(); } catch (e) {} }); amb = [];
    if (!S || !S.sound || !audio() || S.won || $('#start').hidden === false || $('#intro').hidden === false) return;
    const g = ac.createGain(); g.gain.value = 0; g.connect(master); g.gain.linearRampToValueAtTime(1, ac.currentTime + 2);
    const osc = (f, type, vol) => { const o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.value = f; og.gain.value = vol; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 280; o.connect(lp).connect(og).connect(g); o.start(); amb.push(o); return og; };
    if (S.room === 2) {
      osc(55, 'sawtooth', .05); osc(55.6, 'sawtooth', .05); const pulse = osc(110, 'sine', .0);
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .8; lg.gain.value = .03; lfo.connect(lg).connect(pulse.gain); lfo.start(); amb.push(lfo);
    } else if (S.done.fuses) osc(50, 'sine', .025);
    amb.push({ stop: () => g.disconnect() });
  }

  /* ---------- частици (прах в светлината, искри от реактора) ---------- */
  const cv = $('#fx'), cx = cv.getContext('2d'); let parts = [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fxLoop() {
    const W = cv.clientWidth, H = cv.clientHeight; if (cv.width !== W) { cv.width = W; cv.height = H; }
    cx.clearRect(0, 0, W, H);
    if (S && !reduce && !document.hidden && $('#modal').hidden) {
      const lab = S.room === 2, want = lab ? (S.won ? 0 : 46) : (S.done.fuses ? 36 : 14);
      while (parts.length < want) parts.push(lab ? { x: W * (.42 + Math.random() * .16), y: H * (.35 + Math.random() * .3), vx: (Math.random() - .5) * .4, vy: -.3 - Math.random() * .9, r: 1 + Math.random() * 2, life: 1, ember: true }
        : { x: Math.random() * W, y: Math.random() * H * .8, vx: (Math.random() - .5) * .15, vy: (Math.random() - .5) * .12, r: .6 + Math.random() * 1.6, life: 1 });
      if (parts.length > want) parts.length = want;
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.life -= p.ember ? .006 : .0015;
        if (p.life <= 0 || p.y < 0 || p.x < 0 || p.x > W) Object.assign(p, lab ? { x: W * (.42 + Math.random() * .16), y: H * (.4 + Math.random() * .25), life: 1 } : { x: Math.random() * W, y: Math.random() * H * .8, life: 1 });
        cx.globalAlpha = Math.max(0, Math.min(1, p.life)) * (p.ember ? .9 : .35);
        cx.fillStyle = p.ember ? (Math.random() < .5 ? '#ffb347' : '#ff5a3d') : '#fff3d0';
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill();
      }
      cx.globalAlpha = 1;
    }
    requestAnimationFrame(fxLoop);
  }
  requestAnimationFrame(fxLoop);

  /* ---------- тъмнина и фенерче ---------- */
  const vp = $('#viewport');
  const moveLight = e => { const r = vp.getBoundingClientRect(); vp.style.setProperty('--lx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); vp.style.setProperty('--ly', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%'); };
  vp.addEventListener('pointermove', moveLight); vp.addEventListener('pointerdown', moveLight);
  const flash = (cls = 'white') => { const f = $('#flash'); f.className = ''; void f.offsetWidth; f.className = cls; };
  const shake = () => { vp.classList.remove('shake'); void vp.offsetWidth; vp.classList.add('shake'); };

  /* ---------- предмети ---------- */
  const ICON = {
    uv: '<svg viewBox="0 0 32 32"><rect x="3" y="12" width="17" height="9" rx="3" fill="#cfd4d2"/><path d="M20 9h6v15h-6z" fill="#9b6bff"/><path d="M27 10l4-3M27 23l4 3M28 16.5h4" stroke="#b48cff" stroke-width="2"/></svg>',
    card: '<svg viewBox="0 0 32 32"><rect x="3" y="7" width="26" height="18" rx="3" fill="#e9e2cc"/><rect x="3" y="11" width="26" height="4" fill="#c0392b"/><rect x="6" y="18" width="9" height="4" fill="#b8862b"/></svg>',
    usb: '<svg viewBox="0 0 32 32"><rect x="10" y="4" width="12" height="9" rx="1" fill="#cfd4d2"/><rect x="12" y="6" width="3" height="3" fill="#333"/><rect x="17" y="6" width="3" height="3" fill="#333"/><rect x="8" y="12" width="16" height="17" rx="3" fill="#c0392b"/></svg>',
    note: '<svg viewBox="0 0 32 32"><path d="M6 4h20v24H6z" fill="#f3ecd9"/><path d="M10 10h12M10 15h12M10 20h8" stroke="#8a7d63" stroke-width="2"/></svg>',
  };
  const ITEMS = { uv: { n: 'UV фенерче', tool: 1 }, card: { n: 'Ключ-карта „Лаборатория“', tool: 1 }, usb: { n: 'Флашка на професора', tool: 1 } };
  const nameOf = id => ITEMS[id] ? ITEMS[id].n : id === 'noteA' ? `A = ${G.plain(P.A)}` : id === 'noteB' ? `B = ${G.plain(P.B)}` : id === 'noteC' ? `C = ${G.plain(P.C)}` : id;
  const has = id => S.inv.includes(id);
  function give(id) { if (!has(id)) { S.inv.push(id); sfx.item(); } renderInv(); save(); }
  function take(id) { S.inv = S.inv.filter(x => x !== id); if (S.sel === id) S.sel = null; renderInv(); save(); }
  function renderInv() {
    $('#inv').innerHTML = S.inv.length ? S.inv.map(id => `<button class="item${S.sel === id ? ' sel' : ''}${ITEMS[id] ? '' : ' note'}" data-item="${id}" type="button">${ICON[ITEMS[id] ? id : 'note']}<span>${nameOf(id)}</span></button>`).join('')
      : '<span class="empty">Празно. Огледайте стаята.</span>';
  }
  $('#inv').addEventListener('click', e => {
    const b = e.target.closest('[data-item]'); if (!b) return; const id = b.dataset.item; sfx.click();
    if (ITEMS[id]) { S.sel = S.sel === id ? null : id; say(S.sel ? `В ръката ви: ${nameOf(id)}. Кликнете там, където искате да го използвате.` : 'Прибрахте го.'); }
    else say(`Бележка: ${nameOf(id)}. Ще ви трябва за реактора.`);
    renderInv();
  });

  /* ---------- сцена ---------- */
  const OBJ = { 1: [['fuses', 'Таблото'], ['desk', 'Бюрото'], ['diary', 'Дневникът'], ['cryptex', 'Криптексът'], ['board', 'Дъската'], ['safe', 'Портретът'], ['shelf', 'Библиотеката'], ['clock', 'Часовникът'], ['door1', 'Вратата']],
    2: [['terminal', 'Компютърът'], ['poster', 'Плакатът'], ['reactor', 'Реакторът'], ['lasers', 'Лазерното табло'], ['flasks', 'Колбите'], ['exit', 'Изходът'], ['back', 'Към кабинета']] };
  function render() {
    if (!S) return;
    $('#scene').innerHTML = S.room === 1 ? ART.office(S, P) : ART.lab(S, P);
    vp.classList.toggle('dark', S.room === 1 && !S.done.fuses);
    vp.classList.toggle('lab', S.room === 2);
    $('#roomTag').textContent = S.room === 1 ? (S.done.fuses ? 'Кабинетът' : 'Кабинетът · токът е спрял') : (S.won ? 'Лабораторията · реакторът е изключен' : 'Лабораторията · Минус-реакторът');
    $('#objList').innerHTML = OBJ[S.room].map(([id, n]) => `<button type="button" data-go="${id}">${id === 'safe' && S.got.painting ? 'Сейфът' : n}</button>`).join('');
    $('#hudTeam').textContent = S.team; $('#hudHints').textContent = `Подсказки: ${S.hintCount}`; $('#btnSound').textContent = `Звук: ${S.sound ? 'вкл.' : 'изкл.'}`;
    renderInv(); drawTimer();
  }
  function go(room) { S.room = room; S.sel = null; sfx.door(); render(); save(); ambience(); }
  function act(id) {
    if (!S || S.won) return; sfx.click(); const sel = S.sel;
    if (sel && PUZ.fits[sel] !== id) { say(`${ITEMS[sel].n} не върши работа тук. Прибирате го.`); S.sel = null; renderInv(); return; }
    if (sel) { S.sel = null; renderInv(); }
    (PUZ.act[id] || (() => {}))(sel);
  }
  $('#scene').addEventListener('click', e => { const h = e.target.closest('.hot'); if (h) act(h.dataset.id); });
  $('#scene').addEventListener('keydown', e => { const h = e.target.closest('.hot'); if (h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); act(h.dataset.id); } });
  $('#objList').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) act(b.dataset.go); });
  function say(t) { const n = $('#narr'); n.textContent = t; n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop'); }

  /* ---------- листове с отблизо ---------- */
  let cur = null, lastFocus = null, onClose = null;
  function open(title, cls, html, hintId, bind, closeCb) {
    lastFocus = document.activeElement; onClose = closeCb || null;
    $('.sheet').className = 'sheet' + (cls ? ' ' + cls : ''); $('#mTitle').textContent = title; $('#mBody').innerHTML = html; cur = hintId || null; renderHints();
    $('#modal').hidden = false; if (bind) bind($('#mBody'));
    const f = $('#mBody').querySelector('input:not([disabled])'); (f || $('#mClose')).focus({ preventScroll: true });
  }
  function close() { if ($('#modal').hidden) return; $('#modal').hidden = true; cur = null; const cb = onClose; onClose = null; if (cb) cb(); render(); if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true }); }
  $('#mClose').addEventListener('click', close);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) close(); });
  function renderHints() {
    const bar = $('#mHints'), list = cur && PUZ.hints[cur];
    if (!list) { bar.hidden = true; return; }
    bar.hidden = false; const n = S.hints[cur] || 0;
    bar.innerHTML = list.slice(0, n).map((h, i) => `<p class="hint"><b>Подсказка ${i + 1}.</b> ${typeof h === 'function' ? h(P, S) : h}</p>`).join('') +
      (n < list.length ? `<button class="ghost small" type="button" id="btnHint">Подсказка ${n + 1} от ${list.length} · струва 1 минута</button>` : '');
    const b = $('#btnHint'); if (b) b.onclick = () => { S.hints[cur] = n + 1; S.hintCount++; S.t += 60; sfx.beep(); save(); renderHints(); render(); };
  }

  /* ---------- проверки ---------- */
  function wrong(id, el, fb, msg) {
    S.mistakes++; S.wrongs[id] = (S.wrongs[id] || 0) + 1; sfx.bad(); if (fb) { fb.className = 'fb bad'; fb.textContent = msg; }
    if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } save();
    return Math.min(4 + 3 * (S.wrongs[id] - 1), 20);
  }
  function right(fb, msg) { sfx.ok(); if (fb) { fb.className = 'fb good'; fb.textContent = msg; } save(); }
  function cool(btn, secs) {
    if (!btn) return; const label = btn.textContent; btn.disabled = true; let s = secs;
    const step = () => { if (!btn.isConnected) return; if (s <= 0) { btn.disabled = false; btn.textContent = label; return; } btn.textContent = `Изчакайте ${s} с`; s--; setTimeout(step, 1000); };
    step();
  }

  /* ---------- таймер ---------- */
  function drawTimer() {
    if (!S) return; const left = total() - S.t;
    $('#timer').innerHTML = seg(clock(left)); $('#timer').parentElement.classList.toggle('low', left < 300);
  }
  setInterval(() => {
    if (!S || S.won || !$('#start').hidden || !$('#intro').hidden) return;
    S.t++; drawTimer(); const left = total() - S.t;
    if (S.room === 1 && S.t % 2 === 0) sfx.tick();
    if (left === 300 && !S.warned.five) { S.warned.five = 1; sfx.alarm(); flash('red'); say('Остават 5 минути! Реакторът загрява. Побързайте!'); }
    if (left === 0 && !S.warned.zero) { S.warned.zero = 1; sfx.alarm(); flash('red'); shake(); say('Минус-реакторът се включи! Но професорът е забравил предпазителя — имате още малко време. Продължавайте!'); }
    if (S.t % 5 === 0) save();
  }, 1000);

  /* ---------- въведение ---------- */
  const STORY = ['22:47. Училището е празно.', 'Вашият отбор се промъква в лабораторията на Професор Минус.', 'Той е построил Минус-реактор — машина, която ще направи всяко число на света отрицателно.', 'Зад вас вратата се затръшва.', 'Токът спира.'];
  let introTimer = null;
  function intro(done) {
    const box = $('#introText'); $('#intro').hidden = false; box.innerHTML = ''; let li = 0, ci = 0, line = null;
    const finish = () => { clearTimeout(introTimer); $('#intro').hidden = true; sfx.slam(); shake(); flash('black'); done(); };
    $('#skipIntro').onclick = finish;
    const step = () => {
      if (li >= STORY.length) { introTimer = setTimeout(finish, 900); return; }
      if (!line) { line = document.createElement('p'); box.appendChild(line); }
      line.textContent = STORY[li].slice(0, ++ci); if (ci % 2) sfx.type();
      if (ci >= STORY[li].length) { li++; ci = 0; line = null; if (li === 4) sfx.slam(); introTimer = setTimeout(step, 700); }
      else introTimer = setTimeout(step, 38);
    };
    step();
  }

  /* ---------- начало, край, учител ---------- */
  function begin(team, minutes) {
    S = fresh(team, minutes); P = G.make(team); save(); $('#start').hidden = true; render();
    intro(() => { render(); ambience(); say('Тъмно е. Само фенерчето на телефона ви свети. Движете мишката (или докоснете екрана), за да огледате стаята. Някъде мига червена лампичка.'); });
  }
  function resume(st) { S = st; P = G.make(S.team); $('#start').hidden = true; render(); ambience(); say(S.room === 1 ? 'Обратно в кабинета. Продължавайте!' : 'Обратно в лабораторията. Продължавайте!'); }
  function showStart() {
    const st = load(), box = $('#resumeBox');
    if (st && st.team && !st.won && st.minutes) { box.hidden = false; $('#btnResume').textContent = `Продължи: отбор „${st.team}“ · остават ${clock(st.minutes * 60 - st.t)}`; $('#btnResume').onclick = () => resume(st); }
    else box.hidden = true;
    $('#start').hidden = false;
  }
  $('#startForm').addEventListener('submit', e => { e.preventDefault(); audio(); const n = $('#teamName').value.trim().replace(/\s+/g, ' ') || 'Отбор'; begin(n, +$('#minutes').value || 50); });

  function win() {
    S.won = true; save(); close(); ambience(); sfx.down(); flash('white'); render();
    say('Реакторът угасна. Числата в света са спасени! Тежката врата на изхода се плъзга встрани…');
    setTimeout(() => { sfx.door(); }, 1800);
    setTimeout(() => {
      sfx.win(); const inTime = S.t <= total(), stars = inTime && S.hintCount <= 3 ? 3 : inTime ? 2 : 1;
      const rank = ['Оцелели в мрака', 'Укротители на дробите', 'Майстори на знаците'][stars - 1];
      $('#winStats').innerHTML = `<p class="stars" aria-label="${stars} от 3 звезди">${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span></p><p class="rank">${rank}</p>
        <div class="winstat"><div>Отбор<b>${esc(S.team)}</b></div><div>Време<b>${clock(S.t)}</b></div><div>Подсказки<b>${S.hintCount}</b></div><div>Грешни опити<b>${S.mistakes}</b></div></div>`;
      $('#winNote').textContent = inTime ? '„Невъзможно! Победихте моя реактор с умножение и деление… Признавам, и положителните числа имат своя чар.“ — Проф. Минус' : '„Спряхте го в последния миг. Следващия път няма да имате този късмет!“ — Проф. Минус';
      $('#win').hidden = false;
    }, 3600);
  }
  $('#btnAgain').addEventListener('click', () => { try { localStorage.removeItem(KEY); } catch (e) {} S = null; $('#win').hidden = true; $('#teamName').value = ''; showStart(); });

  $('#keyForm').addEventListener('submit', e => {
    e.preventDefault(); const out = $('#keyOut');
    if ($('#keyPin').value.trim() !== PIN) { out.innerHTML = '<p class="fb bad">Грешен ПИН.</p>'; return; }
    const t = $('#keyTeam').value.trim().replace(/\s+/g, ' ') || 'Отбор', k = G.make(t), pl = G.plain;
    const rows = [['Бушони', k.fuses.slots.map((s, i) => `${i + 1}) ${s.html} = ${G.val(s.v)}`).join('<br>')],
      ['Сейф', `↻ ${k.safe.xs[0]}, ↺ ${k.safe.xs[1]}, ↻ ${k.safe.xs[2]}`], ['Криптекс', k.cipher.word],
      ['Машина', `вход A = ${k.machine.x}, изход ${pl(k.machine.y)}`], ['UV път', `колони по редове: ${k.grid.path.map(c => c + 1).join(', ')}; произведение ${pl(k.grid.T)}; B = ${pl(k.B)}`],
      ['Колби', k.flasks.xs.map(pl).join('; ') + ` → C = ${pl(k.C)}`], ['Лазери', k.wires.pairs.map(p => `${p.l} = ${p.r}`).join('<br>')],
      ['Реактор', `K = A · B : C = <b>${pl(k.K)}</b>`]];
    out.innerHTML = `<table class="keytab"><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table><p class="small">Отбор „${esc(t)}“. Името трябва да е изписано като в играта (главните и малките букви нямат значение).</p>`;
  });
  $('#btnSound').addEventListener('click', () => { if (!S) return; S.sound = !S.sound; save(); render(); ambience(); });
  $('#btnRules').addEventListener('click', () => { if (S && PUZ.act.rules) PUZ.act.rules(); });
  document.addEventListener('visibilitychange', () => { if (ac) document.hidden ? ac.suspend() : ac.resume(); });

  function boot(data) { if (data && data.team && !data.won && data.minutes) resume(data); else showStart(); }
  window.claude?.hot?.snapshot?.(() => S);

  return { boot, get S() { return S; }, get P() { return P; }, say, give, take, has, open, close, render, go, save, sfx, wrong, right, cool, win, esc, seg, flash, shake, ambience, total };
})();
