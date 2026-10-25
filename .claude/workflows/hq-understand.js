export const meta = {
  name: 'hq-understand',
  description: '파악 라운드 — hq-scout N명 존재·개수·인용 실측 → hq-research 설계 질문별 초안 파일 → hq-auditor 재실측. 설계·빌드는 하지 않는다',
  whenToUse: '설계 전 현황 전수 파악. args: root·out·stamp·scouts[{id,task}]·research[{id,question,file}] (+audit.checks[]·agentTypes·effort·rules)',
  phases: [
    { title: 'Scout', detail: 'hq-scout × args.scouts — 응답 본문(파일 없음)' },
    { title: 'Research', detail: 'hq-research × args.research — out/ 아래 파일 1개씩' },
    { title: 'Audit', detail: 'hq-auditor 1명 — 스카우트·연구 전건 재실측, 고정 마지막 줄. 노선 배치는 발사 전 guardAgentTypes(공통 블록)가 검사' },
  ],
}
// 단계별 노선·effort 기본값 — args.agentTypes / args.effort 로 키 단위 덮어쓰기(null = 범용 / 상속).
const DEFAULT_AGENT_TYPES = { scout: 'hq-scout', research: 'hq-research', audit: 'hq-auditor' }
const DEFAULT_EFFORT = { scout: null, research: 'high', audit: 'high' }

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
const SCOUTS = needList('scouts', ['id', 'task'])                  // hq-scout 조사 항목 — task 에 절대경로·질문
const RESEARCH = needList('research', ['id', 'question', 'file'])  // hq-research 설계 질문 — file 은 out 아래 파일명
RESEARCH.forEach((r, i) => fileNameOnly(`args.research[${i}].file`, r.file))
const CHECKS = args.audit && Array.isArray(args.audit.checks) ? args.audit.checks : []
// 노선 배치 — 단계키 3개 전부를 공통 블록 guardAgentTypes 가 같은 규칙으로 검사한다(키별 검사 없음 — 4차 리뷰 §9.4 의 audit 키 hq-research 대칭 공백을 여기서 닫는다). files = 이 단계가 쓰는 파일 / exec = 프롬프트가 명령 실행을 요구(scout "실측(명령 출력 인용)" · audit AUDIT 의 ls·wc -l·grep -c·재실행 — 5차 반증 #1) / fixed = 고정 보고 형식(보고 순서·마지막 고정 줄) / format = 그 고정 형식의 출처 노선(scout 보고 순서 = hq-scout.md 입출력 절 원문 · AUDIT_TAIL = hq-auditor 원문 — 6차 반증 #3 audit=hq-scout 침묵의 클래스 수리: 출처 노선만 그 단계에 선다).
const STAGE_KEYS = {
  scout: { exec: true, fixed: true, format: 'hq-scout' },
  research: { files: RESEARCH.map((r) => r.file) },
  audit: { exec: true, fixed: true, format: 'hq-auditor' },
}
guardAgentTypes(args, STAGE_KEYS)

phase('Scout')
// 배리어가 맞는 자리 — Research 는 스카우트 전건을 한 번에 인용해야 한다.
const scouted = (await parallel(SCOUTS.map((s) => () =>
  agent(`${RULES}\n\n# 조사 ${s.id}\n${s.task}\n\n보고 순서: 실측(명령 출력 인용) → 요지 → 미확인 목록. 응답 본문으로(파일 만들지 마라). 결론·권고 금지.`,
    { label: `scout:${s.id}`, phase: 'Scout', agentType: at('scout'), effort: ef('scout') })
    .then((r) => (r == null ? null : { id: s.id, text: r }))
))).filter(Boolean)
const MISS_S = SCOUTS.filter((s) => !scouted.some((x) => x.id === s.id)).map((s) => s.id)   // null 은 미산출 — 이름으로 남긴다(통과 아님)
log(`Scout ${scouted.length}/${SCOUTS.length} (null ${MISS_S.length}${MISS_S.length ? ': ' + MISS_S.join(' · ') : ''})`)
if (scouted.length === 0) throw new Error('Scout 전건 실패 — 인벤토리 없이 연구로 넘어가지 않는다')
const SCOUT_TEXT = scouted.map((s) => `## scout:${s.id}\n${s.text}`).join('\n\n=====\n\n')

phase('Research')
const researched = (await parallel(RESEARCH.map((r) => () =>
  agent(`${RULES}\n\n# 인벤토리 — hq-scout ${scouted.length}/${SCOUTS.length}건 (개수·존재는 여기서 인용)\n${SCOUT_TEXT}\n\n# 설계 질문 ${r.id}\n${r.question}\n\n출처: 위 인벤토리 + 질문에 적힌 절대경로·URL. 후보 병기, 판정 칸 공란, UNVERIFIED 분리, 개수는 인벤토리 인용.\n출력 파일: ${OUT}/${r.file}`,
    { label: `research:${r.id}`, phase: 'Research', agentType: at('research'), effort: ef('research') })
    .then((x) => (x == null ? null : { id: r.id, file: `${OUT}/${r.file}`, text: x }))
))).filter(Boolean)
const MISS_R = RESEARCH.filter((r) => !researched.some((x) => x.id === r.id)).map((r) => r.id)   // null 은 미산출 — 이름으로 남긴다(통과 아님)
log(`Research ${researched.length}/${RESEARCH.length} (null ${MISS_R.length}${MISS_R.length ? ': ' + MISS_R.join(' · ') : ''})`)

phase('Audit')
const audit = await agent(`${RULES}\n\n${AUDIT}\n추가 확인(호출자 지정):\n${list(CHECKS)}\n\n# 감사 대상\n연구 산출 파일(실존부터 ls): ${researched.map((r) => r.file).join(' · ') || '(없음)'}\n스카우트 ${scouted.length}/${SCOUTS.length}(미산출: ${MISS_S.join(' · ') || '없음'}) · 연구 ${researched.length}/${RESEARCH.length}(미산출: ${MISS_R.join(' · ') || '없음'}) — null 건은 미산출이다, 성공으로 적지 마라.\n\n## 스카우트 보고\n${SCOUT_TEXT}\n\n## 연구 응답\n${researched.map((r) => `### research:${r.id} → ${r.file}\n${r.text}`).join('\n\n') || '(없음)'}\n\n${AUDIT_TAIL}`,
  { label: 'audit:understand', phase: 'Audit', agentType: at('audit'), effort: ef('audit') })
if (audit == null) throw new Error('Audit null — 감사 없이 종료하지 않는다(재발사는 workflow-retry)')

return {
  template: 'hq-understand', stamp: STAMP, out: OUT,
  files: researched.map((r) => r.file),
  scouts: `${scouted.length}/${SCOUTS.length}`, research: `${researched.length}/${RESEARCH.length}`, missing: { scouts: MISS_S, research: MISS_R },
  audit, auditTail: tail(audit, 1),
}
