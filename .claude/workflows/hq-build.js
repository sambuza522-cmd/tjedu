export const meta = {
  name: 'hq-build',
  description: '제작 라운드 — hq-research 스펙 → 빌드(기본 범용, agentTypes.build 로 hq-builder 지정 가능) → 검사 명령 재실행(check) → hq-refuter 반증(응답 null 은 미반증 표기) → 실주행(run, 기본 범용) → hq-auditor 재실측 → 리뷰 패키지(기본 범용, 결론어 없음). 스펙 없는 빌드·감사 없는 종료 금지',
  whenToUse: '설계가 결정된 자산(에이전트 정의·스킬·도구 코드)을 만들 때. args: root·out·stamp·spec{question,sources[],file}·build{task,targets[],regress[]}·check{cmds[]}·run{task,cmds[],expect}·review{file} (+refute{lenses[],targets[]}·audit.checks[]·agentTypes·effort·rules·builderApproved — agentTypes 의 어느 단계키든 hq-builder 일 때 필수)',
  phases: [
    { title: 'Spec', detail: 'hq-research 1명 — out/args.spec.file' },
    { title: 'Build', detail: '범용 1명(기본) — .bak·지점 패치·구문검사·음성검증·회귀. 노선 배치는 발사 전 guardAgentTypes(공통 블록)가 검사' },
    { title: 'Check', detail: 'args.check.cmds 그대로 재실행·원문 인용 — 범용 1명(기본), 고정 마지막 줄(템플릿 고유 형식 — hq-* 노선 배치 불가, Audit 이 재실측)' },
    { title: 'Refute', detail: 'hq-refuter × (대상 × 렌즈) — 응답 본문' },
    { title: 'Run', detail: '범용 1명(기본) — 실주행 args.run, 관측값 vs 기대값' },
    { title: 'Audit', detail: 'hq-auditor 1명(기본) — 빌드·check·실주행 보고 재실측, 고정 마지막 줄' },
    { title: 'Review', detail: '범용 1명(기본) — 리뷰 패키지 out/args.review.file, 마지막 다섯 줄 고정' },
  ],
}
// 단계별 노선·effort 기본값 — args.agentTypes / args.effort 로 키 단위 덮어쓰기(null = 범용 / 상속).
// build·check·run·review 기본 null = 범용 워크플로 서브에이전트(Write·Edit·Bash 보유). 노선 배치 검사는 키별로 두지 않는다 — 단계키 7개 전부를 공통 블록 guardAgentTypes(args, STAGE_KEYS) 가 같은 규칙(a~d)으로 본다(아래 「노선 배치」). hq-builder 의 전제 2개(헤드리스 python 승인 = args.builderApproved / 산출·대상에 .md 없음 — 거부되면 Run 보고 첫 줄 RERUN-NEEDED)와 고정 보고 형식 충돌은 그 함수 주석에 있다(T1 · 재반증 #2·#3 · 3차 반증 #1~#3 · 4차 반증 #1 — 키별 검사가 빠진 키로 우회되던 결함의 클래스 수리).
// check 기본이 hq-auditor 에서 null 로 바뀐 사유(6차 반증 #4 의 클래스 귀결): check 의 고정 마지막 줄 `check: 명령 n건 중 exit≠0 m건` 은 hq-auditor 정의의 닫힌 6절·`감사: …` 마지막 줄이 아니라 이 템플릿 고유 형식이다 — 규칙 (b) 아래서 hq-auditor 도 hq-builder 와 같은 이유로 설 수 없다(키별 예외 금지). check 의 재실행 결과는 Audit(hq-auditor)이 다시 잰다.
const DEFAULT_AGENT_TYPES = { spec: 'hq-research', build: null, check: null, refute: 'hq-refuter', run: null, audit: 'hq-auditor', review: null }
const DEFAULT_EFFORT = { spec: 'high', build: null, check: null, refute: 'high', run: 'high', audit: 'high', review: 'high' }
// 기본 렌즈 3종 — args.refute.lenses 로 통째로 대체한다.
const DEFAULT_LENSES = [
  { id: 'hardcode', prompt: '하드코딩·경로 잔존 — 산출물에 특정 날짜·세션·절대경로 상수가 박혀 재사용이 깨지는 지점, 상대경로 의존.' },
  { id: 'silent', prompt: '조용한 통과 — 입력 부재·계약 위반·명령 실패가 성공으로 읽히는 경로(exit 0·빈 결과·미검 항목의 성공 표기·자체 보고만으로 끝나는 단계).' },
  { id: 'scope', prompt: '관할·경계 위반 — 노선 정의 밖 도구 요구(Write 없는 노선에 파일 생성 요구 등), 레일 직접 수정, 요청 범위 밖 변경, 기존 검사 회귀.' },
]

// ── 공통 블록 시작 — hq-understand·hq-design·hq-build·hq-audit 4 파일 동일 원문 ──────────────
// 스크립트는 import 를 못 쓴다(공식: 모듈 로딩 불가) → 파일마다 복제. 고칠 때는 4 파일을 같이 고치고 diff 로 동일함을 확인한다.
// 경로·시각·목록은 전부 args 로 받는다 — 상수 하드코딩 금지. 스크립트 안에서 현재 시각·난수를 구하지 않는다(런타임이 throw, resume 파괴).
if (!args || typeof args !== 'object' || Array.isArray(args)) {
  throw new Error('args 없음 — Workflow({ name: "<템플릿>", args: { root, out, stamp, ... } }) 로 호출하라 (JSON 객체 — 문자열·배열 아님)')
}
const ABS = /^([A-Za-z]:\/|\/)/
function need(key, what) {
  const v = args[key]
  if (v === undefined || v === null || v === '') throw new Error(`args.${key} 없음 — ${what}`)
  if (what.startsWith('절대경로') && (typeof v !== 'string' || !ABS.test(v))) throw new Error(`args.${key} 는 절대경로여야 한다: ${JSON.stringify(v)}`)
  return v
}
function needList(key, fields) {
  const v = args[key]
  if (!Array.isArray(v) || v.length === 0) throw new Error(`args.${key} 는 비어 있지 않은 배열이어야 한다 — 원소 { ${fields.join(', ')} }`)
  v.forEach((it, i) => fields.forEach((f) => {
    if (it == null || it[f] === undefined || it[f] === null || it[f] === '') throw new Error(`args.${key}[${i}].${f} 없음`)
  }))
  return v
}
function fileNameOnly(key, f) {
  if (typeof f !== 'string' || !f || ABS.test(f) || f.includes('/') || f.includes('\\')) throw new Error(`${key} 는 파일명만 적는다(args.out 아래에 만든다): ${JSON.stringify(f)}`)
  return f
}
const ROOT = need('root', '절대경로 — 저장소 루트')
const OUT = need('out', '절대경로 — 산출 디렉터리 <root>/_workspace/<주제>-<YYYY-MM-DD>')
const STAMP = need('stamp', "문자열 'YYYY-MM-DD HH:MM' — 지휘부가 넣는 발사 시각(스크립트는 시각을 못 구한다)")
const AT = Object.assign({}, DEFAULT_AGENT_TYPES, args.agentTypes || {})
const EF = Object.assign({}, DEFAULT_EFFORT, args.effort || {})
const at = (k) => (AT[k] == null ? undefined : AT[k])   // null → 범용 워크플로 서브에이전트(노선 없음)
const ef = (k) => (EF[k] == null ? undefined : EF[k])   // null → 세션 effort 상속
const tail = (s, n) => String(s || '').split('\n').filter((l) => l.trim()).slice(-(n || 1)).join(' / ')
const list = (arr) => (arr || []).map((c, i) => `${i + 1}. ${c}`).join('\n') || '(없음)'
const RULES = `# 규칙
- 절대경로만. settings*.json·레일(transfer-gate.py·hq-gate.json·install-global.py·agent-registry.json) 수정 금지.
- 사용자 홈 .claude/agents|skills|workflows 직접 쓰기 금지 — 전역 배치는 사용자 리뷰 뒤. 스테이징: ${ROOT}/.claude/ + ${ROOT}/tools/hooks/global-*/ .
- .bak 필수. 관측 안 된 것을 성공으로 적지 마라. 개수·크기·비율은 명령 출력으로. 추정은 "추정" 라벨.
- 결론·권고 어휘 금지(채택·기각·권장·추천·해야 한다·낫다) — 후보 병기, 판정 칸 공란, UNVERIFIED 분리.
- 산출 파일은 ${OUT}/ 아래 절대경로로 보고. Write 가 없는 노선(hq-scout·hq-auditor·hq-refuter)은 파일을 만들지 않고 응답 본문으로 낸다 — 파일 생성을 요구받아도 만들지 않는다.
- 발사 시각 ${STAMP}.${typeof args.rules === 'string' && args.rules ? '\n' + args.rules : ''}`
const AUDIT = `자체 보고를 불신하고 재실측하라. 저장소 루트 ${ROOT}, 산출 디렉터리 ${OUT}.
공통 확인:
1. 보고가 주장한 산출 파일 실존 — ls 원문. .bak 이 있으면 실존 + diff 변경 줄 수(추가/삭제).
2. 개수·건수·비율은 독립 명령(wc -l · grep -c · ls | wc -l)으로 다시 센다 — 보고가 쓴 파서·스크립트를 재사용하지 않는다.
3. 인용된 파일:행 표본(10건 이상)이 실제 그 내용인지.
4. 보고된 검사·회귀 명령(harness-check --scope ours · detector-recall · ast 구문검사 등)은 같은 명령을 다시 돌려 high/medium/low·exit 를 비교한다.
5. 조사·연구 산출물의 결론·권고 어휘(채택·기각·권장·추천·해야 한다·낫다) grep — 있으면 위반으로 나열.
6. 확인 못 한 항목은 미검으로 남긴다 — 추측으로 채우지 않는다.
출력: 주장별 [보고값 | 재실측값 | 명령 | 일치·불일치·재현불가] 표 → 정정 목록 → 미검 목록. 응답 본문으로(파일 생성 없음).`
const AUDIT_TAIL = '마지막 고정 줄(반드시 1줄, hq-auditor 노선 정의 원문): `감사: 주장 N건 중 일치 a / 불일치 b / 재현 불가 c / 미검 d — 정정 b건`'
const REFUTE_TAIL = '출력: [번호 | 대상 파일:행 | 무엇이 틀렸나 | 구체 반례/근거 | 심각도(치명=설계 무효/중/경) | 확신도] 발견표. 응답 본문으로(파일 생성 없음). 마지막 고정 줄(반드시 1줄, hq-refuter 노선 정의 원문): `반증: n건(치명 n) / 의심: m건`'
const REFUTER = '너는 반증자다. 통과가 아니라 무너뜨리는 게 목표다 — 단 근거(파일:행·구체 반례) 없는 반증은 "의심"으로 강등한다. 수리 제안·PASS/FAIL·총평 금지.'
// 노선 배치 검사 — 클래스 규칙 1함수. 단계키마다 따로 두던 검사(hq-build BUILDER_KEYS·review/check/audit throw, hq-design sheet/audit throw)는 검사가 없는 키로 우회됐다(4차 반증 #1·#2, hq-understand·hq-audit 의 audit 키 대칭 공백) → 모든 단계키를 같은 표로 검사한다.
// 5차 반증 #1~#8 — 규칙이 Write 보유만 보고 Bash 보유는 어느 규칙도 보지 않아, files 가 없는 단계(audit·check·run)에 Bash 없는 노선(hq-refuter·hq-scribe·hq-verdict)이 통과했고 build 는 Write 만 있는 hq-scribe·hq-verdict 를 통과시켰다(#1~#7). 닫힌 고정 출력을 스스로 선언한 hq-verdict 가 (b) 밖이었다(#8). → 노선 이름 목록(NO_WRITE) 대신 노선별 도구·형식표 ROUTES 와 단계별 요구 STAGE_KEYS 를 대조하는 클래스 규칙으로 고쳤다(키별 예외 없음).
// 6차 반증 #1~#4(치명)·#5·#6(중) — (b) 가 own 을 hq-research·hq-verdict 2개에만 두고 나머지 5개 노선을 "단계 형식의 출처라 own 아님" 으로 일괄 제외해, 그 노선이 자기 홈 단계 밖의 fixed 단계에 놓일 때(refute=hq-auditor · sheet=hq-scribe · audit=hq-scout · check=hq-builder) 두 고정 형식이 충돌해도 침묵했다 — 속성 검사라던 (b) 가 실제로는 이름 목록이었다(#1~#4). files 단계는 Write 유무만 봐 반영 전용 hq-scribe·대조 전용 hq-verdict 가 초안 단계(spec·candidate)를 통과했다(#5·#6). → 7개 노선 전부가 own(닫힌 출력 골격)을 갖는다고 두고, fixed 단계는 자기 고정 형식의 출처 노선을 STAGE_KEYS.<k>.format 으로 선언한다 — 그 노선만 그 단계에 설 수 있고, format 없는 fixed 단계(템플릿 고유 형식)는 hq-* 전부 금지(범용만). files 단계는 write 에 더해 draft(초안·새 산출 생산 관할)를 본다(키별 예외 없음).
// STAGE_KEYS = { <단계키>: { files: [이 단계가 쓰는 산출 파일], scope: [쓰지 않고 작용하는 대상 파일], exec: 프롬프트가 명령 실행(ls·wc -l·grep -c·검사 명령 재실행·py_compile)을 요구, fixed: 고정 보고 형식(마지막 고정 줄·보고 열 순서) 요구, format: fixed 단계의 고정 형식이 어느 노선 정의 원문에서 왔는가('<노선>' — 없으면 템플릿 고유 형식) } } — 각 템플릿이 자기 단계키만 넘긴다. 검사 대상은 기본값을 합친 AT(기본 노선도 검사한다 — T1).
// ROUTES = { <노선>: { write: Write 보유, bash: Bash 보유, draft: 초안·새 산출 생산 관할(반영 전용 hq-scribe · 대조 전용 hq-verdict 는 false), own: 노선 정의가 스스로 선언한 닫힌 출력 골격(7개 노선 전부 — 원문 요약) } } — 값은 각 정의 파일(<root>/.claude/agents/<노선>.md) frontmatter `tools:` 행과 입출력 절 원문에서 옮긴 관측값이다. 정의 파일의 tools 행·출력 골격이 바뀌면 이 표를 같이 고친다.
//   (a) hq-builder — args.builderApproved === true 전제(헤드리스 python 승인 선언 — 선언은 관측이 아니다) + files∪scope 에 .md 금지(관할은 코드뿐 — 자기 정의로 BLOCKED)
//   (b) fixed 단계 — 노선 정의는 저마다 닫힌 출력 골격(own)을 선언하므로, 그 단계의 고정 형식 출처(format)가 그 노선 자신일 때만 통과. format ≠ 노선이면 throw(한 응답이 두 고정 형식을 동시에 낼 수 없다) · format 없음(템플릿 고유 형식 — 결정지·리뷰·check·run)이면 hq-* 전부 throw(범용만)
//   (c) 도구·관할 부족 — files 단계에 write 없는 노선 금지(파일을 만들 수 없다) · files 단계에 draft 없는 노선 금지(반영·대조 전용이라 초안을 내지 않는다) · exec 단계에 bash 없는 노선 금지(명령을 돌릴 수 없다)
//   (d) ROUTES 밖 agentType · 이 템플릿 단계키 밖 args.agentTypes/effort 키 — throw 하지 않고 log 경고(조용한 무시 금지)
//   STAGE_KEYS 자기검사 — format 은 ROUTES 안 이름 · fixed 아닌 단계에 format 금지 · format 노선 자신이 그 단계의 (c) 를 못 넘으면 템플릿 오류로 throw(표↔노선 정의 드리프트를 발사 전에 드러낸다)
function guardAgentTypes(args, STAGE_KEYS) {
  const ROUTES = {
    'hq-research': { write: true, bash: false, draft: true, own: '닫힌 8절 골격(제목·순서 고정)' },
    'hq-scout': { write: false, bash: true, draft: false, own: '보고 순서 고정 — 실측(명령 출력 인용) → 요지 → 미확인 목록' },
    'hq-builder': { write: true, bash: true, draft: true, own: '보고서 골격 8행 열 고정(패치 대상 … 못 한 것)' },
    'hq-scribe': { write: true, bash: false, draft: false, own: 'applied.md — 반영 항목별 한 줄 + SKIPPED 목록(반영 전용, 초안 생산 금지)' },
    'hq-verdict': { write: true, bash: false, draft: false, own: 'verdict.md 표 열 고정(항목|기대|실제|결론|근거|비고) + 합계 줄(대조 전용)' },
    'hq-refuter': { write: false, bash: false, draft: false, own: '닫힌 6절 + 마지막 줄 `반증: n건(치명 n) / 의심: m건`' },
    'hq-auditor': { write: false, bash: true, draft: false, own: '닫힌 6절 + 마지막 줄 `감사: 주장 N건 중 일치 a / 불일치 b / 재현 불가 c / 미검 d — 정정 b건`' },
  }
  const KNOWN = Object.keys(ROUTES)
  if (!STAGE_KEYS || typeof STAGE_KEYS !== 'object' || Array.isArray(STAGE_KEYS) || !Object.keys(STAGE_KEYS).length) throw new Error('STAGE_KEYS 없음 — 템플릿이 { <단계키>: { files, scope, exec, fixed, format } } 를 넘겨야 한다')
  const keys = Object.keys(STAGE_KEYS)
  const strs = (k, f, v) => { if (v === undefined) return []; if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) throw new Error(`STAGE_KEYS.${k}.${f} 는 문자열 배열이어야 한다`); return v }
  // 규칙 (c) — 노선 배치 검사와 STAGE_KEYS 자기검사(format 노선)가 같은 함수를 쓴다.
  const lack = (d, r) => {
    const out = []
    if (d.files.length && !r.write) out.push(`Write 가 없는 노선인데 파일 산출(${d.files.join(' · ')})을 요구한다`)
    if (d.files.length && r.write && !r.draft) out.push(`초안·새 산출 생산 관할이 없는 노선(${r.own})인데 파일 산출(${d.files.join(' · ')})을 요구한다`)
    if (d.exec && !r.bash) out.push('Bash 가 없는 노선인데 프롬프트는 명령 실행(ls·wc -l·grep -c·검사 명령 재실행·py_compile 등)을 요구한다')
    return out
  }
  const S = {}
  keys.forEach((k) => {
    const d = STAGE_KEYS[k] || {}
    const s = { files: strs(k, 'files', d.files), scope: strs(k, 'scope', d.scope), exec: d.exec === true, fixed: d.fixed === true, format: d.format === undefined ? null : d.format }
    if (s.format !== null) {
      if (typeof s.format !== 'string' || !ROUTES[s.format]) throw new Error(`STAGE_KEYS.${k}.format 은 ROUTES 안 노선 이름(${KNOWN.join('·')})이어야 한다: ${JSON.stringify(s.format)}`)
      if (!s.fixed) throw new Error(`STAGE_KEYS.${k}.format = ${s.format} 인데 fixed 가 아니다 — 고정 형식 출처는 fixed 단계에만 적는다`)
      const bad = lack(s, ROUTES[s.format])
      if (bad.length) throw new Error(`STAGE_KEYS.${k}.format = ${s.format} — 그 노선이 ${k} 단계의 요구를 못 채운다(${bad.join(' / ')}) — 템플릿 표↔노선 정의 드리프트`)
    }
    S[k] = s
  })
  for (const src of ['agentTypes', 'effort']) {
    const o = args[src]
    if (o && typeof o === 'object' && !Array.isArray(o)) Object.keys(o).filter((k) => !keys.includes(k)).forEach((k) => log(`경고: args.${src}.${k} — 이 템플릿의 단계키(${keys.join('·')}) 밖이라 무시된다`))
  }
  keys.forEach((k) => { if (AT[k] != null && typeof AT[k] !== 'string') throw new Error(`agentTypes.${k} 는 '<hq-*>' 문자열 또는 null 이어야 한다: ${JSON.stringify(AT[k])}`) })
  const builder = keys.filter((k) => AT[k] === 'hq-builder')
  if (builder.length && args.builderApproved !== true) throw new Error(`agentTypes.${builder.join('/')} = hq-builder — 헤드리스 python 승인(settings permissions.allow 조각 병합)이 전제다. 확인했으면 args.builderApproved: true, 아니면 agentTypes.${builder.join('/')}: null(범용)`)
  keys.forEach((k) => {
    const t = AT[k]
    if (t == null) return
    const d = S[k]
    const r = ROUTES[t]
    if (!r) { log(`경고: agentTypes.${k} = ${t} — 노선 배치 표(${KNOWN.join('·')}) 밖. 정의 파일·도구 보유(Write·Bash)·초안 관할·닫힌 출력 골격 유무는 호출자가 확인한다`); return }
    const md = d.files.concat(d.scope).filter((f) => f.toLowerCase().endsWith('.md'))
    if (t === 'hq-builder' && md.length) throw new Error(`agentTypes.${k} = hq-builder 인데 ${k} 단계의 산출·대상 파일에 .md ${md.length}건(${md.join(' · ')}) — hq-builder 는 .md 를 관할하지 않는다(BLOCKED, 어느 단계키든). agentTypes.${k}: null(범용) 로`)
    if (d.fixed && d.format !== t) throw new Error(`agentTypes.${k} = ${t} — 노선 정의가 스스로 닫힌 출력 골격(${r.own})을 선언하는데 ${k} 단계의 고정 보고 형식은 ${d.format ? d.format + ' 노선 정의 원문' : '이 템플릿 고유 형식(어느 노선 정의에도 없음)'}이다 — 한 응답이 두 고정 형식을 동시에 낼 수 없다. agentTypes.${k}: ${d.format ? "'" + d.format + "'" : 'null(범용)'} 로`)
    const bad = lack(d, r)
    if (bad.length) throw new Error(`agentTypes.${k} = ${t} — ${bad.join(' / ')}. agentTypes.${k}: 기본값 또는 null(범용) 로`)
  })
  return builder
}
// ── 공통 블록 끝 ──────────────────────────────────────────────────────────────────────────

// ── 이 템플릿의 args ──
const SPEC = args.spec
if (!SPEC || !SPEC.question) throw new Error('args.spec 없음 — { question, sources: [절대경로|URL], file: "<스펙 파일명>" }')
fileNameOnly('args.spec.file', SPEC.file)
const SOURCES = Array.isArray(SPEC.sources) ? SPEC.sources : []
const BUILD = args.build
if (!BUILD || !BUILD.task || !Array.isArray(BUILD.targets) || BUILD.targets.length === 0) throw new Error('args.build 없음 — { task, targets: [절대경로], regress: [명령] }')
BUILD.targets.forEach((t, i) => { if (typeof t !== 'string' || !ABS.test(t)) throw new Error(`args.build.targets[${i}] 절대경로 아님: ${JSON.stringify(t)}`) })
const REGRESS = Array.isArray(BUILD.regress) ? BUILD.regress : []
const CHECK = args.check
if (!CHECK || !Array.isArray(CHECK.cmds) || CHECK.cmds.length === 0) throw new Error('args.check 없음 — { cmds: ["python <root>/tools/harness-check.py <경로> --scope ours", ...] }')
const REF = args.refute || {}
const LENSES = Array.isArray(REF.lenses) && REF.lenses.length ? REF.lenses : DEFAULT_LENSES
LENSES.forEach((L, i) => { if (!L || !L.id || !L.prompt) throw new Error(`args.refute.lenses[${i}] 는 { id, prompt }`) })
const REF_TARGETS = Array.isArray(REF.targets) && REF.targets.length ? REF.targets : BUILD.targets
REF_TARGETS.forEach((t, i) => { if (typeof t !== 'string' || !ABS.test(t)) throw new Error(`args.refute.targets[${i}] 절대경로 아님: ${JSON.stringify(t)}`) })
const RUN = args.run
if (!RUN || !RUN.task || !RUN.expect) throw new Error('args.run 없음 — { task, cmds: [명령], expect: "기대 관측" }')
const RUN_CMDS = Array.isArray(RUN.cmds) ? RUN.cmds : []
const REVIEW = args.review
if (!REVIEW) throw new Error('args.review 없음 — { file: "<리뷰 파일명>" }')
fileNameOnly('args.review.file', REVIEW.file)
const CHECKS = args.audit && Array.isArray(args.audit.checks) ? args.audit.checks : []
// 노선 배치 — 단계키 7개 전부를 공통 블록 guardAgentTypes 가 같은 규칙으로 검사한다(키별 검사 없음). files = 이 단계가 쓰는 파일 / scope = 실주행이 작용하는 빌드 대상(쓰지 않음) / exec = 프롬프트가 명령 실행을 요구(build ls·py_compile·회귀 / check 검사 명령 그대로 재실행 / run 명령·exit / audit AUDIT — 5차 반증 #3·#5·#6·#7) / fixed = 고정 보고 형식(마지막 고정 줄·보고 열) / format = 그 고정 형식의 출처 노선(build 보고 열 = hq-builder.md 보고서 골격 원문 · REFUTE_TAIL = hq-refuter · AUDIT_TAIL = hq-auditor). check(`check: …` 줄)·run(RERUN-NEEDED 첫 줄·보고 순서)·review(마지막 다섯 줄)의 형식은 어느 노선 정의에도 없는 템플릿 고유 형식이라 format 없음 → hq-* 전부 금지, 범용만(6차 반증 #4 check=hq-builder 침묵의 클래스 수리 — run=hq-builder 도 같은 이유로 막힌다).
const STAGE_KEYS = {
  spec: { files: [SPEC.file] },
  build: { files: BUILD.targets, exec: true, fixed: true, format: 'hq-builder' },
  check: { exec: true, fixed: true },
  refute: { fixed: true, format: 'hq-refuter' },
  run: { scope: BUILD.targets, exec: true, fixed: true },
  audit: { exec: true, fixed: true, format: 'hq-auditor' },
  review: { files: [REVIEW.file], fixed: true },
}
guardAgentTypes(args, STAGE_KEYS)
const specFile = `${OUT}/${SPEC.file}`
const reviewFile = `${OUT}/${REVIEW.file}`

phase('Spec')
const spec = await agent(`${RULES}\n\n# 설계 질문(스펙 도출)\n${SPEC.question}\n\n# 출처\n${list(SOURCES)}\n\n스펙 항목: 관할 한 문장·경계표 / 입력·출력 계약 / 필수 절차·완료 기준 / 금지 / 검증 과제(실주행에서 잴 것 — 심은 결함·카나리아). 후보 병기, 판정 칸 공란, UNVERIFIED 분리.\n출력 파일: ${specFile}`,
  { label: 'spec:draft', phase: 'Spec', agentType: at('spec'), effort: ef('spec') })
if (spec == null) throw new Error('Spec null — 스펙 없이 빌드하지 않는다')

phase('Build')
const build = await agent(`${RULES}\n\n# 스펙 (${specFile} — 전문은 파일에서 읽어라)\n${spec}\n\n# 빌드 과제\n${BUILD.task}\n\n대상(절대경로):\n${list(BUILD.targets)}\n\n절차: 대상 실존 확인(ls) → 기존 파일은 .bak 뒤 지점 패치(Edit) / 새 파일은 Write → 구문 검사(py_compile 등) → 음성 검증 1회 → 회귀:\n${list(REGRESS)}\n보고: 패치 대상 | .bak 경로 | diff +/- | 구문 검사 | 음성 검증 명령·결과 | 회귀 전후 | 못 한 것(미관측). 관측 안 된 것을 성공으로 적지 마라.`,
  { label: 'build:main', phase: 'Build', agentType: at('build'), effort: ef('build') })
if (build == null) throw new Error('Build null')

phase('Check')
const check = await agent(`${RULES}\n\n아래 검사 명령을 **그대로** 돌리고 출력을 원문 인용하라(요약 금지, 성공/실패 어휘 대신 exit·수치). 빌드 보고가 같은 명령의 결과를 주장했으면 [보고값 | 재실측값] 로 나란히 적어라.\n명령:\n${list(CHECK.cmds)}\n\n# 빌드 보고\n${build}\n\n응답 본문으로(파일 생성 없음). 마지막 줄(반드시 1줄): \`check: 명령 n건 중 exit≠0 m건\``,
  { label: 'check:cmds', phase: 'Check', agentType: at('check'), effort: ef('check') })
if (check == null) throw new Error('Check null')

phase('Refute')
// null 은 통과가 아니다(T2 와 같은 패턴) — 렌즈 응답 null·대상 단위 탈락(stage throw)을 원래 개수와 대조해 "미반증"으로 셈하고 감사·리뷰에 이름으로 넘긴다. 전건 null 이면 실주행으로 가지 않는다.
const refutedRaw = await pipeline(REF_TARGETS, (t, _t, i) =>
  parallel(LENSES.map((L) => () =>
    agent(`${RULES}\n\n${REFUTER}\n\n대상: ${t} (전문 읽어라)\n\n# 근거 자료\n스펙 파일: ${specFile}\n빌드 보고:\n${build}\ncheck 원문:\n${check}\n\n# 렌즈 ${L.id}\n${L.prompt}\n\n${REFUTE_TAIL}`,
      { label: `refute:t${i + 1}:${L.id}`, phase: 'Refute', agentType: at('refute'), effort: ef('refute') })
  )).then((rs) => ({ target: t, refutes: rs.filter(Boolean), missing: LENSES.filter((_, j) => rs[j] == null).map((L) => L.id) }))
)
const refuted = REF_TARGETS.map((t) => (refutedRaw || []).find((x) => x && x.target === t) || { target: t, refutes: [], missing: LENSES.map((L) => L.id) })
const nTotal = REF_TARGETS.length * LENSES.length
const nRef = refuted.reduce((n, r) => n + r.refutes.length, 0)
const UNREF = refuted.filter((r) => r.missing.length).map((r) => `${r.target}(${r.missing.join(',')})`)
log(`반증 ${nRef}/${nTotal} (null ${nTotal - nRef}) — 미반증 대상 ${UNREF.length}/${REF_TARGETS.length}${UNREF.length ? ': ' + UNREF.join(' · ') : ''}`)
if (nRef === 0) throw new Error(`Refute 전건 null(${nTotal}건) — 반증 없이 실주행·감사로 가지 않는다(재발사는 workflow-retry)`)
const UNREF_TEXT = UNREF.length ? UNREF.join(' · ') : '없음'
const REF_TEXT = refuted.map((r) => `## ${r.target} — 렌즈 ${LENSES.length}건 중 응답 ${r.refutes.length}건` + (r.missing.length ? ` / 미반증 ${r.missing.length}건(${r.missing.join(', ')}) — 반증이 수행되지 않은 것이지 "반증 0건"이 아니다` : '') + `\n${r.refutes.join('\n\n---\n\n') || '(응답 없음)'}`).join('\n\n=====\n\n')

phase('Run')
const run = await agent(`${RULES}\n\n# 실주행 과제\n${RUN.task}\n\n명령(순서대로, 출력 원문 인용):\n${list(RUN_CMDS)}\n\n기대 관측: ${RUN.expect}\n\n# 참고 — 스펙 ${specFile} / 빌드 보고\n${build}\n\n보고: 명령별 [명령 | exit | 출력 원문 요지] → 기대 대비 관측(같다 / 다르다 — 무엇이 / 재현 불가 — 이유) → 산출 파일 절대경로 → 미관측. 헤드리스 승인 거부면 첫 줄에 RERUN-NEEDED.`,
  { label: 'run:live', phase: 'Run', agentType: at('run'), effort: ef('run') })
if (run == null) throw new Error('Run null')

phase('Audit')
const audit = await agent(`${RULES}\n\n${AUDIT}\n추가 확인(호출자 지정):\n${list(CHECKS)}\n\n# 감사 대상\n스펙 파일: ${specFile} / 빌드 대상: ${BUILD.targets.join(' · ')} / 리뷰 파일(아직 없음): ${reviewFile}\n\n## 빌드 보고\n${build}\n\n## check 원문\n${check}\n\n## 실주행 보고\n${run}\n\n## 반증 — 응답 ${nRef}/${nTotal}건, 미반증 ${UNREF.length}건(${UNREF_TEXT}) — 미반증은 "반증 0건"이 아니다, 통과로 적지 마라\n${REF_TEXT}\n\n${AUDIT_TAIL}`,
  { label: 'audit:build', phase: 'Audit', agentType: at('audit'), effort: ef('audit') })
if (audit == null) throw new Error('Audit null — 감사 없이 리뷰로 가지 않는다')

phase('Review')
const review = await agent(`${RULES}\n\n리뷰 패키지 1장을 ${reviewFile} 로 써라 — 사용자가 배치 여부를 결정하는 자료다. 구성: 스펙 요지·파일 / 빌드 결과(대상·.bak·diff 줄 수) / check 원문 수치 / 반증 잔여(치명 n건 — 무엇) / 미반증(렌즈 응답 없음 — 치명 0 으로 세지 않는다): ${UNREF_TEXT} / 실주행 관측 vs 기대 / 감사 정정 목록 / 사용자 액션 후보(배치 명령 A/B·되돌리기 명령) — 권고·추천 어휘 금지, "실측이 가리키는 쪽"으로 표시.\n\n# 자료\n## 스펙\n${spec}\n## 빌드\n${build}\n## check\n${check}\n## 반증\n${REF_TEXT}\n## 실주행\n${run}\n## 감사\n${audit}\n\n마지막 다섯 줄(반드시): \`치명 반증: n건\` / \`미반증: ${UNREF.length}건\` / \`감사 불일치: m건\` / \`check exit≠0: k건\` / \`다음 1수 후보: A | B\``,
  { label: 'review:pkg', phase: 'Review', agentType: at('review'), effort: ef('review') })
if (review == null) throw new Error('Review null')

return {
  template: 'hq-build', stamp: STAMP, out: OUT,
  files: [specFile, reviewFile], targets: BUILD.targets,
  refutes: `${nRef}/${nTotal}`, unrefuted: UNREF,
  refuteTails: refuted.map((r) => ({ target: r.target, tails: r.refutes.map((x) => tail(x, 1)) })),
  checkTail: tail(check, 1), runTail: tail(run, 1), audit, auditTail: tail(audit, 1), reviewTail: tail(review, 5),
}
