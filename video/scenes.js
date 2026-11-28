'use strict';
/* Сценарий: глави, текст на говорителя и анимации.
   Всяка стъпка: say (изречения), act (анимация от началото), on[i] (анимация при изречение i), after. */
(() => {
  const { add, out, clear, svg, draw, anim, tween, wait, eq, board, chapter, chapterOut, burst, ring, rectOf, BOT, SND, soft } = V;
  const C = V.chapters;
  const corner = () => { soft(BOT.corner(900)); BOT.pose(''); };
  const hdr = (html, y = 92) => add(html, { cls: 'hud', x: 960, y, fx: 'down' });
  const card = (html, o = {}) => add(html, { cls: 'glass rule', x: o.x ?? 1580, y: o.y ?? 330, w: o.w ?? 540, fx: o.fx ?? 'right', sound: 'pop' });
  const RULE = {
    mult: '<small>Неизвестен множител</small>= произведение <b>:</b> другия множител',
    dividend: '<small>Неизвестно делимо</small>= частно <b>·</b> делител',
    divisor: '<small>Неизвестен делител</small>= делимо <b>:</b> частно',
    subtr: '<small>Неизвестен умалител</small>= умаляемо <b>−</b> разлика',
  };
  const X = '<span class="xv">x</span>';
  const chap = (n, t, say) => ({ say, act: () => chapter(n, t), after: chapterOut, pause: 150 });
  const drop = async b => { const l = b.lines.pop(); if (l) await l.out(); };
  const frames = async (e, list) => { for (const [a, b, o] of list) { soft(e.frame(a, b, o)); await wait(220); } await wait(300); };
  const smooth = p => { let d = `M${p[0]}`; for (let i = 0; i < p.length - 1; i++) { const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c; d += ` C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6},${c[1] - (e[1] - b[1]) / 6} ${c}`; } return d; };
  const glowPulse = el => anim(el, [{ scale: '1' }, { scale: '1.12' }, { scale: '1' }], { dur: 700 });

  /* ================= 0. Интро ================= */
  C.push({
    title: 'Мисия: Намери Х', theme: 0,
    setup: () => { BOT.at(960, -300, 1.6, 0); BOT.pose(''); },
    beats: [
      { say: 'Здравейте, детективи! Аз съм Бит — роботът детектив.',
        act: async c => {
          c.spot = add('', { x: 960, y: 520, fx: 'fade', style: 'width:1100px;height:1100px;border-radius:50%;background:radial-gradient(circle, rgba(130,90,255,.42), transparent 62%)' });
          SND.whoosh(); await BOT.at(960, 500, 1.6, 1500); BOT.mood('joy'); BOT.pose('wave');
        } },
      { say: 'Днес ще разследваме най-хитрия беглец в математиката — неизвестното число [[x||икс]].',
        act: async c => {
          BOT.mood(''); soft(out(c.spot)); soft(BOT.at(500, 560, 1.25, 1000));
          c.poster = add(`<div class="poster" style="rotate:-4deg"><div class="p1">ИЗДИРВА СЕ</div><div class="px">x</div><div class="p2">Неизвестното число<br>Особени белези: крие се в&nbsp;уравнения</div><div class="p3">НАГРАДА: ОТЛИЧЕН 6</div></div>`, { x: 1290, y: 500, fx: 'drop', sound: 'thud' });
          await c.poster.ready; await wait(600);
          c.stamp = add('ОПАСНО ХИТЪР', { cls: 'stamp', x: 1300, y: 440, fx: 'pop', sound: 'stamp', style: 'font-size:38px;white-space:nowrap' });
        } },
      { say: '[[x||Икс]] обича да се крие в уравнения — зад умножения, деления и дроби.',
        act: async c => {
          await Promise.all([out(c.poster, 'shrink'), out(c.stamp, 'shrink')]);
          const es = [eq('0,4 · x = -18', { x: 1260, y: 290, size: 84, align: 'center', fx: 'pop' })];
          SND.pop(); await wait(380);
          es.push(eq('4,8 - 2 · x = 5,8', { x: 1260, y: 500, size: 84, align: 'center', fx: 'pop' })); SND.pop(); await wait(380);
          es.push(eq('-2_1/4 = 3/4 : x', { x: 1260, y: 710, size: 84, align: 'center', fx: 'pop' })); SND.pop();
          await wait(700); await Promise.all(es.map(e => e.pulse('x')));
        } },
      { say: 'Но ние имаме план! Ще научим златните правила, метода на матрьошката, хитрите капани, задачите с думи и задачите за движение.',
        act: async c => {
          await clear(); corner();
          hdr('Карта на <b>мисията</b>');
          const P = [[330, 600], [560, 390], [800, 610], [1030, 390], [1260, 610], [1490, 390], [1700, 600]];
          const LB = ['Златните правила', 'Една стъпка', 'Матрьошката', 'Хитри капани', 'Думи → уравнение', 'Насрещно движение', 'Кръгова писта'];
          const s = svg(`<defs><linearGradient id="mpG" x1="0" x2="1"><stop offset="0" stop-color="#9b7bff"/><stop offset=".5" stop-color="#ff4fd8"/><stop offset="1" stop-color="#ffd23f"/></linearGradient></defs>
            <path d="${smooth(P)}" fill="none" stroke="url(#mpG)" stroke-width="10" stroke-linecap="round" opacity=".75" style="filter:drop-shadow(0 0 12px rgba(255,79,216,.6))"/>`, { fx: 'none' });
          soft(draw(s.querySelector('path'), 2600));
          c.nodes = [];
          for (let i = 0; i < P.length; i++) {
            const [x, y] = P[i];
            c.nodes.push(add(String(i + 1), { cls: 'node', x, y, center: false, fx: 'pop' }));
            add(LB[i], { cls: 'nodeLbl', x, y: y > 500 ? y + 82 : y - 140, center: false, fx: 'up' });
            SND.pop(); await wait(330);
          }
        } },
      { say: 'Вземете тетрадка и химикал. Започваме!',
        act: async c => { BOT.mood('joy'); await glowPulse(c.nodes[0]); burst(330, 600, 50, .7); SND.sparkle(); } },
    ],
  });

  /* ================= 1. Златните правила ================= */
  C.push({
    title: 'Златните правила', theme: 1, setup: corner,
    beats: [
      chap(1, 'Златните правила', 'Глава първа: златните правила.'),
      { say: 'Всяко действие си има части. При умножението имаме множители и произведение.',
        act: async c => { c.b = board({ x: 960, y: 300, gap: 150, size: 120 }); c.e = await c.b.line('3 · 4 = 12', { fx: 'pop' }); },
        on: [null, c => frames(c.e, [['3', '3', { tag: 'множител', above: true }], ['4', '4', { tag: 'множител' }], ['12', '12', { tag: 'произведение', color: 'pink' }]])] },
      { say: 'Ако единият множител е скрит, делим произведението на другия множител. Дванадесет делено на три е четири.',
        on: [async c => { await c.e.to('3 · x = 12'); await c.b.line('x = 12 : 3'); },
          async c => { await c.b.last.to('x = 4', { into: '4' }); await c.b.last.win('4'); c.r = card(RULE.mult, { x: 960, y: 790, w: 1100, fx: 'up' }); }] },
      { say: 'При делението имаме делимо, делител и частно. Дванадесет делено на три е четири.',
        act: async c => { soft(out(c.r)); await c.b.clear(); c.b = board({ x: 960, y: 300, gap: 150, size: 120 }); c.e = await c.b.line('12 : 3 = 4', { fx: 'pop' }); },
        on: [null, c => frames(c.e, [['12', '12', { tag: 'делимо' }], ['3', '3', { tag: 'делител', color: 'violet' }], ['4', '4', { tag: 'частно', color: 'pink' }]])] },
      { say: 'Скрито делимо намираме, като умножим частното по делителя. Четири по три е дванадесет.',
        on: [async c => { await c.e.to('x : 3 = 4'); await c.b.line('x = 4 · 3'); },
          async c => { await c.b.last.to('x = 12', { into: '12' }); await c.b.last.win('12'); c.r = card(RULE.dividend, { x: 960, y: 790, w: 1100, fx: 'up' }); }] },
      { say: 'А скрит делител намираме, като разделим делимото на частното. Дванадесет делено на четири е три.',
        on: [async c => { soft(out(c.r)); await drop(c.b); await c.e.to('12 : x = 4'); await c.b.line('x = 12 : 4'); },
          async c => { await c.b.last.to('x = 3', { into: '3' }); await c.b.last.win('3'); c.r = card(RULE.divisor, { x: 960, y: 790, w: 1100, fx: 'up' }); }] },
      { say: 'Същото важи за събирането и изваждането. Внимавайте с умалителя: той се намира, като от умаляемото извадим разликата.',
        act: async c => {
          await clear(); hdr('Шестте <b>златни правила</b>');
          const R = [['Неизвестно събираемо', 'сбор <b>−</b> другото събираемо'], ['Неизвестен множител', 'произведение <b>:</b> другия множител'], ['Неизвестно умаляемо', 'разлика <b>+</b> умалител'], ['Неизвестно делимо', 'частно <b>·</b> делител'], ['Неизвестен умалител', 'умаляемо <b>−</b> разлика'], ['Неизвестен делител', 'делимо <b>:</b> частно']];
          c.g = add(R.map(([a, b]) => `<div class="rc glass"><small>${a}</small>= ${b}</div>`).join(''), { cls: 'grid6', x: 960, y: 510, fx: 'none' });
          const cells = [...c.g.children]; cells.forEach(e => { e.style.opacity = 0; });
          for (const e of cells) { SND.pop(); soft(anim(e, [{ opacity: 0, translate: '0 40px' }, { opacity: 1, translate: '0 0' }], { dur: 500 })); await wait(170); }
        },
        on: [null, async c => { const e = c.g.children[4]; e.style.borderColor = 'var(--gold)'; e.style.boxShadow = '0 0 60px rgba(255,210,63,.45)'; SND.pop(); await anim(e, [{ scale: '1' }, { scale: '1.08' }, { scale: '1.04' }], { dur: 700 }); }] },
      { say: 'Трик на детектива: ако забравите правило, измислете си пример с малки числа. Две по три е шест — значи шест делено на три е две, а шест делено на две е три.',
        act: async c => { await clear(); hdr('Трик на <b>детектива</b>'); c.b = board({ x: 960, y: 320, gap: 160, size: 120 }); c.e = await c.b.line('2 · 3 = 6', { fx: 'pop' }); },
        on: [null, async c => { await c.b.line('6 : 3 = 2'); await wait(700); await c.b.line('6 : 2 = 3', { from: c.e }); SND.ding(); }] },
      { say: 'И не забравяйте знаците! При умножение и деление еднакви знаци дават плюс. Различни знаци дават минус.',
        act: async c => { await clear(); hdr('Правилото за <b>знаците</b> при · и :'); },
        on: [null,
          async c => {
            const ch = s => `<span class="chip ${s === '+' ? 'plus' : 'minus'}">${s === '+' ? '+' : '−'}</span>`;
            const row = (a, b, r, y) => add(`<div class="signrow">${ch(a)}<span>·</span>${ch(b)}<span>=</span>${ch(r)}</div>`, { x: 720, y, fx: 'left', sound: 'pop' });
            row('+', '+', '+', 290); await wait(300); row('-', '-', '+', 410); await wait(300);
            add('еднакви знаци → <b class="green">плюс</b>', { cls: 'txt', x: 1300, y: 350, fx: 'right' });
          },
          async c => {
            const ch = s => `<span class="chip ${s === '+' ? 'plus' : 'minus'}">${s === '+' ? '+' : '−'}</span>`;
            const row = (a, b, r, y) => add(`<div class="signrow">${ch(a)}<span>·</span>${ch(b)}<span>=</span>${ch(r)}</div>`, { x: 720, y, fx: 'left', sound: 'pop' });
            row('+', '-', '-', 590); await wait(300); row('-', '+', '-', 710); await wait(300);
            add('различни знаци → <b class="red">минус</b>', { cls: 'txt', x: 1300, y: 650, fx: 'right' });
          }] },
    ],
  });

  /* ================= 2. Една стъпка ================= */
  C.push({
    title: 'Една стъпка до Х', theme: 3, setup: corner,
    beats: [
      chap(2, 'Една стъпка до Х', 'Глава втора: уравнения с една стъпка.'),
      { say: 'Първа задача: нула цяло и четири десети по [[x||икс]] е равно на минус осемнадесет.',
        act: async c => { hdr('Пример <b>1</b>'); c.b = board({ x: 820, y: 285, gap: 135, size: 92 }); await c.b.line('0,4 · x = -18', { fx: 'type' }); } },
      { say: '[[x||Икс]] е множител, а минус осемнадесет е произведение. Неизвестен множител намираме, като разделим произведението на другия множител.',
        on: [c => frames(c.b.last, [['x', 'x', { tag: 'множител', color: 'gold', above: true }], ['-18', '-18', { tag: 'произведение', color: 'pink' }]]),
          c => { c.r = card(RULE.mult); }] },
      { say: '[[x||Икс]] е равно на минус осемнадесет делено на нула цяло и четири десети.', act: c => c.b.line('x = -18 : 0,4') },
      { say: 'За да делим на десетична дроб, местим запетаята надясно и в двете числа. Получаваме минус сто и осемдесет делено на четири.',
        on: [c => frames(c.b.last, [['-18', '-18', { tag: '· 10', color: 'violet' }], ['0,4', '0,4', { tag: '· 10', color: 'violet' }]]),
          c => c.b.last.to('x = -180 : 4')] },
      { say: 'Различни знаци дават минус. Минус сто и осемдесет делено на четири е минус четиридесет и пет.',
        on: [null, async c => { const e = await c.b.line('x = -45'); await e.win('-45'); }] },
      { say: 'Винаги правим проверка: нула цяло и четири десети по минус четиридесет и пет е минус осемнадесет. Вярно!',
        on: [async c => { soft(out(c.r)); await c.b.line('0,4 · ( -45 ) = -18'); },
          async c => { await c.b.last.to('0,4 · ( -45 ) = -18 ✓'); await c.b.last.win('✓'); }] },
      { say: 'Следващата е по-хитра: минус две цяло и една четвърт е равно на три четвърти делено на [[x||икс]].',
        act: async c => { await clear(); hdr('Пример <b>2</b>'); c.b = board({ x: 820, y: 285, gap: 135, size: 92 }); await c.b.line('-2_1/4 = 3/4 : x', { fx: 'type' }); } },
      { say: 'Тук [[x||икс]] е делител. Неизвестен делител намираме, като разделим делимото на частното.',
        on: [c => frames(c.b.last, [['x', 'x', { tag: 'делител', color: 'gold' }], ['3/4', '3/4', { tag: 'делимо', above: true }], ['-2_1/4', '-2_1/4', { tag: 'частно', color: 'pink' }]]),
          c => { c.r = card(RULE.divisor); }] },
      { say: '[[x||Икс]] е равно на три четвърти делено на минус две цяло и една четвърт. Смесеното число превръщаме в неправилна дроб: минус девет четвърти.',
        on: [c => c.b.line('x = 3/4 : ( -2_1/4 )'), c => c.b.last.to('x = 3/4 : ( -9/4 )', { into: '-9/4' })] },
      { say: 'Деленето на дроб е умножение по реципрочната ѝ дроб: три четвърти по минус четири девети.',
        act: async c => { await c.b.last.to('x = 3/4 · ( !-4/9 )'); await c.b.last.pulse('-4/9'); } },
      { say: 'Съкращаваме и получаваме минус една трета.', act: async c => { const e = await c.b.line('x = -1/3'); await e.win('-1/3'); } },
      { say: 'Проверка: три четвърти делено на минус една трета е три четвърти по минус три, тоест минус девет четвърти. Точно минус две цяло и една четвърт!',
        on: [async c => { soft(out(c.r)); await c.b.line('3/4 : ( -1/3 ) = -9/4'); },
          async c => { await c.b.last.to('3/4 : ( -1/3 ) = -9/4 = -2_1/4 ✓'); await c.b.last.win('✓'); }] },
    ],
  });

  /* ================= 3. Матрьошката ================= */
  async function openDoll(c, id) {
    const g = c.d.querySelector('#' + id);
    SND.whoosh();
    await Promise.all([
      anim(g.querySelector('.top'), [{ transform: 'translate(0px,0px) rotate(0deg)', opacity: 1 }, { transform: 'translate(-70px,-250px) rotate(-28deg)', opacity: 0 }], { dur: 1000, ease: V.INOUT }),
      anim(g.querySelector('.bot'), [{ transform: 'translate(0px,0px)', opacity: 1 }, { transform: 'translate(0px,90px)', opacity: 0 }], { dur: 900, delay: 150, ease: V.INOUT }),
    ]);
  }
  C.push({
    title: 'Методът на матрьошката', theme: 0, setup: corner,
    beats: [
      chap(3, 'Методът на матрьошката', 'Глава трета: методът на матрьошката.'),
      { say: 'Когато [[x||икс]] е скрит в няколко слоя, махаме слоевете един по един — отвън навътре, като при матрьошка.',
        act: async c => {
          c.d = svg(ART.doll('dS', 960, 860, 270, '#3f8cff', 'x') + ART.doll('dM', 960, 860, 400, '#22b07d', '2 · ▢') + ART.doll('dB', 960, 860, 560, '#e0344f', '4,8 − ▢'), { fx: 'up' });
          const B = c.d.querySelector('#dB'), S = c.d.querySelector('#dS');
          B.style.transform = 'translate(-480px,0px)'; S.style.transform = 'translate(400px,0px)';
          await wait(2200);
          SND.swoosh();
          await Promise.all([anim(B, [{ transform: 'translate(-480px,0px)' }, { transform: 'translate(0px,0px)' }], { dur: 1200, ease: V.INOUT }),
            anim(S, [{ transform: 'translate(400px,0px)' }, { transform: 'translate(0px,0px)' }], { dur: 1200, delay: 250, ease: V.INOUT })]);
          SND.thud();
        } },
      { say: 'Задачата е: четири цяло и осем десети минус две по [[x||икс]] е равно на седем цяло и три десети минус едно цяло и пет десети.',
        act: async c => {
          c.d.style.transformOrigin = '960px 860px';
          soft(anim(c.d, [{ translate: '0px 0px', scale: '1' }, { translate: '660px -60px', scale: '.62' }], { dur: 1000, ease: V.INOUT }));
          hdr('Пример'); c.b = board({ x: 760, y: 250, gap: 135, size: 86 }); await c.b.line('4,8 - 2 · x = 7,3 - 1,5', { fx: 'type' });
        } },
      { say: 'Стъпка първа: пресмятаме всичко, което можем. Дясната страна е пет цяло и осем десети.',
        on: [c => c.b.last.frame('7,3', '1,5', { tag: 'пресмятаме', color: 'violet' }), c => c.b.last.to('4,8 - 2 · x = 5,8', { into: '5,8' })] },
      { say: 'Стъпка втора: кое действие е последно отляво? Изваждането! Затова закриваме две по [[x||икс]] с кутия — тя е неизвестен умалител.',
        on: [null, async c => { c.b.last.cls('-', '-', 'hl'); await c.b.last.pulse('-'); },
          c => frames(c.b.last, [['4,8', '4,8', { tag: 'умаляемо', color: 'violet' }], ['2', 'x', { tag: 'кутия = умалител' }], ['5,8', '5,8', { tag: 'разлика', color: 'pink' }]])] },
      { say: 'Умалителят е равен на умаляемото минус разликата: четири цяло и осем десети минус пет цяло и осем десети. Това е минус едно.',
        on: [async c => { soft(openDoll(c, 'dB')); c.r = card(RULE.subtr, { y: 250 }); await c.b.line('2 · x = 4,8 - 5,8'); },
          c => c.b.last.to('2 · x = -1', { into: '-1' })] },
      { say: 'Отваряме следващата кукла: две по [[x||икс]] е минус едно. [[x||Икс]] е множител, затова делим минус едно на две.',
        on: [async c => { soft(out(c.r)); soft(openDoll(c, 'dM')); await c.b.last.frame('x', 'x', { tag: 'множител', color: 'gold' }); },
          async c => { c.r = card(RULE.mult, { y: 250 }); await c.b.line('x = -1 : 2'); }] },
      { say: '[[x||Икс]] е равно на минус нула цяло и пет десети!',
        act: async c => {
          await c.b.last.to('x = -0,5', { into: '-0,5' }); BOT.mood('joy');
          const s = c.d.querySelector('#dS'), r = rectOf(s); ring(r.x + r.w / 2, r.y + r.h / 2, '#ffd23f');
          await Promise.all([c.b.last.win('-0,5'), anim(s, [{ transform: 'translate(0px,0px) scale(1)' }, { transform: 'translate(0px,-30px) scale(1.12)' }, { transform: 'translate(0px,0px) scale(1)' }], { dur: 800 })]);
        } },
      { say: 'Проверка: две по минус нула цяло и пет е минус едно. Четири цяло и осем минус минус едно е същото като четири цяло и осем плюс едно, тоест пет цяло и осем. Съвпада!',
        on: [async c => { soft(out(c.r)); BOT.mood(''); await c.b.line('4,8 - 2 · ( -0,5 ) = 4,8 - ( -1 )', { from: c.b.lines[0] }); },
          c => c.b.line('= 4,8 + 1 = 5,8'),
          async c => { await c.b.last.to('= 4,8 + 1 = 5,8 ✓'); await c.b.last.win('✓'); }] },
    ],
  });

  /* ================= 4. Хитри капани ================= */
  C.push({
    title: 'Хитри капани', theme: 2, setup: corner,
    beats: [
      chap(4, 'Хитри капани', 'Глава четвърта: хитри капани — деление, дроби и минус пред буквата.'),
      { say: 'Капан номер едно: две цяло и пет десети минус осемнадесет делено на [[x||икс]] е равно на три цяло и пет десети плюс две.',
        act: async c => { hdr('Капан <b>1</b> · x е делител'); c.b = board({ x: 760, y: 250, gap: 135, size: 88 }); await c.b.line('2,5 - 18 : x = 3,5 + 2', { fx: 'type' }); } },
      { say: 'Първо пресмятаме дясната страна: пет цяло и пет десети.',
        act: async c => { await c.b.last.frame('3,5', '2', { color: 'violet' }); await c.b.last.to('2,5 - 18 : x = 5,5', { into: '5,5' }); } },
      { say: 'Последното действие отляво е изваждане, затова кутията осемнадесет делено на [[x||икс]] е умалител. Умалителят е умаляемото минус разликата.',
        on: [c => c.b.last.frame('18', 'x', { tag: 'кутия = умалител' }), async c => { c.r = card(RULE.subtr); await c.b.line('18 : x = 2,5 - 5,5'); }] },
      { say: 'Две цяло и пет минус пет цяло и пет е минус три.', act: c => c.b.last.to('18 : x = -3', { into: '-3' }) },
      { say: 'Сега [[x||икс]] е делител: делимото делим на частното. Осемнадесет делено на минус три е минус шест.',
        on: [async c => { soft(out(c.r)); c.r = card(RULE.divisor); await c.b.last.frame('x', 'x', { tag: 'делител', color: 'gold' }); },
          async c => { await c.b.line('x = 18 : ( -3 )'); await c.b.last.to('x = -6', { into: '-6' }); await c.b.last.win('-6'); }] },
      { say: 'Проверка: осемнадесет делено на минус шест е минус три, а две цяло и пет минус минус три е пет цяло и пет. Вярно!',
        on: [async c => { soft(out(c.r)); await c.b.line('2,5 - 18 : ( -6 ) = 2,5 + 3', { from: c.b.lines[0] }); },
          async c => { const e = await c.b.line('= 5,5 ✓'); await e.win('✓'); }] },
      { say: 'Капан номер две — обикновени дроби: една четвърт минус две трети по [[x||икс]] е равно на едно цяло и една втора минус една четвърт.',
        act: async c => { await clear(); hdr('Капан <b>2</b> · дроби'); c.b = board({ x: 760, y: 250, gap: 140, size: 92 }); await c.b.line('1/4 - 2/3 · x = 1_1/2 - 1/4', { fx: 'type' }); } },
      { say: 'Дясната страна: три втори минус една четвърт е шест четвърти минус една четвърт, тоест пет четвърти.',
        act: async c => { const e = c.b.last; await e.to('1/4 - 2/3 · x = 3/2 - 1/4'); await wait(500); await e.to('1/4 - 2/3 · x = 6/4 - 1/4'); await wait(700); await e.to('1/4 - 2/3 · x = 5/4', { into: '5/4' }); } },
      { say: 'Две трети по [[x||икс]] е умалител: една четвърт минус пет четвърти е минус четири четвърти, тоест минус едно.',
        act: async c => { await c.b.last.frame('2/3', 'x', { tag: 'умалител' }); await wait(500); await c.b.line('2/3 · x = 1/4 - 5/4'); await wait(900); await c.b.last.to('2/3 · x = -4/4', { into: '-4/4' }); await wait(500); await c.b.last.to('2/3 · x = -1', { into: '-1' }); } },
      { say: '[[x||Икс]] е множител: минус едно делено на две трети е минус едно по три втори. [[x||Икс]] е минус три втори, или минус едно цяло и една втора.',
        on: [async c => { await c.b.line('x = -1 : 2/3'); await wait(700); await c.b.last.to('x = -1 · !3/2'); },
          async c => { await c.b.last.to('x = -3/2 = -1_1/2', { into: '-3/2' }); await c.b.last.win('-3/2', '-1_1/2'); }] },
      { say: 'Капан номер три: минус пред буквата! Минус [[y||игрек]] по скоба две цяло и седем плюс едно цяло и три е равно на четири цяло и шест минус седем.',
        act: async c => { await clear(); hdr('Капан <b>3</b> · минус пред буквата'); c.b = board({ x: 820, y: 260, gap: 140, size: 92 }); await c.b.line('-y · ( 2,7 + 1,3 ) = 4,6 - 7', { fx: 'type' }); } },
      { say: 'Пресмятаме скобата и дясната страна: минус [[y||игрек]] по четири е равно на минус две цяло и четири десети.',
        act: async c => { const e = c.b.last; await e.to('-y · 4 = 4,6 - 7', { into: '4' }); await wait(400); await e.to('-y · 4 = -2,4', { into: '-2,4' }); } },
      { say: 'Минус [[y||игрек]] е множител: минус две цяло и четири делено на четири е минус нула цяло и шест.',
        act: async c => { await c.b.last.frame('-y', '-y', { tag: 'множител', color: 'gold' }); await c.b.line('-y = -2,4 : 4'); await wait(500); await c.b.last.to('-y = -0,6', { into: '-0,6' }); } },
      { say: 'Щом минус [[y||игрек]] е минус нула цяло и шест, то самото [[y||игрек]] е нула цяло и шест. Просто сменяме знака и от двете страни!',
        on: [async c => { const e = await c.b.line('y = 0,6'); await e.win('0,6'); }, () => { BOT.mood('joy'); }] },
    ],
  });

  /* ================= 5. Думи → уравнение ================= */
  const NX = n => n === -99 ? 330 : 1600 + n * 100;
  function numberLine() {
    const ticks = [-99, ...Array.from({ length: 12 }, (_, i) => i - 10)];
    return svg(`<path id="ax" d="M260 560 H420 l16 -22 l20 44 l20 -44 l20 44 l16 -22 H1760" fill="none" stroke="#c9d3f0" stroke-width="5" stroke-linejoin="round"/>
      <path d="M1752 546 L1782 560 L1752 574" fill="none" stroke="#c9d3f0" stroke-width="5" stroke-linecap="round"/>
      ${ticks.map(n => `<line x1="${NX(n)}" y1="${n === 0 ? 536 : 544}" x2="${NX(n)}" y2="${n === 0 ? 584 : 576}" stroke="${n === 0 ? '#fff' : '#c9d3f0'}" stroke-width="${n === 0 ? 6 : 4}"/>
        <text x="${NX(n)}" y="620" text-anchor="middle" class="lbl" font-size="${n === 0 ? 34 : 30}" fill="${n === 0 ? '#fff' : '#aab4d6'}">${n < 0 ? '−' + -n : n}</text>`).join('')}
      <text x="460" y="790" class="lbl" font-size="30" fill="#ff5a6a">← по-малки</text><text x="1540" y="790" class="lbl" font-size="30" fill="#3dffa2">по-големи →</text>`, { fx: 'fade' });
  }
  function pin(n, color, cls, text, above) {
    const x = NX(n);
    add('', { x, y: 560, fx: 'pop', sound: 'pop', style: `width:34px;height:34px;border-radius:50%;background:${color};box-shadow:0 0 30px ${color};border:4px solid #fff` });
    return add(text, { cls: `tag ${cls} ${above ? 'above' : 'below'}`, x, y: above ? 450 : 655, center: false, fx: above ? 'down' : 'up' });
  }
  C.push({
    title: 'От думи към уравнение', theme: 1, setup: corner,
    beats: [
      chap(5, 'От думи към уравнение', 'Глава пета: задачи с думи. Тук [[x||икс]] се крие в изреченията.'),
      { say: 'Първо ни трябва речник. На числовата ос числата растат надясно, а отрицателните са вляво от нулата.',
        act: async c => { hdr('Речник на <b>детектива</b>'); const s = numberLine(); await draw(s.querySelector('#ax'), 1400); } },
      { say: 'Най-голямото отрицателно цяло число е минус едно — то е най-близо до нулата.',
        act: c => { pin(-1, '#ffd23f', 'gold', 'най-голямото отрицателно цяло: −1', true); } },
      { say: 'Най-голямото отрицателно двуцифрено число е минус десет. А най-малкото е минус деветдесет и девет — колкото по-наляво, толкова по-малко.',
        on: [c => { c.t10 = pin(-10, '#3fd8ff', '', 'най-голямото отрицателно двуцифрено: −10', false); },
          c => { pin(-99, '#ff4fd8', 'pink', 'най-малкото двуцифрено: −99', true); }] },
      { say: 'А сред едноцифрените отрицателни числа най-малкото е минус девет, а най-голямото — пак минус едно.',
        act: async c => { await out(c.t10); pin(-9, '#9b7bff', 'violet', 'най-малкото едноцифрено: −9', false); } },
      { say: 'Задача: разликата на най-голямото и най-малкото отрицателно едноцифрено число е разделена на някакво число. Частното е минус четиридесет. Кое е числото?',
        act: async c => {
          await clear();
          c.prob = add('<mark id="m1">Разликата</mark> на <mark id="m2">най-голямото</mark> и <mark id="m3">най-малкото отрицателно едноцифрено число</mark> е <mark id="m4">разделена на някакво число</mark>. <mark id="m5">Частното е −40</mark>. Кое е числото?', { cls: 'glass problem', x: 960, y: 250, fx: 'up', sound: 'pop' });
          c.b = board({ x: 960, y: 520, gap: 120, size: 84, top: 330 });
        } },
      { say: 'Превеждаме фраза по фраза. Най-голямото отрицателно едноцифрено число е минус едно, а най-малкото е минус девет.',
        on: [c => { c.prob.querySelector('#m1').classList.add('on3'); },
          async c => { c.prob.querySelector('#m2').classList.add('on'); c.prob.querySelector('#m3').classList.add('on2'); await c.b.line('( !-1 ) $- ( ^-9 )', { fx: 'pop' }); }] },
      { say: 'Разликата им е минус едно минус минус девет, тоест минус едно плюс девет — осем.',
        act: async c => { await c.b.last.to('( !-1 ) $- ( ^-9 ) = -1 + 9'); await wait(600); await c.b.last.to('( !-1 ) $- ( ^-9 ) = -1 + 9 = 8'); await c.b.last.win('8'); } },
      { say: 'Разделена на някакво число — значи осем делено на [[x||икс]]. А частното е минус четиридесет.',
        on: [c => { c.prob.querySelector('#m4').classList.add('on2'); },
          async c => { c.prob.querySelector('#m5').classList.add('on3'); await c.b.line('8 : x = -40'); }] },
      { say: '[[x||Икс]] е делител: делимото делим на частното. Осем делено на минус четиридесет е минус нула цяло и две десети.',
        on: [c => c.b.last.frame('x', 'x', { tag: 'делител', color: 'gold' }),
          async c => { await c.b.line('x = 8 : ( -40 )'); await wait(400); await c.b.last.to('x = 8 : ( -40 ) = -0,2'); await c.b.last.win('-0,2'); }] },
      { say: 'Проверка: осем делено на минус нула цяло и две десети е минус четиридесет. Браво!',
        act: async c => { soft(out(c.prob, 'up')); await c.b.shift(240); const e = await c.b.line('8 : ( -0,2 ) = -40'); await e.to('8 : ( -0,2 ) = -40 ✓'); await e.win('✓'); } },
      { say: 'Запомнете и тези фрази. „С кое число да умножим“ означава неизвестен множител. „На кое число да разделим“ — неизвестен делител. А „кое число да разделим на“ — неизвестно делимо.',
        act: async c => {
          await clear(); hdr('Фрази <b>→</b> уравнения');
          c.ph = add(`<div class="rc glass"><span>„С кое число да <b>умножим</b> А, за да получим Б?“</span><span class="m">А · ${X} = Б</span></div>
            <div class="rc glass"><span>„На кое число да <b>разделим</b> А, за да получим Б?“</span><span class="m">А : ${X} = Б</span></div>
            <div class="rc glass"><span>„Кое число да <b>разделим</b> на А, за да получим Б?“</span><span class="m">${X} : А = Б</span></div>`, { cls: 'phr', x: 960, y: 480, fx: 'none' });
          [...c.ph.children].forEach(e => { e.style.opacity = 0; });
        },
        on: [null, ...[0, 1, 2].map(i => async c => { SND.pop(); await anim(c.ph.children[i], [{ opacity: 0, translate: '-80px 0' }, { opacity: 1, translate: '0 0' }], { dur: 600 }); })] },
    ],
  });

  /* ================= 6. Насрещно движение ================= */
  const LA = 300, LBx = 1620, RY = 330, KM = (LBx - LA) / 252;
  function road(c) {
    const s = svg(`<defs><linearGradient id="asph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d3250"/><stop offset="1" stop-color="#1b1e33"/></linearGradient></defs>
      <rect x="${LA - 150}" y="${RY - 52}" width="${LBx - LA + 300}" height="104" rx="20" fill="url(#asph)" stroke="#454c78" stroke-width="3"/>
      <line x1="${LA}" y1="${RY}" x2="${LBx}" y2="${RY}" stroke="#ffd23f" stroke-width="4" stroke-dasharray="28 22" opacity=".65"/>
      ${ART.city(LA - 170, RY - 52, 'А', '#3fd8ff')}${ART.city(LBx + 170, RY - 52, 'Б', '#ff4fd8')}
      ${ART.clock('clk', 960, 128, 50)}
      <g id="cA">${ART.car('carA', '#3f8cff')}</g><g id="cB">${ART.car('carB', '#ff4f6a', true)}</g>
      <g id="tA" class="lbl"><rect x="-78" y="-27" width="156" height="46" rx="23" fill="#3f8cff"/><text y="7" text-anchor="middle" font-size="27" fill="#fff">80 км/ч</text></g>
      <g id="tB" class="lbl"><rect x="-78" y="-27" width="156" height="46" rx="23" fill="#ff4f6a"/><text y="7" text-anchor="middle" font-size="27" fill="#fff">? км/ч</text></g>`, { fx: 'up' });
    c.road = s;
    const q = id => s.querySelector('#' + id);
    const cA = q('cA'), cB = q('cB'), tA = q('tA'), tB = q('tB'), clk = q('clk');
    const wA = [...cA.querySelectorAll('.wheel')], wB = [...cB.querySelectorAll('.wheel')];
    c.setT = t => {
      const dA = Math.min(252, 80 * t), dB = Math.min(252, 60 * t), nA = LA + dA * KM, nB = LBx - dB * KM;
      cA.setAttribute('transform', `translate(${nA - 66} ${RY - 26}) scale(.8)`);
      cB.setAttribute('transform', `translate(${nB + 66} ${RY + 22}) scale(.8)`);
      wA.forEach(w => w.setAttribute('transform', `translate(${w.dataset.x} 24) rotate(${dA * KM * 4.2})`));
      wB.forEach(w => w.setAttribute('transform', `translate(${w.dataset.x} 24) rotate(${dB * KM * 4.2})`));
      tA.setAttribute('transform', `translate(${nA - 66} ${RY - 92})`);
      tB.setAttribute('transform', `translate(${nB + 66} ${RY + 96})`);
      ART.setClock(clk, 480 + t * 60); c.t = t;
    };
    c.setT(0);
  }
  const drive = (c, to, dur) => { const from = c.t; SND.engine(dur / 1000); return tween(dur, p => c.setT(V.lerp(from, to, p))); };
  function dim(x1, x2, y, label, col) {
    const s = svg(`<g stroke="${col}" stroke-width="4" stroke-linecap="round"><line class="dl" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y - 14}" x2="${x1}" y2="${y + 14}"/><line x1="${x2}" y1="${y - 14}" x2="${x2}" y2="${y + 14}"/></g>
      <text x="${(x1 + x2) / 2}" y="${y + 42}" text-anchor="middle" class="lbl" font-size="32" fill="${col}">${label}</text>`, { fx: 'fade' });
    soft(draw(s.querySelector('.dl'), 900));
    return s;
  }
  const mB = 1620 - 108 * KM;
  C.push({
    title: 'Насрещно движение', theme: 2, setup: corner,
    beats: [
      chap(6, 'Насрещно движение', 'Глава шеста: задачи за движение.'),
      { say: 'Тук ни трябва една формула: пътят е равен на скоростта по времето. От нея, по правилото за неизвестен множител, скоростта е път делено на време, а времето е път делено на скорост.',
        act: async c => { hdr('Формулата за <b>движение</b>'); c.b = board({ x: 960, y: 330, gap: 160, size: 120 }); c.e = await c.b.line('S = v · t', { fx: 'pop' }); await frames(c.e, [['S', 'S', { tag: 'път', color: 'pink' }], ['v', 'v', { tag: 'скорост' }], ['t', 't', { tag: 'време', color: 'violet' }]]); },
        on: [null, async c => { await c.b.line('v = S : t'); await c.b.line('t = S : v', { from: c.e }); }] },
      { say: 'Задача: две коли тръгват една срещу друга от градовете А и [[Б||Бе]] в осем часа сутринта. Разстоянието между градовете е двеста петдесет и два километра.',
        act: async c => { await clear(); road(c); },
        on: [null, c => { c.dim = dim(LA, LBx, 482, '252 км', '#c9d3f0'); }] },
      { say: 'Колата от А се движи с осемдесет километра в час. Двете коли се срещат в девет часа и четиридесет и осем минути.',
        on: [c => glowPulse(c.road.querySelector('#tA')),
          async c => { await drive(c, 1.8, 3600); ring(mB, RY, '#ffd23f'); SND.thud(); }] },
      { say: 'Намерете скоростта на втората кола и в колко часа тя ще пристигне в А.',
        act: c => glowPulse(c.road.querySelector('#tB')) },
      { say: 'Колко време са пътували? От осем часа до девет часа и четиридесет и осем минути е един час и четиридесет и осем минути.',
        act: async c => { c.b = board({ x: 960, y: 600, gap: 100, size: 70, top: 560 }); await c.b.line('t = 9:48 - 8:00 = 1 ч 48 мин', { fx: 'up' }); } },
      { say: 'Минутите превръщаме в часове: четиридесет и осем минути са четиридесет и осем шестдесети от часа, тоест нула цяло и осем десети. Значи времето е едно цяло и осем десети часа.',
        on: [c => c.b.line('48 мин = 48/60 ч = 0,8 ч', { from: null, fx: 'up' }),
          async c => { await drop(c.b); await c.b.last.to('t = 1,8 ч', { into: '1,8' }); await c.b.last.win('1,8'); }] },
      { say: 'Колите се движат една към друга, затова всеки час разстоянието между тях намалява с двете скорости заедно. Това е скоростта на сближаване.',
        act: async c => {
          await drive(c, 0, 1300);
          c.arr = svg(`<g stroke="#ffd23f" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 10px #ffd23f)">
            <path class="a1" d="M470 250 H860"/><path d="M836 234 L864 250 L836 266"/><path class="a2" d="M1450 420 H1060"/><path d="M1084 404 L1056 420 L1084 436"/></g>`, { fx: 'fade' });
          soft(draw(c.arr.querySelector('.a1'), 900)); soft(draw(c.arr.querySelector('.a2'), 900));
        },
        on: [null, c => { c.tg = add('скорост на сближаване = v<sub>1</sub> + v<sub>2</sub>', { cls: 'tag gold', x: 960, y: 172, center: false, fx: 'pop', sound: 'pop' }); }] },
      { say: 'За едно цяло и осем десети часа двете коли заедно са изминали целия път. Скоростта на сближаване е двеста петдесет и две делено на едно цяло и осем, тоест сто и четиридесет километра в час.',
        on: [async c => { soft(out(c.arr)); soft(out(c.tg)); soft(drive(c, 1.8, 2600)); await c.b.line('v_1 + v_2 = 252 : 1,8', { fx: 'up' }); },
          async c => { await c.b.last.to('v_1 + v_2 = 252 : 1,8 = 140 км/ч'); await c.b.last.pulse('140'); }] },
      { say: 'Значи втората кола се движи със сто и четиридесет минус осемдесет, тоест шестдесет километра в час.',
        act: async c => {
          const e = await c.b.line('v_2 = 140 - 80 = 60 км/ч'); await e.win('60');
          const t = c.road.querySelector('#tB'); t.querySelector('text').textContent = '60 км/ч'; t.querySelector('rect').setAttribute('fill', '#14a86a'); await glowPulse(t);
        } },
      { say: 'Проверка: първата кола е изминала осемдесет по едно цяло и осем, тоест сто четиридесет и четири километра. Втората е изминала шестдесет по едно цяло и осем, тоест сто и осем километра. Общо двеста петдесет и два. Вярно!',
        on: [async c => { soft(out(c.dim)); await c.b.clear(); c.b = board({ x: 960, y: 600, gap: 100, size: 70, top: 560 }); c.dA = dim(LA, mB, 482, '144 км', '#3f8cff'); await c.b.line('80 · 1,8 = 144 км', { fx: 'up' }); },
          async c => { c.dB = dim(mB, LBx, 482, '108 км', '#ff4f6a'); await c.b.line('60 · 1,8 = 108 км', { from: null, fx: 'up' }); },
          c => c.b.line('144 + 108 = 252 км', { from: null, fx: 'up' }),
          async c => { await c.b.last.to('144 + 108 = 252 км ✓'); await c.b.last.win('✓'); }] },
      { say: 'Кога втората кола ще стигне до А? Целият път делим на скоростта ѝ: двеста петдесет и две делено на шестдесет е четири цяло и две десети часа.',
        on: [async c => { soft(out(c.dA)); soft(out(c.dB)); await c.b.clear(); c.b = board({ x: 960, y: 600, gap: 100, size: 70, top: 560 }); await drive(c, 4.2, 3800); },
          c => c.b.line('t_2 = 252 : 60 = 4,2 ч', { fx: 'up' })] },
      { say: 'Нула цяло и две десети от часа са дванадесет минути, защото нула цяло и две по шестдесет е дванадесет. Значи пътуването трае четири часа и дванадесет минути.',
        on: [c => c.b.line('0,2 ч = 0,2 · 60 мин = 12 мин', { from: null, fx: 'up' }),
          async c => { const e = await c.b.line('t_2 = 4 ч 12 мин', { from: c.b.lines[0] }); await e.win('4', 'мин'); }] },
      { say: 'Внимание: въпросът е в колко часа! Колата е тръгнала в осем часа, значи пристига в А в дванадесет часа и дванадесет минути.',
        on: [async c => { const k = c.road.querySelector('#clk'); k.style.transformBox = 'fill-box'; k.style.transformOrigin = 'center'; SND.tick(); await anim(k, [{ scale: '1' }, { scale: '1.35' }, { scale: '1' }], { dur: 900 }); },
          async c => { const e = await c.b.line('8:00 + 4 ч 12 мин = 12:12', { from: null, fx: 'up' }); await e.win('12:12'); }] },
    ],
  });

  /* ================= 7. Кръгова писта ================= */
  const TX = 480, TY = 430, TL = 130, TR = 190, TP = 4 * TL + 2 * Math.PI * TR, TS0 = 3 * TL + Math.PI * TR;
  function track(c) {
    const d = ART.trackPath(TX, TY, TL, TR);
    const trail = col => Array.from({ length: 9 }, (_, i) => `<circle r="${21 - i * 1.8}" fill="${col}" opacity="${(1 - i / 9) * .55}"/>`).join('');
    const s = svg(`<defs><pattern id="chk" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fff"/><rect x="6" y="6" width="6" height="6" fill="#fff"/><rect x="6" width="6" height="6" fill="#111"/><rect y="6" width="6" height="6" fill="#111"/></pattern></defs>
      <path d="${d}" fill="#164d36" opacity=".8"/>
      <path d="${d}" fill="none" stroke="#b5553a" stroke-width="78"/>
      <path d="${d}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.5" stroke-dasharray="16 14"/>
      <path id="tp" d="${d}" fill="none" stroke="none"/>
      <rect x="${TX - 7}" y="${TY + TR - 39}" width="14" height="78" fill="url(#chk)"/>
      <text x="${TX}" y="${TY + TR + 78}" text-anchor="middle" class="lbl" font-size="28" fill="#fff" letter-spacing="4">СТАРТ</text>
      <text x="${TX}" y="${TY - TR - 58}" text-anchor="middle" class="lbl" font-size="34" fill="#ffd23f">1 обиколка = 250 м</text>
      <g id="r1">${trail('#ff5a6a')}</g><g id="r2">${trail('#3fd8ff')}</g>`, { fx: 'up' });
    c.trk = s;
    const p = s.querySelector('#tp'), r1 = [...s.querySelectorAll('#r1 circle')], r2 = [...s.querySelectorAll('#r2 circle')];
    const at = (laps, off) => {
      const L = ((TS0 + (laps % 1) * TP) % TP + TP) % TP, a = p.getPointAtLength(L), b = p.getPointAtLength((L + 2) % TP);
      const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1;
      return [a.x - dy / n * off, a.y + dx / n * off];
    };
    c.setRun = t => {
      const l1 = 15 * t, l2 = 14 * t;
      r1.forEach((e, i) => { const [x, y] = at(l1 - i * .012, -18); e.setAttribute('cx', x); e.setAttribute('cy', y); });
      r2.forEach((e, i) => { const [x, y] = at(l2 - i * .012, 18); e.setAttribute('cx', x); e.setAttribute('cy', y); });
      if (c.tm) c.tm.querySelector('b').textContent = Math.round(20 * t);
    };
    c.tm = add('⏱ <b>0</b> мин', { cls: 'counter', x: TX, y: TY - 70, fx: 'fade' });
    c.n1 = add('<span style="color:#ff5a6a">●</span> 1-ви: <b>?</b> обиколки', { cls: 'counter', x: TX, y: TY + 2, fx: 'fade' });
    c.n2 = add('<span style="color:#3fd8ff">●</span> 2-ри: <b>?</b> обиколки', { cls: 'counter', x: TX, y: TY + 56, fx: 'fade' });
    c.setRun(0);
  }
  const setN = async (el, v, col) => { const b = el.querySelector('b'); b.textContent = v; b.style.color = col; SND.pop(); await glowPulse(el); };
  C.push({
    title: 'Кръгова писта', theme: 3, setup: corner,
    beats: [
      chap(7, 'Кръгова писта', 'Глава седма: колоездачи на кръгова писта.'),
      { say: 'Пистата е дълга двеста и петдесет метра. Двама колоездачи тръгват заедно от старта и след двадесет минути отново заедно пресичат стартовата линия.',
        act: c => track(c),
        on: [null, async c => { SND.engine(9); await tween(9000, t => c.setRun(t), t => t); SND.ding(); ring(TX, TY + TR, '#ffd23f'); }] },
      { say: 'Първият кара с четиридесет и пет километра в час и е направил с четири обиколки повече от втория. Колко обиколки е направил всеки и с каква скорост кара вторият?',
        on: [c => { c.v1 = add('45 км/ч', { cls: 'tag', x: 340, y: 730, center: false, fx: 'pop', sound: 'pop', style: 'color:#ff8a96;border-color:#ff5a6a;background:rgba(255,90,106,.16)' }); c.v2 = add('? км/ч', { cls: 'tag', x: 620, y: 730, center: false, fx: 'pop', sound: 'pop' }); },
          async c => { await Promise.all([glowPulse(c.n1), glowPulse(c.n2), glowPulse(c.v2)]); }] },
      { say: 'Първо уеднаквяваме мерните единици: двадесет минути са двадесет шестдесети от часа, тоест една трета от часа.',
        act: async c => { c.b = board({ x: 1230, y: 230, gap: 110, size: 62, max: 800 }); await c.b.line('t = 20 мин = 20/60 ч = 1/3 ч', { fx: 'up' }); } },
      { say: 'Първият е изминал четиридесет и пет по една трета, тоест петнадесет километра. Това са петнадесет хиляди метра.',
        on: [c => c.b.line('S_1 = 45 · 1/3 = 15 км', { from: null, fx: 'up' }), c => c.b.last.to('S_1 = 15 км = 15~000 м')] },
      { say: 'Обиколките му са петнадесет хиляди делено на двеста и петдесет — шестдесет обиколки.',
        act: async c => { const e = await c.b.line('n_1 = 15~000 : 250 = 60'); await e.win('60'); await setN(c.n1, 60, '#ff8a96'); } },
      { say: 'Вторият е направил с четири обиколки по-малко — петдесет и шест. Неговият път е петдесет и шест по двеста и петдесет, тоест четиринадесет хиляди метра, или четиринадесет километра.',
        on: [async c => { await c.b.line('n_2 = 60 - 4 = 56', { from: null, fx: 'up' }); await setN(c.n2, 56, '#3fd8ff'); },
          async c => { await c.b.line('S_2 = 56 · 250 = 14~000 м', { from: null, fx: 'up' }); await wait(1600); await c.b.last.to('S_2 = 14~000 м = 14 км'); }] },
      { say: 'Скоростта е път делено на време: четиринадесет делено на една трета е четиринадесет по три, тоест четиридесет и два километра в час.',
        act: async c => { const e = await c.b.line('v_2 = 14 : 1/3 = 42 км/ч', { from: null, fx: 'up' }); await e.win('42'); c.v2.textContent = '42 км/ч'; c.v2.classList.add('green'); await glowPulse(c.v2); } },
    ],
  });

  /* ================= 8. Финал ================= */
  C.push({
    title: 'Планът на детектива', theme: 0, setup: corner,
    beats: [
      { say: 'Да обобщим плана на детектива.',
        act: async c => {
          add('Планът на <span class="hlw">детектива</span>', { cls: 'title', x: 960, y: 128, size: 66, fx: 'zoom', sound: 'whoosh' });
          const S = ['<b>Пресметни</b> всичко, което е известно', 'Намери <b>последното действие</b> и закрий останалото с кутия', 'Приложи <b>златното правило</b>', `Махай слоевете, докато остане <b>само ${X}</b>`, 'Винаги прави <b>проверка</b>'];
          c.st = add(S.map((t, i) => `<div class="step glass"><span class="n">${i + 1}</span><span>${t}</span></div>`).join(''), { cls: 'steps', x: 1010, y: 530, fx: 'none' });
          [...c.st.children].forEach(e => { e.style.opacity = 0; });
        } },
      { say: 'Едно: пресмятаме всичко, което е известно. Две: намираме последното действие и закриваме останалото с кутия. Три: прилагаме златното правило. Четири: махаме слоевете, докато остане само [[x||икс]]. И пет: винаги правим проверка!',
        on: [0, 1, 2, 3, 4].map(i => async c => { SND.pop(); await anim(c.st.children[i], [{ opacity: 0, translate: '-120px 0' }, { opacity: 1, translate: '0 0' }], { dur: 600, ease: V.BACK }); }) },
      { say: 'Сега е ваш ред — отворете учебника и хванете всеки [[x||икс]]! А ако искате истинско предизвикателство, ви чака ескейп стаята на Професор Минус.',
        act: async c => {
          await clear();
          add('Мисията е <span class="hlw">изпълнена!</span>', { cls: 'title', x: 960, y: 150, size: 80, fx: 'zoom', sound: 'whoosh' });
          add('', { x: 960, y: 560, fx: 'fade', style: 'width:1000px;height:1000px;border-radius:50%;background:radial-gradient(circle, rgba(255,210,63,.28), transparent 62%)' });
          await BOT.at(960, 560, 1.5, 1300); BOT.mood('joy'); SND.sparkle(); burst(960, 420, 120, 1.2);
        } },
      { say: 'До нови срещи, детективи!',
        act: async () => { BOT.pose('wave'); burst(500, 300, 80); await wait(400); burst(1420, 300, 80); } },
    ],
  });

  V.init();
})();
