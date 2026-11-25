/* Задачите в стаите */
const PZ = (() => {
  const { fmt, op, parse, same } = G;
  const $ = s => document.querySelector(s);
  const m = h => `<span class="math">${h}</span>`;
  const fb = '<p class="fb" id="fb" aria-live="polite"></p>';
  const ITEMNAME = { key: 'Ключът', uv: 'Фенерчето' };
  const LAT = { A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', O: 'О', P: 'Р', C: 'С', T: 'Т', X: 'Х', Y: 'У' };
  const norm = s => s.trim().toUpperCase().replace(/[ABEKMHOPCTXY]/g, c => LAT[c]);

  const HINTS = {
    signs: ['Преброй отрицателните числа в израза. Четен брой минуси → резултатът е положителен (+). Нечетен брой → отрицателен (−).',
      'Ако някое от числата е 0 (и то не е делител), целият резултат е 0. При делението знакът се определя точно както при умножението.'],
    cipher: ['Първо определи знака, после пресметни. Например (−4) · 3 = −12, а (−12) : (−4) = 3. После потърси числото в таблицата.',
      p => `Първият израз е равен на ${fmt(p.cipher.items[0].v)}, значи първата буква е „${p.cipher.items[0].L}“.`],
    pass: ['Паролата е думата, която се получава от шифъра в книгата в кабинета.',
      p => `Думата има ${p.cipher.word.length} букви и започва с „${p.cipher.word[0]}“.`],
    machine: ['Върви отзад напред, от изхода към входа. Обратното на умножението е деление, а обратното на делението е умножение — със същото число и със същия знак.',
      p => `Преди последната стъпка числото е било ${fmt(p.machine.vals[2])}.`],
    flasks: ['Неизвестен множител = произведението : известния множител. Неизвестно делимо = частното · делителя. Неизвестен делител = делимото : частното.',
      p => { const q = p.flasks.list[3]; return `За четвъртата колба първо намери на колко е равно ${op(q.c)} · x. То е ${fmt(q.e)} ${q.d < 0 ? '+' : '−'} ${Math.abs(q.d)} = ${fmt(q.e - q.d)}.`; }],
    uv: ['Умножението и делението са с еднакъв приоритет — смятай отляво надясно.',
      p => `Първа стъпка: ${op(p.uv.a)} · ${op(p.uv.b)} = ${fmt(G.r6(p.uv.a * p.uv.b))}. Остава да разделиш на ${op(p.uv.c)}.`],
    wires: ['Реципрочното на една дроб е „обърнатата“ дроб със същия знак: реципрочното на −2/3 е −3/2.',
      'Нула, разделена на число, различно от нула, е нула. Произведение на нечетен брой (−1) е −1, а на четен брой е 1.'],
    door: ['Цифрите идват от картите в инвентара. Подреди ги в реда △ ○ □ ☆.',
      'Картите: △ е в чекмеджето на бюрото, ○ дава компютърът, □ е в стъкления шкаф, ☆ се крие в портрета (нужна е UV светлина).'],
  };

  function act(id) {
    const S = E.S, sel = S.sel;
    const fits = (sel === 'key' && id === 'door1') || (sel === 'uv' && id === 'painting');
    if (sel && !fits) { E.say(`${ITEMNAME[sel]} не върши работа тук. Прибираш го.`); S.sel = null; E.render(); return; }
    ({ letter, panel: signs, drawer, book, painting, clock, door1, back, computer, flasks, board, cabinet, exit })[id](sel);
  }

  /* ---------- Кабинетът ---------- */
  const rulesTable = `<p class="math">(+) · (+) = (+)&nbsp;&nbsp; (−) · (−) = (+)<br>(+) · (−) = (−)&nbsp;&nbsp; (−) · (+) = (−)</p>`;
  function letter() {
    E.open('Писмо от Професор Минус', 'paper', `
      <p class="hand">Скъпи мои пленници,</p>
      <p>Изходът от лабораторията се отваря с код от четири символа: <b>△ ○ □ ☆</b>. Всеки символ се крие зад задача тук, в кабинета, или в съседната лаборатория.</p>
      <p>Ще ви трябват правилата на знаците. Те важат и за умножението, и за делението:</p>${rulesTable}
      <p>Помнете още: произведение, в което има множител 0, е равно на 0. А на нула не се дели!</p>
      <p class="hand">Започнете от таблото на стената. Успех… ще ви трябва. — Проф. Минус</p>`);
  }

  function signs() {
    const S = E.S, L = E.P.signs.lamps, done = S.done.signs;
    const rows = L.map((l, i) => `<div class="lamp"><span class="bulb${done ? ' on' : ''}"></span>${m(l.html)}
      <button class="sign" type="button" data-i="${i}" ${done ? 'disabled' : ''} aria-label="Знак на лампа ${i + 1}">${done ? l.ans : S.lamps[i]}</button></div>`).join('');
    E.open('Електрическото табло', '', `
      <p>Таблото захранва ключалката на чекмеджето. Лампата светва само ако зададеш <b>знака на резултата</b>. Натискай бутона до всеки израз: <b>+</b>, <b>−</b> или <b>0</b>.</p>
      <p class="small">Не е нужно да пресмяташ целия израз — достатъчно е да знаеш знака.</p>
      <div class="lamps">${rows}</div>
      ${done ? '<p class="fb good">Таблото работи. Всички лампи светят.</p>' : `<div class="row"><button class="primary" id="go" type="button">Пусни тока</button><span id="meter" aria-hidden="true"></span></div>${fb}`}`, 'signs', b => {
      if (done) return;
      b.querySelectorAll('.sign').forEach(btn => btn.onclick = () => {
        const i = +btn.dataset.i, order = ['?', '+', '−', '0'];
        S.lamps[i] = order[(order.indexOf(S.lamps[i]) + 1) % 4]; if (S.lamps[i] === '?') S.lamps[i] = '+';
        btn.textContent = S.lamps[i]; E.sfx.click(); E.save();
      });
      $('#go').onclick = () => {
        const f = $('#fb');
        if (S.lamps.includes('?')) { f.className = 'fb bad'; f.textContent = 'Задай знак на всяка лампа.'; return; }
        const c = L.filter((l, i) => S.lamps[i] === l.ans).length;
        $('#meter').innerHTML = `<span class="small">Мощност: ${'●'.repeat(c)}${'○'.repeat(6 - c)}</span>`;
        if (c === 6) {
          S.done.signs = true; b.querySelectorAll('.bulb').forEach(x => x.classList.add('on'));
          b.querySelectorAll('.sign').forEach(x => (x.disabled = true));
          E.right(f, 'Всички лампи светят! Някъде в кабинета нещо щракна.'); E.say('Щрак! Някъде в кабинета се отключи нещо. Лампичката на бюрото стана зелена.');
        } else { E.wrong($('.lamps'), f, `Светнаха ${c} от 6 лампи. Провери знаците отново.`); E.cool($('#go')); }
      };
    });
  }

  function drawer() {
    const S = E.S;
    if (!S.done.signs) return E.say('Чекмеджето е заключено с електрическа ключалка. Червената лампичка свети. Кабелът води към таблото на стената.');
    if (!S.got.drawer) { S.got.drawer = true; E.give('key'); E.give('tri'); return E.say('Чекмеджето се отвори! Вътре има ключ с етикет „Лаборатория“ и карта: △ = броят на лампите с „−“ на таблото.'); }
    E.say('Чекмеджето е празно. Само стари химикалки и гумичка във формата на минус.');
  }

  function book() {
    const S = E.S, C = E.P.cipher;
    const boxes = C.items.map((it, i) => `<div class="cbox"><small>Буква ${i + 1}</small>${m(it.html)}
      <input class="ans" data-i="${i}" maxlength="1" value="${E.esc(S.book[i] || '')}" aria-label="Буква ${i + 1}"></div>`).join('');
    const table = C.table.map(t => `<div><b>${fmt(t.v)}</b><span>${t.L}</span></div>`).join('');
    E.open('Шифърът на Професор Минус', 'paper', `
      <p>В светещата книга има бележка: <span class="hand">„Паролата за компютъра в лабораторията е скрита тук.“</span></p>
      <p>Пресметни всеки израз, намери резултата в таблицата и запиши буквата под него. Таблицата е подредена като числова ос — от най-малкото към най-голямото число.</p>
      <div class="cgrid">${boxes}</div>
      <div class="ctable">${table}</div>
      <p class="small" style="margin-top:12px">${S.done.pass ? 'Компютърът вече прие паролата.' : 'Когато думата е готова, въведи я в компютъра в лабораторията.'}</p>`, 'cipher', b => {
      b.querySelectorAll('input').forEach(inp => inp.oninput = () => { inp.value = norm(inp.value).slice(0, 1); S.book[+inp.dataset.i] = inp.value; E.save(); });
    });
  }

  function painting(sel) {
    const S = E.S, U = E.P.uv;
    if (sel !== 'uv' && !S.got.star) return E.say('Портрет на Професор Минус с червен мустак-минус. Под рамката е издраскано: „Истината се вижда само в ултравиолетова светлина.“');
    S.sel = null;
    E.open('Скритият надпис', 'uvl', `
      <p>В лилавата светлина върху портрета се появи надпис, написан с невидимо мастило:</p>
      <p class="uvtext">☆ = ${U.html}</p>
      ${S.got.star ? `<p class="fb good">Разгадано: ☆ = ${U.d}. Картата е в инвентара.</p>` :
      `<div class="row"><label for="uvA">☆ =</label><input class="ans" id="uvA" inputmode="decimal" autocomplete="off"><button class="primary" id="go" type="button">Провери</button></div>${fb}`}`, 'uv', () => {
      if (S.got.star) return;
      const check = () => {
        const f = $('#fb');
        if (same(parse($('#uvA').value), U.d)) { S.got.star = true; E.give('star'); E.right(f, `Вярно! ☆ = ${U.d}. Записваш го на карта.`); E.say(`Разгада надписа под портрета: ☆ = ${U.d}.`); $('#go').disabled = true; }
        else { E.wrong($('#uvA'), f, 'Не е това. Смятай отляво надясно и внимавай със знаците.'); E.cool($('#go')); }
      };
      $('#go').onclick = check; $('#uvA').onkeydown = e => { if (e.key === 'Enter' && !$('#go').disabled) check(); };
    });
  }

  function clock() {
    const left = E.TOTAL - E.S.t;
    E.say(`Часовникът показва −12 вместо 12. Професорът дори часовника си е направил отрицателен. ${left > 0 ? `Остават около ${Math.ceil(left / 60)} минути.` : 'Времето изтече!'}`);
  }

  function door1(sel) {
    const S = E.S;
    if (S.done.door1) { E.go(2); return labIntro(); }
    if (sel === 'key') { S.done.door1 = true; E.take('key'); E.sfx.ok(); E.go(2); E.say('Ключът пасна! Катинарът падна и вратата се отвори.'); return setTimeout(labIntro, 1600); }
    E.say(E.has('key') ? 'Вратата е заключена с катинар. Имаш ключ — кликни го в инвентара и после върху вратата.' : 'Вратата към лабораторията е заключена с червен катинар.');
  }
  function labIntro() {
    const S = E.S;
    if (!S.seen2) { S.seen2 = true; E.save(); E.say('Лабораторията! Колби, компютър, стъклен шкаф и… изходът. Табелата „ИЗХОД“ не свети — вратата е без ток.'); }
    else E.say('Лабораторията.');
  }
  function back() { E.go(1); E.say('Обратно в кабинета.'); }

  /* ---------- Лабораторията ---------- */
  function computer() {
    const S = E.S;
    if (S.done.pass) return machine();
    E.open('Компютърът на професора', 'term', `
      <p>СИСТЕМА „МИНУС“ v−1.0<br>&gt; ВЪВЕДЕТЕ ПАРОЛА:</p>
      <div class="row"><input class="ans" id="pw" autocomplete="off" aria-label="Парола" style="width:12em;text-transform:uppercase"><button class="primary" id="go" type="button">Вход</button></div>${fb}`, 'pass', () => {
      const check = () => {
        const f = $('#fb');
        if (norm($('#pw').value) === E.P.cipher.word) { S.done.pass = true; E.right(f, 'ДОСТЪП РАЗРЕШЕН'); setTimeout(machine, 900); }
        else { E.wrong($('#pw'), f, 'ДОСТЪПЪТ Е ОТКАЗАН. Паролата е дума — потърси я в кабинета.'); E.cool($('#go')); }
      };
      $('#go').onclick = check; $('#pw').onkeydown = e => { if (e.key === 'Enter' && !$('#go').disabled) check(); };
    });
  }

  function machine() {
    const S = E.S, M = E.P.machine, done = S.done.machine;
    const nodes = M.steps.map((s, i) => `<span class="arrow">→</span><div class="node opn" data-n="${i + 1}"><b>${s.o} ${op(s.k)}</b><small>&nbsp;</small></div>`).join('');
    E.open('Машината за числа', 'term', `
      <p>&gt; Машината взе едно цяло число, обработи го на три стъпки и изписа <b>${fmt(M.y)}</b>. Кое число е влязло?</p>
      <div class="pipe"><div class="node" data-n="0"><small>ВХОД</small><b>${done ? fmt(M.x) : '?'}</b></div>${nodes}<span class="arrow">→</span><div class="node"><small>ИЗХОД</small><b>${fmt(M.y)}</b></div></div>
      ${done ? `<p class="fb good">РЕШЕНО. Входното число беше ${fmt(M.x)}. Картата ○ е в инвентара.</p>` : `
      <p>&gt; Пробно пускане: въведи число и виж какво излиза. Енергията стига за ${S.trials} пускания.</p>
      <div class="row"><input class="ans" id="tryN" inputmode="decimal" autocomplete="off" aria-label="Пробно число"><button class="ghost" id="run" type="button">Пусни</button></div>
      <p>&gt; Отговор — входното число:</p>
      <div class="row"><input class="ans" id="ansN" inputmode="decimal" autocomplete="off" aria-label="Входното число"><button class="primary" id="go" type="button">Потвърди</button></div>${fb}`}`, 'machine', b => {
      if (done) return;
      const runBtn = $('#run'), setRun = () => { runBtn.textContent = S.trials > 0 ? `Пусни (остават ${S.trials})` : 'Енергията свърши'; runBtn.disabled = S.trials <= 0; };
      setRun();
      runBtn.onclick = () => {
        const v = parse($('#tryN').value), f = $('#fb');
        if (!Number.isFinite(v)) { f.className = 'fb bad'; f.textContent = 'Въведи число, например −4 или 2,5.'; return; }
        S.trials--; E.save(); setRun();
        b.querySelector('[data-n="0"] b').textContent = fmt(v);
        let cur = v;
        M.steps.forEach((s, i) => setTimeout(() => {
          cur = G.r6(s.o === '·' ? cur * s.k : cur / s.k);
          const n = b.querySelector(`[data-n="${i + 1}"]`); if (!n) return;
          n.querySelector('small').textContent = '= ' + fmt(cur); n.classList.add('lit'); E.sfx.click();
          if (i === 2) { const hit = same(cur, M.y); f.className = 'fb ' + (hit ? 'good' : 'bad'); f.textContent = hit ? `Излезе ${fmt(cur)} — точно целта! Сега потвърди отговора.` : `Излезе ${fmt(cur)}, а целта е ${fmt(M.y)}.`; }
        }, 450 * (i + 1)));
        setTimeout(() => b.querySelectorAll('.lit').forEach(n => n.classList.remove('lit')), 2600);
      };
      const check = () => {
        const f = $('#fb');
        if (same(parse($('#ansN').value), M.x)) { S.done.machine = true; E.give('circ'); E.right(f, 'ВЯРНО! От принтера излезе карта: ○ = |входното число на машината|.'); E.say('Компютърът изписа ○ = |входното число на машината|. Картата е в инвентара.'); $('#go').disabled = true; }
        else { E.wrong($('#ansN'), f, 'ГРЕШКА. Машината прегрява… Опитай да вървиш отзад напред.'); E.cool($('#go'), 8); }
      };
      $('#go').onclick = check; $('#ansN').onkeydown = e => { if (e.key === 'Enter' && !$('#go').disabled) check(); };
    });
  }

  const fcol = ['#e8553f', '#e0a93e', '#5dade2', '#b48cff'];
  const flaskSvg = (i, ok) => `<svg viewBox="0 0 60 76" aria-hidden="true"><path d="M22 4v22L4 66a6 6 0 0 0 6 8h40a6 6 0 0 0 6-8L38 26V4z" fill="#d9f1ee" fill-opacity=".15" stroke="#d9f1ee" stroke-width="3"/><path d="M12 50h36l8 16a6 6 0 0 1-6 8H10a6 6 0 0 1-6-8z" fill="${ok ? fcol[i] : '#55605c'}"/></svg>`;
  function flasks() {
    const S = E.S, F = E.P.flasks.list;
    const cards = F.map((q, i) => `<div class="fcard" data-i="${i}">${flaskSvg(i, S.fok[i])}<small>Колба ${i + 1} · ${q.kind}</small>${m(q.html)}
      <input class="ans${S.fok[i] ? ' ok' : ''}" data-i="${i}" inputmode="decimal" autocomplete="off" placeholder="x = ?" aria-label="x в колба ${i + 1}" value="${E.esc(S.fok[i] ? fmt(q.x) : S.flasks[i])}" ${S.fok[i] ? 'disabled' : ''}></div>`).join('');
    E.open('Колбите с неизвестното', '', `
      <p>На всяка колба е залепено уравнение. Намери неизвестното <b>x</b>. Когато течността и в четирите колби светне, ключалката на шкафа ще щракне.</p>
      <p class="small">Пиши десетичните числа със запетая (−2,5), а дробите — с наклонена черта (−5/2).</p>
      <div class="fgrid">${cards}</div>
      ${S.done.flasks ? '<p class="fb good">Четирите колби светят. Шкафът е отключен.</p>' : `<button class="primary" id="go" type="button">Провери колбите</button>${fb}`}`, 'flasks', b => {
      if (S.done.flasks) return;
      b.querySelectorAll('input').forEach(inp => inp.oninput = () => { S.flasks[+inp.dataset.i] = inp.value; E.save(); });
      $('#go').onclick = () => {
        const f = $('#fb'); let bad = 0, empty = 0;
        F.forEach((q, i) => {
          if (S.fok[i]) return; const inp = b.querySelector(`input[data-i="${i}"]`);
          if (!inp.value.trim()) { empty++; return; }
          if (same(parse(inp.value), q.x)) { S.fok[i] = true; inp.disabled = true; inp.classList.add('ok'); b.querySelector(`.fcard[data-i="${i}"] svg`).outerHTML = flaskSvg(i, true); }
          else { bad++; inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); }
        });
        const n = S.fok.filter(Boolean).length; E.render();
        if (n === 4) { S.done.flasks = true; $('#go').disabled = true; E.right(f, 'Четирите колби светят! Ключалката на шкафа щракна.'); E.say('Течностите засветиха в четири цвята. Стъкленият шкаф се отключи!'); }
        else if (bad) { E.wrong(null, f, `Светят ${n} от 4 колби. Сивите имат грешен отговор.`); E.cool($('#go')); }
        else { f.className = 'fb'; f.textContent = empty ? `Светят ${n} от 4 колби. Попълни и останалите.` : ''; E.save(); }
      };
    });
  }

  function cabinet() {
    const S = E.S;
    if (!S.done.flasks) return E.say('Стъкленият шкаф е заключен. Вътре се вижда фенерче с лилава лампа. На ключалката има четири малки отвора във формата на колби.');
    if (!S.got.uv) { S.got.uv = true; E.give('uv'); E.give('sq'); E.render(); return E.say('Шкафът се отвори! Взимаш UV фенерче и карта: □ = |x| от четвъртата колба.'); }
    E.say('Шкафът е празен. По рафтовете има само прах и една епруветка с надпис „−1“.');
  }

  function board() {
    E.open('Помагалото на дъската', '', `
      <p>Някой е написал с тебешир как се намира неизвестното:</p>
      <p><b>Неизвестен множител:</b> ${m('a · x = b → x = b : a')}<br><span class="small">Пример: ${m('(−4) · x = 12 → x = 12 : (−4) = −3')}</span></p>
      <p><b>Неизвестно делимо:</b> ${m('x : a = b → x = b · a')}<br><span class="small">Пример: ${m('x : (−2) = 5 → x = 5 · (−2) = −10')}</span></p>
      <p><b>Неизвестен делител:</b> ${m('a : x = b → x = a : b')}<br><span class="small">Пример: ${m('18 : x = −6 → x = 18 : (−6) = −3')}</span></p>
      <p><b>Неизвестно събираемо:</b> ${m('x + a = b → x = b − a')}</p>
      <p><b>Реципрочни числа:</b> произведението им е 1, например ${m(`${G.frac(-2, 3)} · ${G.frac(-3, 2)} = 1`)}. Да разделиш на число е същото като да умножиш по реципрочното му.</p>
      ${rulesTable}`);
  }

  function exit() { return E.S.done.wires ? keypad() : wires(); }

  function wires() {
    const S = E.S, W = E.P.wires, cols = ['#e8553f', '#e0a93e', '#5dade2', '#7bd88f', '#b48cff', '#f2efe4'];
    let selL = null;
    E.open('Таблото на изхода', '', `
      <p>Вратата е без ток. Свържи всеки израз отляво с неговата стойност отдясно: кликни израз, после стойност. Когато всички 6 кабела са свързани правилно, клавиатурата ще светне.</p>
      <div class="wires" id="wbox"><svg id="wsvg"></svg>
        <div class="wcol">${W.left.map(i => `<button class="wbtn" type="button" data-l="${i}">${W.pairs[i].l}</button>`).join('')}</div>
        <div class="wcol">${W.right.map(i => `<button class="wbtn" type="button" data-r="${i}">${W.pairs[i].r}</button>`).join('')}</div>
      </div>
      <button class="primary" id="go" type="button">Включи тока</button>${fb}`, 'wires', b => {
      const box = $('#wbox');
      const draw = () => {
        if (!box.isConnected) return; const R = box.getBoundingClientRect();
        b.querySelectorAll('.wbtn').forEach(x => { x.style.borderColor = ''; x.classList.toggle('sel', x.dataset.l == selL && selL !== null); });
        $('#wsvg').innerHTML = Object.entries(S.wires).map(([l, r]) => {
          const a = b.querySelector(`[data-l="${l}"]`).getBoundingClientRect(), z = b.querySelector(`[data-r="${r}"]`).getBoundingClientRect(), c = cols[l];
          b.querySelector(`[data-l="${l}"]`).style.borderColor = c; b.querySelector(`[data-r="${r}"]`).style.borderColor = c;
          const x1 = a.right - R.left, y1 = a.top + a.height / 2 - R.top, x2 = z.left - R.left, y2 = z.top + z.height / 2 - R.top, mx = (x1 + x2) / 2;
          return `<path d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/><circle cx="${x1}" cy="${y1}" r="5" fill="${c}"/><circle cx="${x2}" cy="${y2}" r="5" fill="${c}"/>`;
        }).join('');
      };
      b.querySelectorAll('[data-l]').forEach(x => x.onclick = () => { selL = +x.dataset.l; E.sfx.click(); draw(); });
      b.querySelectorAll('[data-r]').forEach(x => x.onclick = () => {
        const r = +x.dataset.r;
        if (selL === null) { for (const [l, rr] of Object.entries(S.wires)) if (rr === r) delete S.wires[l]; E.sfx.click(); E.save(); return draw(); }
        for (const [l, rr] of Object.entries(S.wires)) if (rr === r) delete S.wires[l];
        S.wires[selL] = r; selL = null; E.sfx.click(); E.save(); draw();
      });
      const wireRO = new ResizeObserver(draw); wireRO.observe(box); requestAnimationFrame(draw);
      $('#go').onclick = () => {
        const f = $('#fb'), n = Object.keys(S.wires).length;
        if (n < 6) { f.className = 'fb bad'; f.textContent = `Свързани са ${n} от 6 кабела. Свържи всички.`; return; }
        const c = Object.entries(S.wires).filter(([l, r]) => +l === r).length;
        if (c === 6) { S.done.wires = true; $('#go').disabled = true; E.right(f, 'Ток! Табелата „ИЗХОД“ светна в зелено.'); E.say('Табелата „ИЗХОД“ светна. Клавиатурата на вратата чака код.'); setTimeout(keypad, 1300); }
        else { E.wrong(box, f, `Ток протече само по ${c} от 6 кабела. Кликни стойност без избран израз, за да махнеш кабел.`); E.cool($('#go')); }
      };
    });
  }

  function keypad() {
    let code = '';
    const syms = ['△', '○', '□', '☆'];
    E.open('Кодът на изхода', '', `
      <p>Табелата свети. Въведи четирите цифри в реда на символите.</p>
      <div class="slots">${syms.map((s, i) => `<div class="slot"><small>${s}</small><b id="sl${i}"></b></div>`).join('')}</div>
      <div class="keypad" id="kp">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" type="button" data-d="${d}">${d}</button>`).join('')}
        <button class="key" type="button" data-d="del" aria-label="Изтрий">⌫</button><button class="key" type="button" data-d="0">0</button><button class="key" type="button" data-d="ok" id="go" aria-label="Отвори">✓</button></div>${fb}`, 'door', b => {
      const show = () => syms.forEach((_, i) => ($(`#sl${i}`).textContent = code[i] || ''));
      const press = d => {
        const f = $('#fb'); E.sfx.click();
        if (d === 'del') code = code.slice(0, -1);
        else if (d === 'ok') {
          if ($('#go').disabled) return;
          if (code.length < 4) { f.className = 'fb bad'; f.textContent = 'Кодът има 4 цифри.'; return; }
          if (code === E.P.code) { E.right(f, 'Ключалката изщрака…'); setTimeout(E.win, 900); return; }
          code = ''; E.wrong($('.slots'), f, 'Грешен код. Провери картите в инвентара.'); E.cool($('#go'));
        } else if (code.length < 4) code += d;
        show();
      };
      b.querySelectorAll('.key').forEach(k => k.onclick = () => press(k.dataset.d));
      b.tabIndex = -1; b.onkeydown = e => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); else if (e.key === 'Enter') { e.preventDefault(); press('ok'); } };
      b.focus();
    });
  }

  function rules() {
    E.open('Как се играе', '', `
      <p>Кликайте върху предметите в стаята (или върху бутоните под картинката). Някои предмети отварят задачи, други дават находки за инвентара.</p>
      <p>Инструментите от инвентара (ключ, фенерче) се използват така: кликни предмета, за да го вземеш в ръка, после кликни там, където искаш да го използваш.</p>
      <p>Всяка задача има две подсказки. Всяка подсказка струва 1 минута. След грешен отговор уредите почиват няколко секунди — мислете, не налучквайте.</p>
      <p>Пишете минус с тирето на клавиатурата (−3 или -3), десетичните числа със запетая (2,5), а дробите с наклонена черта (3/4).</p>
      <p>Играта се запазва сама. Ако презаредите страницата, изберете „Продължи“.</p>
      ${rulesTable}`);
  }

  return { act, HINTS, rules };
})();

window.claude?.hot?.ready ? window.claude.hot.ready(E.boot) : E.boot(window.claude?.hot?.data ?? null);
