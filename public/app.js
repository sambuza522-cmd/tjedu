/* caedu — 틀의 동작. 관통 장치 = 출발판 하나(스플릿플랩). 문안·색·글꼴·글자표는 전부 data/ 에서 받는다.
   마스터 = ScrollTrigger 1(scrub, pin 0) · 루프 = GSAP ticker 1(멎으면 2초 뒤 쉼) · RM / Save-Data = 정지 서사.
   운동은 직각·칸 단위(단속): 진행값은 qz() 로 계단을 탄다. 페이드 0. */
(function () {
'use strict';
const D = document, H = D.documentElement, W = window;
const $ = (s, r) => (r || D).querySelector(s), $$ = (s, r) => Array.from((r || D).querySelectorAll(s));
const GSAP_SRC = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js';
const ST_SRC = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const prog = (s, a, b) => b <= a ? (s >= b ? 1 : 0) : clamp((s - a) / (b - a), 0, 1);
const io = t => t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
const qz = (t, n) => Math.floor(clamp(t, 0, 1) * n + 1e-6) / n;
const REQ = W.CAEDU_REQ || { c: 'tj', l: '' };
function loadScript(src) { return new Promise((ok, no) => { const s = D.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; D.head.appendChild(s); }); }

function boot() {
  const CA = W.CAEDU;
  if (!CA || !CA.lang || !CA.lang.ru) { console.error('caedu: data/ru.js missing'); return; }
  const C = CA.country && CA.country[REQ.c];
  if (C) { init(CA, C); return; }
  /* 나라 파일이 없으면 주소를 기본 나라로 바꿔 다시 연다 — 주소의 나라와 화면의 나라가 어긋난 채 열리지 않는다 */
  console.error('caedu: no country file data/' + REQ.c + '.js (or it failed to register)');
  if (REQ.c !== 'tj') location.replace('?c=tj' + (REQ.l ? '&l=' + REQ.l : '') + location.hash);
}

function init(CA, C) {
/* ── 언어 · 문안 ── */
const RU = CA.lang.ru;
const LANGS = C.open.filter(l => l === 'ru' || !!(C.copy && C.copy[l]));
const L = LANGS.includes(REQ.l) ? REQ.l : (LANGS.includes(C.defaultLang) ? C.defaultLang : 'ru');
/* 열리지 않은 언어를 주소에 적었으면 실제로 연 언어로 주소를 맞춘다 */
if (REQ.l && REQ.l !== L) { location.replace('?c=' + C.code + '&l=' + L + location.hash); return; }
const PACK = L === 'ru' ? RU : C.copy[L];
const DICT = PACK.t;
const BRAND = C.brand.name || (C.brand.code + C.brand.suffix);
const VARS = Object.assign({}, C.names[L] || C.names.ru, { capital: (C.capital && (C.capital[L] || C.capital.ru)) || '', brand: BRAND,
  color: (C.colors && C.colors.name && C.colors.name[L]) || null }); /* {color} = 판 키 색 이름(나라 파일 colors.name) — 없으면 자리표시가 그대로 남고 검사기가 막는다 */
/* 원고는 고른 언어 사전 하나만 읽는다(다른 언어로 메우지 않는다). 빈 문자열도 빠진 키로 본다 */
const has = k => typeof DICT[k] === 'string' && DICT[k] !== '';
const NB = s => s.replace(/ ([—–]) /g, ' $1 '); /* 줄표가 줄 머리에 오지 않게 */
function t(k, v) {
  if (!has(k)) { console.error('caedu: missing copy', L + ':' + k); return ''; }
  return NB(DICT[k].replace(/\{(\w+)\}/g, (m, n) => v && v[n] != null ? v[n] : (VARS[n] != null ? VARS[n] : m)));
}
const pick = v => v == null ? null : typeof v === 'string' ? v : (typeof v[L] === 'string' ? v[L] : null); /* 행 값: 문자열 또는 언어별 */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
H.lang = PACK.meta.code;
D.title = t('doc.title');
const md = $('meta[name="description"]'); if (md) md.setAttribute('content', t('doc.desc'));

/* 글꼴 — 나라 데이터의 요구대로 */
const fq = a => a.map(f => '"' + f + '"').join(',');
/* 한글 대체(공용 회사 이름, data/common.js hangul) — 나라 sans 뒤에만: 라틴·키릴 글자는 그대로 나라 글꼴이 그린다 */
const HG = CA.common && CA.common.hangul, HZ = Array.from(new Set(Array.from(JSON.stringify((CA.common && CA.common.company) || {})))).filter(ch => /\p{Script=Hangul}/u.test(ch)).join(''); /* 회사 칸(이름·주소)의 한글 전부 */
const SANS = fq(C.fonts.sans) + (HG && HZ ? ',' + fq([HG.family]) : '') + ',sans-serif', MONO = fq(C.fonts.mono) + ',ui-monospace,monospace';
H.style.setProperty('--f-sans', SANS); H.style.setProperty('--f-mono', MONO);
H.style.setProperty('--wmax', String(Math.max.apply(null, C.board.cells.map(c => c.w))));
const fl = D.createElement('link'); fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?' + C.fonts.google + '&display=swap'; D.head.appendChild(fl);
if (HG && HZ) { const fk = D.createElement('link'); fk.rel = 'stylesheet'; fk.href = 'https://fonts.googleapis.com/css2?' + HG.google + '&text=' + encodeURIComponent(HZ) + '&display=swap'; D.head.appendChild(fk); }

let STILL = H.classList.contains('still');
const mqWide = matchMedia('(min-width:1200px)');

/* ── 아이콘: 직접 그린 24 격자 선, 직각 ── */
const ICO = {
  arrow: '<path d="M3 12H19"/><path d="M13 6L19 12L13 18"/>',
  ext: '<path d="M13 4H20V11"/><path d="M20 4L11 13"/><path d="M17 15V20H4V7H9"/>',
  menu: '<path d="M3 6H21"/><path d="M3 12H21"/><path d="M3 18H15"/>',
  close: '<path d="M5 5L19 19"/><path d="M19 5L5 19"/>',
  theme: '<rect x="3" y="5" width="18" height="14"/><path class="fl" d="M3 5H12V19H3Z"/>',
  msg: '<path d="M3 4H21V16H11V20H7V16H3Z"/><path d="M7 9H17"/><path d="M7 12H13"/>',
  send: '<path d="M3 5V19L21 12Z"/><path d="M3 12H11"/>',
  copy: '<rect x="8" y="8" width="12" height="12"/><path d="M4 16V4H16"/>',
  slot: '<rect x="4" y="9" width="16" height="6"/><path d="M12 3V9"/><path d="M12 15V21"/>'
};
const ico = (n, cls) => '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICO[n] + '</svg>';

const TOUCH = new Map();
function css(el, p, v) { let m = TOUCH.get(el); if (!m) { m = {}; TOUCH.set(el, m); } if (m[p] === v) return; m[p] = v; if (p.charCodeAt(0) === 45) el.style.setProperty(p, v); else el.style[p] = v; }
function resetCss() { TOUCH.forEach((m, el) => { for (const p in m) { if (p.charCodeAt(0) === 45) el.style.removeProperty(p); else el.style[p] = ''; } }); TOUCH.clear(); }

/* ── 낱칸 ── */
const RING = Array.from(C.drum), RL = RING.length;
const pad = (s, w) => { const a = Array.from(s); while (a.length < w) a.push(' '); return a.slice(0, w); };
function staticTile(ch) { const c = esc(ch === ' ' ? ' ' : ch); return '<span class="tl" aria-hidden="true"><b class="ta"><i>' + c + '</i></b><b class="tb"><i>' + c + '</i></b><b class="tc"><i></i></b><b class="td"><i></i></b></span>'; }
function mkTile() {
  const s = D.createElement('span'); s.className = 'tl'; s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<b class="ta"><i></i></b><b class="tb"><i></i></b><b class="tc"><i></i></b><b class="td"><i></i></b>';
  const b = s.children; const T = { el: s, a: b[0].firstChild, b: b[1].firstChild, c: b[2], d: b[3], ci: b[2].firstChild, di: b[3].firstChild, k: '', cv: false, dv: false };
  setT(T.a, ' '); setT(T.b, ' '); return T;
}
function setT(e, ch) { if (e._c !== ch) { e._c = ch; e.textContent = ch === ' ' ? ' ' : ch; } }
function paint(T, cur, nxt, ph) {
  const k = cur + nxt + (ph > 0 ? Math.round(ph * 90) : 0);
  if (T.k === k) return false; T.k = k;
  if (!(ph > 0)) {
    setT(T.a, cur); setT(T.b, cur);
    if (T.cv) { T.c.style.visibility = 'hidden'; T.cv = false; }
    if (T.dv) { T.d.style.visibility = 'hidden'; T.dv = false; }
    return true;
  }
  setT(T.a, nxt); setT(T.b, cur);
  if (ph < .5) {
    if (T.dv) { T.d.style.visibility = 'hidden'; T.dv = false; }
    if (!T.cv) { T.c.style.visibility = 'visible'; T.cv = true; }
    setT(T.ci, cur); T.c.style.transform = 'rotateX(' + (-ph * 180).toFixed(1) + 'deg)';
  } else {
    if (T.cv) { T.c.style.visibility = 'hidden'; T.cv = false; }
    if (!T.dv) { T.d.style.visibility = 'visible'; T.dv = true; }
    setT(T.di, nxt); T.d.style.transform = 'rotateX(' + ((1 - ph) * 180).toFixed(1) + 'deg)';
  }
  return true;
}
/* a 에서 b 까지 드럼을 n 칸 돌린다 — 글자표에 없는 글자는 바로 넘긴다. spin 이면 같은 글자(빈칸)도 한 바퀴 돌고 선다 */
function seqTo(a, b, n, spin) {
  if (a === b && !spin) return [a];
  const ib = RING.indexOf(b); if (ib < 0) return [a, b];
  const o = [a];
  for (let k = n - 1; k >= 0; k--) { const ch = RING[((ib - k) % RL + RL) % RL]; if (ch !== o[o.length - 1]) o.push(ch); }
  if (o[o.length - 1] !== b) o.push(b);
  return o;
}
class Cell {
  constructor(w, i, base) {
    this.w = w; this.i = i; this.views = []; this.boxes = []; this.target = pad('', w); this.shown = pad('', w);
    this.ns = []; for (let j = 0; j < w; j++) this.ns.push((base || 4) + ((j * 5 + i * 3) % 7));
    this.jam = w > 2 ? Math.floor(w / 2) : (w === 3 ? 1 : -1); this.seq = null; this.tap = null; this.pick = false;
    this.f = -1; this.done = false; this.ripeT = 0; this.reflap = 0;
  }
  set(str, pick, now) {
    const nt = pad(str, this.w), same = nt.join('') === this.target.join('');
    if (this.pick !== !!pick) { this.pick = !!pick; this.views.forEach(v => v.forEach(T => T.el.classList.toggle('pk', this.pick))); }
    if (same) return;
    if (this.f >= 1 && !STILL && now != null) this.tap = { t0: now, from: this.shown.slice(), seq: null };
    this.target = nt; this.seq = null;
  }
  frame(f, now) {
    if (this.tap) {
      const tp = clamp((now - this.tap.t0) / 560, 0, 1);
      if (!this.tap.seq) this.tap.seq = this.target.map((c, j) => seqTo(this.tap.from[j], c, 3 + (j % 3)));
      const ch = this.drive(this.tap.seq, tp); if (tp >= 1) this.tap = null; this.f = f; return ch;
    }
    this.f = f;
    if (f >= 1 && this.reflap > 0 && this.reflap < 1) return this.re(this.reflap);
    if (!this.seq) this.seq = this.target.map((ch, j) => seqTo(' ', ch, this.ns[j], true));
    return this.drive(this.seq, f);
  }
  drive(seqs, f) {
    let ch = false; const w = this.w;
    for (let j = 0; j < w; j++) {
      const S = seqs[j], n = S.length; let cur, nxt, ph = 0;
      if (n <= 1 || f >= 1) { cur = nxt = S[n - 1]; }
      else if (f <= 0) { cur = nxt = S[0]; }
      else {
        const e = .45 + .55 * (j + 1) / w; /* 왼쪽 칸부터 멎는다 */
        let u = clamp(f / e, 0, 1) * (n - 1);
        if (j === this.jam && n > 3) { const k = Math.floor((n - 1) * .5), dw = .9; u = clamp(f / e, 0, 1) * (n - 1 + dw); if (u > k && u < k + dw) u = k; else if (u >= k + dw) u -= dw; } /* 한 칸 잼 */
        let p = Math.floor(u), fr = u - p; if (p >= n - 1) { p = n - 1; fr = 0; }
        ph = fr > 0 ? io(clamp(fr / .42, 0, 1)) : 0; cur = S[p]; nxt = S[Math.min(p + 1, n - 1)];
        if (ph >= 1) { cur = nxt; ph = 0; }
      }
      this.shown[j] = ph > .5 ? nxt : cur;
      for (const v of this.views) if (paint(v[j], cur, nxt, ph)) ch = true;
    }
    return ch;
  }
  re(r) { /* 제자리에서 한 번 넘어간다(같은 글자) */
    let ch = false; const w = this.w;
    for (let j = 0; j < w; j++) { const c = this.target[j], rj = clamp(r * 1.6 - j * .6 / Math.max(1, w), 0, 1), ph = rj > 0 && rj < 1 ? io(rj) : 0; for (const v of this.views) if (paint(v[j], c, c, ph)) ch = true; }
    return ch;
  }
}

/* ── 상태 ── */
const CATS = C.rows.categories, AXES = C.rows.axes, STEPS = C.rows.steps;
let catSel = C.rows.categoryDefault, catTap = false;
const axVal = {}, axTap = {}, chipTap = {};
AXES.forEach(a => { axVal[a.id] = a.def; axTap[a.id] = false; chipTap[a.id] = 0; });
function cellValue(spec) {
  if (spec.val === 'byUni') return { tile: t('board.v.byUni'), text: t('board.d.byUni') };
  if (spec.val === 'cat') return { tile: t('cat.' + catSel + '.tile'), text: t('cat.' + catSel + '.name') };
  if (spec.val === 'blank') return { tile: '', text: t('board.d.blank') }; /* 값 출처가 없는 칸 = 빈 판 */
  return { tile: String(spec.val), text: String(spec.val) };
}
const axText = id => t('ax.' + id + '.' + axVal[id]);
/* 초안 둘째·셋째 줄은 데이터에 있는 축·칸으로만 짓는다(빈 판 칸은 싣지 않는다) */
const line2 = () => AXES.map(a => t('ax.' + a.id) + ': ' + axText(a.id)).join(' · ') + '.';
const line3 = () => C.board.cells.filter(c => c.val !== 'blank').map(c => t('d.h.' + c.key) + ': ' + cellValue(c).text).join(' · ') + '.';
const draftText = () => [t('d.l1'), line2(), line3(), t('d.l4')].join('\n');

/* ── 화면 짓기 ── */
$$('[data-t]').forEach(e => { e.textContent = t(e.dataset.t); });
$$('[data-ta]').forEach(e => e.dataset.ta.split(';').forEach(p => { const i = p.indexOf(':'); e.setAttribute(p.slice(0, i), t(p.slice(i + 1))); }));

/* 상호(brand.name)가 정해지면 그 이름이 보이고, 그 전에는 도메인 글자(code 낱칸 + suffix) */
const brandHTML = () => '<span class="sr">' + esc(BRAND) + '</span><span aria-hidden="true" class="bmark">' +
  (C.brand.name ? '<span class="bn">' + esc(C.brand.name) + '</span>' : Array.from(C.brand.code).map(staticTile).join('') + '<span class="bs">' + esc(C.brand.suffix) + '</span>') + '</span>';
$('#brand').innerHTML = brandHTML(); $('#brand-m').innerHTML = brandHTML();

const ANCH = { uni: '#s2', cost: '#s3', docs: '#s4', company: '#chk', consult: '#s5' };
const href = k => (C.pages && C.pages.indexOf(k) >= 0) ? ('/' + L + '/' + C.routes[k]) : ANCH[k];
const NAV = ['uni', 'cost', 'docs', 'company'];
$('#nav-list').innerHTML = NAV.map(k => '<li><a href="' + href(k) + '">' + esc(t('nav.' + k)) + '</a></li>').join('');
$('#menu-list').innerHTML = NAV.concat('consult').map(k => '<li' + (k === 'consult' ? ' class="mi-m6"' : '') + '><a href="' + href(k) + '"><span>' + esc(t('nav.' + k)) + '</span>' + ico('arrow') + '</a></li>').join('');
const m6 = $('#m6'); m6.href = href('consult'); m6.innerHTML = ico('msg') + '<span>' + esc(t('nav.consult')) + '</span>';
const thumb = $('#thumb'); thumb.href = href('consult'); thumb.innerHTML = ico('msg') + '<span>' + esc(t('nav.consult')) + '</span>';
$('#menu-btn').innerHTML = ico('menu') + '<span>' + esc(t('menu.open')) + '</span>';
$('#menu-close').innerHTML = ico('close') + '<span>' + esc(t('menu.close')) + '</span>';
function langsHTML() {
  return LANGS.map(l => {
    const m = l === 'ru' ? RU.meta : C.copy[l].meta;
    const full = '<span class="lf">' + esc(m.name) + '</span><span class="ls">' + esc(m.short) + '</span>';
    return l === L ? '<b lang="' + m.code + '" aria-current="true">' + full + '</b>'
      : '<a lang="' + m.code + '" hreflang="' + m.code + '" href="?c=' + C.code + '&amp;l=' + l + '" data-lang="' + l + '">' + full + '</a>';
  }).join('');
}
['#langs-hd', '#langs-m'].forEach(s => { const e = $(s); if (!e) return; e.setAttribute('role', 'group'); e.setAttribute('aria-label', t('lang.label')); e.innerHTML = LANGS.length > 1 ? langsHTML() : ''; });
D.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[data-lang]'); if (a) a.href = '?c=' + C.code + '&l=' + a.dataset.lang + location.hash; });

/* 테마: key(초록 판) 기본 · 버튼은 흑백(웜 모노)으로 */
function syncTheme() {
  const k = H.getAttribute('data-theme') !== 'mono', lb = t(k ? 'theme.toMono' : 'theme.toKey');
  $$('[data-theme-btn]').forEach(b => { b.innerHTML = ico('theme') + '<span class="tlb">' + esc(lb) + '</span>'; b.setAttribute('aria-label', lb); b.setAttribute('title', lb); });
}
$$('[data-theme-btn]').forEach(b => b.addEventListener('click', () => {
  const nt = H.getAttribute('data-theme') === 'mono' ? 'key' : 'mono'; H.setAttribute('data-theme', nt);
  try { localStorage.setItem('caedu-theme', nt); } catch (e) { } syncTheme();
}));
syncTheme();

/* S1 판 + 미니 판 */
$('#cap').textContent = t('board.route');
const cells = C.board.cells.map((spec, i) => new Cell(spec.w, i));
const board = $('#board'), mini = $('#mini');
cells.forEach((cell, i) => {
  const spec = C.board.cells[i];
  const row = D.createElement('div'); row.className = 'brow';
  row.innerHTML = '<span class="bh">' + esc(t('board.h.' + spec.key)) + '</span><span class="bv"></span><span class="btag">' + esc(t('board.tag.' + spec.key)) + '</span><span class="sr bsr"></span>';
  const bv = row.children[1], v0 = []; for (let j = 0; j < cell.w; j++) { const T = mkTile(); bv.appendChild(T.el); v0.push(T); }
  board.appendChild(row);
  const mc = D.createElement('span'); mc.className = 'mc' + (i === 0 ? ' on' : '');
  mc.innerHTML = '<span class="mh">' + esc(t('board.h.' + spec.key)) + '</span><span class="mt"></span>';
  const mt = mc.children[1], v1 = []; for (let j = 0; j < cell.w; j++) { const T = mkTile(); mt.appendChild(T.el); v1.push(T); }
  mini.appendChild(mc);
  cell.views.push(v0, v1); cell.boxes.push(row, mc); cell.sr = row.children[3]; cell.mc = mc; cell.key = spec.key; cell.row = row;
  cell.set(cellValue(spec).tile, false, null);
});
const mdots = D.createElement('span'); mdots.className = 'mdots'; mdots.innerHTML = cells.map(() => '<i></i>').join(''); mini.appendChild(mdots);
const dots = $$('i', mdots);
$('#band').setAttribute('aria-hidden', 'true');

/* S1 초대형 «D-2» */
const heroRow = $('#hero-row'), heroCell = new Cell(Array.from(C.hero.text).length, 7, 7);
$('#hero').style.setProperty('--hn', String(heroCell.w)); /* 글자 크기는 칸 수로 나눈다(나라마다 길이가 달라도 한 줄) */
const hv = []; for (let j = 0; j < heroCell.w; j++) { const T = mkTile(); heroRow.appendChild(T.el); hv.push(T); }
heroCell.views.push(hv); heroCell.set(C.hero.text, false, null);
const ask = $('#ask'); ask.innerHTML = '<span>' + esc(t('s1.ask')) + '</span>' + ico('arrow');

/* S2 계단 */
const stairs = $('#stairs');
const N = CATS.length;
const lenOf = i => Math.round(100 - i * 56 / Math.max(1, N - 1));
/* .cf = 열의 초록 면(넓은 화면에서 이것만 바닥선에서 차오른다). 열 자리 윤곽은 처음부터 보인다 */
stairs.innerHTML = CATS.map((c, i) => '<button type="button" class="col" role="radio" data-n="' + c.n + '" style="--len:' + lenOf(i) + '%">' +
  '<span class="cf" aria-hidden="true"></span><span class="bar"><span class="rk">' + c.n + '</span></span><span class="tx"><span class="nm">' + esc(t('cat.' + c.n + '.name')) + '</span><span class="fc">' + esc(t('cat.' + c.n + '.fact')) + '</span></span>' +
  '<span class="sr">' + esc(t('s2.rank', { n: c.n, total: N })) + '</span></button>').join('');
const cols = $$('.col', stairs);
const sik = $('#sik'); sik.href = C.links.studyInKorea; sik.innerHTML = '<span>' + esc(t('s2.link')) + '</span>' + ico('ext');
const echo = $('#echo'), echoBar = $('.bar', echo);
function syncCats() {
  cols.forEach(b => { const on = +b.dataset.n === catSel; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
  const i = CATS.findIndex(c => c.n === catSel);
  css(echoBar, '--len', lenOf(i) + '%');
  $('.rk', echo).textContent = String(catSel); $('.et', echo).textContent = t('cat.' + catSel + '.name');
}
function pickCat(n, focus) {
  if (n === catSel && catTap) return; catSel = n; catTap = true; syncCats();
  const ci = C.board.cells.findIndex(c => c.val === 'cat'); if (ci >= 0) cells[ci].set(cellValue(C.board.cells[ci]).tile, true, performance.now());
  if (focus) { const b = cols.find(x => +x.dataset.n === n); if (b) b.focus(); }
  syncDraft(); wake();
}
cols.forEach(b => b.addEventListener('click', () => pickCat(+b.dataset.n)));
stairs.addEventListener('keydown', e => {
  const k = e.key, i = CATS.findIndex(c => c.n === catSel); let j = -1;
  if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % N; else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + N) % N; else if (k === 'Home') j = 0; else if (k === 'End') j = N - 1;
  if (j >= 0) { e.preventDefault(); pickCat(CATS[j].n, true); }
});
syncCats();

/* S3 원장 */
const ledger = $('#ledger');
const blank = n => { let s = ''; for (let i = 0; i < n; i++) s += staticTile(' '); return s; };
/* 행 값(value)이 있으면 그 값, 없으면 빈 판 */
/* 값이 한국어면 lang="ko"(한글 대체 글꼴 · 어절 줄바꿈), 긴 값은 행 아래 줄 전폭(long) */
const valCell = (cls, v, n, lab) => v != null ? '<span class="' + cls + ' lv' + (Array.from(v).length > 16 ? ' long' : '') + '"' + (/\p{Script=Hangul}/u.test(v) ? ' lang="ko"' : '') + '>' + esc(v) + '</span>' : '<span class="' + cls + '"' + (lab ? ' role="img" aria-label="' + esc(lab) + '"' : ' aria-hidden="true"') + '>' + blank(n) + '</span>';
ledger.innerHTML = C.rows.ledger.map(r => '<div class="lrow"><span class="lnum">' + String(r.n).padStart(2, '0') + '</span><span class="llab"><b>' + esc(t('s3.row.' + r.n)) + '</b>' +
  (r.tag ? '<span class="ltag">' + esc(t('s3.tag.' + r.n)) + '</span>' : '') + '</span>' + valCell('lval', pick(r.value), C.rows.ledgerBlank || 6, t('s3.blank')) + '</div>').join('');
const lrows = $$('.lrow', ledger), lnums = $$('.lnum', ledger);
const l3 = $('#l3'); l3.href = href('cost'); l3.innerHTML = '<span>' + esc(t('s3.link')) + '</span>' + ico('arrow');
const dash = $('#dash');

/* S4 단계 · 축 · 칩 */
const GS = (C.rows.guard && C.rows.guard.step) || 2;
const stepsEl = $('#steps');
stepsEl.innerHTML = STEPS.map(s => '<div class="step' + (s.n === GS ? ' s2nd' : '') + '" data-n="' + s.n + '"><span class="snum">' + staticTile(String(s.n)) + '</span><span class="snm">' + esc(t('s4.step.' + s.n)) + '</span>' +
  '<span class="swho">' + esc(t('s4.who')) + '<b>' + esc(t('s4.dec.' + s.n)) + '</b></span></div>').join('');
const stepEls = $$('.step', stepsEl);
const l4 = $('#l4'); l4.href = href('docs'); l4.innerHTML = '<span>' + esc(t('s4.link')) + '</span>' + ico('arrow');
const axesEl = $('#axes');
axesEl.innerHTML = AXES.map(a => {
  const opt = v => '<button type="button" class="opt" role="radio" data-v="' + v + '"><span>' + esc(t('ax.' + a.id + '.' + v)) + '</span>' + (has('ax.' + a.id + '.' + v + '.d') ? '<small>' + esc(t('ax.' + a.id + '.' + v + '.d')) + '</small>' : '') + '</button>';
  let slots = ''; for (let i = 0; i < STEPS.length; i++) slots += '<i class="slot"></i>';
  return '<div class="axis" data-ax="' + a.id + '"><div class="tog" role="radiogroup" aria-labelledby="axl-' + a.id + '"><span class="axl" id="axl-' + a.id + '">' + esc(t('ax.' + a.id)) + '</span>' + opt('a') + opt('b') + '</div>' +
    '<div class="rail">' + slots + '<div class="chip">' + ico('arrow') + '<span class="ct"></span><span class="cd">' + esc(t('s4.dec.' + a.step)) + '</span><span class="sr">' + esc(t('s4.slot', { n: a.step })) + '</span></div></div><p class="cq"></p></div>';
}).join('');
const axisEls = $$('.axis', axesEl), rails = axisEls.map(e => $('.rail', e)), chips = axisEls.map(e => $('.chip', e));
const sbx = $('#sbx');
sbx.innerHTML = AXES.map(a => '<span class="sb" data-ax="' + a.id + '"><small>' + esc(t('ax.' + a.id)) + '</small><b></b></span>').join('');
const sbs = $$('.sb', sbx), strip = $('#strip');
function syncAxes() {
  AXES.forEach((a, i) => {
    $$('.opt', axisEls[i]).forEach(o => { const on = o.dataset.v === axVal[a.id]; o.setAttribute('aria-checked', on ? 'true' : 'false'); o.tabIndex = on ? 0 : -1; o.classList.toggle('tap', on && axTap[a.id]); });
    $('.ct', chips[i]).textContent = t('q.' + a.id + '.' + axVal[a.id]); $('.cq', axisEls[i]).textContent = t('q.' + a.id + '.' + axVal[a.id]); chips[i].classList.toggle('tap', axTap[a.id]);
    $('b', sbs[i]).textContent = axText(a.id);
  });
}
axisEls.forEach((ax, i) => {
  const id = AXES[i].id;
  $$('.opt', ax).forEach(o => o.addEventListener('click', () => { axVal[id] = o.dataset.v; axTap[id] = true; chipTap[id] = performance.now(); syncAxes(); syncDraft(); wake(); }));
  $('.tog', ax).addEventListener('keydown', e => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return; e.preventDefault();
    axVal[id] = axVal[id] === 'a' ? 'b' : 'a'; axTap[id] = true; chipTap[id] = performance.now(); syncAxes(); syncDraft();
    const o = $('.opt[data-v="' + axVal[id] + '"]', ax); if (o) o.focus(); wake();
  });
});
syncAxes();

/* S5 초안 · 보내기 · 확인 */
const dl = $('#dl');
dl.innerHTML = '<p class="d1"></p><p class="d2"><span class="gh"></span><span class="ty"></span></p><p class="d3"><span class="gh"></span><span class="ty"></span></p><p class="d4"></p>';
$('.d1', dl).textContent = t('d.l1'); $('.d4', dl).textContent = t('d.l4');
const ty2 = $('.d2 .ty', dl), ty3 = $('.d3 .ty', dl), gh2 = $('.d2 .gh', dl), gh3 = $('.d3 .gh', dl);
let T2 = 1, T3 = 1;
function typeTo(el, str, n) { const a = Array.from(str), k = clamp(Math.round(n * a.length), 0, a.length); if (el._k === k && el._s === str) return; el._k = k; el._s = str; el.textContent = a.slice(0, k).join(''); el.classList.toggle('on', k > 0 && k < a.length); }
const send = $('#send');
const msgr = C.messengers.map(m => {
  const a = D.createElement('a'); a.className = 'btn ' + (m.id === 'whatsapp' ? 'wa' : 'tgm'); a.target = '_blank'; a.rel = 'noopener';
  a.innerHTML = ico(m.id === 'whatsapp' ? 'msg' : 'send') + '<span>' + esc(t(m.id === 'whatsapp' ? 's5.wa' : 's5.tg')) + '</span>'; send.appendChild(a); return { m, a };
});
const cp = D.createElement('button'); cp.type = 'button'; cp.className = 'btn cp'; cp.innerHTML = ico('copy') + '<span>' + esc(t('s5.copy')) + '</span>'; send.appendChild(cp);
const sn = D.createElement('p'); sn.className = 'sn'; sn.textContent = t('s5.note'); send.appendChild(sn);
let cpT = 0;
cp.addEventListener('click', () => {
  const txt = draftText(), done = () => { $('span', cp).textContent = t('s5.copied'); clearTimeout(cpT); cpT = setTimeout(() => { $('span', cp).textContent = t('s5.copy'); }, 2000); };
  try { navigator.clipboard.writeText(txt).then(done, () => fallbackCopy(txt, done)); } catch (e) { fallbackCopy(txt, done); }
});
function fallbackCopy(txt, done) { const ta = D.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px'; D.body.appendChild(ta); ta.select(); try { D.execCommand('copy'); done(); } catch (e) { } ta.remove(); }
function syncDraft() {
  const s2 = line2(), s3 = line3(); gh2.textContent = s2; gh3.textContent = s3;
  typeTo(ty2, s2, T2); typeTo(ty3, s3, T3);
  const enc = encodeURIComponent(draftText());
  msgr.forEach(({ m, a }) => {
    if (m.id === 'whatsapp') a.href = 'https://wa.me/' + (m.account ? encodeURIComponent(m.account) : '') + '?text=' + enc;
    else a.href = m.account ? 'https://t.me/' + encodeURIComponent(m.account) : 'https://t.me/share/url?url=&text=' + enc;
  });
  cells.forEach(c => { const v = cellValue(C.board.cells[c.i]); c.srText = t('board.h.' + c.key) + ': ' + v.text; });
}
syncDraft();
const chk = $('#chk');
/* 「확인」 행: 값이 있으면 값, 없으면 빈 판 + 보이는 상태 한 줄(공개 전).
   행 값 = from(공용 데이터 common.js 의 경로, 예: 'company.reg' — 회사 값은 한 곳에만) 또는 value(글자 · 언어별) */
const fromCommon = p => { const v = String(p).split('.').reduce((o, k) => o == null ? undefined : o[k], CA.common || {}); return typeof v === 'string' && v !== '' ? v : null; };
const rowVal = r => r.from ? fromCommon(r.from) : pick(r.value);
chk.innerHTML = '<h3 class="ch3" id="h3-chk">' + esc(t('chk.h')) + '</h3>' + C.rows.check.map(r => { const v = rowVal(r);
  return '<div class="crow"><span class="cl">' + esc(t('chk.' + r.n)) + (v == null ? '<small class="cn">' + esc(t('chk.none')) + '</small>' : '') + '</span>' +
    valCell('cv', v, C.rows.checkBlank || 8, '') + '<i class="slat" aria-hidden="true"></i></div>'; }).join('');
const slats = $$('.slat', chk), crows = $$('.crow', chk);

/* 바닥글 ①~⑤ */
const ft = $('#ft');
const ctLinks = C.messengers.map(m => '<a href="' + (m.account ? (m.id === 'whatsapp' ? 'https://wa.me/' + encodeURIComponent(m.account) : 'https://t.me/' + encodeURIComponent(m.account)) : '#s5') + '">' + esc(t(m.id === 'whatsapp' ? 's5.wa' : 's5.tg')) + '</a>').join('') +
  (C.email ? '<a href="mailto:' + esc(C.email) + '">' + esc(C.email) + '</a>' : '');
/* ④ 처리방침·약관: 쪽이 열린 것만 링크로(열린 쪽이 없으면 열 자체를 그리지 않는다 — 죽은 링크 0) */
const legalOpen = ['privacy', 'terms'].filter(k => C.pages && C.pages.indexOf(k) >= 0);
/* ⑤ 도착 뒤 커뮤니티 한 줄: 나라 파일 community.url 이 있을 때만 */
const CM = C.community, cmText = CM && CM.url && CM.text ? pick(CM.text) : null;
/* ① 운영 회사 · ⑥ 패밀리 사이트 — 공용 데이터(data/common.js), 라벨만 원고. 지금 사이트(brand.domain)는 글자로, 나머지는 링크.
   주소: 운영 https://<domain>/ · 로컬(file: · localhost · 127.0.0.1)은 lab 경로(없으면 운영 주소) */
const CO = CA.common || {}, CMP = CO.company, FAM = Array.isArray(CO.family) ? CO.family : [];
const famHref = (f, loc) => { loc = loc || location; const local = loc.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(loc.hostname || ''); return local && f.lab ? f.lab : 'https://' + f.domain + '/'; };
const opHTML = CMP && CMP.name ? '<p class="fop">' + esc(t('ft.opBy')) + ': <span lang="ko">' + esc(CMP.name) + '</span>' + (CMP.latin ? ' <span lang="en">' + esc(CMP.latin) + '</span>' : '') + '</p>' + coHTML() : '';
/* 회사 정보 칸: 라벨(고정폭 작은 글) 위 · 값 아래. 전화 = tel: · 메일 = mailto: */
function coHTML() {
  const row = (k, v) => v ? '<div><dt>' + esc(t(k)) + '</dt><dd>' + v + '</dd></div>' : '';
  const ph = CMP.phone && CMP.phone.display && /^\+\d+$/.test(CMP.phone.tel || '') ? '<a href="tel:' + CMP.phone.tel + '">' + esc(CMP.phone.display) + '</a>' : '';
  const s = row('ft.reg', CMP.reg ? esc(CMP.reg) : '') + row('ft.addr', CMP.address ? '<span lang="ko">' + esc(CMP.address) + '</span>' : '') + row('ft.tel', ph) +
    row('ft.mail', CMP.email ? '<a href="mailto:' + esc(CMP.email) + '">' + esc(CMP.email) + '</a>' : '');
  return s ? '<dl class="fco">' + s + '</dl>' : '';
}
const famHTML = FAM.length ? '<nav class="ffam" aria-labelledby="ffam-h"><p class="fl" id="ffam-h">' + esc(t('ft.family')) + '</p><ul class="fls">' + FAM.map(f => {
  const lg = f.lang ? ' lang="' + esc(f.lang) + '"' : '';
  return '<li>' + (f.domain === C.brand.domain ? '<b' + lg + ' aria-current="page">' + esc(f.name) + '</b>' : '<a' + lg + ' data-fam="' + esc(f.id) + '" href="' + esc(famHref(f)) + '">' + esc(f.name) + '</a>') + '</li>'; }).join('') + '</ul></nav>' : '';
ft.innerHTML = '<div class="f1"><p class="fl">' + esc(t('ft.op')) + '</p><span class="brand">' + brandHTML() + '</span>' + opHTML + '</div>' +
  '<div class="f2"><p class="fl">' + esc(t('ft.contact')) + '</p><div class="fls">' + ctLinks + '</div></div>' +
  (LANGS.length > 1 ? '<div class="f3"><p class="fl">' + esc(t('ft.lang')) + '</p><div class="langs" role="group" aria-label="' + esc(t('lang.label')) + '">' + langsHTML() + '</div></div>' : '') +
  (legalOpen.length ? '<div class="f4"><p class="fl">' + esc(t('ft.legal')) + '</p><div class="fls">' + legalOpen.map(k => '<a href="' + href(k) + '">' + esc(t('ft.' + k)) + '</a>').join('') + '</div></div>' : '') +
  famHTML +
  (cmText ? '<p class="f5">' + esc(NB(cmText)) + ' <a href="' + esc(CM.url) + '">' + esc(CM.name || CM.url) + '</a></p>' : '') +
  '<span class="fband" aria-hidden="true"></span>';
const fband = $('.fband', ft), ftCols = $$('.f1,.f2,.f3,.f4,.ffam', ft), ftStag = ftCols.length > 1 ? .45 / (ftCols.length - 1) : 0; /* 칸이 몇이든 끝 칸이 pfr=1 에 다 드러난다 */

/* 메뉴(좁은 화면): 모달 dialog · Esc · 포커스 가둠 · 뒤 스크롤 잠금 */
const dlg = $('#menu'), mBtn = $('#menu-btn'), mClose = $('#menu-close');
let savedY = 0;
function openMenu() { if (dlg.open) return; savedY = scrollY; try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); } H.classList.add('menu-open'); mBtn.setAttribute('aria-expanded', 'true'); mClose.focus(); }
function closeMenu() { if (dlg.open) dlg.close(); }
mBtn.addEventListener('click', openMenu); mClose.addEventListener('click', closeMenu);
dlg.addEventListener('close', () => { H.classList.remove('menu-open'); mBtn.setAttribute('aria-expanded', 'false'); if (Math.abs(scrollY - savedY) > 1) scrollTo(0, savedY); if (!mqWide.matches) mBtn.focus(); });
dlg.addEventListener('click', e => { if (e.target.closest && e.target.closest('a[href^="#"]')) closeMenu(); });
dlg.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return; const f = $$('a[href],button', dlg).filter(x => x.getClientRects().length); if (!f.length) return;
  const a = f[0], b = f[f.length - 1]; if (e.shiftKey && D.activeElement === a) { e.preventDefault(); b.focus(); } else if (!e.shiftKey && D.activeElement === b) { e.preventDefault(); a.focus(); }
});
mqWide.addEventListener('change', () => { if (mqWide.matches && dlg.open) dlg.close(); });

/* ── 움직이는 조각(문서 좌표, 글 칸을 지나지 않는 자리에서만) ── */
const heroEl = $('#hero'), page = $('#page'), fx = $('#fx'), band = $('#band'), grain = $('.grain'), base = $('#base'), draft = $('#draft');
const mk = c => { const e = D.createElement('div'); e.className = c; fx.appendChild(e); return e; };
const FX = { halves: heroCell.views[0].map(() => { const e = mk('fxh'); e.innerHTML = '<i></i>'; return e; }), block: mk('fxb'), strips: lrows.map(() => mk('fxs')), dash: mk('fxd'), line: mk('fxl'), fline: mk('fxl') };
const px = v => v.toFixed(1) + 'px';
function place(e, x, y, w, h, extra) { css(e, 'display', 'block'); css(e, 'transform', 'translate(' + px(x) + ',' + px(y) + ')' + (extra || '')); css(e, 'width', px(Math.max(0, w))); if (h != null) css(e, 'height', px(Math.max(0, h))); }
const hide = e => css(e, 'display', 'none');
const cls = (e, c, on) => { if (e.classList.contains(c) !== on) e.classList.toggle(c, on); };

let started = false, G = null, fontsOk = false, lastW = 0, lastH = 0, lastDH = 0, stDH = 0, ST = null, awake = false, lastAct = 0, lp = -1, lsy = -1, vel = 0, T0 = STILL ? 0 : Infinity, grainK = 0;
const PX = { p: 0 };
const touch = matchMedia('(pointer:coarse)').matches;

function refresh() {
  if (!fontsOk) return;
  const wide = mqWide.matches, VH = innerHeight;
  lastW = page.clientWidth; lastH = VH;
  heroRow.style.transform = ''; cells.forEach(c => { c.boxes[0].children[1].style.transform = ''; });
  sbs.forEach(b => css(b, 'transform', 'none')); css(echoBar, '--len', lenOf(Math.max(0, CATS.findIndex(c => c.n === catSel))) + '%');
  H.classList.add('measuring');
  let hMin = 0; if (wide) cols.forEach(c => { hMin = Math.max(hMin, c.getBoundingClientRect().height); });
  H.classList.remove('measuring');
  const U = parseFloat(getComputedStyle(H).getPropertyValue('--u')) || 26;
  if (wide) { const step = clamp((.45 * VH - hMin) / Math.max(1, N - 1), U / 2, U * 2); cols.forEach((c, i) => c.style.setProperty('--h', Math.round(hMin + (N - 1 - i) * step) + 'px')); }
  else cols.forEach(c => c.style.removeProperty('--h'));
  /* 칩 폭 = 칸 폭 · 레일 높이 = 두 값 중 긴 질문이 들어가는 높이 */
  rails.forEach((r, i) => {
    const ch = chips[i], ct = $('.ct', ch), keep = ct.textContent; let hm = 0; r.style.minHeight = '';
    ch.style.height = 'auto'; ch.style.width = px($('.slot', r).getBoundingClientRect().width);
    ['a', 'b'].forEach(v => { ct.textContent = t('q.' + AXES[i].id + '.' + v); hm = Math.max(hm, ch.getBoundingClientRect().height); });
    ct.textContent = keep; ch.style.height = ''; r.style.minHeight = px(Math.ceil(hm));
  });
  rails.forEach((r, i) => { const sl = $$('.slot', r), k = Math.min(sl.length, AXES[i].step) - 1, rr = r.getBoundingClientRect(), s0 = sl[0].getBoundingClientRect(), sk = sl[k].getBoundingClientRect();
    chips[i].style.width = px(s0.width); chips[i]._x = sk.left - rr.left; chips[i]._x0 = s0.left - rr.left; });
  /* 넓은 화면 계단: 열 글자는 초록 면이 그 줄을 다 덮은 뒤에만 보인다(글줄 중간이 잘린 채 보이지 않게) */
  const colTx = wide ? cols.map(c => { const r = c.getBoundingClientRect(); return { h: r.height, tx: $('.tx', c).getBoundingClientRect().top - r.top, rk: $('.bar', c).getBoundingClientRect().top - r.top }; }) : null;
  const sy = scrollY, pr = page.getBoundingClientRect(), OX = pr.left, OY = pr.top + sy;
  const R = e => { const r = e.getBoundingClientRect(); return { x: r.left - OX, y: r.top + sy - OY, w: r.width, h: r.height, r: r.right - OX, b: r.bottom + sy - OY }; };
  const Wd = page.clientWidth, docH = D.documentElement.scrollHeight, sMax = Math.max(0, docH - VH - OY);
  const at = (y, f) => y - f * VH;
  const hdH = $('.hd-row').getBoundingClientRect().height;
  const g = {
    wide, VH, OY, W: Wd, sMax, hdH,
    board: R(board), tiles: heroCell.views[0].map(T => R(T.el)), base: R(base), cols: cols.map(R), echo: R(echoBar), led: R(ledger), rows: lrows.map(R), nums: lnums.map(R),
    dash: R(dash), steps: stepEls.map(R), rails: rails.map(R), strip: R(strip), sbs: sbs.map(R), draft: R(draft), chk: R(chk), ft: R(ft), colTx
  };
  g.heroFs = parseFloat(getComputedStyle(heroRow).fontSize) || 100;
  /* 계단 열을 눕히는 축: 왼쪽 아래(오른쪽으로 눕힘)가 원장 폭을 넘으면 오른쪽 아래(왼쪽으로) */
  g.pivot = g.cols.map(c => c.x + c.h <= g.led.r + 1 ? 'L' : 'R');
  /* 박자(스크롤 위치) — 경계마다 N 의 마지막 비트가 N+1 의 첫 비트 */
  const B = {}, V = VH;
  /* S1>S2: 반쪽은 바닥선이 화면 아래 끝을 넘기 전에 떨어지기 시작하고, 닿는 박자가 곧 계단이 서는 첫 박자 */
  B.fall0 = Math.max(.06 * V, at(g.base.y, wide ? 1.06 : .94)); B.fall1 = B.fall0 + (wide ? .16 : .1) * V;
  B.rise0 = B.fall1; B.rise1 = B.rise0 + (wide ? .2 : .24) * V;
  B.uni0 = B.rise0 + .1 * V; B.uni1 = B.rise1 + .05 * V;
  if (wide) { B.out0 = Math.max(B.uni1 + .08 * V, at(g.base.y, .5)); B.out1 = B.out0 + .14 * V; B.snap1 = B.out1 + .06 * V; }
  else { B.out0 = Math.max(B.uni1 + .08 * V, at(g.echo.y, .62)); B.out1 = B.out0 + .08 * V; B.snap1 = B.out1 + .08 * V; }
  B.split0 = B.snap1; B.split1 = B.split0 + .18 * V;
  B.cost0 = B.split0 + .06 * V; B.cost1 = B.split1 + .03 * V;
  B.dash0 = Math.max(B.split1 + .05 * V, at(g.dash.y, .62)); B.dash1 = B.dash0 + .12 * V; B.dash2 = B.dash1 + .06 * V;
  B.st0 = B.dash2; B.st1 = B.st0 + .14 * V; B.sh0 = B.st0 + .04 * V; B.sh1 = B.st1 + .04 * V;
  /* 칩은 단계 괘선이 뻗는 동안 차례로 달린다(칸이 화면에 들어온 뒤) */
  B.chip = g.rails.map((r, i) => { const a = Math.max(B.st0 + .07 * V + i * .04 * V, at(r.y, .8)); return [a, a + .12 * V]; });
  const lastChip = B.chip.length ? B.chip[B.chip.length - 1][1] : B.st1;
  B.conv0 = Math.max(lastChip + .02 * V, at(g.strip.y, .8)); B.conv1 = B.conv0 + .1 * V; B.ext1 = B.conv1 + .05 * V;
  B.t2a = B.ext1; B.t2b = B.t2a + .12 * V; B.t3a = B.t2b + .01 * V; B.t3b = B.t3a + .2 * V;
  B.shu0 = Math.max(B.ext1, at(g.chk.y, .95)); B.shu1 = B.shu0 + .16 * V;
  /* S5>끝: 타이핑과 셔터가 끝난 뒤, 「확인」 아랫변이 화면 안에 있을 때 */
  B.fl0 = Math.max(B.t3b, B.shu1, at(g.chk.b, .96)); B.fl1 = B.fl0 + .06 * V; B.fr1 = B.fl1 + .14 * V; B.bd1 = B.fr1 + .04 * V;
  /* 문서 끝(sMax)까지 못 미치면, dash0 뒤 박자 전부를 같은 비율로 당긴다 — 순서는 그대로, 끝 박자 = 문서 끝 이하 */
  if (B.bd1 > sMax && sMax > B.dash0) {
    const k = (sMax - B.dash0) / (B.bd1 - B.dash0), f = x => B.dash0 + (x - B.dash0) * k;
    ['dash1', 'dash2', 'st0', 'st1', 'sh0', 'sh1', 'conv0', 'conv1', 'ext1', 't2a', 't2b', 't3a', 't3b', 'shu0', 'shu1', 'fl0', 'fl1', 'fr1', 'bd1'].forEach(n => { B[n] = f(B[n]); });
    B.chip = B.chip.map(c => c.map(f));
  }
  g.B = B;
  /* 낙하 조각 = 플랩 아래 반쪽 */
  FX.halves.forEach((e, i) => { const T = g.tiles[i]; e.style.fontSize = px(g.heroFs); e.style.lineHeight = px(T.h); const ie = e.firstChild; ie.style.top = 'auto'; ie.style.bottom = '0'; ie.style.height = px(T.h); ie.textContent = Array.from(C.hero.text)[i] || ''; });
  G = g; G.dirty = true;
  render(performance.now());
  const dh = D.documentElement.scrollHeight; lastDH = dh;
  if (ST && Math.abs(dh - stDH) > 1) { stDH = dh; ScrollTrigger.refresh(); }
}

function render(now) {
  if (!G) return;
  const g = G, B = g.B, V = g.VH, sy = scrollY - g.OY;
  const s = STILL ? 1e12 : (ST ? (ST.start + PX.p * (ST.end - ST.start)) - g.OY : sy);
  const live = !STILL;
  let flipped = false;

  /* 판 칸: 입학 = 시작 박자 · 대학 = S2 · 비용 = S3 · 단계 = S4 */
  const fA = STILL ? 1 : prog(now, T0 + 150, T0 + 1150);
  const fHero = STILL ? 1 : prog(now, T0 + 450, T0 + 1750);
  const byKey = { admit: fA, uni: prog(s, B.uni0, B.uni1), cost: prog(s, B.cost0, B.cost1), steps: prog(s, B.sh0, B.sh1) };
  const p3 = prog(s, B.t3a, B.t3b);
  cells.forEach((c, i) => {
    c.reflap = STILL ? 0 : prog(p3, i / cells.length, (i + 1) / cells.length);
    const f = byKey[c.key] != null ? byKey[c.key] : 1;
    if (c.frame(f, now)) flipped = true;
    const done = f >= 1;
    if (done && !c.done && live && started) c.ripeT = now;
    c.done = done;
    const ripe = c.ripeT > 0 && now - c.ripeT < 200; c.boxes.forEach(b => cls(b, 'ripe', ripe)); if (!ripe) c.ripeT = 0;
    const srt = done ? c.srText : t('board.h.' + c.key) + ': ' + t('board.empty'); if (c.sr._t !== srt) { c.sr._t = srt; c.sr.textContent = srt; }
    cls(dots[i], 'on', done);
  });
  /* 반쪽이 떨어지는 동안 «D-2» 칸은 제자리에서 한 번 넘어간다(다음 장이 같은 글자로 걸린다) — 판은 비지 않는다 */
  const pf = STILL ? 0 : prog(s, B.fall0, B.fall1);
  heroCell.reflap = pf;
  if (heroCell.frame(fHero, now)) flipped = true;
  /* 좁은 화면 띠: 지금 도는 칸 하나 */
  const ai = s < B.uni0 ? 0 : s < B.cost0 ? 1 : s < B.sh0 ? 2 : 3;
  cells.forEach((c, i) => cls(c.mc, 'on', i === Math.min(ai, cells.length - 1)));

  /* S1 끝: 판이 머리 괘선에 닿으면 미니 판이 괘선 밑에서 칸 단위로 나온다(실제 스크롤 기준) */
  const fd = clamp((sy + g.hdH - g.board.y) / Math.max(1, g.board.h), 0, 1);
  const qd = STILL ? (fd >= .5 ? 1 : 0) : qz(fd, 4);
  cls(band, 'on', qd > 0); css(band, 'clipPath', 'inset(0 0 ' + ((1 - qd) * 100).toFixed(1) + '% 0)');

  syncThumb();

  if (STILL) { stillFrame(); return; }

  /* ── S1>S2 «D-2» 아래 반쪽이 떨어져 바닥선이 된다 ── */
  cls(heroEl, 'dropped', pf > 0);
  const hx0 = g.tiles[0].x, hx1 = g.tiles[g.tiles.length - 1].r;
  FX.halves.forEach((e, i) => {
    if (!(pf > 0 && pf < 1)) { hide(e); return; }
    /* 아랫변이 바닥선 아랫변에 닿고, 높이가 바닥선 두께로 눌린다 — 조각은 바닥선 아래(원장 글)로 내려가지 않는다 */
    const T = g.tiles[i], hh = T.h / 2, a = clamp(pf / .78, 0, 1), b = clamp((pf - .78) / .22, 0, 1);
    const bot = lerp(T.y + T.h, g.base.b, a * a * a), h = b > 0 ? lerp(hh, g.base.h, qz(b, 3)) : hh;
    place(e, T.x, bot - h, T.w, h);
  });
  const pb = prog(s, B.fall1, B.fall1 + .04 * V);
  if (pf >= 1) { const l = lerp(hx0 - g.base.x, 0, qz(pb, 3)), r = lerp(g.base.r - hx1, 0, qz(pb, 3)); css(base, 'clipPath', 'inset(0 ' + px(Math.max(0, r)) + ' 0 ' + px(Math.max(0, l)) + ')'); }
  else css(base, 'clipPath', 'inset(0 100% 0 0)');

  /* ── S2 계단: 바닥선에서 역순으로 선다(칸 단위) ── */
  const pr = prog(s, B.rise0, B.rise1), pout = prog(s, B.out0, B.out1), psnap = prog(s, B.out1, B.snap1);
  const ci = CATS.findIndex(c => c.n === catSel);
  cols.forEach((c, i) => {
    const st = (N - 1 - i) * .12, f = clamp((pr - st) / (1 - .12 * (N - 1)), 0, 1);
    let clip = 1 - qz(f, 6);
    if (i !== ci) clip = Math.max(clip, qz(clamp(pout / .3, 0, 1), 4)); /* 고르지 않은 열은 바닥선으로 */
    css(c, '--clip', (clip * 100).toFixed(1) + '%');
    cls(c, 'gone', i === ci && pout > 0 && g.wide);
    if (g.colTx) { const m = g.colTx[i], top = clip * m.h; cls(c, 'tx-off', top > m.tx + .5); cls(c, 'rk-off', top > m.rk + .5); }
  });
  cls(stairs, 'sunk', g.wide && pout > 0); /* 열이 바닥선으로 들어가면 자리 윤곽도 걷는다 */
  /* ── S2>S3 ── */
  const blk = FX.block; let over = false; /* over = 블록이 원장 자리 위로 넘어온 동안 */
  if (g.wide) {
    const cr = g.cols[ci];
    if (pout > 0 && psnap <= 0) {
      const ang = 90 * qz(io(clamp((pout - .3) / .7, 0, 1)), 6), L = g.pivot[ci] === 'L';
      css(blk, 'transformOrigin', L ? '0 ' + px(cr.h) : px(cr.w) + ' ' + px(cr.h));
      place(blk, cr.x, cr.y, cr.w, cr.h, ' rotate(' + (L ? ang : -ang).toFixed(1) + 'deg)'); over = ang > 0;
    } else if (psnap > 0 && prog(s, B.split0, B.split1) <= 0) {
      const L = g.pivot[ci] === 'L', lx = L ? cr.x : cr.r - cr.h, e = qz(psnap, 4);
      css(blk, 'transformOrigin', '0 0');
      place(blk, lerp(lx, g.led.x, e), lerp(cr.b, g.led.y, e), lerp(cr.h, g.led.w, e), lerp(cr.w, g.led.h, e)); over = true;
    } else hide(blk);
  } else {
    const er = g.echo, full = g.W - 2 * er.x;
    const e0 = qz(pout, 4);
    css(echoBar, '--len', lerp(lenOf(ci), 100, e0).toFixed(1) + '%');
    css(echo, 'visibility', psnap > 0 ? 'hidden' : 'visible');
    if (psnap > 0 && prog(s, B.split0, B.split1) <= 0) {
      const e = qz(psnap, 4);
      css(blk, 'transformOrigin', '0 0');
      place(blk, er.x, lerp(er.y, g.led.y, e), lerp(full, g.led.w, e), lerp(er.h, g.led.h, e)); over = true;
    } else hide(blk);
  }
  const ledOn = psnap >= 1; cls(ledger, 'on', ledOn);
  /* 원장 글은 평소에 보인다. 누운 열(블록)이 원장 위로 오는 동안만 비켜 두고, 갈라진 띠가 물러나며 다시 드러낸다(조각이 글 위를 지나가지 않게) */
  cls(ledger, 'hold', over && !ledOn);
  /* ── S3 원장: 한 덩어리가 같은 높이 4행으로 갈라지고, 칸 번호로 물러난다 ── */
  const psp = prog(s, B.split0, B.split1);
  /* 행 글은 그 행의 띠가 다 물러난 뒤에 보인다 — 반쯤 덮인 글줄이 멈춘 화면에 남지 않게 */
  FX.strips.forEach((e, r) => {
    if (!(psp > 0 && psp < 1)) { hide(e); cls(lrows[r], 'rh', false); return; }
    const R = g.rows[r], nm = g.nums[r], cut = qz(clamp(psp / .22, 0, 1), 2), back = qz(clamp((psp - .22 - r * .1) / .42, 0, 1), 5);
    const h = R.h - cut * 2;
    place(e, R.x, R.y, lerp(R.w, nm.w, back), h); cls(lrows[r], 'rh', back < 1);
  });

  /* ── S3>S4 기준선이 밀려 나가 단계 2 자리에 걸린다 ── */
  const pd = prog(s, B.dash0, B.dash1), pdd = prog(s, B.dash1, B.dash2), s2r = g.steps[GS - 1] || g.steps[0];
  css(dash, 'visibility', pd > 0 ? 'hidden' : 'visible');
  if (pd > 0 && pdd < 1) {
    const e = qz(pd, 6), dd = pdd > 0 ? (pdd * pdd) : 0;
    place(FX.dash, lerp(g.dash.x, s2r.x, e), lerp(g.dash.y, s2r.y, dd), lerp(g.dash.w, s2r.w, e), null);
  } else hide(FX.dash);
  /* 단계 글은 늘 보인다. 움직이는 것은 단계 머리 괘선뿐: 단계 2 는 옮겨 온 점선이 닿을 때, 1·3 은 그 양옆으로 칸 단위로 뻗는다 */
  const pst = prog(s, B.st0, B.st1);
  stepEls.forEach((el, i) => {
    const n = STEPS[i].n;
    if (n === GS) { css(el, '--rl', '0%'); css(el, '--rr', pdd >= 1 ? '0%' : '100%'); }
    else { const e = qz(clamp(pst / .7, 0, 1), 4), left = n < GS, x = ((1 - e) * 100).toFixed(1) + '%'; css(el, '--rl', left ? x : '0%'); css(el, '--rr', left ? '0%' : x); }
  });
  /* ── S4 칩: 축 값의 질문이 정하는 쪽 칸으로 달린다 ── */
  chips.forEach((ch, i) => {
    const id = AXES[i].id, pc = prog(s, B.chip[i][0], B.chip[i][1]);
    let unf = qz(clamp(pc / .35, 0, 1), 3), ride = qz(io(clamp((pc - .35) / .65, 0, 1)), 4);
    const tp = chipTap[id] ? (now - chipTap[id]) / 220 : 2;
    if (tp < 1 && pc >= 1) { unf = 1; ride = qz(tp, 4); }
    else if (tp >= 1 && chipTap[id]) chipTap[id] = 0;
    css(ch, 'clipPath', 'inset(0 ' + ((1 - unf) * 100).toFixed(1) + '% 0 0)'); cls(ch, 'rh', unf < 1); /* 칩 글은 다 펼친 뒤에 */
    css(ch, 'transform', 'translateX(' + px(lerp(ch._x0, ch._x, ride)) + ')');
  });

  /* ── S4>S5 고른 값 셋이 가운데로 모여 한 줄로 눌리고, 그 줄이 초안 윗변이 된다 ── */
  const pc = prog(s, B.conv0, B.conv1), pe = prog(s, B.conv1, B.ext1);
  const cx = g.strip.x + g.strip.w / 2;
  /* 먼저 눌러 아랫변 괘선만 남기고(글자는 겹치지 않는다), 그 괘선 셋이 가운데로 모인다 */
  sbs.forEach((b, i) => { const R = g.sbs[i], dx = (cx - (R.x + R.w / 2)) * qz(io(clamp((pc - .45) / .55, 0, 1)), 5); css(b, 'transform', 'translateX(' + px(dx) + ')'); });
  css(strip, 'clipPath', 'inset(' + px(qz(clamp(pc / .45, 0, 1), 4) * (g.strip.h - 2)) + ' 0 0 0)');
  css(strip, 'visibility', pe > 0 ? 'hidden' : 'visible');
  if (pe > 0 && pe < 1) { const e = qz(pe, 4), w0 = Math.max.apply(null, g.sbs.map(r => r.w)); place(FX.line, lerp(cx - w0 / 2, g.draft.x, e), lerp(g.strip.b - 2, g.draft.y, e), lerp(w0, g.draft.w, e), null); }
  else hide(FX.line);
  cls(draft, 'on', pe >= 1);
  T2 = prog(s, B.t2a, B.t2b); T3 = p3;
  typeTo(ty2, gh2.textContent, T2); typeTo(ty3, gh3.textContent, T3);

  /* ── S5 셔터: 슬랫이 위로 열린다 ── */
  const psh = prog(s, B.shu0, B.shu1);
  slats.forEach((sl, r) => { const e = qz(clamp((psh - r * .15) / .55, 0, 1), 5); css(sl, 'clipPath', 'inset(0 0 ' + (e * 100).toFixed(1) + '% 0)'); cls(crows[r], 'rh', e < 1); }); /* 행 글은 슬랫이 다 열린 뒤에 */
  /* ── S5>끝 「확인」 상자 아랫변 괘선이 전폭으로 뻗어 바닥글 윗선이 되고, 바닥글 칸이 그 선에 차례로 매달린다 ── */
  const pfl = prog(s, B.fl0, B.fl1), pfr = prog(s, B.fl1, B.fr1), pbd = prog(s, B.fr1, B.bd1);
  if (pfl > 0 && pfl < 1) { const e = qz(pfl, 4); place(FX.fline, lerp(g.chk.x, 0, e), g.chk.b - 2, lerp(g.chk.w, g.W, e), null); }
  else hide(FX.fline);
  cls(ft, 'on', pfl >= 1);
  ftCols.forEach((c, k) => { const o = g.wide ? ftCols.length - 1 - k : k, e = qz(clamp((pfr - o * ftStag) / .55, 0, 1), 4); css(c, 'clipPath', 'inset(0 0 ' + ((1 - e) * 100).toFixed(1) + '% 0)'); });
  css(fband, 'clipPath', 'inset(0 ' + ((1 - qz(pbd, 4)) * 100).toFixed(1) + '% 0 0)');

  /* 숨 ±3%(스크롤 속도에 묶임, 정지 시 0) · 그레인은 칸이 넘어갈 때만 한 걸음 */
  if (awake) {
    const v = vel;
    heroRow.style.transform = v > .01 ? 'scaleY(' + (1 + .03 * Math.sin(now * .005) * v).toFixed(4) + ')' : '';
    cells.forEach((c, i) => { const el = c.boxes[0].children[1]; el.style.transform = v > .01 ? 'scaleY(' + (1 + .03 * Math.sin(now * .005 + i * 1.3) * v).toFixed(4) + ')' : ''; });
  }
  if (flipped && grain) { grainK = (grainK + 1) % 16; grain.style.transform = 'translate(' + ((grainK * 53) % 240) + 'px,' + ((grainK * 97) % 240) + 'px)'; }
  G.dirty = false;
}
function stillFrame() {
  T2 = 1; T3 = 1; typeTo(ty2, gh2.textContent, 1); typeTo(ty3, gh3.textContent, 1);
  chips.forEach(ch => { ch.style.transform = 'translateX(' + px(ch._x || 0) + ')'; });
  cls(ledger, 'on', true); cls(draft, 'on', true); cls(ft, 'on', true);
}

/* ── 루프: GSAP ticker 하나. 스크롤이 멎고 2초 뒤 떼어 내면 GSAP 도 잠든다 ── */
function busy(now) { return (started && now - T0 < 1900) || cells.some(c => c.tap) || AXES.some(a => chipTap[a.id] && now - chipTap[a.id] < 400) || cells.some(c => c.ripeT); }
function tick() {
  const now = performance.now(), sy = scrollY;
  if (PX.p !== lp || sy !== lsy) { if (lsy >= 0) vel = lerp(vel, clamp(Math.abs(sy - lsy) / 40, 0, 1), .3); lp = PX.p; lsy = sy; lastAct = now; } else vel *= .85;
  render(now);
  if (!busy(now) && now - lastAct > 2000) { awake = false; gsap.ticker.remove(tick); vel = 0; heroRow.style.transform = ''; cells.forEach(c => { c.boxes[0].children[1].style.transform = ''; }); }
}
function wake() { lastAct = performance.now(); if (STILL) { if (G) render(lastAct); return; } if (!awake && W.gsap) { awake = true; lsy = -1; gsap.ticker.add(tick); } }
function startMotion() {
  if (STILL) return; if (!W.gsap || !W.ScrollTrigger) { toStill(); return; }
  gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true });
  H.classList.add('live');
  const tl = gsap.timeline({ paused: true }); tl.fromTo(PX, { p: 0 }, { p: 1, ease: 'none', duration: 1 });
  ST = ScrollTrigger.create({ trigger: page, start: 0, end: 'max', animation: tl, scrub: .6, onUpdate: wake, onRefresh: wake });
  stDH = D.documentElement.scrollHeight; T0 = performance.now(); started = true;
  refresh(); wake();
}
function toStill() {
  STILL = true; H.classList.remove('motion', 'live'); H.classList.add('still');
  if (ST) { ST.kill(); ST = null; } if (awake && W.gsap) { gsap.ticker.remove(tick); awake = false; }
  resetCss(); FX.halves.concat([FX.block, FX.dash, FX.line, FX.fline], FX.strips).forEach(e => { e.style.display = 'none'; });
  cells.forEach(c => { c.tap = null; c.reflap = 0; }); heroRow.style.transform = '';
  cls(heroEl, 'dropped', false); cols.forEach(c => c.classList.remove('gone', 'tx-off', 'rk-off')); stairs.classList.remove('sunk'); ledger.classList.remove('hold'); lrows.concat(crows, chips).forEach(e => e.classList.remove('rh'));
  refresh();
}
/* 아래 고정 「상담」(좁은 화면): 내려 읽는 동안은 비켜 있고, 위로 올리거나 맨 위에서 나온다. S5 가 화면에 들어오면 비킨다 */
let thY = scrollY, thHide = false;
function syncThumb() {
  if (!G || G.wide) return;
  const y = scrollY, d = y - thY;
  if (Math.abs(d) > 6) { thHide = d > 0; thY = y; }
  if (y < 40) thHide = false;
  cls(thumb, 'off', thHide || G.draft.y + G.OY - y < innerHeight);
}
addEventListener('scroll', () => { if (STILL && G) render(performance.now()); else syncThumb(); }, { passive: true });

/* 글꼴: 고정폭 글자를 칸 이음매에 맞춰 세우고(cap 중앙), 현지어 글자가 실제로 그려지는지 잰다 */
function capFix() {
  try {
    const ctx = D.createElement('canvas').getContext('2d'); ctx.font = '700 100px ' + MONO;
    const m = ctx.measureText('H'), A = m.fontBoundingBoxAscent, De = m.fontBoundingBoxDescent, cap = m.actualBoundingBoxAscent;
    if (!(A > 0) || !(cap > 0)) return;
    const Lh = 112, base = (Lh - (A + De)) / 2 + A, off = (Lh / 2 - (base - cap / 2)) / 100;
    H.style.setProperty('--capfix', off.toFixed(4) + 'em');
  } catch (e) { }
}
/* 현지어 글자 전부(alphabet) + 고유 글자(sample) + 판 글자표(drum)를 실제로 쓰는 글꼴·굵기마다 잰다.
   같은 글자를 두 대체 글꼴(monospace / serif)로 받쳐 폭이 같으면 그 글꼴이 그린 것이다. check-country.mjs 가 이 값을 읽어 판정한다 */
function fontProbe() {
  try {
    const ctx = D.createElement('canvas').getContext('2d'), out = {};
    const chars = Array.from(new Set(Array.from(C.fonts.alphabet + C.fonts.sample + C.drum))).filter(ch => /\S/.test(ch));
    [[C.fonts.sans[0], ['400', '500', '700']], [C.fonts.mono[0], ['500', '700']]].forEach(([f, ws]) => ws.forEach(wt => {
      out[f + ' ' + wt] = chars.filter(ch => {
        ctx.font = wt + ' 40px "' + f + '",monospace'; const a = ctx.measureText(ch).width;
        ctx.font = wt + ' 40px "' + f + '",serif'; return Math.abs(a - ctx.measureText(ch).width) > .5;
      }).join('');
    }));
    W.CAEDU_FONTCHECK = { country: C.code, lang: L, chars: chars.length, miss: out };
    Object.keys(out).forEach(f => console.info('caedu font', f, out[f] ? 'falls back for: ' + out[f] : 'ok'));
  } catch (e) { W.CAEDU_FONTCHECK = { error: String(e) }; }
}

/* ── 시작 ── */
const gsapReady = STILL ? null : loadScript(GSAP_SRC).then(() => loadScript(ST_SRC));
if (gsapReady) gsapReady.catch(() => { });
function onFonts() { if (fontsOk) return; fontsOk = true; capFix(); refresh(); if (gsapReady) gsapReady.then(startMotion, toStill); D.fonts.ready.then(() => setTimeout(fontProbe, 300)); }
const TX = Array.from(new Set(Array.from(C.drum + C.fonts.sample + C.fonts.alphabet))).join('');
try {
  Promise.all([['700 40px ' + MONO, TX], ['500 13px ' + MONO, TX], ['400 17px ' + SANS, TX], ['500 17px ' + SANS, TX], ['700 17px ' + SANS, TX]].map(a => D.fonts.load(a[0], a[1])))
    .then(() => D.fonts.ready).then(onFonts, onFonts);
} catch (e) { onFonts(); }
setTimeout(onFonts, 3000);
function changed() { return page.clientWidth !== lastW || Math.abs(D.documentElement.scrollHeight - lastDH) > 1; }
let rq = 0; function schedule() { clearTimeout(rq); rq = setTimeout(refresh, 140); }
if (D.fonts && D.fonts.addEventListener) D.fonts.addEventListener('loadingdone', () => { if (fontsOk) schedule(); });
if ('ResizeObserver' in W) new ResizeObserver(() => { if (fontsOk && changed() && (!touch || page.clientWidth !== lastW)) schedule(); }).observe(page);
addEventListener('resize', () => { if (!fontsOk) return; const w = page.clientWidth, h = innerHeight; if (w !== lastW || (!touch && h !== lastH) || Math.abs(h - lastH) > 160) schedule(); });
try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => { if (e.matches && !STILL) toStill(); }); } catch (e) { }
W.CAEDU_APP = { country: C.code, lang: L, draft: draftText, refresh: () => refresh(), beats: () => G && G.B, famHref: (id, loc) => { const f = FAM.find(x => x.id === id); return f ? famHref(f, loc) : null; } };
}

boot();
})();
