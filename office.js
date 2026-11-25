/* Загадките в кабинета: бушони, дъска, сейф с диск, дневник, криптекс */
(() => {
  const $ = s => document.querySelector(s);
  const m = h => `<span class="math">${h}</span>`;
  const FB = '<p class="fb" id="fb" aria-live="polite"></p>';
  const ALPH = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ'.split('');
  const LAT = { A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', O: 'О', P: 'Р', C: 'С', T: 'Т', X: 'Х', Y: 'У' };
  const norm = s => String(s).toUpperCase().replace(/[ABEKMHOPCTXY]/g, c => LAT[c]);
  const dark = () => !E.S.done.fuses;
  PUZ.fits = { card: 'door1', usb: 'terminal', uv: 'poster' };

  PUZ.hints.fuses = ['Започнете със знака: пребройте отрицателните числа в израза. Четен брой → плюс, нечетен → минус. Така ще разпознаете капаните — бушоните със сгрешен знак.',
    'Превърнете десетичните дроби в обикновени (0,75 = 3/4; 1,5 = 3/2; 2,5 = 5/2) и съкращавайте, преди да умножите. Делението е умножение по реципрочното число.',
    P => `Първият израз е равен на ${G.val(P.fuses.slots[0].v)}.`];
  PUZ.hints.safe = ['Неизвестен множител = произведението : известния множител. Неизвестно делимо = частното · делителя.',
    'При третото уравнение работете отзад напред: първо премахнете последното действие, после следващото.',
    P => `x₁ = ${P.safe.xs[0]}. Внимавайте и с посоката: първото число се набира с въртене надясно (↻).`];
  PUZ.hints.cipher = ['Определете знака отделно, после пресметнете числото. Всички резултати са цели числа от −30 до 30.',
    P => `Първият израз е равен на ${G.plain(G.q(P.cipher.items[0].v))}, значи първата буква е „${P.cipher.items[0].L}“.`];
  PUZ.hints.cryptex = ['Думата се получава от шифъра в дневника на професора. Нужна е светлина, за да го прочетете.',
    P => `Думата има ${P.cipher.word.length} букви и започва с „${P.cipher.word[0]}“.`];

  /* ---------- 1. Бушоните ---------- */
  PUZ.act.fuses = () => {
    const S = E.S, F = E.P.fuses, done = S.done.fuses;
    const tileHTML = id => `<span class="fuse" data-t="${id}">${F.tiles[id].html}</span>`;
    const draw = b => {
      b.querySelectorAll('.socket').forEach(s => { const t = S.fuseSlots[+s.dataset.s]; s.classList.toggle('filled', t !== null); s.innerHTML = t !== null ? tileHTML(t) : '<span class="small">празно гнездо</span>'; });
      const used = new Set(S.fuseSlots.filter(x => x !== null));
      $('#tray').innerHTML = F.tiles.filter(t => !used.has(t.id)).map(t => tileHTML(t.id)).join('') || '<span class="small">Всички бушони са поставени.</span>';
    };
    E.open('Електрическото табло', 'metal', `
      <p>Главният прекъсвач е паднал, а бушоните са извадени. Всеки бушон носи число. Поставете във всяко гнездо бушона, равен на израза до него, и вдигнете прекъсвача. <b>Внимание:</b> три от бушоните са капани.</p>
      <div class="fusebox">${F.slots.map((s, i) => `<div class="fslot">${m(s.html)}<div class="socket" data-s="${i}"></div></div>`).join('')}</div>
      <div class="tiles" id="tray" aria-label="Свободни бушони"></div>
      <p class="small">Влачете бушон до гнездо или кликнете бушон, а после гнездо. Кликнете поставен бушон, за да го върнете.</p>
      <div class="lever"><button id="lever" class="${done ? 'down' : ''}" type="button" aria-label="Вдигни главния прекъсвач"></button><div><b>Главен прекъсвач</b><div class="meter" id="meter">${'<i></i>'.repeat(6)}</div></div></div>${FB}`, 'fuses', b => {
      draw(b); if (done) { b.querySelectorAll('#meter i').forEach(i => i.classList.add('on')); return; }
      let sel = null;
      const place = (tid, slot) => { const prev = S.fuseSlots.indexOf(tid); if (prev >= 0) S.fuseSlots[prev] = null; S.fuseSlots[slot] = tid; E.sfx.thunk(); E.save(); draw(b); };
      b.addEventListener('pointerdown', e => {
        const f = e.target.closest('.fuse'); if (!f) return; e.preventDefault();
        const tid = +f.dataset.t, sx = e.clientX, sy = e.clientY; let ghost = null;
        const mv = ev => { if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) { ghost = f.cloneNode(true); ghost.classList.add('drag'); document.body.appendChild(ghost); }
          if (ghost) { ghost.style.left = ev.clientX - 48 + 'px'; ghost.style.top = ev.clientY - 24 + 'px'; } };
        const up = ev => {
          removeEventListener('pointermove', mv); removeEventListener('pointerup', up);
          if (ghost) { ghost.remove(); const s = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.socket'); if (s) place(tid, +s.dataset.s); else if (S.fuseSlots.includes(tid)) { S.fuseSlots[S.fuseSlots.indexOf(tid)] = null; E.save(); draw(b); } return; }
          const inSlot = S.fuseSlots.indexOf(tid);
          if (inSlot >= 0 && sel === null) { S.fuseSlots[inSlot] = null; E.sfx.click(); E.save(); draw(b); return; }
          sel = sel === tid ? null : tid; b.querySelectorAll('.fuse').forEach(x => x.classList.toggle('sel', +x.dataset.t === sel)); E.sfx.click();
        };
        addEventListener('pointermove', mv); addEventListener('pointerup', up);
      });
      b.addEventListener('click', e => { const s = e.target.closest('.socket'); if (s && sel !== null && !e.target.closest('.fuse')) { place(sel, +s.dataset.s); sel = null; } });
      $('#lever').onclick = () => {
        const fb = $('#fb');
        if (S.fuseSlots.includes(null)) { fb.className = 'fb bad'; fb.textContent = 'Не всички гнезда имат бушон.'; return; }
        const c = S.fuseSlots.filter((t, i) => F.tiles[t].v.eq(F.slots[i].v)).length;
        b.querySelectorAll('#meter i').forEach((x, i) => x.classList.toggle('on', i < c));
        $('#lever').classList.add('down'); E.sfx.thunk();
        if (c === 6) {
          S.done.fuses = true; E.sfx.power(); E.right(fb, 'Шест зелени лампи! Токът тръгва…');
          setTimeout(() => { E.close(); E.flash('white'); E.ambience(); E.say('Лампите премигват и светват! Сега виждате всичко: дъската с надписи, портрета, бюрото с дневник и криптекс, вратата с четец за карти.'); }, 1300);
        } else { setTimeout(() => $('#lever') && $('#lever').classList.remove('down'), 700); E.cool($('#lever'), E.wrong('fuses', $('.fusebox'), fb, `Искри! Светнаха само ${c} от 6 лампи. Някои бушони не са на мястото си.`)); }
      };
    });
  };

  /* ---------- 2. Дъската ---------- */
  PUZ.act.board = () => {
    if (dark()) return E.say('На стената има черна дъска, но е твърде тъмно, за да прочетете надписите. Трябва ви ток.');
    const Sf = E.P.safe, dirs = ['↻ надясно', '↺ наляво', '↻ надясно'];
    E.open('Дъската на професора', 'chalk', `
      <p class="hand-t">„Комбинацията на моя сейф ли? Решете уравненията и въртете диска: надясно до x₁, наляво до x₂, надясно до x₃.“</p>
      ${Sf.eqs.map((e, i) => `<div class="chalkline"><b>x${'₁₂₃'[i]}:</b> ${m(e.html.replace(/x/g, 'x' + '₁₂₃'[i]))} <b>${dirs[i]}</b></div>`).join('')}
      <p class="small" style="margin-top:12px">По диска на сейфа има числата от −20 до 19.</p>`, 'safe');
  };

  /* ---------- 3. Портретът и сейфът ---------- */
  PUZ.act.safe = () => {
    const S = E.S;
    if (!S.got.painting) { S.got.painting = true; E.sfx.slide(); E.render(); return E.say(dark() ? 'Опипвате рамката в тъмното… Портретът е на панти и се отваря като врата! Отзад има нещо метално.' : 'Портретът се оказа на панти! Зад него има стоманен сейф с кръгъл диск.'); }
    if (S.done.safe) return E.say('Сейфът е празен. На дъното е надраскано: „−·− = +“.');
    const xs = E.P.safe.xs; let idx = 20, lastDir = null, seq = [];
    const dialSVG = () => `<svg viewBox="-110 -110 220 220"><circle r="104" fill="#1b1f1f" stroke="#8a9593" stroke-width="4"/>
      <g id="dialg" style="transition:transform .08s">${[...Array(40)].map((_, i) => { const a = i * 9, big = i % 5 === 0, n = i - 20;
        return `<g transform="rotate(${a})"><line y1="-96" y2="${big ? -84 : -89}" stroke="#e9eeec" stroke-width="${big ? 2.5 : 1.2}"/>${big ? `<text y="-70" text-anchor="middle" font-size="12" font-weight="700" fill="#e9eeec" font-family="Onest">${n < 0 ? '−' + -n : n}</text>` : ''}</g>`; }).join('')}
      <circle r="44" fill="url(#dg)" stroke="#2a2f2e" stroke-width="3"/>${[0, 60, 120, 180, 240, 300].map(a => `<rect x="-4" y="-50" width="8" height="12" rx="2" fill="#6d7876" transform="rotate(${a})"/>`).join('')}</g>
      <defs><radialGradient id="dg"><stop offset="0" stop-color="#c9d1cf"/><stop offset="1" stop-color="#4a5352"/></radialGradient></defs>
      <path d="M0 -108 l-8 -2 h16z" fill="#ff3b2f"/><polygon points="-7,-110 7,-110 0,-98" fill="#ff3b2f"/></svg>`;
    E.open('Сейфът', 'metal', `
      <div class="safebox"><div><div class="dialwrap" id="dial">${dialSVG()}</div>
        <div class="dialbtns"><button class="ghost" id="dl" type="button">↺ наляво</button><button class="ghost" id="dr" type="button">↻ надясно</button></div></div>
        <div><p>Въртете диска (влачете го или ползвайте бутоните). Когато червената стрелка сочи нужното число, натиснете „Запомни“. Сейфът помни и посоката, в която сте въртели.</p>
          <div class="readout" id="rd"></div><div class="seq" id="seq"></div>
          <div class="row"><button class="ghost" id="mark" type="button">Запомни числото</button><button class="ghost small" id="clr" type="button">Изчисти</button></div>
          <button class="primary" id="open" type="button">Дръпни дръжката</button>${FB}</div></div>`, 'safe', b => {
      const upd = () => { $('#dialg').style.transform = `rotate(${-(idx * 9)}deg)`; const n = idx - 20; $('#rd').textContent = n < 0 ? '−' + -n : n;
        $('#seq').innerHTML = seq.map(s => `<span>${s.d === 'R' ? '↻' : '↺'} ${s.n < 0 ? '−' + -s.n : s.n}</span>`).join('') || '<span>— — —</span>'; };
      const turn = d => { lastDir = d; idx = (idx + (d === 'R' ? -1 : 1) + 40) % 40; E.sfx.tick(); upd(); };
      let hold = null; const rep = d => { turn(d); hold = setTimeout(() => rep(d), hold ? 70 : 350); };
      [['#dl', 'L'], ['#dr', 'R']].forEach(([s, d]) => { const el = $(s); el.onpointerdown = e => { e.preventDefault(); hold = null; rep(d); }; ['pointerup', 'pointerleave'].forEach(ev => el.addEventListener(ev, () => { clearTimeout(hold); hold = null; })); });
      const dial = $('#dial'); let last = null, acc = 0;
      const ang = e => { const r = dial.getBoundingClientRect(); return Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) * 180 / Math.PI; };
      dial.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; dial.setPointerCapture(e.pointerId); last = ang(e); });
      dial.addEventListener('pointermove', e => { if (last === null) return; let a = ang(e), d = a - last; if (d > 180) d -= 360; if (d < -180) d += 360; last = a; acc += d; while (acc >= 9) { acc -= 9; turn('R'); } while (acc <= -9) { acc += 9; turn('L'); } });
      dial.addEventListener('pointerup', () => { last = null; acc = 0; });
      $('#mark').onclick = () => { if (!lastDir) { $('#fb').className = 'fb bad'; $('#fb').textContent = 'Първо завъртете диска.'; return; } if (seq.length >= 3) seq.shift(); seq.push({ n: idx - 20, d: lastDir }); E.sfx.thunk(); upd(); };
      $('#clr').onclick = () => { seq = []; upd(); };
      $('#open').onclick = () => {
        const fb = $('#fb'), ok = seq.length === 3 && seq.every((s, i) => s.n === xs[i] && s.d === 'RLR'[i]);
        if (ok) { S.done.safe = true; E.sfx.slide(); E.give('uv'); E.give('card'); E.right(fb, 'Щрак! Вратата на сейфа се отвори.');
          setTimeout(() => { E.close(); E.say('В сейфа има UV фенерче и ключ-карта с надпис „Лаборатория“. И двете са в инвентара.'); }, 1200); }
        else { const msg = seq.length < 3 ? 'Дръжката не помръдва. Нужни са три запомнени числа.' : 'Дръжката не помръдва. Грешна комбинация или посока.'; seq = []; upd(); E.cool($('#open'), E.wrong('safe', dial, fb, msg)); }
      };
      upd();
    });
  };

  /* ---------- 4. Дневникът ---------- */
  PUZ.act.diary = () => {
    if (dark()) return E.say('Напипвате кожена тетрадка, но страниците са твърде тъмни. Трябва ви светлина.');
    const S = E.S, C = E.P.cipher;
    E.open('Дневникът на Професор Минус', 'paper', `
      <p class="hand-t">„Паролата на криптекса е скрита тук. Всяко число в моята таблица е буква. Само истински майстор на знаците ще я разчете.“</p>
      <p>Пресметнете всеки израз, намерете резултата в таблицата и запишете буквата. Таблицата е подредена като числова ос.</p>
      <div class="cgrid">${C.items.map((it, i) => `<div class="cbox"><small>Буква ${i + 1}</small>${m(it.html)}<input class="ans" data-i="${i}" maxlength="1" value="${E.esc(S.book[i] || '')}" aria-label="Буква ${i + 1}"></div>`).join('')}</div>
      <div class="ctable">${C.table.map(t => `<div><b>${t.v < 0 ? '−' + -t.v : t.v}</b><span>${t.L}</span></div>`).join('')}</div>`, 'cipher', b => {
      b.querySelectorAll('input').forEach(inp => inp.oninput = () => { inp.value = norm(inp.value).slice(-1); S.book[+inp.dataset.i] = inp.value; E.save(); if (inp.value) { const n = b.querySelector(`input[data-i="${+inp.dataset.i + 1}"]`); if (n) n.focus(); } });
    });
  };

  /* ---------- 5. Криптексът ---------- */
  PUZ.act.cryptex = () => {
    const S = E.S, W = E.P.cipher.word, n = W.length, done = S.done.cryptex;
    if (!S.cryptex || S.cryptex.length !== n) S.cryptex = Array(n).fill(0);
    let focus = 0;
    E.open('Криптексът', '', `
      <p>Месингов цилиндър с ${n} пръстена от букви. Ако подредите правилната дума, той ще се отвори сам. Вътре нещо потраква.</p>
      <div class="cryptex${done ? ' open' : ''}" id="cx" tabindex="0" aria-label="Криптекс: пишете букви или ползвайте стрелките"><div class="cap l"></div>
        ${[...Array(n)].map((_, i) => `<div class="ring" data-r="${i}"><button type="button" data-d="-1" aria-label="Предишна буква">▲</button><div class="win"></div><button type="button" data-d="1" aria-label="Следваща буква">▼</button></div>`).join('')}<div class="cap r"></div></div>
      <p class="small">Кликнете ▲ ▼ или кликнете пръстен и пишете букви от клавиатурата.</p>${FB}`, 'cryptex', b => {
      const upd = () => b.querySelectorAll('.ring').forEach((r, i) => { r.querySelector('.win').textContent = done ? W[i] : ALPH[S.cryptex[i]]; r.classList.toggle('focus', i === focus && !done); });
      const check = () => {
        if (S.cryptex.map(i => ALPH[i]).join('') !== W) return;
        S.done.cryptex = true; $('#cx').classList.add('open'); E.sfx.slide(); E.give('usb'); E.right($('#fb'), 'Пръстените щракват и капачките се разделят!');
        setTimeout(() => { E.close(); E.say('В криптекса има червена флашка с етикет „МАШИНАТА“. Взехте я.'); }, 1500);
      };
      if (!done) {
        b.querySelectorAll('.ring button').forEach(btn => btn.onclick = () => { const i = +btn.closest('.ring').dataset.r; focus = i; S.cryptex[i] = (S.cryptex[i] + +btn.dataset.d + ALPH.length) % ALPH.length; E.sfx.tick(); E.save(); upd(); check(); });
        b.querySelectorAll('.ring .win').forEach(w => w.onclick = () => { focus = +w.parentElement.dataset.r; upd(); $('#cx').focus(); });
        $('#cx').onkeydown = e => {
          const k = norm(e.key);
          if (ALPH.includes(k)) { S.cryptex[focus] = ALPH.indexOf(k); focus = Math.min(n - 1, focus + 1); E.sfx.tick(); }
          else if (e.key === 'ArrowLeft') focus = Math.max(0, focus - 1); else if (e.key === 'ArrowRight') focus = Math.min(n - 1, focus + 1);
          else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { S.cryptex[focus] = (S.cryptex[focus] + (e.key === 'ArrowUp' ? -1 : 1) + ALPH.length) % ALPH.length; E.sfx.tick(); }
          else if (e.key === 'Backspace') focus = Math.max(0, focus - 1); else return;
          e.preventDefault(); E.save(); upd(); check();
        };
        $('#cx').focus();
      }
      upd();
    });
  };

  /* ---------- дребни предмети и вратата ---------- */
  PUZ.act.shelf = () => E.say(dark() ? 'Рафтове с книги. В тъмното не се четат заглавията.' : 'Заглавия: „Рационални числа за напреднали“, „Знаците и аз“, „Как да превърнем света в минус“. На гърба на една книга с молив: „Деленето е умножение по реципрочното число.“');
  PUZ.act.clock = () => { const left = E.total() - E.S.t; E.say(`Часовникът показва −12 вместо 12. ${left > 0 ? `До включването на реактора остават около ${Math.ceil(left / 60)} минути.` : 'Реакторът вече се включи!'}`); };
  PUZ.act.desk = () => E.say(dark() ? 'Напипвате масивно бюро. Отгоре има тетрадка и някакъв метален цилиндър.' : 'Масивно бюро. Върху него: дневник с кожена корица и месингов криптекс с букви. В чекмеджето — само гумички във форма на минус.');
  const labIntro = () => { if (!E.S.got.labSeen) { E.S.got.labSeen = true; E.save(); E.say('Лабораторията! В средата бучи Минус-реакторът, обграден от червени лазери. На конзолата свети: „K = A · B : C“. Намерете A, B и C!'); } else E.say('Лабораторията. Реакторът бучи.'); };
  PUZ.act.door1 = sel => {
    const S = E.S;
    if (S.done.door1) { E.go(2); return labIntro(); }
    if (sel === 'card') { S.done.door1 = true; E.take('card'); E.sfx.beep(); E.render(); setTimeout(() => { E.go(2); labIntro(); }, 700); return E.say('Бип! Лампичката светва в зелено и ключалката щраква.'); }
    E.say(dark() ? 'Напипвате врата. До нея мига малка червена лампичка — четец за карти.' : E.has('card') ? 'Четецът мига в червено. Кликнете ключ-картата в инвентара и после вратата.' : 'Вратата към лабораторията е заключена. До нея има четец за ключ-карти.');
  };
  PUZ.act.back = () => { E.go(1); E.say('Обратно в кабинета.'); };
  PUZ.act.rules = () => E.open('Как се играе', '', `
    <p>Кликайте предметите в стаята или бутоните под картинката. Някои предмети отварят загадка в близък план, други дават находки за инвентара.</p>
    <p>Инструментите (фенерче, карта, флашка) се ползват така: кликнете предмета в инвентара, после мястото, където искате да го използвате.</p>
    <p>Всяка загадка има подсказки. Всяка подсказка струва 1 минута. След грешен опит уредът блокира за няколко секунди — и всеки следващ път за по-дълго. Мислете, не налучквайте.</p>
    <p>Пишете минус с тирето (−3 или -3), десетичните числа със запетая (2,5), дробите с наклонена черта (3/4), смесените числа с интервал (1 1/2).</p>
    <p>Играта се пази сама. Ако презаредите страницата, изберете „Продължи“.</p>`);
})();
