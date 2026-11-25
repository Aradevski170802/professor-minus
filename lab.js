/* Загадките в лабораторията: терминал и машина, UV път, колби, лазери, реактор */
(() => {
  const $ = s => document.querySelector(s);
  const m = h => `<span class="math">${h}</span>`;
  const FB = '<p class="fb" id="fb" aria-live="polite"></p>';
  const { val, plain, parse, same, q } = G;

  PUZ.hints.machine = ['Тръгнете отзад напред. Обратното на „· k“ е „: k“, а обратното на „: k“ е „· k“ — със същото число и същия знак.',
    P => `Преди последната операция числото е ${plain(P.machine.vals[3])}.`, P => `След първата операция числото е ${plain(P.machine.vals[1])}.`];
  PUZ.hints.grid = [P => `Произведението ${P.grid.T.n < 0 ? 'е отрицателно, значи по пътя има нечетен брой отрицателни числа' : 'е положително, значи по пътя има четен брой отрицателни числа'}.`,
    P => `Пътят започва от колона ${P.grid.path[0] + 1} на горния ред.`, P => `Първите три числа по пътя са в колони ${P.grid.path.slice(0, 3).map(c => c + 1).join(', ')}.`];
  PUZ.hints.flasks = ['Неизвестен множител = произведението : известния множител. Неизвестно делимо = частното · делителя. Неизвестен делител = делимото : частното.',
    P => { const f = P.flasks.list[3]; return `Четвъртата колба: първо ${f.d < 0 ? 'прибавете' : 'извадете'} ${Math.abs(f.d)} към двете страни. Получавате ${G.opnd(f.a)} · x = ${val(f.c.add(q(-f.d)))}.`; },
    'C е произведението на четирите отговора. Първо определете знака (колко от тях са отрицателни), после умножете модулите и съкратете.'];
  PUZ.hints.wires = ['Реципрочното на смесено число: превърнете го в неправилна дроб (2 1/3 = 7/3) и я обърнете: 3/7. Знакът остава същият.',
    'Делението на дроб е умножение по реципрочната ѝ. Нула, разделена на число, различно от нула, е нула.', P => `${P.wires.pairs[1].l} = ${P.wires.pairs[1].r}`];
  PUZ.hints.reactor = ['A е входното число на машината, B — числото, в което завършва UV пътят, C — произведението от колбите. Бележките са в инвентара.',
    'Пресметнете отляво надясно: първо A · B, после разделете на C. Помислете за знака на K, преди да смятате.', P => `A · B = ${plain(P.A.mul(P.B))}.`];

  /* ---------- 1. Терминалът и машината ---------- */
  let log = null;
  PUZ.act.terminal = sel => {
    const S = E.S, M = E.P.machine;
    if (!S.done.usb) {
      if (sel !== 'usb') return E.say(E.has('usb') ? 'Мониторът мига: „ВЪВЕДИ USB“. Кликнете флашката в инвентара, после компютъра.' : 'Старият монитор мига: „ВЪВЕДИ USB“. Трябва ви флашка.');
      S.done.usb = true; E.take('usb'); E.sfx.beep(); E.render();
    }
    const boot = ['MINUS-OS v−2.0', 'Проверка на паметта… −640 KB… OK', 'USB: МАШИНАТА.exe — заредена', 'Добре дошли, професоре. (Вие не сте професорът, нали?)', 'Напишете ПОМОЩ.'];
    const pipe = `<div class="pipe" id="pipe"><div class="node" data-n="0"><small>ВХОД</small><b>${S.done.machine ? plain(M.vals[0]) : 'A = ?'}</b></div>${M.steps.map((s, i) => `<span>→</span><div class="node" data-n="${i + 1}"><small></small><b>${s.html}</b></div>`).join('')}<span>→</span><div class="node"><small>ИЗХОД</small><b>${val(M.y)}</b></div></div>`;
    E.open('Компютърът на професора', 'term', `<div class="screen" id="scr"></div>${pipe}
      <div class="cmds">${['ПОМОЩ', 'ДНЕВНИК', 'МАШИНА', 'ПРОБА ', 'ВХОД '].map(c => `<button type="button" data-c="${c}">${c.trim()}</button>`).join('')}</div>
      <div class="row"><span>&gt;</span><input class="ans" id="cmd" autocomplete="off" spellcheck="false" style="flex:1;min-width:10em" aria-label="Команда"><button class="primary" id="run" type="button">Enter</button></div>`, 'machine', () => {
      const scr = $('#scr'), print = (t, cls) => { log.push(t); scr.textContent = log.slice(-14).join('\n'); };
      if (!log) { log = []; boot.forEach((l, i) => setTimeout(() => { print(l); E.sfx.type(); }, i * 260)); } else scr.textContent = log.slice(-14).join('\n');
      const exec = raw => {
        const s = raw.trim(), [w, ...rest] = s.split(/\s+/), c = w ? w.toUpperCase() : '', arg = rest.join(' ');
        if (!s) return; print('> ' + s);
        if (['ПОМОЩ', 'HELP'].includes(c)) print('ДНЕВНИК — бележките на професора\nМАШИНА — какво прави машината\nПРОБА <число> — пробно пускане (остават ' + S.trials + ')\nВХОД <число> — въведи числото A');
        else if (['ДНЕВНИК', 'LOG'].includes(c)) print('Ден 1: Реакторът е почти готов.\nДен 2: Скрих ключа на конзолата в три числа: A, B и C.\nДен 3: A е входът на машината. Никой няма да се сети да смята отзад напред!');
        else if (['МАШИНА', 'MACHINE'].includes(c)) print(`Машината взема цяло число A, прилага 4 операции и дава ${plain(M.y)}.\nНамерете A и го въведете с ВХОД.`);
        else if (['ПРОБА', 'RUN'].includes(c)) {
          const v = parse(arg); if (!v) return print('Грешка: напишете число, например ПРОБА 5');
          if (S.trials <= 0) return print('Енергията за проби свърши.');
          S.trials--; E.save(); let cur = v; $('[data-n="0"] b').textContent = val(v);
          M.steps.forEach((st, i) => setTimeout(() => { cur = st.o === '·' ? cur.mul(st.k.q) : cur.div(st.k.q); const n = $(`[data-n="${i + 1}"]`); if (!n) return; n.querySelector('small').textContent = '= ' + plain(cur); n.classList.add('lit'); E.sfx.beep();
            if (i === 3) { print(`Изход: ${plain(cur)}${same(cur, M.y) ? '  ← съвпада!' : `  (целта е ${plain(M.y)})`}. ${S.trials === 1 ? 'Остава 1 проба' : S.trials ? `Остават ${S.trials} проби` : 'Пробите свършиха'}.`); setTimeout(() => document.querySelectorAll('.node.lit').forEach(x => x.classList.remove('lit')), 1500); } }, 420 * (i + 1)));
        } else if (['ВХОД', 'INPUT'].includes(c)) {
          if (S.done.machine) return print('A вече е намерено.');
          const v = parse(arg); if (!v) return print('Грешка: напишете число, например ВХОД -7');
          if (same(v, E.P.A)) { S.done.machine = true; E.give('noteA'); E.sfx.ok(); print(`ДОСТЪП РАЗРЕШЕН. A = ${plain(v)}. Записано в бележка.`); $('[data-n="0"] b').textContent = plain(v); E.say(`Компютърът потвърди: A = ${plain(v)}. Бележката е в инвентара.`); }
          else { const s2 = E.wrong('machine', $('#scr'), null, ''); print(`ГРЕШНО. Машината прегрява — изчакайте ${s2} секунди.`); E.cool($('#run'), s2); }
        } else print('Непозната команда. Напишете ПОМОЩ.');
      };
      const cmd = $('#cmd');
      $('#run').onclick = () => { if ($('#run').disabled) return; exec(cmd.value); cmd.value = ''; cmd.focus(); };
      cmd.onkeydown = e => { E.sfx.key(); if (e.key === 'Enter') $('#run').onclick(); };
      document.querySelectorAll('.cmds button').forEach(b => b.onclick = () => { cmd.value = b.dataset.c; cmd.focus(); if (!b.dataset.c.endsWith(' ')) $('#run').onclick(); });
    });
  };

  /* ---------- 2. UV плакатът ---------- */
  PUZ.act.poster = sel => {
    const S = E.S, Gd = E.P.grid;
    if (!S.got.uvGrid && sel !== 'uv') return E.say('Плакат „ЗНАЦИТЕ“. В долния ъгъл някой е дописал: „Истината свети само в ултравиолетово.“');
    if (!S.got.uvGrid) { S.got.uvGrid = true; E.sfx.zap(); E.save(); }
    E.open('Скритата мрежа', 'uv', `
      <p>В лилавата светлина по плаката светва мрежа от числа и надпис с невидимо мастило:</p>
      <p class="uvtarget">Пътят, чието произведение е ${val(Gd.T)}</p>
      <p>Започнете от кое да е число на горния ред и слизайте ред по ред — право надолу или по диагонал в съседна колона. Пътят минава през точно 5 числа. Числото, в което пътят свършва, е <b>B</b>.</p>
      <div class="gridp" id="gp"></div>
      <div class="row"><button class="primary" id="go" type="button">Провери пътя</button><button class="ghost" id="clr" type="button">Изчисти</button></div>${FB}`, 'grid', b => {
      const path = S.gridPath, done = S.done.grid;
      const draw = () => {
        $('#gp').innerHTML = Gd.cells.map((row, r) => row.map((c, k) => { const on = path[r] === k, nx = !done && r === path.length && (r === 0 || Math.abs(k - path[r - 1]) <= 1);
          return `<button class="gcell${on ? ' on' : ''}${nx ? ' next' : ''}" type="button" data-r="${r}" data-c="${k}">${G.show(c)}</button>`; }).join('')).join('');
      };
      draw(); if (done) { $('#go').disabled = true; $('#fb').className = 'fb good'; $('#fb').textContent = `Решено: B = ${plain(E.P.B)}.`; return; }
      $('#gp').onclick = e => {
        const c = e.target.closest('.gcell'); if (!c) return; const r = +c.dataset.r, k = +c.dataset.c;
        if (r > path.length || (r > 0 && Math.abs(k - path[r - 1]) > 1)) return;
        path.length = r; path.push(k); E.sfx.tick(); E.save(); draw();
      };
      $('#clr').onclick = () => { path.length = 0; E.save(); draw(); };
      $('#go').onclick = () => {
        const fb = $('#fb');
        if (path.length < 5) { fb.className = 'fb bad'; fb.textContent = 'Пътят трябва да мине през 5 числа — по едно на всеки ред.'; return; }
        const prod = path.reduce((p, k, r) => p.mul(Gd.cells[r][k].q), q(1));
        if (same(prod, Gd.T)) { S.done.grid = true; E.give('noteB'); E.right(fb, `Пътят засия! B = ${plain(E.P.B)}.`); E.say(`UV пътят е намерен: B = ${plain(E.P.B)}. Бележката е в инвентара.`); $('#go').disabled = true; draw(); }
        else { const s2 = E.wrong('grid', $('#gp'), fb, 'Мастилото угасва — произведението по този път е друго.'); path.length = 0; E.save(); draw(); E.cool($('#go'), s2); }
      };
    });
  };

  /* ---------- 3. Колбите и смесителят ---------- */
  const fcol = ['#ff5a4e', '#ffc23d', '#4fc3ff', '#b48cff'];
  const flaskSvg = (i, ok) => `<svg viewBox="0 0 64 82" aria-hidden="true"><path d="M24 4v24L5 68a7 7 0 0 0 6 10h42a7 7 0 0 0 6-10L40 28V4z" fill="#d9f1ee" fill-opacity=".1" stroke="#d9f1ee" stroke-width="3"/>
    <path class="liq" d="M14 50h36l9 18a7 7 0 0 1-6 10H11a7 7 0 0 1-6-10z" fill="${ok ? fcol[i] : '#3a4442'}"/>${ok ? '<circle class="bub" cx="26" cy="62" r="3" fill="#fff" opacity=".7"/><circle class="bub" cx="38" cy="66" r="2" fill="#fff" opacity=".7" style="animation-delay:.6s"/>' : ''}</svg>`;
  PUZ.act.flasks = () => {
    const S = E.S, F = E.P.flasks;
    E.open('Колбите и смесителят', '', `
      <p>Четири колби, на всяка — уравнение. Намерете неизвестното <b>x</b>. Когато и четирите светнат, смесителят ще поиска числото <b>C</b> — произведението на четирите отговора.</p>
      <div class="fgrid">${F.list.map((f, i) => `<div class="fcard" data-i="${i}">${flaskSvg(i, S.fok[i])}<small>x${'₁₂₃₄'[i]} · ${f.kind}</small>${m(f.html.replace(/x/g, 'x' + '₁₂₃₄'[i]))}
        <input class="ans${S.fok[i] ? ' ok' : ''}" data-i="${i}" inputmode="text" autocomplete="off" placeholder="x${'₁₂₃₄'[i]} = ?" aria-label="x${i + 1}" value="${E.esc(S.fok[i] ? plain(F.xs[i]) : S.flasks[i])}" ${S.fok[i] ? 'disabled' : ''}></div>`).join('')}</div>
      <button class="primary" id="go" type="button">Провери колбите</button>
      <div id="mix" ${S.fok.every(Boolean) ? '' : 'hidden'}><p style="margin-top:14px"><b>Смесител:</b> C = x₁ · x₂ · x₃ · x₄ = ?</p>
        <div class="row"><input class="ans" id="cIn" autocomplete="off" aria-label="C" ${S.done.flasks ? `disabled value="${plain(F.C)}"` : ''}><button class="primary" id="mixGo" type="button" ${S.done.flasks ? 'disabled' : ''}>Смеси</button></div></div>${FB}
      <p class="small">Десетичните числа пишете със запетая (−0,5), дробите — с наклонена черта (−1/2).</p>`, 'flasks', b => {
      b.querySelectorAll('.fcard input').forEach(inp => inp.oninput = () => { S.flasks[+inp.dataset.i] = inp.value; E.save(); });
      if (S.fok.every(Boolean)) $('#go').disabled = true;
      $('#go').onclick = () => {
        const fb = $('#fb'); let bad = 0, empty = 0;
        F.list.forEach((f, i) => {
          if (S.fok[i]) return; const inp = b.querySelector(`.fcard input[data-i="${i}"]`);
          if (!inp.value.trim()) { empty++; return; }
          if (same(parse(inp.value), F.xs[i])) { S.fok[i] = true; inp.disabled = true; inp.classList.add('ok'); b.querySelector(`.fcard[data-i="${i}"] svg`).outerHTML = flaskSvg(i, true); E.sfx.item(); }
          else { bad++; inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); }
        });
        const n = S.fok.filter(Boolean).length; E.save();
        if (n === 4) { $('#go').disabled = true; $('#mix').hidden = false; E.right(fb, 'И четирите колби светят! Смесителят чака числото C.'); $('#cIn').focus(); }
        else if (bad) E.cool($('#go'), E.wrong('flasks', null, fb, `Светят ${n} от 4 колби. Сивите имат грешен отговор.`));
        else { fb.className = 'fb'; fb.textContent = empty ? `Светят ${n} от 4 колби. Попълнете и останалите.` : ''; }
      };
      $('#mixGo').onclick = () => {
        const fb = $('#fb');
        if (same(parse($('#cIn').value), F.C)) { S.done.flasks = true; E.give('noteC'); E.right(fb, `Течностите се смесват в ярко сияние. C = ${plain(F.C)}.`); E.say(`Смесителят потвърди: C = ${plain(F.C)}. Бележката е в инвентара.`); $('#mixGo').disabled = true; $('#cIn').disabled = true; }
        else E.cool($('#mixGo'), E.wrong('flasks', $('#cIn'), fb, 'Сместа побуля и угасна. Проверете знака и умножението.'));
      };
    });
  };

  /* ---------- 4. Лазерната защита ---------- */
  PUZ.act.lasers = () => {
    const S = E.S, W = E.P.wires, cols = ['#ff5a4e', '#ffc23d', '#4fc3ff', '#4dff88', '#b48cff', '#f2efe4', '#ff8fd0'], n = W.pairs.length;
    let selL = null, dragLine = null;
    E.open('Лазерната защита', 'metal', `
      <p>За да изключите лазерите, свържете всеки израз отляво със стойността му отдясно. Влачете кабел от израза до стойността (или кликнете израз, после стойност).</p>
      <div class="wires" id="wbox"><svg id="wsvg"></svg>
        <div class="wcol">${W.left.map(i => `<button class="wbtn" type="button" data-l="${i}">${W.pairs[i].l}</button>`).join('')}</div>
        <div class="wcol">${W.right.map(i => `<button class="wbtn" type="button" data-r="${i}">${W.pairs[i].r}</button>`).join('')}</div></div>
      <button class="primary" id="go" type="button" ${S.done.wires ? 'disabled' : ''}>Изключи лазерите</button>${FB}`, 'wires', b => {
      const box = $('#wbox');
      const pt = (el, side) => { const R = box.getBoundingClientRect(), r = el.getBoundingClientRect(); return [side ? r.left - R.left : r.right - R.left, r.top + r.height / 2 - R.top]; };
      const curve = ([x1, y1], [x2, y2], c) => { const mx = (x1 + x2) / 2; return `<path d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/><circle cx="${x1}" cy="${y1}" r="6" fill="${c}"/><circle cx="${x2}" cy="${y2}" r="6" fill="${c}"/>`; };
      const draw = () => {
        if (!box.isConnected) return;
        b.querySelectorAll('.wbtn').forEach(x => { x.style.borderColor = ''; x.classList.toggle('sel', selL !== null && x.dataset.l == selL); });
        $('#wsvg').innerHTML = Object.entries(S.wires).map(([l, r]) => { const a = b.querySelector(`[data-l="${l}"]`), z = b.querySelector(`[data-r="${r}"]`); a.style.borderColor = z.style.borderColor = cols[l]; return curve(pt(a, 0), pt(z, 1), cols[l]); }).join('') + (dragLine || '');
      };
      const connect = (l, r) => { for (const [k, v] of Object.entries(S.wires)) if (v === r || +k === l) delete S.wires[k]; S.wires[l] = r; E.sfx.thunk(); E.save(); };
      if (!S.done.wires) {
        box.addEventListener('pointerdown', e => {
          const a = e.target.closest('[data-l]'); if (!a) return; e.preventDefault(); const l = +a.dataset.l, start = pt(a, 0); let moved = false;
          const mv = ev => { moved = true; const R = box.getBoundingClientRect(); dragLine = curve(start, [ev.clientX - R.left, ev.clientY - R.top], cols[l]); draw(); };
          const up = ev => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); dragLine = null;
            const z = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-r]');
            if (moved && z) { connect(l, +z.dataset.r); selL = null; } else if (!moved) { selL = selL === l ? null : l; E.sfx.click(); } draw(); };
          addEventListener('pointermove', mv); addEventListener('pointerup', up);
        });
        b.querySelectorAll('[data-r]').forEach(z => z.onclick = () => { const r = +z.dataset.r; if (selL !== null) { connect(selL, r); selL = null; } else { for (const [k, v] of Object.entries(S.wires)) if (v === r) delete S.wires[k]; E.save(); } draw(); });
      }
      const wireRO = new ResizeObserver(draw); wireRO.observe(box); requestAnimationFrame(draw);
      $('#go').onclick = () => {
        const fb = $('#fb'), k = Object.keys(S.wires).length;
        if (k < n) { fb.className = 'fb bad'; fb.textContent = `Свързани са ${k} от ${n} кабела.`; return; }
        const c = Object.entries(S.wires).filter(([l, r]) => +l === r).length;
        if (c === n) { S.done.wires = true; E.sfx.zap(); E.right(fb, 'Лазерите угасват един по един…'); $('#go').disabled = true; setTimeout(() => { E.close(); E.say('Лазерите изгаснаха! Пътят до конзолата на реактора е свободен.'); }, 1200); }
        else E.cool($('#go'), E.wrong('wires', box, fb, `Ток протече само по ${c} от ${n} кабела. Кликнете стойност без избран израз, за да махнете кабела ѝ.`));
      };
    });
  };

  /* ---------- 5. Реакторът ---------- */
  PUZ.act.reactor = () => {
    const S = E.S, Pz = E.P;
    if (!S.done.wires) { E.sfx.zap(); E.flash('red'); return E.say('Тззт! Лазерите пазят конзолата. Таблото на лазерната защита е на стената вдясно от реактора.'); }
    let k = '';
    const heat = () => Math.min(100, 20 + (S.wrongs.reactor || 0) * 20);
    E.open('Конзолата на Минус-реактора', 'reactor', `
      <p class="formula">K = A · B : C</p>
      <div class="abc">${['A', 'B', 'C'].map(x => `<label>${x} =<input class="ans${S.abc[x] ? ' ok' : ''}" data-x="${x}" autocomplete="off" value="${S.abc[x] ? plain(Pz[x]) : ''}" ${S.abc[x] ? 'disabled' : ''} aria-label="${x}"></label>`).join('')}</div>
      <p class="small">Въведете A, B и C. Конзолата ще светне зелено за всяко вярно число.</p>
      <div class="heat" aria-label="Температура на реактора"><i id="heat" style="width:${heat()}%"></i></div>
      <div class="lcd" id="lcd"></div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button type="button" data-k="${d}">${d}</button>`).join('')}<button type="button" data-k="±" aria-label="Смени знака">±</button><button type="button" data-k="0">0</button><button type="button" data-k="del" aria-label="Изтрий">⌫</button></div>
      <div class="row" style="justify-content:center"><button class="primary" id="go" type="button">ИЗКЛЮЧИ РЕАКТОРА</button></div>${FB}`, 'reactor', b => {
      const ready = () => ['A', 'B', 'C'].every(x => S.abc[x]);
      const lcd = () => { $('#lcd').innerHTML = E.seg((k || '0').padStart(3, ' ')); };
      b.querySelectorAll('.abc input').forEach(inp => inp.oninput = () => { const x = inp.dataset.x; if (same(parse(inp.value), Pz[x])) { S.abc[x] = true; inp.disabled = true; inp.classList.add('ok'); E.sfx.beep(); E.save(); } });
      b.querySelectorAll('.keypad button').forEach(btn => btn.onclick = () => {
        const d = btn.dataset.k; E.sfx.key();
        if (d === 'del') k = k.slice(0, -1); else if (d === '±') k = k.startsWith('-') ? k.slice(1) : '-' + k; else if (k.replace('-', '').length < 2) k += d;
        lcd();
      });
      b.tabIndex = -1; b.onkeydown = e => { if (/^\d$/.test(e.key)) b.querySelector(`[data-k="${e.key}"]`).click(); else if (e.key === '-') b.querySelector('[data-k="±"]').click(); else if (e.key === 'Backspace' && !e.target.matches('input')) b.querySelector('[data-k="del"]').click(); };
      $('#go').onclick = () => {
        const fb = $('#fb');
        if (!ready()) { fb.className = 'fb bad'; fb.textContent = 'Конзолата е заключена: първо въведете верните A, B и C.'; return; }
        if (k && same(parse(k), Pz.K)) { E.right(fb, 'КОДЪТ Е ПРИЕТ. Изключване…'); $('#go').disabled = true; setTimeout(E.win, 900); return; }
        E.sfx.alarm(); E.flash('red'); E.shake(); k = ''; lcd();
        E.cool($('#go'), E.wrong('reactor', $('#lcd'), fb, 'ГРЕШЕН КОД! Реакторът загрява. Проверете знака и действията.')); $('#heat').style.width = heat() + '%';
      };
      lcd();
    });
  };

  PUZ.act.exit = () => E.say(E.S.won ? 'Вратата е отворена!' : 'Тежка стоманена врата. Табелата „ИЗХОД“ свети в червено — отваря се само когато реакторът е изключен.');
})();

window.claude?.hot?.ready ? window.claude.hot.ready(E.boot) : E.boot(window.claude?.hot?.data ?? null);
