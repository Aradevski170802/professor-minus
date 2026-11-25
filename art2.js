/* Лабораторията с Минус-реактора */
ART.lab = (S, P) => {
  const { L, Rw, quad, aff, affR, hot } = ART;
  const off = !!S.won, lasers = !S.done.wires, usb = !!S.done.usb;
  const fcol = ['#ff5a4e', '#ffc23d', '#4fc3ff', '#b48cff'];
  const flask = (x, i) => `<path d="M${x + 10} 376 v18 l-16 30 a5 5 0 0 0 4 7 h40 a5 5 0 0 0 4 -7 l-16 -30 v-18z" fill="#d9f1ee" fill-opacity=".14" stroke="#d9f1ee" stroke-opacity=".7" stroke-width="2"/>
    <path d="M${x - 1} 414 l-4 8 a5 5 0 0 0 4 7 h40 a5 5 0 0 0 4 -7 l-4 -8z" fill="${S.fok && S.fok[i] ? fcol[i] : '#4a5452'}" ${S.fok && S.fok[i] ? 'filter="url(#fGlow)"' : ''}/>`;
  const beams = [395, 415, 435, 455].map((y, i) => `<line class="laser" style="animation-delay:${i * .13}s" x1="452" y1="${y}" x2="748" y2="${y + (i % 2 ? 6 : -6)}" stroke="#ff2a1f" stroke-width="3" filter="url(#fGlow)"/>`).join('');
  return ART.DEFS + ART.shell({ ceil: '#0b1213', wallL: 'gWallL', wallR: 'gWallR', wallB: 'gTileB', pat: 'pTile', floor: 'gConc', planks: false }) +
    `<polygon points="${quad(L, 0, 0, 1, 1)}" fill="#0b1a1c" opacity=".55"/><polygon points="${quad(Rw, 0, 0, 1, 1)}" fill="#0b1a1c" opacity=".55"/>
    <polygon points="380,470 820,470 900,540 300,540" fill="url(#pHaz)" opacity=".75"/><polygon points="392,478 808,478 878,532 322,532" fill="#262c2d"/>
    <ellipse cx="600" cy="300" rx="420" ry="300" fill="url(#gRedGlow)" class="${off ? '' : 'pulse'}" opacity="${off ? 0 : 1}"/>
    <g stroke="#3d4644" stroke-width="16" fill="none" stroke-linecap="round"><path d="M560 150 V60 H420 V0"/><path d="M640 150 V40 H820 V0"/><path d="M500 300 H340 V95"/><path d="M700 300 H900 V180 H930"/></g>
    <g stroke="#6b7674" stroke-width="6" fill="none" opacity=".6"><path d="M560 150 V60 H420 V0"/><path d="M640 150 V40 H820 V0"/></g>
    ${hot('terminal', 'Компютърът на професора', `<polygon points="292,392 452,392 466,410 278,410" fill="#4a5452"/><rect x="278" y="410" width="188" height="12" fill="#2a3130"/><rect x="290" y="422" width="12" height="40" fill="#1e2423"/><rect x="442" y="422" width="12" height="40" fill="#1e2423"/>
      <rect x="306" y="296" width="132" height="98" rx="10" fill="#cfc8b4" filter="url(#fShadow)"/><rect x="318" y="306" width="108" height="76" rx="8" fill="${usb ? 'url(#gScreen)' : '#0d1412'}"/>
      <text x="372" y="350" text-anchor="middle" font-size="11" font-family="JetBrains Mono" fill="${usb ? '#062012' : '#3cff9a'}" class="${usb ? '' : 'blink'}">${usb ? (S.done.machine ? 'A НАМЕРЕНО' : 'МАШИНА') : 'ВЪВЕДИ USB'}</text>
      <polygon points="330,398 418,398 424,406 324,406" fill="#9b9480"/><rect x="430" y="392" width="16" height="6" fill="#2b2b2b"/>`)}
    ${hot('reactor', 'Минус-реакторът', `<ellipse cx="600" cy="458" rx="150" ry="22" fill="#141819"/>
      <rect x="490" y="150" width="220" height="300" fill="url(#gSteelV)" filter="url(#fShadow)"/><ellipse cx="600" cy="150" rx="110" ry="20" fill="#8d9896"/><ellipse cx="600" cy="150" rx="70" ry="11" fill="#3d4644"/>
      ${[190, 400].map(y => `<rect x="484" y="${y}" width="232" height="14" fill="#2c3332"/>`).join('')}
      <rect x="545" y="214" width="110" height="176" rx="18" fill="#0a0a0a"/><rect x="553" y="222" width="94" height="160" rx="14" fill="${off ? 'url(#gCoreOff)' : 'url(#gCore)'}" class="${off ? '' : 'core'}"/>
      ${off ? '' : [0, 1, 2].map(i => `<line x1="${578 + i * 22}" y1="232" x2="${578 + i * 22}" y2="372" stroke="#fff6d0" stroke-width="3" opacity=".7" class="rod" style="animation-delay:${i * .3}s"/>`).join('')}
      <circle cx="600" cy="176" r="12" fill="#c0392b" stroke="#2c3332" stroke-width="3"/><rect x="592" y="174" width="16" height="4" fill="#fff"/>
      ${[505, 695].map(x => `<circle cx="${x}" cy="140" r="9" fill="${off ? '#2a3a3a' : '#ff2a1f'}" class="${off ? '' : 'beacon'}" filter="url(#fGlow)"/>`).join('')}
      <circle cx="515" cy="300" r="16" fill="#e9eeec" stroke="#2c3332" stroke-width="4"/><line x1="515" y1="300" x2="${off ? 506 : 526}" y2="${off ? 308 : 290}" stroke="#c0392b" stroke-width="3"/>
      <circle cx="685" cy="300" r="16" fill="#e9eeec" stroke="#2c3332" stroke-width="4"/><line x1="685" y1="300" x2="${off ? 676 : 696}" y2="${off ? 308 : 290}" stroke="#c0392b" stroke-width="3"/>
      <polygon points="535,470 665,470 680,505 520,505" fill="#3d4644"/><rect x="520" y="505" width="160" height="30" fill="#22292a"/>
      <rect x="560" y="476" width="80" height="18" rx="3" fill="#0b0f10"/><text x="600" y="490" text-anchor="middle" font-size="12" font-family="JetBrains Mono" fill="${off ? '#4fc3ff' : '#ff4a3d'}">${off ? 'OFF' : 'K = ?'}</text>
      <rect x="452" y="380" width="10" height="90" fill="#22292a"/><rect x="738" y="380" width="10" height="90" fill="#22292a"/>
      ${lasers ? beams : ''}`)}
    ${hot('lasers', 'Таблото на лазерната защита', `<rect x="764" y="188" width="104" height="112" rx="6" fill="url(#gSteel)" stroke="#1b1b1b" stroke-width="3" filter="url(#fShadow)"/><rect x="776" y="200" width="80" height="18" fill="#111"/>
      <text x="816" y="213" text-anchor="middle" font-size="10" font-family="JetBrains Mono" fill="${lasers ? '#ff4a3d' : '#4dff88'}">ЛАЗЕР ${lasers ? 'ВКЛ' : 'ИЗКЛ'}</text>
      ${fcol.concat(['#e8e8e8', '#4dff88', '#e8b628']).map((c, i) => `<path d="M${784 + i * 11} 232 q6 ${18 + (i % 3) * 8} ${(i % 2 ? 10 : -6)} 52" stroke="${c}" stroke-width="3" fill="none"/>`).join('')}`)}
    ${hot('flasks', 'Масата с колбите', `<polygon points="752,410 916,410 928,424 740,424" fill="#c9d2cf"/><rect x="740" y="424" width="188" height="10" fill="#7d8985"/><rect x="752" y="434" width="10" height="34" fill="#55605c"/><rect x="906" y="434" width="10" height="34" fill="#55605c"/>
      ${[0, 1, 2, 3].map(i => flask(762 + i * 40, i)).join('')}
      <rect x="770" y="342" width="130" height="30" rx="6" fill="#2a3130"/><circle cx="790" cy="357" r="6" fill="${S.done.flasks ? '#4dff88' : '#ff2a1f'}" filter="url(#fGlow)"/><text x="850" y="361" text-anchor="middle" font-size="10" font-family="JetBrains Mono" fill="#cfd8d4">СМЕСИТЕЛ</text>`)}
    ${hot('poster', 'Плакатът на стената', `<polygon points="${quad(L, .45, .22, .82, .56)}" fill="#e9e2cc" filter="url(#fShadow)"/>
      <g transform="${aff(L, .48, .25, .79, .33, 300, 60)}"><text x="150" y="40" text-anchor="middle" font-size="30" font-weight="800" font-family="Unbounded" fill="#1d2f2a">ЗНАЦИТЕ</text></g>
      <g transform="${aff(L, .5, .36, .78, .52, 200, 110)}" font-family="Onest" font-weight="800" font-size="26" fill="#1d2f2a"><text x="10" y="40">+ · + = +</text><text x="10" y="80">− · − = +</text><text x="120" y="40" fill="#c0392b">+ · − = −</text></g>
      ${S.got.uvGrid ? `<polygon points="${quad(L, .47, .3, .8, .55)}" fill="#8f5cff" opacity=".35" class="uvglow"/>` : ''}`)}
    ${hot('back', 'Обратно към кабинета', `<polygon points="${quad(L, .05, .14, .3, 1)}" fill="#1e1209"/><polygon points="${quad(L, .07, .17, .28, 1)}" fill="url(#gWoodL)"/>
      <g transform="${aff(L, .12, .25, .27, .3, 120, 30)}"><rect width="120" height="30" fill="#f2efe4"/><text x="60" y="21" text-anchor="middle" font-size="14" font-weight="800" font-family="Unbounded" fill="#1d2f2a">← КАБИНЕТ</text></g>`)}
    ${hot('exit', 'Изходът', `<polygon points="${quad(Rw, .16, .1, .62, 1)}" fill="#151a1b"/><polygon points="${quad(Rw, .19, .14, .59, 1)}" fill="url(#gSteel)"/>
      <polygon points="${quad(Rw, .19, .86, .59, 1)}" fill="url(#pHaz)"/><polygon points="${quad(Rw, .19, .14, .59, .2)}" fill="url(#pHaz)"/>
      <circle cx="${Rw(.39, .55)[0]}" cy="${Rw(.39, .55)[1]}" r="36" fill="none" stroke="#2c3332" stroke-width="9"/><circle cx="${Rw(.39, .55)[0]}" cy="${Rw(.39, .55)[1]}" r="8" fill="#2c3332"/>
      <g transform="${affR(.28, .035, .52, .09, 180, 34)}"><rect width="180" height="34" rx="4" fill="#0b0f10"/><text x="90" y="25" text-anchor="middle" font-size="20" font-weight="900" font-family="Unbounded" fill="${off ? '#4dff88' : '#ff2a1f'}" filter="url(#fGlow)">ИЗХОД</text></g>`)}
    <rect width="1200" height="675" filter="url(#fGrain)" opacity=".7" pointer-events="none"/>
    <rect width="1200" height="675" fill="url(#gVig)" pointer-events="none"/>`;
};
