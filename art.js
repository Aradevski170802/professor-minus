/* Рисунки на стаите в перспектива. Задната стена: x 270–930, y 95–455.
   L(u,v) и Rw(u,v) превръщат точка от страничната стена (u: отпред→назад, v: горе→долу) в координати на сцената. */
const ART = (() => {
  const L = (u, v) => { const yt = 95 * u, yb = 675 - 220 * u; return [270 * u, yt + v * (yb - yt)]; };
  const Rw = (u, v) => { const p = L(u, v); return [1200 - p[0], p[1]]; };
  const pts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const quad = (m, u0, v0, u1, v1) => pts([m(u0, v0), m(u1, v0), m(u1, v1), m(u0, v1)]);
  const aff = (m, u0, v0, u1, v1, w, h) => { const a = m(u0, v0), b = m(u1, v0), c = m(u0, v1);
    return `matrix(${((b[0] - a[0]) / w).toFixed(4)} ${((b[1] - a[1]) / w).toFixed(4)} ${((c[0] - a[0]) / h).toFixed(4)} ${((c[1] - a[1]) / h).toFixed(4)} ${a[0].toFixed(1)} ${a[1].toFixed(1)})`; };
  const affR = (u0, v0, u1, v1, w, h) => aff(Rw, u1, v0, u0, v1, w, h);
  const hot = (id, label, inner) => `<g class="hot" data-id="${id}" tabindex="0" role="button" aria-label="${label}">${inner}</g>`;

  const DEFS = `<defs>
    <linearGradient id="gWallB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a4a3e"/><stop offset="1" stop-color="#1c3329"/></linearGradient>
    <linearGradient id="gWallL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#132a22"/><stop offset="1" stop-color="#22402f"/></linearGradient>
    <linearGradient id="gWallR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#11241d"/><stop offset="1" stop-color="#1f3b30"/></linearGradient>
    <linearGradient id="gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4a26"/><stop offset="1" stop-color="#4a2a14"/></linearGradient>
    <linearGradient id="gWoodL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6438"/><stop offset="1" stop-color="#6b4022"/></linearGradient>
    <linearGradient id="gFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2413"/><stop offset="1" stop-color="#6a4325"/></linearGradient>
    <linearGradient id="gBrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d27a"/><stop offset=".5" stop-color="#b8862b"/><stop offset="1" stop-color="#6e4b12"/></linearGradient>
    <linearGradient id="gSteel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a9b4b2"/><stop offset=".5" stop-color="#6d7876"/><stop offset="1" stop-color="#3e4645"/></linearGradient>
    <linearGradient id="gSteelV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3d4644"/><stop offset=".35" stop-color="#9aa6a3"/><stop offset=".6" stop-color="#6b7674"/><stop offset="1" stop-color="#2c3332"/></linearGradient>
    <linearGradient id="gTileB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d4648"/><stop offset="1" stop-color="#1b2c2e"/></linearGradient>
    <linearGradient id="gConc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2223"/><stop offset="1" stop-color="#3a4244"/></linearGradient>
    <radialGradient id="gLamp" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".5"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>
    <radialGradient id="gVig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".65"/></radialGradient>
    <radialGradient id="gCore" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff3c4"/><stop offset=".35" stop-color="#ff7a3d"/><stop offset="1" stop-color="#7a0d0d"/></radialGradient>
    <radialGradient id="gCoreOff" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#bfe9ff"/><stop offset=".4" stop-color="#2d6c96"/><stop offset="1" stop-color="#0b1c2b"/></radialGradient>
    <radialGradient id="gRedGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff3b2f" stop-opacity=".45"/><stop offset="1" stop-color="#ff3b2f" stop-opacity="0"/></radialGradient>
    <radialGradient id="gScreen" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#3cff9a" stop-opacity=".9"/><stop offset="1" stop-color="#0b3d22"/></radialGradient>
    <pattern id="pDamask" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M22 4 L30 22 L22 40 L14 22Z" fill="none" stroke="#d6e8d8" stroke-opacity=".05" stroke-width="2"/><circle cx="0" cy="0" r="3" fill="#d6e8d8" fill-opacity=".05"/><circle cx="44" cy="44" r="3" fill="#d6e8d8" fill-opacity=".05"/></pattern>
    <pattern id="pTile" width="40" height="30" patternUnits="userSpaceOnUse"><rect width="40" height="30" fill="none" stroke="#bfe0e0" stroke-opacity=".08" stroke-width="2"/></pattern>
    <pattern id="pHaz" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="24" fill="#e8b628"/><rect x="12" width="12" height="24" fill="#1a1a1a"/></pattern>
    <filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="fBlur"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="fGrain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .09 0"/></filter>
    <filter id="fShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity=".55"/></filter>
  </defs>`;

  function shell(o) { // общо: таван, стени, под, ламперия
    const planks = [...Array(13)].map((_, i) => `<line x1="${270 + i * 55}" y1="455" x2="${i * 100}" y2="675"/>`).join('') +
      [470, 492, 520, 556, 604, 660].map(y => { const t = (y - 455) / 220; return `<line x1="${270 - 270 * t}" y1="${y}" x2="${930 + 270 * t}" y2="${y}"/>`; }).join('');
    return `<polygon points="0,0 1200,0 930,95 270,95" fill="${o.ceil}"/>
      <polygon points="${quad(L, 0, 0, 1, 1)}" fill="url(#${o.wallL})"/><polygon points="${quad(Rw, 0, 0, 1, 1)}" fill="url(#${o.wallR})"/>
      <rect x="270" y="95" width="660" height="360" fill="url(#${o.wallB})"/>
      <rect x="270" y="95" width="660" height="360" fill="url(#${o.pat})"/>
      <polygon points="${quad(L, 0, 0, 1, 1)}" fill="url(#${o.pat})" opacity=".7"/><polygon points="${quad(Rw, 0, 0, 1, 1)}" fill="url(#${o.pat})" opacity=".7"/>
      <polygon points="0,675 270,455 930,455 1200,675" fill="url(#${o.floor})"/>
      <g stroke="#000" stroke-opacity=".28" stroke-width="1.5">${o.planks ? planks : ''}</g>
      <g stroke="#000" stroke-opacity=".5" stroke-width="2" fill="none"><line x1="270" y1="95" x2="270" y2="455"/><line x1="930" y1="95" x2="930" y2="455"/><line x1="0" y1="675" x2="270" y2="455"/><line x1="1200" y1="675" x2="930" y2="455"/></g>`;
  }
  const wainscot = () => `<rect x="270" y="335" width="660" height="120" fill="url(#gWood)"/><rect x="270" y="330" width="660" height="8" fill="#9a6438"/>
    <polygon points="${quad(L, 0, .667, 1, 1)}" fill="url(#gWood)" opacity=".9"/><polygon points="${quad(Rw, 0, .667, 1, 1)}" fill="url(#gWood)" opacity=".8"/>
    <polygon points="${quad(L, 0, .655, 1, .675)}" fill="#9a6438"/><polygon points="${quad(Rw, 0, .655, 1, .675)}" fill="#8a5a32"/>
    ${[300, 420, 540, 660, 780].map(x => `<rect x="${x}" y="350" width="100" height="90" fill="none" stroke="#2c170a" stroke-opacity=".5" stroke-width="2"/>`).join('')}`;

  /* ---------------- КАБИНЕТЪТ ---------------- */
  function office(S, P) {
    const lit = !!S.done.fuses, pOpen = !!S.got.painting, safeOpen = !!S.done.safe, cOpen = !!S.done.cryptex;
    const books = []; const cols = ['#7b1e1e', '#1f4f7a', '#b8862b', '#4d2a6b', '#2c6b3f', '#8a3d12', '#d8d0bc', '#3a3f4a'];
    [.25, .43, .61, .79].forEach((v0, r) => { let u = .5, i = r * 7;
      while (u < .84) { const w = .016 + ((i * 7) % 5) * .004, h = .13 + ((i * 3) % 4) * .012;
        books.push(`<polygon points="${quad(L, u, v0 + .16 - h, u + w, v0 + .16)}" fill="${cols[i % 8]}"/>`); u += w + .003; i++; } });
    const chalk = lit ? `<g font-family="Caveat, cursive" fill="#f3f1e6" font-size="26" opacity=".92">
        <text x="580" y="170">x₁ · … = …</text><text x="580" y="212">x₂ : … = …</text><text x="580" y="254">… · x₃ … = …</text>
        <text x="760" y="170" font-size="22" fill="#ffd36b">↻ x₁</text><text x="760" y="212" font-size="22" fill="#ffd36b">↺ x₂</text><text x="760" y="254" font-size="22" fill="#ffd36b">↻ x₃</text></g>` : '';
    const safe = `<rect x="335" y="160" width="120" height="125" rx="6" fill="url(#gSteel)" stroke="#222" stroke-width="3"/>
      ${safeOpen ? `<rect x="343" y="168" width="104" height="109" fill="#0b0d0d"/><rect x="343" y="222" width="104" height="5" fill="#333"/>
        <polygon points="335,160 300,150 300,295 335,285" fill="url(#gSteel)" stroke="#222" stroke-width="2"/>` :
      `<circle cx="395" cy="222" r="30" fill="#2a2f2e" stroke="#c9d1cf" stroke-width="3"/><circle cx="395" cy="222" r="10" fill="url(#gSteel)"/>
        ${[...Array(12)].map((_, i) => `<line x1="395" y1="194" x2="395" y2="199" stroke="#e9eeec" stroke-width="2" transform="rotate(${i * 30} 395 222)"/>`).join('')}
        <rect x="433" y="212" width="8" height="22" rx="3" fill="#c9d1cf"/>`}`;
    const painting = pOpen
      ? `<polygon points="470,138 520,150 520,290 470,302" fill="#b8862b" filter="url(#fShadow)"/><polygon points="476,146 514,156 514,284 476,294" fill="#2b3f5a"/>`
      : `<g filter="url(#fShadow)"><rect x="318" y="138" width="154" height="164" fill="url(#gBrass)"/><rect x="330" y="150" width="130" height="140" fill="#24384f"/>
        <circle cx="395" cy="212" r="34" fill="#efc9a0"/><path d="M360 196 q35-52 70 0 q-4-34-35-38 q-31 4-35 38z" fill="#e6e6e6"/>
        <circle cx="382" cy="208" r="9" fill="none" stroke="#151515" stroke-width="3"/><circle cx="408" cy="208" r="9" fill="none" stroke="#151515" stroke-width="3"/>
        <rect x="378" y="226" width="34" height="8" rx="4" fill="#e8553f"/><path d="M344 290 q51-58 102 0z" fill="#f2efe4"/>
        <rect x="372" y="292" width="46" height="8" fill="url(#gBrass)"/></g>`;
    const cryptex = cOpen
      ? `<g filter="url(#fShadow)"><rect x="560" y="482" width="44" height="20" rx="8" fill="url(#gBrass)"/><rect x="626" y="484" width="44" height="20" rx="8" fill="url(#gBrass)"/><rect x="604" y="488" width="22" height="8" rx="2" fill="#2a2a2a"/></g>`
      : `<g filter="url(#fShadow)"><rect x="562" y="482" width="104" height="22" rx="9" fill="url(#gBrass)"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${574 + i * 14}" y="480" width="10" height="26" rx="2" fill="#8a6418" stroke="#f3d27a" stroke-width=".8"/>`).join('')}</g>`;
    return DEFS + shell({ ceil: '#0e1915', wallL: 'gWallL', wallR: 'gWallR', wallB: 'gWallB', pat: 'pDamask', floor: 'gFloor', planks: true }) + wainscot() +
      `<polygon points="360,560 840,560 980,660 220,660" fill="#5a1414" opacity=".85"/><polygon points="385,572 815,572 935,648 265,648" fill="none" stroke="#c9a04a" stroke-opacity=".5" stroke-width="3"/>
      ${lit ? `<ellipse cx="600" cy="300" rx="520" ry="330" fill="url(#gLamp)"/>` : ''}
      <line x1="600" y1="0" x2="600" y2="55" stroke="#080d0b" stroke-width="3"/><path d="M570 55 h60 l22 34 h-104z" fill="#24382f"/><ellipse cx="600" cy="89" rx="52" ry="6" fill="${lit ? '#fff1c2' : '#2a2a22'}"/>
      ${hot('clock', 'Часовникът', `<circle cx="515" cy="150" r="26" fill="#f2efe4" stroke="#5a3820" stroke-width="5"/><text x="515" y="143" text-anchor="middle" font-size="9" font-family="Onest" fill="#222">−12</text><line class="clockhand" x1="515" y1="150" x2="515" y2="132" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/><line x1="515" y1="150" x2="528" y2="156" stroke="#111" stroke-width="3" stroke-linecap="round"/>`)}
      ${hot('safe', pOpen ? 'Сейфът' : 'Портретът на професора', safe + painting)}
      ${hot('board', 'Черната дъска', `<rect x="556" y="128" width="320" height="170" fill="#5a3820" filter="url(#fShadow)"/><rect x="566" y="138" width="300" height="150" fill="#1d2f2a"/><rect x="566" y="138" width="300" height="150" fill="url(#pDamask)" opacity=".4"/>${chalk}<rect x="600" y="292" width="40" height="6" fill="#ddd"/>`)}
      ${hot('fuses', 'Електрическото табло', `<polygon points="${quad(L, .1, .3, .28, .56)}" fill="url(#gSteel)" stroke="#111" stroke-width="3" filter="url(#fShadow)"/>
        <polygon points="${quad(L, .115, .32, .265, .54)}" fill="#59625f"/>
        <g transform="${aff(L, .13, .34, .25, .4, 100, 40)}"><polygon points="50,4 66,34 34,34" fill="#e8b628"/><text x="50" y="31" text-anchor="middle" font-size="20" font-weight="800" font-family="Onest">!</text></g>
        <circle cx="${L(.24, .5)[0]}" cy="${L(.24, .5)[1]}" r="7" class="${lit ? '' : 'blink'}" fill="${lit ? '#4dff88' : '#ff2a1f'}" filter="url(#fGlow)"/>
        <path d="M${L(.19, .56).join(' ')} Q ${L(.2, .64).join(' ')} ${L(.24, .66).join(' ')}" stroke="#111" stroke-width="5" fill="none"/>`)}
      ${hot('shelf', 'Библиотеката', `<polygon points="${quad(L, .48, .2, .86, .98)}" fill="#3a2212" filter="url(#fShadow)"/>${[.25, .43, .61, .79, .97].map(v => `<polygon points="${quad(L, .48, v - .012, .86, v + .006)}" fill="#7a4a26"/>`).join('')}${books.join('')}`)}
      ${hot('desk', 'Бюрото', `<polygon points="430,470 770,470 820,520 380,520" fill="#8a5630"/><rect x="380" y="520" width="440" height="16" fill="#5a3418"/>
        <rect x="392" y="536" width="20" height="100" fill="#3e2310"/><rect x="788" y="536" width="20" height="100" fill="#3e2310"/>
        <rect x="430" y="536" width="150" height="60" fill="url(#gWood)" stroke="#2c170a" stroke-width="2"/><rect x="490" y="560" width="30" height="6" rx="3" fill="url(#gBrass)"/>
        <polygon points="760,470 790,460 800,476 770,486" fill="#c9c2ad"/>
        <rect x="700" y="420" width="8" height="58" fill="#2b2b2b"/><path d="M682 420 h44 l-10 -26 h-24z" fill="url(#gBrass)"/>${lit ? '<ellipse cx="704" cy="478" rx="60" ry="14" fill="#ffe7a6" opacity=".35"/>' : ''}`)}
      ${hot('diary', 'Дневникът на професора', `<g filter="url(#fShadow)"><polygon points="450,488 505,480 548,490 494,500" fill="#6b1e1e"/><polygon points="455,484 505,476 505,480 455,488" fill="#f1e7cf"/><polygon points="505,476 545,486 548,490 505,480" fill="#e9dcc0"/><path d="M462 484 l36 -6 M466 488 l34 -6" stroke="#8a7d63" stroke-width="1.4"/></g>`)}
      ${hot('cryptex', 'Криптексът', cryptex)}
      ${hot('door1', 'Вратата към лабораторията', `<polygon points="${quad(Rw, .22, .2, .58, 1)}" fill="#2a1609"/>
        ${S.done.door1 ? `<polygon points="${quad(Rw, .25, .23, .55, 1)}" fill="#120606"/><polygon points="${quad(Rw, .25, .23, .55, 1)}" fill="url(#gRedGlow)"/>`
        : `<polygon points="${quad(Rw, .25, .23, .55, 1)}" fill="url(#gWoodL)"/>${[[.28, .27, .52, .55], [.28, .6, .52, .95]].map(r => `<polygon points="${quad(Rw, ...r)}" fill="none" stroke="#3c2210" stroke-width="3"/>`).join('')}
          <circle cx="${Rw(.51, .62)[0]}" cy="${Rw(.51, .62)[1]}" r="8" fill="url(#gBrass)"/>`}
        <g transform="${affR(.3, .28, .5, .33, 160, 30)}"><rect width="160" height="30" fill="#f2efe4"/><text x="80" y="21" text-anchor="middle" font-size="15" font-weight="800" font-family="Unbounded" fill="#1d2f2a">ЛАБОРАТОРИЯ</text></g>
        <polygon points="${quad(Rw, .6, .5, .66, .6)}" fill="#1b1b1b" stroke="#555" stroke-width="2"/>
        <circle cx="${Rw(.63, .53)[0]}" cy="${Rw(.63, .53)[1]}" r="5" fill="${S.done.door1 ? '#4dff88' : '#ff2a1f'}" filter="url(#fGlow)"/>`)}
      <rect width="1200" height="675" filter="url(#fGrain)" opacity=".7" pointer-events="none"/>
      <rect width="1200" height="675" fill="url(#gVig)" pointer-events="none"/>`;
  }

  return { office, DEFS, shell, L, Rw, quad, aff, affR, hot };
})();
