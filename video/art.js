'use strict';
/* Рисунки: робот-детектив Бит, матрьошки, коли, часовници, писта, числова ос */
const ART = (() => {
  const bot = `<svg viewBox="0 0 260 320">
  <defs>
    <linearGradient id="bMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7ff"/><stop offset=".55" stop-color="#c4cde4"/><stop offset="1" stop-color="#8c97b8"/></linearGradient>
    <linearGradient id="bBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9eefb"/><stop offset="1" stop-color="#8f9abb"/></linearGradient>
    <linearGradient id="bHat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3f63"/><stop offset="1" stop-color="#1c1f38"/></linearGradient>
    <radialGradient id="bGlow"><stop offset="0" stop-color="#46e6ff" stop-opacity=".9"/><stop offset="1" stop-color="#46e6ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="bFlame" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#7ef0ff"/><stop offset="1" stop-color="#3f6bff" stop-opacity="0"/></radialGradient>
    <filter id="bSoft"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <ellipse cx="130" cy="312" rx="62" ry="8" fill="#000" opacity=".35"/>
  <path class="flame" d="M112 268 Q130 318 148 268 Z" fill="url(#bFlame)"/>
  <rect x="78" y="182" width="104" height="88" rx="34" fill="url(#bBody)" stroke="#5c6688" stroke-width="3"/>
  <circle cx="130" cy="224" r="19" fill="#141936" stroke="#5c6688" stroke-width="3"/>
  <text x="130" y="234" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="30" fill="#ffd23f">x</text>
  <g class="armL"><path d="M80 200 Q48 214 52 248" stroke="#8f9abb" stroke-width="14" fill="none" stroke-linecap="round"/><circle cx="52" cy="250" r="11" fill="#e9eefb" stroke="#5c6688" stroke-width="3"/></g>
  <g class="armR"><path d="M180 200 Q212 214 208 246" stroke="#8f9abb" stroke-width="14" fill="none" stroke-linecap="round"/>
    <g transform="translate(208 252) rotate(-20)"><rect x="-5" y="2" width="10" height="34" rx="4" fill="#6b4a2b"/><circle cx="0" cy="-16" r="21" fill="rgba(140,220,255,.25)" stroke="#d9b45a" stroke-width="6"/><path d="M-9 -24 a12 12 0 0 1 10 -5" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/></g></g>
  <rect x="26" y="96" width="18" height="50" rx="8" fill="#ff4fd8"/><rect x="216" y="96" width="18" height="50" rx="8" fill="#ff4fd8"/>
  <rect x="36" y="58" width="188" height="128" rx="52" fill="url(#bMetal)" stroke="#5c6688" stroke-width="3"/>
  <rect x="54" y="78" width="152" height="88" rx="38" fill="#0b1026"/>
  <ellipse cx="130" cy="122" rx="70" ry="38" fill="url(#bGlow)" opacity=".12"/>
  <g filter="url(#bSoft)" opacity=".7"><ellipse cx="102" cy="116" rx="13" ry="17" fill="#46e6ff"/><ellipse cx="158" cy="116" rx="13" ry="17" fill="#46e6ff"/></g>
  <ellipse class="eye" cx="102" cy="116" rx="12" ry="16" fill="#9ff3ff"/><ellipse class="eye" cx="158" cy="116" rx="12" ry="16" fill="#9ff3ff"/>
  <path class="happy" d="M88 120 Q102 100 116 120" stroke="#9ff3ff" stroke-width="7" fill="none" stroke-linecap="round"/><path class="happy" d="M144 120 Q158 100 172 120" stroke="#9ff3ff" stroke-width="7" fill="none" stroke-linecap="round"/>
  <rect class="mouth" x="117" y="143" width="26" height="5" rx="2.5" fill="#9ff3ff"/>
  <circle cx="76" cy="146" r="7" fill="#ff4fd8" opacity=".35"/><circle cx="184" cy="146" r="7" fill="#ff4fd8" opacity=".35"/>
  <ellipse cx="130" cy="62" rx="104" ry="15" fill="url(#bHat)"/>
  <path d="M62 62 Q66 14 130 10 Q194 14 198 62 Z" fill="url(#bHat)"/>
  <path d="M100 18 Q130 32 160 18" stroke="#14162b" stroke-width="5" fill="none" opacity=".7"/>
  <rect x="64" y="42" width="132" height="13" fill="#ffd23f"/>
  <circle class="antL" cx="186" cy="30" r="0" fill="#ff4fd8"/>
</svg>`;

  /* матрьошка: cx, основа by, височина h, цвят, надпис на престилката */
  function doll(id, cx, by, h, col, label) {
    const k = h / 300, X = v => cx + v * k, Y = v => by - 300 * k + v * k;
    const half = (top) => `
      <ellipse cx="${X(0)}" cy="${Y(200)}" rx="${100 * k}" ry="${100 * k}" fill="${col}"/>
      <circle cx="${X(0)}" cy="${Y(92)}" r="${74 * k}" fill="${col}"/>
      ${top ? `<circle cx="${X(0)}" cy="${Y(98)}" r="${52 * k}" fill="#ffe3c8"/>
      <path d="M${X(-52)} ${Y(90)} Q${X(0)} ${Y(20)} ${X(52)} ${Y(90)} Q${X(30)} ${Y(55)} ${X(0)} ${Y(62)} Q${X(-30)} ${Y(55)} ${X(-52)} ${Y(90)}Z" fill="#5a2b12"/>
      <circle cx="${X(-18)}" cy="${Y(100)}" r="${6 * k}" fill="#1b1b2b"/><circle cx="${X(18)}" cy="${Y(100)}" r="${6 * k}" fill="#1b1b2b"/>
      <circle cx="${X(-30)}" cy="${Y(116)}" r="${9 * k}" fill="#ff7a9a" opacity=".7"/><circle cx="${X(30)}" cy="${Y(116)}" r="${9 * k}" fill="#ff7a9a" opacity=".7"/>
      <path d="M${X(-10)} ${Y(124)} Q${X(0)} ${Y(132)} ${X(10)} ${Y(124)}" stroke="#c0392b" stroke-width="${4 * k}" fill="none" stroke-linecap="round"/>` : ''}`;
    return `<g id="${id}">
      <clipPath id="${id}T"><rect x="${X(-130)}" y="${Y(-10)}" width="${260 * k}" height="${175 * k}"/></clipPath>
      <clipPath id="${id}B"><rect x="${X(-130)}" y="${Y(165)}" width="${260 * k}" height="${150 * k}"/></clipPath>
      <g class="bot" clip-path="url(#${id}B)" style="transform-box:fill-box;transform-origin:50% 0">${half(false)}
        <ellipse cx="${X(0)}" cy="${Y(222)}" rx="${66 * k}" ry="${70 * k}" fill="#fff6e6"/>
        <circle cx="${X(-34)}" cy="${Y(262)}" r="${12 * k}" fill="#ff5a6a" opacity=".85"/><circle cx="${X(34)}" cy="${Y(262)}" r="${12 * k}" fill="#ffb03f" opacity=".85"/>
        <text x="${X(0)}" y="${Y(236)}" text-anchor="middle" font-family="Onest" font-weight="800" font-size="${(label.length > 2 ? 34 : 50) * k}" ${label === 'x' ? 'font-style="italic" font-family="Georgia,serif"' : ''} fill="#2a1840">${label}</text>
      </g>
      <g class="top" clip-path="url(#${id}T)" style="transform-box:fill-box;transform-origin:50% 100%">${half(true)}
        <ellipse cx="${X(0)}" cy="${Y(222)}" rx="${66 * k}" ry="${70 * k}" fill="#fff6e6"/>
        <path d="M${X(-60)} ${Y(165)} h${120 * k}" stroke="#ffd23f" stroke-width="${6 * k}"/>
      </g>
    </g>`;
  }

  function car(id, color, flip) {
    const s = flip ? -1 : 1;
    return `<g id="${id}"><g transform="scale(${s} 1)">
      <ellipse cx="0" cy="34" rx="80" ry="8" fill="#000" opacity=".35"/>
      <path d="M-78 18 Q-80 -4 -60 -8 L-34 -10 Q-18 -38 14 -38 L36 -38 Q54 -36 66 -12 L74 -8 Q84 -4 82 16 Q80 24 70 24 L-70 24 Q-78 24 -78 18Z" fill="${color}"/>
      <path d="M-26 -12 Q-14 -32 10 -32 L14 -32 L14 -12 Z M20 -32 L34 -32 Q48 -30 56 -12 L20 -12 Z" fill="#bfe9ff" opacity=".9"/>
      <rect x="66" y="-4" width="12" height="8" rx="3" fill="#fff6b0"/><rect x="-80" y="-2" width="8" height="8" rx="2" fill="#ff5a5a"/>
      <path d="M-70 4 H74" stroke="#000" stroke-opacity=".15" stroke-width="3"/>
      <g class="wheel" data-x="-44" transform="translate(-44 24)"><circle r="17" fill="#14141c"/><circle r="8" fill="#9aa3b8"/><path d="M-8 0 H8 M0 -8 V8" stroke="#14141c" stroke-width="3"/></g>
      <g class="wheel" data-x="48" transform="translate(48 24)"><circle r="17" fill="#14141c"/><circle r="8" fill="#9aa3b8"/><path d="M-8 0 H8 M0 -8 V8" stroke="#14141c" stroke-width="3"/></g>
    </g></g>`;
  }

  function clock(id, x, y, r = 58) {
    const ticks = Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${Math.sin(a) * (r - 6)}" y1="${-Math.cos(a) * (r - 6)}" x2="${Math.sin(a) * (r - 14)}" y2="${-Math.cos(a) * (r - 14)}" stroke="#2a2f4a" stroke-width="${i % 3 ? 3 : 5}" stroke-linecap="round"/>`; }).join('');
    return `<g id="${id}" transform="translate(${x} ${y})">
      <circle r="${r + 8}" fill="#ffd23f" opacity=".18"/>
      <circle r="${r}" fill="#f6f3ea" stroke="#2a2f4a" stroke-width="6"/>${ticks}
      <line class="hh" x1="0" y1="6" x2="0" y2="${-r * .5}" stroke="#1a1d33" stroke-width="7" stroke-linecap="round"/>
      <line class="mh" x1="0" y1="8" x2="0" y2="${-r * .78}" stroke="#ff4fd8" stroke-width="4.5" stroke-linecap="round"/>
      <circle r="6" fill="#1a1d33"/>
      <text class="dig" x="${r + 22}" y="13" text-anchor="start" font-family="Unbounded" font-weight="700" font-size="36" fill="#fff">8:00</text>
    </g>`;
  }
  function setClock(g, mins) {
    const h = (mins / 60) % 12, m = mins % 60;
    g.querySelector('.hh').setAttribute('transform', `rotate(${h * 30})`);
    g.querySelector('.mh').setAttribute('transform', `rotate(${m * 6})`);
    const hh = Math.floor(mins / 60), mm = Math.floor(mins % 60);
    g.querySelector('.dig').textContent = `${hh}:${String(mm).padStart(2, '0')}`;
  }

  function city(x, y, label, col) {
    const b = [[-70, 70, 40], [-26, 120, 46], [24, 90, 40], [-4, 150, 26]];
    return `<g transform="translate(${x} ${y})">
      ${b.map(([bx, h, w]) => `<rect x="${bx}" y="${-h}" width="${w}" height="${h}" rx="4" fill="#1d2550" stroke="${col}" stroke-opacity=".5" stroke-width="2"/>` +
        Array.from({ length: Math.floor(h / 26) }, (_, j) => `<rect x="${bx + 8}" y="${-h + 10 + j * 26}" width="${w - 16}" height="9" rx="2" fill="${col}" opacity="${.25 + (j % 2) * .4}"/>`).join('')).join('')}
      <circle cx="0" cy="34" r="34" fill="${col}"/><text x="0" y="48" text-anchor="middle" font-family="Unbounded" font-weight="900" font-size="38" fill="#0b0f2a">${label}</text>
    </g>`;
  }

  /* стадионна писта: център, полуширина на правата, радиус */
  function trackPath(cx, cy, L, R) {
    return `M${cx - L} ${cy - R} H${cx + L} A${R} ${R} 0 0 1 ${cx + L} ${cy + R} H${cx - L} A${R} ${R} 0 0 1 ${cx - L} ${cy - R} Z`;
  }

  return { bot, doll, car, clock, setClock, city, trackPath };
})();
V.BOT.mount(ART.bot);
