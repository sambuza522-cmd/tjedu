// 나라 데이터 검사기 — node check-country.mjs <나라코드> [--dir <data 폴더>]
// 필수 키 · 현지어 원고 키 = ru 원고 키(빈 값 0) · 사실 행·원고 사실 문장마다 출처 키 · 드럼 글자표 · 글자 범위 · 자리표시 · 금지어 · 아이콘 글자 · 키 색(colors) 대비,
// 끝으로 헤드리스 크롬으로 페이지를 열어 글꼴이 현지어 글자를 실제로 그리는지 잰다(R). 하나라도 어긋나면 종료 코드 1.
// 크롬 경로: 환경변수 CAEDU_CHROME 또는 기본 설치 경로. --dir 로 다른 data 폴더를 볼 때는 페이지가 그 폴더를 읽지 않으므로 R 은 건너뛴다(SKIP 표시).
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const di = argv.indexOf('--dir');
const dataDefault = join(here, 'data');
const dir = di >= 0 ? argv[di + 1] : dataDefault;
const code = (argv.filter((a, i) => !a.startsWith('--') && (di < 0 || i !== di + 1))[0] || '').toLowerCase();
const res = []; let bad = 0;
const ok = (name, cond, detail) => { res.push((cond ? 'PASS ' : 'FAIL ') + name + (cond || !detail ? '' : ' :: ' + detail)); if (!cond) bad++; return cond; };
if (!/^[a-z]{2}$/.test(code)) { console.log('usage: node check-country.mjs <code> [--dir <data folder>]'); process.exit(2); }

/* 브라우저처럼 classic script 두 개를 같은 window 에 싣는다 */
const ctx = { window: {} }; vm.createContext(ctx);
/* 공용 데이터(common.js — 운영 회사 · 패밀리 사이트)는 나라와 무관: --dir 폴더에 없으면 기본 data 폴더 것을 읽는다 */
const commonPath = existsSync(join(dir, 'common.js')) ? join(dir, 'common.js') : join(dataDefault, 'common.js');
for (const f of ['common.js', 'ru.js', code + '.js']) {
  const p = f === 'common.js' ? commonPath : join(dir, f);
  if (!ok('file ' + f, existsSync(p), p + ' missing')) await finish();
  try { vm.runInContext(readFileSync(p, 'utf8'), ctx, { filename: f }); } catch (e) { ok('load ' + f, false, e.message); await finish(); }
}
const CA = ctx.window.CAEDU || {};
const RU = CA.lang && CA.lang.ru;
const C = CA.country && CA.country[code];
ok('ru.js registers lang.ru', !!(RU && RU.t && RU.meta));
if (!ok('country registered as country.' + code, !!C, 'data/' + code + '.js must assign CAEDU.country.' + code)) await finish();

/* A. 필수 키 */
const get = (o, path) => path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), o);
const isStr = v => typeof v === 'string' && v.trim().length > 0;
const L = C.local;
const OPEN = Array.isArray(C.open) ? C.open : [];
const nonEmptyList = v => Array.isArray(v) && v.length > 0 && v.every(isStr);
/* 행 값: 없음(null/undefined) · 글자 · 열린 언어마다 글자 */
const valOk = v => v == null || isStr(v) || (typeof v === 'object' && OPEN.every(l => isStr(v[l])));
const rowList = v => Array.isArray(v) && v.length > 0 && v.every(r => Number.isInteger(r.n) && isStr(r.src) && valOk(r.value));
const req = [
  ['code', v => v === code], ['local', v => /^[a-z]{2}$/.test(v)], ['defaultLang', v => OPEN.includes(v)],
  ['open', v => Array.isArray(v) && v.includes('ru') && v.includes(L)],
  ['names.ru.nom', isStr], ['names.ru.gen', isStr], ['names.ru.loc', isStr], ['names.' + L + '.nom', isStr], ['names.ko.nom', isStr],
  ['capital.ru', isStr], ['capital.' + L, isStr],
  ['brand.code', isStr], ['brand.suffix', isStr], ['brand.name', v => v == null || isStr(v)],
  ['fonts.google', isStr], ['fonts.sans', nonEmptyList], ['fonts.mono', nonEmptyList],
  ['fonts.alphabet', isStr], ['fonts.sample', isStr],
  ['drum', v => typeof v === 'string' && v.includes(' ') && v.trim().length > 0],
  ['hero.text', v => isStr(v) && Array.from(v).length <= 6], ['hero.src', isStr],
  ['board.cells', v => Array.isArray(v) && v.map(c => c.key).join() === 'admit,uni,cost,steps' &&
    v.every(c => Number.isInteger(c.w) && c.w > 0 && (c.val === 'byUni' || c.val === 'cat' || c.val === 'blank' || isStr(String(c.val ?? ''))) && isStr(c.src))],
  ['rows.categories', v => Array.isArray(v) && v.length > 0 && v.every(r => Number.isInteger(r.n) && isStr(r.src))],
  ['rows.categoryDefault', v => (C.rows.categories || []).some(r => r.n === v)],
  ['rows.ledger', rowList], ['rows.check', rowList],
  ['rows.guard.src', isStr], ['rows.guard.step', v => (C.rows.steps || []).some(s => s.n === v)],
  ['rows.steps', v => Array.isArray(v) && v.length > 0 && v.every(r => Number.isInteger(r.n) && isStr(r.src))],
  ['rows.axes', v => Array.isArray(v) && v.length > 0 && v.every(a => isStr(a.id) && (C.rows.steps || []).some(s => s.n === a.step) && (a.def === 'a' || a.def === 'b') && isStr(a.src))],
  ['sources', v => v && typeof v === 'object' && Object.keys(v).length > 0],
  ['cites', v => v == null || (typeof v === 'object' && Object.values(v).every(nonEmptyList))],
  ['messengers', v => Array.isArray(v) && v.length > 0 && v.every(m => (m.id === 'whatsapp' || m.id === 'telegram') && 'account' in m && (m.account == null || isStr(m.account)))],
  ['email', v => v == null || (isStr(v) && /^[^@\s]+@[^@\s]+$/.test(v))],
  ['seminar.cities', v => Array.isArray(v)], ['seminar.show', v => typeof v === 'boolean'],
  ['links.studyInKorea', v => /^https:\/\//.test(v || '')],
  ['community', v => v == null || (typeof v === 'object' && (v.url == null || (/^https:\/\//.test(v.url) && v.text && OPEN.every(l => isStr(v.text[l])))))],
  ['pages', v => Array.isArray(v)],
  ['routes', v => v && ['uni', 'cost', 'docs', 'company', 'consult', 'privacy', 'terms'].every(k => isStr(v[k]))],
  ['copy.' + L + '.meta.code', v => v === L], ['copy.' + L + '.meta.name', isStr], ['copy.' + L + '.meta.short', isStr],
  ['copy.' + L + '.meta.forbidden', nonEmptyList], ['copy.' + L + '.t', v => v && typeof v === 'object']
];
const missing = req.filter(([k, f]) => { let v; try { v = get(C, k); } catch (e) { v = undefined; } try { return !f(v); } catch (e) { return true; } }).map(([k]) => k);
ok('required keys (' + req.length + ')', missing.length === 0, 'missing or invalid: ' + missing.join(', '));
ok('ru meta.forbidden non-empty', nonEmptyList(RU.meta && RU.meta.forbidden));
/* 공용: 운영 회사(이름 · 로마자) · 패밀리 사이트(id · 이름 · 도메인 · lab 경로 또는 null). 지금 사이트 = brand.domain 과 같은 항목 */
const CMN = CA.common || {}, FAM = Array.isArray(CMN.family) ? CMN.family : [];
const famBad = FAM.filter(f => !(f && isStr(f.id) && isStr(f.name) && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(f.domain || '') && (f.lab == null || (isStr(f.lab) && !/^[a-z]+:/i.test(f.lab))))).map(f => (f && f.id) || '?');
ok('common.company name + latin', !!(CMN.company && isStr(CMN.company.name) && isStr(CMN.company.latin)), 'common.js must set CAEDU.common.company { name, latin }');
const CO2 = CMN.company || {};
const coBad = [['reg', v => v == null || isStr(v)], ['address', v => v == null || isStr(v)], ['email', v => v == null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)],
  ['phone', v => v == null || (isStr(v.display) && /^\+\d{6,15}$/.test(v.tel || ''))]].filter(([k, f]) => { try { return !f(CO2[k]); } catch (e) { return true; } }).map(([k]) => k);
ok('common.company reg / address / phone(display, tel +digits) / email', coBad.length === 0, 'invalid: ' + coBad.join(', '));
/* 「확인」 행의 from = common.js 경로 — 값이 한 곳(공용)에만 있고, 그 경로가 비지 않은 글자로 풀린다 */
const fromRows = (C.rows.check || []).filter(r => r.from != null);
const fromBad = fromRows.filter(r => !(isStr(r.from) && isStr(String(r.from).split('.').reduce((o, k) => (o == null ? undefined : o[k]), CMN)) && r.value == null)).map(r => 'check.' + r.n + ' -> ' + r.from);
ok('check rows from common.js resolve (' + fromRows.map(r => r.n + ':' + r.from).join(' ') + ')', fromBad.length === 0, fromBad.join(', ') + ' (path empty, or value also set)');
ok('common.family (' + FAM.length + ' sites, ids unique)', FAM.length > 0 && famBad.length === 0 && new Set(FAM.map(f => f.id)).size === FAM.length, 'invalid: ' + famBad.join(', '));
res.push('NOTE current family site: ' + ((FAM.find(f => f.domain === (C.brand && C.brand.domain)) || {}).id || 'none (brand.domain ' + JSON.stringify(C.brand && C.brand.domain) + ' not in common.family — every site shows as a link)'));
const LT = (C.copy && C.copy[L] && C.copy[L].t) || {};

/* B. 현지어 원고 키 = ru 원고 키, 값은 둘 다 빈 글자 0 */
const rk = Object.keys(RU.t), lk = Object.keys(LT);
const miss = rk.filter(k => !(k in LT)), extra = lk.filter(k => !(k in RU.t));
ok('copy keys ' + L + ' == ru (' + rk.length + ')', miss.length === 0 && extra.length === 0, (miss.length ? 'missing in ' + L + ': ' + miss.join(', ') : '') + (extra.length ? ' extra in ' + L + ': ' + extra.join(', ') : ''));
const empty = [].concat(rk.filter(k => !isStr(RU.t[k])).map(k => 'ru:' + k), lk.filter(k => !isStr(LT[k])).map(k => L + ':' + k));
ok('copy values non-empty (ru + ' + L + ')', empty.length === 0, empty.join(', '));

/* C. 틀이 데이터 따라 부르는 키가 두 원고에 다 있다 */
const need = [];
(C.rows.categories || []).forEach(r => need.push('cat.' + r.n + '.tile', 'cat.' + r.n + '.name', 'cat.' + r.n + '.fact'));
(C.rows.ledger || []).forEach(r => { need.push('s3.row.' + r.n); if (r.tag) need.push('s3.tag.' + r.n); });
(C.rows.steps || []).forEach(r => need.push('s4.step.' + r.n, 's4.dec.' + r.n));
(C.rows.axes || []).forEach(a => need.push('ax.' + a.id, 'ax.' + a.id + '.a', 'ax.' + a.id + '.b', 'q.' + a.id + '.a', 'q.' + a.id + '.b'));
(C.rows.check || []).forEach(r => need.push('chk.' + r.n));
(C.board.cells || []).forEach(c => need.push('board.h.' + c.key, 'board.tag.' + c.key, 'd.h.' + c.key));
if (CMN.company) need.push('ft.opBy'); if (FAM.length) need.push('ft.family'); /* 바닥글 운영 줄 · 패밀리 사이트 라벨 */
[['reg', 'ft.reg'], ['address', 'ft.addr'], ['phone', 'ft.tel'], ['email', 'ft.mail']].forEach(([f, k]) => { if (CMN.company && CMN.company[f]) need.push(k); }); /* 회사 정보 라벨 */
const needMiss = [];
need.forEach(k => { if (!isStr(RU.t[k])) needMiss.push('ru:' + k); if (!isStr(LT[k])) needMiss.push(L + ':' + k); });
ok('frame keys present (' + need.length + ' x 2)', needMiss.length === 0, needMiss.join(', '));

/* D. 사실 행마다 출처 키가 있고, 그 키가 sources 에 있다. 원고 속 사실 문장(cites)도 같다 */
const S = C.sources || {}; const srcBad = [];
const chk = (where, k) => { if (!isStr(k)) srcBad.push(where + ' has no src'); else if (!S[k]) srcBad.push(where + ' -> ' + k + ' not in sources'); };
chk('hero', C.hero && C.hero.src);
(C.board.cells || []).forEach(c => chk('board.' + c.key, c.src));
['categories', 'ledger', 'steps', 'axes', 'check'].forEach(g => (C.rows[g] || []).forEach(r => { chk(g + '.' + (r.n || r.id), r.src); if (r.also) chk(g + '.' + (r.n || r.id) + '.also', r.also); }));
chk('guard', C.rows.guard && C.rows.guard.src); if (C.rows.guard && C.rows.guard.also) chk('guard.also', C.rows.guard.also);
if (C.seminar) chk('seminar', C.seminar.src);
const cites = C.cites || {};
Object.entries(cites).forEach(([k, list]) => { if (!(k in RU.t)) srcBad.push('cites.' + k + ' is not a copy key'); (list || []).forEach(s => chk('cites.' + k, s)); });
const nRows = ['categories', 'ledger', 'steps', 'axes', 'check'].reduce((a, g) => a + (C.rows[g] || []).length, 0) + (C.board.cells || []).length + 3 + Object.keys(cites).length;
ok('fact rows carry source keys (' + nRows + ')', srcBad.length === 0, srcBad.join('; '));
const sNoRef = Object.keys(S).filter(k => !isStr(S[k] && S[k].ref));
ok('every source has ref', sNoRef.length === 0, sNoRef.join(', '));

/* E. 드럼 글자표가 판 글자를 다 품고, 값이 칸 폭에 든다. 판 머리 칸(11ch)에 머리글이 든다 */
const drum = new Set(Array.from(C.drum || ''));
const fmtVars = lang => Object.assign({}, (C.names && C.names[lang]) || {}, { capital: C.capital && C.capital[lang], brand: C.brand && (C.brand.name || C.brand.code + C.brand.suffix), color: C.colors && C.colors.name && C.colors.name[lang] });
const tx = (lang, k) => { const d = lang === 'ru' ? RU.t : LT; const v = fmtVars(lang); return String(d[k] == null ? '' : d[k]).replace(/\{(\w+)\}/g, (m, n) => v[n] != null ? v[n] : m); };
const drumBad = [], widthBad = [], headBad = [];
const tileStr = (lang, cell) => cell.val === 'byUni' ? [tx(lang, 'board.v.byUni')] : cell.val === 'cat' ? (C.rows.categories || []).map(r => tx(lang, 'cat.' + r.n + '.tile')) : cell.val === 'blank' ? [''] : [String(cell.val)];
['ru', L].forEach(lang => {
  (C.board.cells || []).forEach(cell => {
    tileStr(lang, cell).forEach(s => {
      Array.from(s).forEach(ch => { if (!drum.has(ch)) drumBad.push(lang + ':' + cell.key + ' "' + s + '" char ' + JSON.stringify(ch)); });
      if (Array.from(s).length > cell.w) widthBad.push(lang + ':' + cell.key + ' "' + s + '" ' + Array.from(s).length + ' > w ' + cell.w);
    });
    const h = tx(lang, 'board.h.' + cell.key); if (Array.from(h).length > 11) headBad.push(lang + ':board.h.' + cell.key + ' "' + h + '" > 11');
  });
});
Array.from((C.hero && C.hero.text) || '').forEach(ch => { if (!drum.has(ch)) drumBad.push('hero char ' + JSON.stringify(ch)); });
ok('drum covers board + hero glyphs (ru, ' + L + ')', drumBad.length === 0, drumBad.slice(0, 8).join('; '));
ok('board values fit cell width', widthBad.length === 0, widthBad.join('; '));
ok('board heads fit 11ch', headBad.length === 0, headBad.join('; '));

/* F. 현지어 글(원고 + 나라 파일의 현지어 문장 + 행 값)의 글자가 fonts.alphabet 범위 안이다. 결합 부호(분해형) 0 */
const localTexts = Object.values(LT).map(String);
if (C.community && C.community.text && C.community.text[L]) localTexts.push(C.community.text[L]);
if (C.colors && C.colors.name && typeof C.colors.name[L] === 'string') localTexts.push(C.colors.name[L]);
['ledger', 'check'].forEach(g => (C.rows[g] || []).forEach(r => { if (r.value && typeof r.value === 'object' && r.value[L]) localTexts.push(r.value[L]); }));
const alpha = new Set(Array.from((C.fonts && C.fonts.alphabet) || ''));
const outside = new Set(), marks = new Set();
localTexts.forEach(s => Array.from(s).forEach(ch => { if (/\p{M}/u.test(ch)) marks.add('U+' + ch.codePointAt(0).toString(16).toUpperCase()); else if (/\p{L}/u.test(ch) && ch.codePointAt(0) > 127 && !alpha.has(ch)) outside.add(ch); }));
ok('local text letters inside fonts.alphabet', outside.size === 0, 'outside: ' + Array.from(outside).join(''));
ok('local text has no combining marks (precomposed only)', marks.size === 0, Array.from(marks).join(' '));
const sampleMiss = Array.from(new Set(Array.from((C.fonts && C.fonts.sample) || '').filter(ch => /\p{L}/u.test(ch) && !alpha.has(ch))));
ok('fonts.sample letters inside alphabet', sampleMiss.length === 0, sampleMiss.join(''));

/* G. 자리표시 {x} 가 다 풀린다 — 나라 이름 격·수도·상호·판 색 이름(J 에서 값 확인)은 어디서나, 그 밖은 키마다 정해진 것만 */
const common = new Set(['capital', 'brand', 'color']);
const perKey = { 's2.rank': ['n', 'total'], 's4.slot': ['n'] };
const phBad = [];
['ru', L].forEach(lang => { const d = lang === 'ru' ? RU.t : LT; const nm = (C.names && C.names[lang]) || {};
  Object.entries(d).forEach(([k, s]) => String(s).replace(/\{(\w+)\}/g, (m, n) => { if (!common.has(n) && !(n in nm) && !(perKey[k] || []).includes(n)) phBad.push(lang + ':' + k + ' {' + n + '}'); return m; })); });
ok('placeholders resolve', phBad.length === 0, phBad.join(', '));

/* H. 금지어(보장·압박·공짜 류) — ru 목록 + 현지어 목록, 두 원고와 나라 파일의 문장 전부 */
const forb = [].concat((RU.meta && RU.meta.forbidden) || [], (C.copy[L] && C.copy[L].meta && C.copy[L].meta.forbidden) || []).map(w => String(w).toLowerCase());
const scan = [['ru', Object.entries(RU.t)], [L, Object.entries(LT)]];
if (C.community && C.community.text) scan.push(['community', Object.entries(C.community.text)]);
const forbHit = [];
scan.forEach(([lang, list]) => list.forEach(([k, s]) => { const low = String(s).toLowerCase(); forb.forEach(w => { if (low.includes(w)) forbHit.push(lang + ':' + k + ' "' + w + '"'); }); }));
ok('forbidden terms 0 (' + forb.length + ' terms)', forbHit.length === 0, forbHit.join(', '));

/* I. 내장 아이콘 글자(화살표·도형·딩뱃·이모지) 0 */
const ICON = new RegExp('[' + [[0x2190, 0x21FF], [0x2300, 0x23FF], [0x25A0, 0x25FF], [0x2600, 0x27BF], [0x2B00, 0x2BFF], [0xFE0F, 0xFE0F]].map(([a, z]) => String.fromCodePoint(a) + '-' + String.fromCodePoint(z)).join('') + ']|[' + String.fromCodePoint(0x1F000) + '-' + String.fromCodePoint(0x1FAFF) + ']', 'u');
const iconHit = [];
scan.forEach(([lang, list]) => list.forEach(([k, s]) => { if (ICON.test(String(s))) iconHit.push(lang + ':' + k); }));
['ru.js', code + '.js'].forEach(f => { const src = readFileSync(join(dir, f), 'utf8'); if (ICON.test(src)) iconHit.push(f); });
if (ICON.test(readFileSync(commonPath, 'utf8'))) iconHit.push('common.js');
ok('icon glyphs 0', iconHit.length === 0, iconHit.join(', '));

/* J. 키 색(colors) — 넷 다 #RRGGBB. 글자로 쓰는 자리의 대비(WCAG): key 는 종이 위(판 글자·단추·링크) 4.5:1, keyOnInk 는 먹 위 4.5:1.
   먹·종이 값은 style.css :root 에서 읽는다(틀과 같은 값) */
const COLOR_KEYS = ['key', 'keyOnInk', 'keyOnInkLg', 'keyRipe'];
const isHex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const CO = (C.colors && typeof C.colors === 'object') ? C.colors : {};
const colBad = COLOR_KEYS.filter(k => !isHex(CO[k])).map(k => 'colors.' + k + '=' + JSON.stringify(CO[k]));
ok('colors present, #RRGGBB (' + COLOR_KEYS.length + ')', colBad.length === 0, colBad.join(', '));
/* 판 색 이름 = 원고 {color}. 공용 원고(ru)에 색 이름을 박지 않으므로 나라가 공개하는 언어(ru + 현지어)마다 있어야 한다 */
const NAME_LANGS = Array.from(new Set(['ru', L].concat(OPEN)));
const CN = (CO.name && typeof CO.name === 'object') ? CO.name : {};
const nameMiss = NAME_LANGS.filter(l => !isStr(CN[l]));
ok('colors.name for ' + NAME_LANGS.join(', ') + ' (' + NAME_LANGS.map(l => l + '=' + JSON.stringify(CN[l] ?? null)).join(' ') + ')', nameMiss.length === 0, 'missing: ' + nameMiss.join(', '));
const rootCss = ((readFileSync(join(here, 'style.css'), 'utf8').match(/:root\{([^}]*)\}/) || [])[1]) || '';
const cssHex = n => (rootCss.match(new RegExp('--' + n + ':\\s*(#[0-9A-Fa-f]{6})\\b')) || [])[1];
const INK = cssHex('ink'), PAPER = cssHex('paper');
ok('style.css :root --ink / --paper are hex', isHex(INK) && isHex(PAPER), 'ink=' + INK + ' paper=' + PAPER);
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
[['key', 'paper', PAPER, 4.5], ['keyOnInk', 'ink', INK, 4.5]].forEach(([k, bgName, bg, min]) => {
  if (!isHex(CO[k]) || !isHex(bg)) { ok('contrast ' + k + ' on ' + bgName, false, 'color missing'); return; }
  const r = ratio(CO[k], bg);
  ok('contrast ' + k + ' ' + CO[k] + ' on ' + bgName + ' ' + bg + ' = ' + (Math.floor(r * 100) / 100).toFixed(2) + ':1 (min ' + min + ':1)', r >= min, 'too low for text');
});

/* R. 렌더 실측: 페이지를 열어 app.js 의 글꼴 탐침(window.CAEDU_FONTCHECK) 값을 읽는다 */
if (resolve(dir) !== resolve(dataDefault)) res.push('SKIP font render (--dir: the page reads ' + dataDefault + ')');
else { const r = await fontRender(); ok('fonts draw every local glyph (render, ' + code + '/' + L + ')', r.ok, r.detail); if (r.ok && r.detail) res.push('     ' + r.detail); }

await finish();

async function fontRender() {
  const exe = [process.env.CAEDU_CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => p && existsSync(p));
  if (!exe) return { ok: false, detail: 'Chrome not found (set CAEDU_CHROME)' };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const port = 9600 + Math.floor(Math.random() * 300), prof = mkdtempSync(join(tmpdir(), 'caedu-font-'));
  const ch = spawn(exe, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
  let ws = null;
  try {
    let tgt;
    for (let k = 0; k < 60 && !tgt; k++) { try { tgt = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find(t => t.type === 'page'); } catch (e) { } if (!tgt) await sleep(250); }
    if (!tgt) return { ok: false, detail: 'Chrome did not start' };
    ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const pend = new Map();
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } };
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async e => ((await send('Runtime.evaluate', { expression: e, returnByValue: true })) || {}).result?.value;
    await send('Page.enable');
    await send('Page.navigate', { url: pathToFileURL(join(here, 'index.html')).href + '?c=' + code + '&l=' + L });
    let out = null;
    for (let k = 0; k < 50 && !out; k++) { await sleep(400); out = await ev('window.CAEDU_FONTCHECK ? JSON.stringify(window.CAEDU_FONTCHECK) : null'); }
    if (!out) return { ok: false, detail: 'no probe result in 20s (fonts not loaded or page error)' };
    const fc = JSON.parse(out);
    if (fc.error) return { ok: false, detail: 'probe error ' + fc.error };
    if (fc.country !== code || fc.lang !== L) return { ok: false, detail: 'page opened ' + fc.country + '/' + fc.lang };
    const fall = Object.entries(fc.miss || {}).filter(([, v]) => v).map(([f, v]) => f + ' falls back for ' + v);
    return fall.length ? { ok: false, detail: fall.join('; ') } : { ok: true, detail: fc.chars + ' glyphs x ' + Object.keys(fc.miss).join(', ') };
  } catch (e) { return { ok: false, detail: 'render check error ' + e.message }; }
  finally { try { ws && ws.close(); } catch (e) { } ch.kill(); await sleep(300); try { rmSync(prof, { recursive: true, force: true }); } catch (e) { } }
}
async function finish() {
  console.log('caedu country check: ' + code + '  (' + dir + ')');
  res.forEach(r => console.log('  ' + r));
  console.log(bad ? 'RESULT FAIL (' + bad + ')' : 'RESULT PASS (' + res.filter(r => r.startsWith('PASS')).length + ' checks)');
  process.exit(bad ? 1 : 0);
}
