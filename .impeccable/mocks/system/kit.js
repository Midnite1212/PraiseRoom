/* Ripple Out · Calm × Paper · shared building blocks for HTML mocks.
   Plain functions that return HTML strings; each mock page composes them. */
(function () {
  const P = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    back: '<path d="M15 6l-6 6 6 6"/>', prev: '<path d="M15 6l-6 6 6 6"/>', next: '<path d="M9 6l6 6-6 6"/>',
    chev: '<path d="M6 9l6 6 6-6"/>', arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>',
    music: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    setlist: '<path d="M4 6h11M4 11h11M4 16h7"/><path d="M17 20V11l4-1"/><circle cx="15.5" cy="20" r="1.6"/>',
    user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    listPlus: '<path d="M4 6h12M4 11h12M4 16h7"/><path d="M18 14v6M15 17h6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8M12 17h.01"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    one: '<rect x="7" y="4.5" width="10" height="15" rx="2"/>',
    two: '<rect x="3.5" y="4.5" width="7.5" height="15" rx="2"/><rect x="13" y="4.5" width="7.5" height="15" rx="2"/>',
    auto: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M12 8v8"/>',
    folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
    sing: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/>',
    request: '<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V16.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M12 8.5v5M9.5 11h5"/>',
    download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
    inline: '<path d="M5 6h9M5 18h14M12 9v6M9.5 12.5L12 15l2.5-2.5"/>',
    users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5a6 6 0 0 1 12 0"/><circle cx="17" cy="9.5" r="2.5"/><path d="M15.8 14.3A5 5 0 0 1 21 19"/>',
    grip: '<circle cx="9" cy="7" r="1"/><circle cx="15" cy="7" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="17" r="1"/><circle cx="15" cy="17" r="1"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2M18 14h2M14 18h2v2M18 18h2v2"/>',
    sparkle: '<path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M6.5 17.5L9 15M15 9l2.5-2.5"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>',
  };
  const I = (name, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;

  const frame = (cls, theme, inner, extra = '') =>
    `<div class="dev ${cls} theme-${theme} ${extra}">${inner}</div>`;
  const fig = (cap, inner) => `<figure><figcaption>${cap}</figcaption>${inner}</figure>`;
  const row = (...figs) => `<div class="row">${figs.join('')}</div>`;
  const sec = (title, text = '') => `<div class="sec"><h2>${title}</h2>${text ? `<p>${text}</p>` : ''}</div>`;
  const sub = (t) => `<p class="sub">${t}</p>`;

  /* ----- web shell: browser frames and the app bar ----- */
  const LOCK = '<svg class="i s16" viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>';
  const fmtUrl = (path) => { const [p, q] = path.split('?'); return `<b>${p}</b>${q ? '?' + q : ''}`; };
  const browser = (theme, path, inner, cls = 'desk') =>
    frame(cls, theme, `<div class="bchrome"><i></i><i></i><i></i><span class="url">${LOCK}${fmtUrl(path)}</span></div><div class="viewport">${inner}</div>`);
  const mbrowser = (theme, path, inner, cls = 'phone') =>
    frame(cls, theme, `<div class="mchrome"><span class="url">${LOCK}${fmtUrl(path)}</span></div><div class="viewport">${inner}</div>`);
  const LINKS = ['Home', 'Songbook', 'Setlists'];
  /* placeholder mark until the brand pass: a point with two widening rings */
  const MARK = '<svg class="mark" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="3" fill="currentColor"/><circle cx="14" cy="14" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".7"/><circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".35"/></svg>';
  /* ripple rings ornament: concentric circles fading outward from (cx, cy) */
  const rings = (n = 6, gap = 46, r0 = 54) => `<svg class="rings" viewBox="-${r0 + n * gap} -${r0 + n * gap} ${2 * (r0 + n * gap)} ${2 * (r0 + n * gap)}" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<circle r="${r0 + i * gap}" fill="none" stroke="currentColor" stroke-width="1.2" opacity="${(0.55 - i * 0.08).toFixed(2)}"/>`).join('')}</svg>`;
  /* opts.search=false hides the bar search (pages whose own search is the heading); opts.guest shows Sign in instead of the avatar */
  const webbar = (active, opts = {}) =>
    `<header class="wbar"><span class="brand">${MARK}Ripple Out <span>Worship</span></span><nav class="wlinks">${LINKS.map((t) => `<a class="${t === active ? 'on' : ''}" ${t === active ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>` +
    (opts.search === false ? '<span style="margin-left:auto"></span>' : `<span class="wsearch">${I('search', 's18')}Search songs, lyrics and setlists<kbd>/</kbd></span>`) +
    (opts.guest ? `<button class="btn">Sign in</button></header>` : `<span class="avatar" title="Joanna L.">JL</span></header>`);
  const mwebbar = () => `<header class="wbar m"><span class="brand">${MARK}Ripple Out <span>Worship</span></span><button class="btn icon quiet" aria-label="Search">${I('search')}</button><button class="btn icon quiet" aria-label="Menu">${I('menu')}</button></header>`;

  /* one octave keyboard for choosing a key: cur = sounding key, orig = the song's original key */
  const piano = (cur = 'D', orig = 'D', w = 44) => {
    const white = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const black = [['C♯', 0], ['E♭', 1], ['F♯', 3], ['A♭', 4], ['B♭', 5]];
    const W = white.map((k, i) => `<span class="pk w ${k === cur ? 'cur' : ''} ${k === orig ? 'orig' : ''}" style="left:${i * w}px;width:${w - 3}px"><b>${k}</b></span>`).join('');
    const B = black.map(([k, i]) => `<span class="pk b ${k === cur ? 'cur' : ''} ${k === orig ? 'orig' : ''}" style="left:${(i + 1) * w - w * 0.31}px;width:${w * 0.6}px"><b>${k}</b></span>`).join('');
    return `<div class="piano" style="width:${7 * w - 3}px">${W}${B}</div>`;
  };
  /* decorative stand-in for a QR code (finder squares + seeded modules) */
  const qr = (size = 168, seed = 7) => {
    const n = 25, c = size / n; let r = seed, cells = '';
    const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    const finder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      if (rnd() > 0.52) cells += `<rect x="${x * c}" y="${y * c}" width="${c}" height="${c}"/>`;
    }
    const fp = (x, y) => `<rect x="${x * c}" y="${y * c}" width="${7 * c}" height="${7 * c}" rx="${c}" fill="none" stroke="currentColor" stroke-width="${c}" transform="translate(${c / 2} ${c / 2}) scale(${6 / 7})" transform-origin="${x * c} ${y * c}"/><rect x="${(x + 2) * c}" y="${(y + 2) * c}" width="${3 * c}" height="${3 * c}" rx="${c / 2}"/>`;
    return `<svg class="qr" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="QR code for the public link"><g fill="currentColor">${cells}${fp(0, 0)}${fp(n - 7, 0)}${fp(0, n - 7)}</g></svg>`;
  };

  const seg = (items, on, cls = '') =>
    `<span class="seg ${cls}">${items.map((t, i) => `<span class="${i === on ? 'on' : ''}">${t}</span>`).join('')}</span>`;
  const keychip = (k, delta = '') =>
    `<button class="keychip"><span>Key</span><b>${k}</b>${delta ? `<i class="delta">${delta}</i>` : ''}${I('chev', 's16')}</button>`;
  const btn = (label, cls = '', icon = '') => `<button class="btn ${cls}">${icon ? I(icon, 's18') : ''}${label}</button>`;
  const ibtn = (icon, label, cls = '') => `<button class="btn icon ${cls}" aria-label="${label}">${I(icon)}</button>`;

  /* Public-domain hymns only, so first lines and lyrics can be shown. */
  const SONGS = [
    { t: 'Amazing Grace', a: 'John Newton', k: 'G', tempo: 'Slow', time: '3/4', code: 'A3', th: ['Thankfulness / Gratitude', 'The Cross'], fl: 'Amazing grace, how sweet the sound' },
    { t: 'A Mighty Fortress Is Our God', a: 'Martin Luther', k: 'C', tempo: 'Medium', time: '4/4', code: 'A7', th: ['Attributes of God'], fl: 'A mighty fortress is our God' },
    { t: 'All Creatures of Our God and King', a: 'Francis of Assisi', k: 'E♭', tempo: 'Medium', time: '3/4', code: 'A9', th: ['Worship / Adoration / Praise'], fl: 'All creatures of our God and King' },
    { t: 'Be Thou My Vision', a: 'Irish hymn', k: 'D', tempo: 'Slow', time: '3/4', code: 'B2', th: ['Intimacy / Love for God', 'Dependence'], fl: 'Be Thou my vision, O Lord of my heart' },
    { t: 'Blessed Assurance', a: 'Fanny Crosby', k: 'D', tempo: 'Medium', time: '9/8', code: 'B5', th: ['Hope'], fl: 'Blessed assurance, Jesus is mine' },
    { t: 'Come Thou Fount', a: 'Robert Robinson', k: 'D', tempo: 'Medium', time: '3/4', code: 'C4', th: ["God's Faithfulness"], fl: 'Come, Thou Fount of every blessing' },
    { t: 'Crown Him with Many Crowns', a: 'Matthew Bridges', k: 'D', tempo: 'Medium', time: '4/4', code: 'C6', th: ['Resurrection', 'Declaration (Victorious/Kingdom)'], fl: 'Crown Him with many crowns' },
    { t: 'Holy, Holy, Holy', a: 'Reginald Heber', k: 'E♭', tempo: 'Medium Slow', time: '4/4', code: 'H3', th: ['Holiness / Purity', 'Attributes of God'], fl: 'Holy, holy, holy! Lord God Almighty' },
    { t: 'How Firm a Foundation', a: 'John Rippon', k: 'G', tempo: 'Medium', time: '3/4', code: 'H8', th: ["God's Faithfulness"], fl: 'How firm a foundation, ye saints of the Lord' },
    { t: 'It Is Well with My Soul', a: 'Horatio Spafford & Philip Bliss', k: 'C', tempo: 'Slow', time: '4/4', code: 'I2', th: ['Hope', 'Obedience / Trust'], fl: 'When peace like a river attendeth my way' },
    { t: 'Joyful, Joyful, We Adore Thee', a: 'Henry van Dyke', k: 'G', tempo: 'Fast', time: '4/4', code: 'J1', th: ['Celebration'], fl: 'Joyful, joyful, we adore Thee' },
    { t: 'Praise to the Lord, the Almighty', a: 'Joachim Neander', k: 'F', tempo: 'Medium', time: '3/4', code: 'P4', th: ['Call to Worship'], fl: 'Praise to the Lord, the Almighty, the King of creation' },
    { t: 'Rock of Ages', a: 'Augustus Toplady', k: 'B♭', tempo: 'Slow', time: '4/4', code: 'R1', th: ['The Cross', 'Repentance'], fl: 'Rock of Ages, cleft for me' },
    { t: 'To God Be the Glory', a: 'Fanny Crosby', k: 'A♭', tempo: 'Fast', time: '4/4', code: 'T3', th: ['Worship / Adoration / Praise'], fl: 'To God be the glory, great things He hath done' },
    { t: 'When I Survey the Wondrous Cross', a: 'Isaac Watts', k: 'F', tempo: 'Slow', time: '4/4', code: 'W2', th: ['The Cross', 'Surrender / Sacrifice'], fl: 'When I survey the wondrous cross' },
  ];
  const THEMES = ['Attributes of God', 'Declaration (Victorious/Kingdom)', 'Call to Worship', 'Celebration', 'Church / Unity', 'Dependence', 'Freedom / Overcoming Sin', "God's Faithfulness", "God's Presence", 'Holiness / Purity', 'Holy Spirit', 'Hope', 'Intimacy / Love for God', 'Missions / Evangelism', 'Obedience / Trust', 'Prayer', 'Purpose/Destiny', 'Repentance', 'Resurrection', 'Surrender / Sacrifice', 'Thankfulness/Gratitude', 'The Cross', 'Worship / Adoration / Praise'];
  const TEMPOS = ['Fast', 'Medium', 'Medium slow', 'Slow'];
  const TIMES = ['4/4', '3/4', '6/8', '2/4', '2/2', '9/8', '12/8', 'Other'];
  const KEYS = ['C', 'C♯/D♭', 'D', 'E♭', 'E', 'F', 'F♯/G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

  /* Be Thou My Vision (Irish hymn, trans. Mary Byrne 1905; public domain) */
  const BTV = [
    ['Verse 1', [[['1', 'D', 'Be Thou my '], ['4', 'G', 'vision, O '], ['1', 'D', 'Lord of my '], ['5', 'A', 'heart']],
      [['', '', 'Naught be all '], ['1', 'D', 'else to me, '], ['4', 'G', 'save that Thou '], ['5', 'A', 'art']],
      [['', '', 'Thou my best '], ['6m', 'Bm', 'thought, by '], ['5', 'A', 'day or by '], ['1', 'D', 'night']],
      [['', '', 'Waking or '], ['4', 'G', 'sleeping, Thy '], ['5', 'A', 'presence my '], ['1', 'D', 'light']]]],
    ['Verse 2', [[['1', 'D', 'Be Thou my '], ['4', 'G', 'wisdom, and '], ['1', 'D', 'Thou my true '], ['5', 'A', 'word']],
      [['', '', 'I ever '], ['1', 'D', 'with Thee and '], ['4', 'G', 'Thou with me, '], ['5', 'A', 'Lord']],
      [['', '', 'Thou my great '], ['6m', 'Bm', 'Father, I '], ['5', 'A', 'Thy true '], ['1', 'D', 'son']],
      [['', '', 'Thou in me '], ['4', 'G', 'dwelling, and '], ['5', 'A', 'I with Thee '], ['1', 'D', 'one']]]],
    ['Verse 3', [[['1', 'D', 'Riches I '], ['4', 'G', 'heed not, nor '], ['1', 'D', "man's empty "], ['5', 'A', 'praise']],
      [['', '', 'Thou mine in'], ['1', 'D', 'heritance, '], ['4', 'G', 'now and al'], ['5', 'A', 'ways']],
      [['', '', 'Thou and Thou '], ['6m', 'Bm', 'only, first '], ['5', 'A', 'in my '], ['1', 'D', 'heart']],
      [['', '', 'High King of '], ['4', 'G', 'heaven, my '], ['5', 'A', 'treasure Thou '], ['1', 'D', 'art']]]],
    ['Verse 4', [[['1', 'D', 'High King of '], ['4', 'G', 'heaven, my '], ['1', 'D', 'victory '], ['5', 'A', 'won']],
      [['', '', 'May I reach '], ['1', 'D', "heaven's joys, "], ['4', 'G', "O bright heaven's "], ['5', 'A', 'Sun']],
      [['', '', 'Heart of my '], ['6m', 'Bm', 'own heart, '], ['5', 'A', 'whatever be'], ['1', 'D', 'fall']],
      [['', '', 'Still be my '], ['4', 'G', 'vision, O '], ['5', 'A', 'Ruler of '], ['1', 'D', 'all']]]],
  ];
  /* It Is Well with My Soul (Spafford / Bliss, 1873; public domain), key C */
  const IW = [
    ['Verse 1', [[['1', 'C', 'When peace like a '], ['4', 'F', 'river at'], ['1', 'C', 'tendeth my way,']],
      [['', '', 'When '], ['6m', 'Am', 'sorrows like '], ['2', 'D', 'sea billows '], ['5', 'G', 'roll;']],
      [['', '', 'What'], ['1', 'C', 'ever my '], ['4', 'F', 'lot, Thou hast '], ['1', 'C', 'taught me to '], ['6', 'A', 'say,']],
      [['', '', 'It is '], ['2m', 'Dm', 'well, it is '], ['5', 'G', 'well with my '], ['1', 'C', 'soul.']]]],
    ['Refrain', [[['1', 'C', 'It is well '], ['5', 'G', 'with my '], ['1', 'C', 'soul,']],
      [['4', 'F', 'It is well, it is '], ['5', 'G', 'well with my '], ['1', 'C', 'soul.']]]],
  ];
  /* phone: a long line breaks at the phrase boundary nearest its middle, never mid-phrase */
  const lyricsOnly = (song = BTV, n = 4, phone = false) => song.slice(0, n).map(([h, lines]) =>
    `<div class="stz"><p class="lab">${h}</p>${lines.map((ln) => {
      const text = ln.map((s) => s[2]).join('');
      if (!phone || text.length <= 30) return `<p class="ly">${text}</p>`;
      const words = text.split(' '); let best = 0, bd = Infinity, acc = 0;
      words.forEach((w, i) => { acc += w.length + 1; const punct = /[,;:]$/.test(w) ? -6 : 0; const d = Math.abs(acc - text.length / 2) + punct; if (i < words.length - 1 && d < bd) { bd = d; best = i; } });
      return `<p class="ly">${words.slice(0, best + 1).join(' ')}<br>${words.slice(best + 1).join(' ')}</p>`;
    }).join('')}</div>`).join('');
  /* phone: a line longer than ~36 characters breaks at the phrase boundary nearest its middle (balanced break) */
  const chords = (song = BTV, n = 4, mode = 'num', phone = false) => song.slice(0, n).map(([h, lines]) =>
    `<div class="stz"><p class="lab">${h}</p>${lines.map((ln) => {
      const text = ln.map((s) => s[2]).join('');
      let cut = -1;
      if (phone && text.length > 30) {
        let acc = 0, best = Infinity;
        ln.forEach((s, i) => { acc += s[2].length; const d = Math.abs(acc - text.length / 2); if (i < ln.length - 1 && d < best) { best = d; cut = i; } });
      }
      return `<div class="cln">${ln.map(([num, let_, tx], i) =>
        `<span class="cg"><span class="ch">${mode === 'num' ? num : let_}</span><span class="cl">${tx}</span></span>${i === cut ? '<span class="brk"></span>' : ''}`).join('')}</div>`;
    }).join('')}</div>`).join('');


  /* The vision as a diagram: worship rippling out from one person. Labels sit on a ray, one per ring. */
  /* the source is the Sunday stage; worship ripples out from it into everyday life */
  const SPHERES = ['the Sunday stage', 'the worship night', 'the care group', 'the living room', 'everyday life'];
  const labelledRipple = (gap = 74, r0 = 26, cls = '') => {
    const R = r0 + (SPHERES.length) * gap;
    const circles = SPHERES.map((_, i) => `<circle cx="0" cy="0" r="${r0 + (i + 1) * gap}" fill="none" stroke="currentColor" stroke-width="1.3" opacity="${(0.6 - i * 0.09).toFixed(2)}"/>`).join('');
    const labels = SPHERES.map((t, i) => `<span class="lr-l" aria-hidden="true" style="left:calc(50% + ${Math.round((r0 + (i + 1) * gap) * 0.707)}px);top:calc(50% - ${Math.round((r0 + (i + 1) * gap) * 0.707)}px)">${t}</span>`).join('');
    return `<div class="lr ${cls}" style="width:${2 * R}px;height:${2 * R}px"><svg viewBox="-${R} -${R} ${2 * R} ${2 * R}" aria-hidden="true">${circles}<circle r="${r0 * 0.38}" fill="currentColor"/></svg>${labels}<ol class="sr">${SPHERES.map((t) => `<li>${t}</li>`).join('')}</ol></div>`;
  };
  window.RO = { MARK, rings, labelledRipple, SPHERES, I, P, frame, fig, row, sec, sub, browser, mbrowser, webbar, mwebbar, piano, qr, IW, seg, keychip, btn, ibtn, SONGS, THEMES, TEMPOS, TIMES, KEYS, BTV, lyricsOnly, chords };
})();
