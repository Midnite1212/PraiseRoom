import { createStoredChoice } from '@/lib/stored-choice';

export const GLASS_STYLES = ['frosted', 'refract'] as const;

export type GlassStyle = (typeof GLASS_STYLES)[number];

const glassStyle = createStoredChoice('glass', GLASS_STYLES, 'frosted');

export const useGlassStyle = glassStyle.use;

// Only Chromium accepts an SVG filter in backdrop-filter; everyone else keeps the frosted stack.
export const canRefract = (): boolean =>
  'userAgentData' in navigator &&
  CSS.supports('backdrop-filter', 'url(#lg)') &&
  !matchMedia('(prefers-reduced-transparency: reduce)').matches;

const SVG_NS = 'http://www.w3.org/2000/svg';
const THICKNESS = 42;
const IOR = 1.52;
const SAMPLES = 128;
const DEFAULT_BLUR = 2.5;
const DEFAULT_DEPTH = 1.35;

const surface = (x: number) => (1 - (1 - x) ** 4) ** 0.25;

type Profile = { profile: Float32Array; maxDisp: number };

const profiles = new Map<number, Profile>();

// How far light bends across a convex-squircle bezel, from Snell's law.
const profileFor = (bezel: number): Profile => {
  const cached = profiles.get(bezel);
  if (cached) return cached;
  const eta = 1 / IOR;
  const profile = new Float32Array(SAMPLES);
  let maxDisp = 0;
  for (let i = 0; i < SAMPLES; i += 1) {
    const x = i / SAMPLES;
    const y = surface(x);
    const dx = x < 1 ? 1e-4 : -1e-4;
    const deriv = (surface(x + dx) - y) / dx;
    const mag = Math.hypot(deriv, 1);
    const nx = -deriv / mag;
    const ny = -1 / mag;
    const k = 1 - eta * eta * (1 - ny * ny);
    if (k < 0) continue;
    const sq = Math.sqrt(k);
    const rx = -(eta * ny + sq) * nx;
    const ry = eta - (eta * ny + sq) * ny;
    profile[i] = rx * ((y * bezel + THICKNESS) / ry);
    maxDisp = Math.max(maxDisp, Math.abs(profile[i] ?? 0));
  }
  const result = { profile, maxDisp: maxDisp || 1 };
  profiles.set(bezel, result);
  return result;
};

// A displacement map for the rounded rim (the centre stays undisplaced) and a specular rim map.
const makeMaps = (w: number, h: number, r: number, bezel: number) => {
  const { profile, maxDisp } = profileFor(bezel);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const disp = ctx.createImageData(w, h);
  new Uint32Array(disp.data.buffer).fill(0xff008080);
  const spec = ctx.createImageData(w, h);
  const dd = disp.data;
  const sd = spec.data;
  const rSq = r * r;
  const r1Sq = (r + 1) * (r + 1);
  const rBSq = Math.max(r - bezel, 0) ** 2;
  const wB = w - 2 * r;
  const hB = h - 2 * r;
  // A thin rim: a wider specular band leaves pills bright top and bottom with a dark strip between.
  const specBezel = Math.max(Math.min(bezel * 0.7, 11), 2);
  const lx = Math.cos(Math.PI / 3.2);
  const ly = Math.sin(Math.PI / 3.2);

  const paint = (x1: number, y1: number) => {
    const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0;
    const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0;
    const dSq = x * x + y * y;
    if (dSq > r1Sq) return;
    const dist = Math.sqrt(dSq);
    if (dist === 0 || dSq < rBSq) return;
    const opacity = dSq < rSq ? 1 : 1 - (dist - r) / (Math.sqrt(r1Sq) - r);
    if (opacity <= 0) return;
    const fromSide = r - dist;
    const cos = x / dist;
    const sin = y / dist;
    const idx = (y1 * w + x1) * 4;
    const shift = profile[Math.min(Math.trunc((fromSide / bezel) * SAMPLES), SAMPLES - 1)] ?? 0;
    dd[idx] = Math.trunc(128 + ((-cos * shift) / maxDisp) * 127 * opacity + 0.5);
    dd[idx + 1] = Math.trunc(128 + ((-sin * shift) / maxDisp) * 127 * opacity + 0.5);
    if (fromSide < specBezel) {
      const dot = Math.abs(cos * lx - sin * ly);
      const light = Math.min(1, dot * (1 - Math.max(fromSide, 0) / specBezel) ** 1.5);
      sd[idx] = 255;
      sd[idx + 1] = 255;
      sd[idx + 2] = 255;
      sd[idx + 3] = Math.trunc(255 * light * opacity);
    }
  };

  const band = Math.ceil(Math.max(r, specBezel)) + 1;
  for (let y1 = 0; y1 < h; y1 += 1) {
    if (y1 < band || y1 >= h - band) {
      for (let x1 = 0; x1 < w; x1 += 1) paint(x1, y1);
    } else {
      const edge = Math.min(band, w);
      for (let x1 = 0; x1 < edge; x1 += 1) paint(x1, y1);
      for (let x1 = Math.max(w - band, edge); x1 < w; x1 += 1) paint(x1, y1);
    }
  }
  ctx.putImageData(disp, 0, 0);
  const dispUrl = canvas.toDataURL();
  ctx.putImageData(spec, 0, 0);
  return { dispUrl, specUrl: canvas.toDataURL(), maxDisp };
};

let defs: SVGDefsElement | null = null;
const filters = new Map<string, string>();

const ensureDefs = (): SVGDefsElement => {
  if (defs) return defs;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.style.overflow = 'hidden';
  defs = document.createElementNS(SVG_NS, 'defs');
  svg.append(defs);
  document.body.append(svg);
  return defs;
};

// Red, green and blue bend by slightly different amounts, for a little dispersion at the rim.
const channel = (index: number, scale: number) =>
  `<feDisplacementMap in="b" in2="d" scale="${scale.toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="d${index}"/>`;

const keepChannel = (index: number, row: string) =>
  `<feColorMatrix in="d${index}" type="matrix" values="${row}" result="c${index}"/>`;

// Same-size glass shares one filter.
const filterFor = (w: number, h: number, r: number, bezel: number, blur: number, depth: number) => {
  const key = `${w}x${h}r${r}b${bezel}s${blur}d${depth}`;
  const cached = filters.get(key);
  if (cached) return cached;
  const maps = makeMaps(w, h, r, bezel);
  if (!maps) return null;
  const id = `lg-${filters.size}`;
  const scale = maps.maxDisp * depth;
  ensureDefs().insertAdjacentHTML(
    'beforeend',
    `<filter id="${id}" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="b"/>
      <feImage href="${maps.dispUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="d"/>
      ${channel(0, scale)}${channel(1, scale * 0.94)}${channel(2, scale * 0.88)}
      ${keepChannel(0, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
      ${keepChannel(1, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
      ${keepChannel(2, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
      <feBlend in="c0" in2="c1" mode="screen" result="rg"/>
      <feBlend in="rg" in2="c2" mode="screen" result="rgb"/>
      <feColorMatrix in="rgb" type="saturate" values="1.7" result="sat"/>
      <feImage href="${maps.specUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="s"/>
      <feComponentTransfer in="s" result="sf"><feFuncA type="linear" slope="0.85"/></feComponentTransfer>
      <feBlend in="sf" in2="sat" mode="screen"/>
    </filter>`
  );
  filters.set(key, id);
  return id;
};

const numberVar = (style: CSSStyleDeclaration, name: string, fallback: number) => {
  const value = Number.parseFloat(style.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
};

const apply = (el: HTMLElement) => {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (w < 8 || h < 8 || w > 2400 || h > 2400) return;
  const style = getComputedStyle(el);
  const r = Math.floor(Math.min(parseFloat(style.borderTopLeftRadius) || 0, w / 2, h / 2));
  if (r < 4) return;
  const bezel = Math.max(2, Math.min(Math.round(r * 0.85), 30, r - 1));
  const blur = numberVar(style, '--lg-blur', DEFAULT_BLUR);
  const depth = numberVar(style, '--lg-depth', DEFAULT_DEPTH);
  const id = filterFor(w, h, r, bezel, blur, depth);
  if (id) el.style.setProperty('--lg', `url(#${id})`);
};

// The rim highlight and the face sheen sit where the pointer is.
const followPointer = (): (() => void) => {
  let hot: HTMLElement | null = null;
  let frame = 0;
  let last: PointerEvent | null = null;
  const update = () => {
    frame = 0;
    if (!last) return;
    const target =
      last.target instanceof Element ? last.target.closest<HTMLElement>('.glass') : null;
    if (hot && hot !== target) hot.style.setProperty('--sheen', '0');
    hot = target;
    if (!target) return;
    const box = target.getBoundingClientRect();
    target.style.setProperty(
      '--mx',
      `${(((last.clientX - box.left) / box.width) * 100).toFixed(1)}%`
    );
    target.style.setProperty(
      '--my',
      `${(((last.clientY - box.top) / box.height) * 100).toFixed(1)}%`
    );
    target.style.setProperty('--sheen', '1');
  };
  const onMove = (event: PointerEvent) => {
    last = event;
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  return () => {
    window.removeEventListener('pointermove', onMove);
    cancelAnimationFrame(frame);
    hot?.style.setProperty('--sheen', '0');
  };
};

// Watches every `.glass` element and gives each a refraction filter sized to it; returns a stop function.
const startRefraction = (): (() => void) => {
  const pending = new Set<HTMLElement>();
  let timer = 0;
  const flush = () => {
    for (const el of pending) if (el.isConnected) apply(el);
    pending.clear();
  };
  const queue = (el: HTMLElement) => {
    pending.add(el);
    clearTimeout(timer);
    timer = window.setTimeout(() => requestAnimationFrame(flush), 60);
  };
  const resize = new ResizeObserver((entries) => {
    for (const entry of entries) if (entry.target instanceof HTMLElement) queue(entry.target);
  });
  const watch = (root: ParentNode) => {
    for (const el of root.querySelectorAll<HTMLElement>('.glass')) resize.observe(el);
  };
  const mutations = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.classList.contains('glass')) resize.observe(node);
        watch(node);
      }
    }
  });
  watch(document);
  mutations.observe(document.body, { childList: true, subtree: true });
  const stopPointer = followPointer();
  document.documentElement.classList.add('refract');
  return () => {
    clearTimeout(timer);
    resize.disconnect();
    mutations.disconnect();
    stopPointer();
    document.documentElement.classList.remove('refract');
  };
};

// Applied with `.refract` on `<html>`; `src/styles.css` swaps each glass backdrop to its filter.
export const syncGlassStyle = (): (() => void) => {
  let stop: (() => void) | null = null;
  const applyStyle = () => {
    const on = glassStyle.read() === 'refract' && canRefract();
    if (on && !stop) stop = startRefraction();
    if (!on && stop) {
      stop();
      stop = null;
    }
  };
  applyStyle();
  return glassStyle.subscribe(applyStyle);
};
