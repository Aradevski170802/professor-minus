/* Двигател на играта: състояние, сцена, инвентар, листове, подсказки, таймер, звук */
const E = (() => {
  const $ = s => document.querySelector(s);
  const TOTAL = 45 * 60, KEY = 'minus-lab-v1', PIN = '6789';
  let S = null, P = null;

  const fresh = team => ({ team, room: 1, t: 0, hints: {}, hintCount: 0, mistakes: 0, inv: [], sel: null, done: {}, got: {},
    lamps: Array(6).fill('?'), book: [], trials: 3, flasks: ['', '', '', ''], fok: [false, false, false, false], wires: {}, won: false, sound: true, seen2: false });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const clock = s => { const a = Math.abs(s); return `${s < 0 ? '+' : ''}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`; };

  /* ---------- звук ---------- */
  let ac = null;
  function beep(f, d = 0.12, type = 'sine', at = 0, vol = 0.07) {
    if (!S || !S.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at;
      o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  }
  const sfx = {
    click: () => beep(900, 0.05, 'square', 0, 0.03),
    ok: () => [523, 659, 784].forEach((f, i) => beep(f, 0.18, 'triangle', i * 0.1)),
    bad: () => beep(130, 0.35, 'sawtooth', 0, 0.06),
    item: () => [784, 1046].forEach((f, i) => beep(f, 0.15, 'sine', i * 0.08)),
    win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => beep(f, 0.3, 'triangle', i * 0.12)),
  };

  /* ---------- предмети ---------- */
  const card = s => `<svg viewBox="0 0 30 30"><rect x="3" y="2" width="24" height="26" rx="4" fill="#f3ecd9"/><text x="15" y="21" text-anchor="middle" font-size="16" fill="#16302a" font-family="Unbounded,sans-serif">${s}</text></svg>`;
  const ITEMS = {
    key: { name: 'Ключ „Лаборатория“', tool: true, icon: '<svg viewBox="0 0 30 30"><circle cx="9" cy="15" r="6" fill="none" stroke="#e0a93e" stroke-width="3"/><path d="M15 15h12m-4 0v5m-4-5v4" stroke="#e0a93e" stroke-width="3" fill="none"/></svg>' },
    uv: { name: 'UV фенерче', tool: true, icon: '<svg viewBox="0 0 30 30"><rect x="3" y="11" width="17" height="8" rx="3" fill="#ccc"/><path d="M20 9h5v12h-5z" fill="#b48cff"/><path d="M26 10l3-3M26 20l3 3M27 15h3" stroke="#b48cff" stroke-width="2"/></svg>' },
    tri: { name: '△ = броят на лампите с „−“ на таблото', icon: card('△') },
    circ: { name: '○ = |входното число на машината|', icon: card('○') },
    sq: { name: '□ = |x| от четвъртата колба', icon: card('□') },
    star: { name: () => `☆ = ${P.uv.d}`, icon: card('☆') },
  };
  const nameOf = id => (typeof ITEMS[id].name === 'function' ? ITEMS[id].name() : ITEMS[id].name);
  const has = id => S.inv.includes(id);
  function give(id) { if (!has(id)) { S.inv.push(id); sfx.item(); } renderInv(); save(); }
  function take(id) { S.inv = S.inv.filter(x => x !== id); if (S.sel === id) S.sel = null; renderInv(); save(); }
  function renderInv() {
    const box = $('#inv');
    box.innerHTML = S.inv.length ? S.inv.map(id => `<button class="item${S.sel === id ? ' sel' : ''}" data-item="${id}" type="button">${ITEMS[id].icon}<span class="cap">${nameOf(id)}</span></button>`).join('')
      : '<span class="small">Празно. Огледай стаята.</span>';
  }
  $('#inv').addEventListener('click', e => {
    const b = e.target.closest('[data-item]'); if (!b) return; const id = b.dataset.item; sfx.click();
    if (ITEMS[id].tool) { S.sel = S.sel === id ? null : id; say(S.sel ? `В ръката ти: ${nameOf(id)}. Кликни върху мястото, където искаш да го използваш.` : 'Прибра предмета.'); }
    else say(`Карта: ${nameOf(id)}`);
    renderInv();
  });

  /* ---------- разказвач ---------- */
  function say(t) { const n = $('#narr'); n.textContent = t; n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop'); }

  /* ---------- сцена ---------- */
  const OBJ = {
    1: [['letter', 'Писмото'], ['panel', 'Таблото'], ['drawer', 'Чекмеджето'], ['book', 'Библиотеката'], ['painting', 'Портретът'], ['clock', 'Часовникът'], ['door1', 'Вратата']],
    2: [['computer', 'Компютърът'], ['flasks', 'Колбите'], ['board', 'Дъската'], ['cabinet', 'Шкафът'], ['exit', 'Изходът'], ['back', 'Към кабинета']],
  };
  function drawStatic() {
    const cols = ['#c0392b', '#2e86c1', '#e0a93e', '#7d3c98', '#229954', '#d35400', '#f2efe4', '#5d6d7e'];
    let h = '', i = 0;
    [[104, 156], [164, 218], [226, 280], [288, 342], [350, 398]].forEach(([y0, y1], r) => {
      h += `<rect x="52" y="${y1}" width="176" height="6" fill="#6a4325"/>`;
      for (let x = 58; ;) {
        const w = 10 + ((i * 7) % 9), hh = (y1 - y0) - ((i * 5) % 14); if (x + w > 224) break;
        if (!(r === 2 && x + w > 146 && x < 178)) h += `<rect x="${x}" y="${y1 - hh}" width="${w}" height="${hh}" fill="${cols[i % cols.length]}" opacity=".85"/>`;
        x += w + 2; i++;
      }
    });
    $('#shelves').innerHTML = h;
  }
  function render() {
    $('#room1').toggleAttribute('hidden', S.room !== 1);
    $('#room2').toggleAttribute('hidden', S.room !== 2);
    $('#padlock').style.display = S.done.door1 ? 'none' : '';
    $('#drawerLed').setAttribute('fill', S.done.signs ? '#7bd88f' : '#e8553f');
    $('#panelLeds').innerHTML = [0, 1, 2, 3, 4, 5].map(i => `<circle cx="${724 + (i % 3) * 28}" cy="${212 + Math.floor(i / 3) * 34}" r="9" fill="${S.done.signs ? '#7bd88f' : '#39443f'}" stroke="#1d2523" stroke-width="2"/>`).join('');
    const fc = ['#e8553f', '#e0a93e', '#5dade2', '#b48cff'];
    $('#flaskArt').innerHTML = [0, 1, 2, 3].map(i => { const x = 420 + i * 68;
      return `<path d="M${x + 12} 262 v26 l-18 40 h52 l-18 -40 v-26z" fill="#d9f1ee" fill-opacity=".25" stroke="#d9f1ee" stroke-width="2"/>
      <path d="M${x - 1} 312 l-5 16 h52 l-5 -16z" fill="${S.fok[i] ? fc[i] : '#55605c'}"/>${S.fok[i] ? `<circle cx="${x + 20}" cy="306" r="3" fill="#fff" opacity=".6"/>` : ''}`; }).join('');
    $('#torchArt').style.display = S.got.uv ? 'none' : '';
    $('#cabLock').setAttribute('fill', S.done.flasks ? '#7bd88f' : '#e8553f');
    $('#pcText').textContent = S.done.machine ? '○ НАМЕРЕН' : S.done.pass ? 'МАШИНАТА' : 'ПАРОЛА?';
    $('#exitSign').setAttribute('fill', S.done.wires ? '#7bd88f' : '#3b5a50');
    $('#keyLeds').innerHTML = `<circle cx="944" cy="250" r="3" fill="${S.done.wires ? '#7bd88f' : '#3b5a50'}"/><circle cx="944" cy="262" r="3" fill="${S.done.wires ? '#7bd88f' : '#3b5a50'}"/>`;
    $('#uvMark').setAttribute('opacity', S.got.star ? '1' : '0');
    $('#objList').innerHTML = OBJ[S.room].map(([id, n]) => `<button type="button" data-go="${id}">${n}</button>`).join('');
    $('#hudTeam').textContent = `Отбор: ${S.team}`;
    $('#hudHints').textContent = `Подсказки: ${S.hintCount}`;
    $('#btnSound').textContent = `Звук: ${S.sound ? 'вкл.' : 'изкл.'}`;
    renderInv(); drawTimer();
  }
  function go(room) { S.room = room; sfx.click(); render(); save(); }
  function act(id) { if (!S || S.won) return; sfx.click(); PZ.act(id); }
  $('#scene').addEventListener('click', e => { const h = e.target.closest('.hot'); if (h) act(h.dataset.id); });
  $('#scene').addEventListener('keydown', e => { const h = e.target.closest('.hot'); if (h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); act(h.dataset.id); } });
  $('#objList').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) act(b.dataset.go); });

  /* ---------- листове ---------- */
  let curHint = null, lastFocus = null;
  function open(title, cls, html, hintId, bind) {
    lastFocus = document.activeElement;
    $('.sheet').className = 'sheet' + (cls ? ' ' + cls : '');
    $('#mTitle').textContent = title; $('#mBody').innerHTML = html; curHint = hintId || null; renderHints();
    $('#modal').hidden = false; if (bind) bind($('#mBody'));
    const f = $('#mBody').querySelector('input:not([disabled])'); (f || $('#mClose')).focus();
  }
  function close() { $('#modal').hidden = true; curHint = null; render(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  $('#mClose').addEventListener('click', close);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) close(); });

  function renderHints() {
    const bar = $('#mHints'); const list = curHint && PZ.HINTS[curHint];
    if (!list) { bar.hidden = true; return; }
    bar.hidden = false; const n = S.hints[curHint] || 0;
    bar.innerHTML = list.slice(0, n).map((h, i) => `<p class="hint"><b>Подсказка ${i + 1}:</b> ${typeof h === 'function' ? h(P, S) : h}</p>`).join('') +
      (n < list.length ? `<button class="ghost" type="button" id="btnHint">Подсказка ${n + 1} от ${list.length} (+1 минута)</button>` : '');
    const b = $('#btnHint'); if (b) b.onclick = () => { S.hints[curHint] = n + 1; S.hintCount++; S.t += 60; sfx.click(); save(); renderHints(); render(); };
  }

  /* ---------- проверки ---------- */
  function wrong(el, fb, msg) { S.mistakes++; sfx.bad(); if (fb) { fb.className = 'fb bad'; fb.textContent = msg; } if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } save(); }
  function right(fb, msg) { sfx.ok(); if (fb) { fb.className = 'fb good'; fb.textContent = msg; } save(); }
  function cool(btn, secs = 5) {
    const label = btn.textContent; btn.disabled = true; let s = secs;
    const step = () => { if (!btn.isConnected) return; if (s <= 0) { btn.disabled = false; btn.textContent = label; return; } btn.textContent = `Изчакай ${s} с…`; s--; setTimeout(step, 1000); };
    step();
  }

  /* ---------- таймер ---------- */
  function drawTimer() {
    if (!S) return; const left = TOTAL - S.t, el = $('#timer');
    el.textContent = clock(left); el.classList.toggle('low', left >= 0 && left < 300); el.classList.toggle('over', left < 0);
    const hand = $('#clockHand'); if (hand) hand.setAttribute('transform', `rotate(${(S.t % 60) * 6} 620 110)`);
  }
  setInterval(() => { if (!S || S.won || $('#start').hidden === false) return; S.t++; drawTimer(); if (S.t === TOTAL) say('Времето изтече! Но професорът е милостив — продължете, времето се брои в повече.'); if (S.t % 5 === 0) save(); }, 1000);

  /* ---------- начало, край, учител ---------- */
  function begin(team) {
    S = fresh(team); P = G.make(team); save();
    $('#start').hidden = true; render();
    say('Вратата зад вас се затръшна. На бюрото има писмо. Кликайте върху предметите в стаята.');
  }
  function resume(st) { S = st; P = G.make(S.team); $('#start').hidden = true; render(); say(S.room === 1 ? 'Обратно в кабинета. Продължавайте!' : 'Обратно в лабораторията. Продължавайте!'); }
  function showStart() {
    const st = load(); const box = $('#resumeBox');
    if (st && st.team && !st.won) { box.hidden = false; $('#btnResume').textContent = `Продължи: отбор „${st.team}“ (${clock(TOTAL - st.t)})`; $('#btnResume').onclick = () => resume(st); }
    else box.hidden = true;
    $('#start').hidden = false;
  }
  $('#startForm').addEventListener('submit', e => { e.preventDefault(); const n = $('#teamName').value.trim().replace(/\s+/g, ' ') || 'Отбор'; begin(n); });

  function win() {
    S.won = true; save(); sfx.win(); close();
    const inTime = S.t <= TOTAL, stars = inTime && S.hintCount <= 2 ? 3 : inTime ? 2 : 1;
    $('#winStats').innerHTML = `<p class="stars" aria-label="${stars} от 3 звезди">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</p>
      <div class="winstat"><div>Отбор<b>${esc(S.team)}</b></div><div>Време<b>${clock(S.t)}</b></div><div>Подсказки<b>${S.hintCount}</b></div><div>Грешни опити<b>${S.mistakes}</b></div></div>`;
    $('#winNote').textContent = inTime ? '„Браво! Знаците не ви уплашиха. Признавам — и положителните числа имат своя чар.“ — Проф. Минус'
      : '„Излязохте, макар и след звънеца. Упражнявайте знаците и пак елате!“ — Проф. Минус';
    $('#win').hidden = false;
  }
  $('#btnAgain').addEventListener('click', () => { try { localStorage.removeItem(KEY); } catch (e) {} S = null; $('#win').hidden = true; $('#teamName').value = ''; showStart(); });

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  $('#keyForm').addEventListener('submit', e => {
    e.preventDefault(); const out = $('#keyOut');
    if ($('#keyPin').value.trim() !== PIN) { out.innerHTML = '<p class="fb bad">Грешен ПИН.</p>'; return; }
    const t = $('#keyTeam').value.trim().replace(/\s+/g, ' ') || 'Отбор', k = G.make(t), f = G.fmt;
    out.innerHTML = `<table class="keytab"><tbody>
      <tr><td>Табло</td><td>${k.signs.lamps.map(l => l.ans).join('  ')} → △ = ${k.signs.digit}</td></tr>
      <tr><td>Парола</td><td>${k.cipher.word}</td></tr>
      <tr><td>Машина</td><td>вход ${f(k.machine.x)}, изход ${f(k.machine.y)} → ○ = ${k.machine.digit}</td></tr>
      <tr><td>Колби</td><td>${k.flasks.list.map(q => 'x = ' + f(q.x)).join('; ')} → □ = ${k.flasks.digit}</td></tr>
      <tr><td>Портрет</td><td>☆ = ${k.uv.d}</td></tr>
      <tr><td>Кабели</td><td>${k.wires.pairs.map(p => `${p.l} = ${p.r}`).join('<br>')}</td></tr>
      <tr><td>Код</td><td><b>${k.code}</b></td></tr></tbody></table><p>Отбор „${esc(t)}“. Името трябва да е изписано точно като в играта (главни и малки букви нямат значение).</p>`;
  });

  $('#btnSound').addEventListener('click', () => { if (!S) return; S.sound = !S.sound; save(); render(); });
  $('#btnRules').addEventListener('click', () => { if (S) PZ.rules(); });

  function boot(data) {
    drawStatic();
    if (data && data.team && !data.won) resume(data); else showStart();
  }
  window.claude?.hot?.snapshot?.(() => S);

  return { boot, get S() { return S; }, get P() { return P; }, say, give, take, has, open, close, render, renderHints, go, save, sfx, wrong, right, cool, win, esc, TOTAL };
})();
