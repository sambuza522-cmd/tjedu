---
name: workflow-launch
description: 2단계 이상·에이전트 2명 이상을 한 번에 돌릴 때 저장 템플릿 4종(hq-understand 파악·hq-design 설계·hq-build 제작·hq-audit 감사)이 맞으면 Workflow 를 name+args 로 발사하고, 안 맞을 때만 Workflow 스크립트(meta·RULES·phase·노선 배치·마지막 hq-auditor 재실측)를 같은 골격으로 짜서 발사하는 절차. 트리거 예 — "워크플로 짜서 돌려" · "N건 병렬로 조사하고 감사까지" · "스크립트로 한 번에 해". 단건 존재·개수 조회(hq-scout 직접 호출)·즉석 대조·파일 1개 지점 수정에는 쓰지 않는다. 이미 발사한 런의 재발사·이어하기·비교용 N회 반복은 workflow-retry 로 보낸다 — 이 스킬로 재발사하지 않는다.
---

# workflow-launch

지휘부가 Workflow 도구를 발사하기 전에 따르는 절차. 스크립트가 곧 스펙이다 — 조사·판정·수리는 스크립트 안의 노선(hq-*)이 한다.

`<루트>` = 프로젝트 루트 절대경로(이 사본: `D:/manhattan/fat-man/_apps/tjedu` · 원본: harness `D:/manhattan/fat-man/harness`). 스크립트·프롬프트·args 에 적을 때 절대경로로 치환한다. 상대경로 금지.

## 저장 템플릿 호출 — 4종 중 맞는 것이 있으면 골격을 새로 짜지 않는다

| 일의 모양 | `name` | phases | 기본 노선(`agentTypes.<단계키>: null` = 범용) |
|---|---|---|---|
| 현황 전수 파악 — 존재·개수 실측 + 설계 질문 초안 | `hq-understand` | Scout → Research → Audit | hq-scout / hq-research / hq-auditor |
| 후보안 N건 → 렌즈 반증 → 결정지 1장 | `hq-design` | Candidates → Refute → Audit → Decision Sheet | hq-research / hq-refuter / hq-auditor / 범용 |
| 설계가 끝난 자산 제작("하네스 만들어"·에이전트 정의·스킬·도구 코드) | `hq-build` | Spec → Build → Check → Refute → Run → Audit → Review | hq-research / 범용 / 범용 / hq-refuter / 범용 / hq-auditor / 범용 |
| 상류 보고서 재실측만 | `hq-audit` | Audit | hq-auditor |

1. 위치·이름 실측: `ls <루트>/.claude/workflows/*.js` 와 각 파일의 `meta.name` — 그 값이 `name` 이다(워크플로는 프로젝트판 > 사용자판). 목록에 없으면 `name` 으로 발사하지 않는다(이름이 안 보이면 `/reload-skills` — REVIEW 기재, 이 세션 미확인 — 또는 `scriptPath` 에 그 `.js` 절대경로).
2. 호출 형식 — 셋 중 하나만. `name` 은 저장 템플릿(공식 참조 workflow-authoring: `workflow(nameOrRef)` 의 이름과 "same registry as {name}"), `scriptPath` 는 파일 경로 직접 지정(세션 디렉터리 스크립트·재발사 — resumeFromRunId 는 workflow-retry 관할), `script` 는 즉석 골격 인라인.
   - `Workflow({ name: "hq-audit", args: { root: "<루트>", out: "<루트>/_workspace/<주제>-<YYYY-MM-DD>", stamp: "<YYYY-MM-DD HH:MM>", reports: [{ id: "<id>", path: "<보고서 절대경로>", checks: ["<명령>"] }] } })`
3. args 계약 확인: 이 스킬 디렉터리의 `references/template-args.md` 표(템플릿별 필수 키·형식·단계키·throw 조건·예시)에서 그 템플릿 줄만 본다. 코드(`<루트>/.claude/workflows/<name>.js` 의 args 검사 줄)가 정본이다.
4. 발사 전 검증 — 전부 통과해야 발사한다.
   - `root`·`out` 절대경로, `stamp` 는 `date '+%Y-%m-%d %H:%M'` 출력 그대로.
   - `file` 류는 파일명만(out 아래 생성), 배열은 JSON 배열(문자열로 감싸면 스크립트가 throw), 필수 배열은 1건 이상.
   - `agentTypes`·`effort` 의 키가 그 템플릿의 단계키 집합 안에 있다 — 단계키 밖 키는 스크립트가 `log` 경고 뒤 무시한다.
   - 노선 배치는 4종 공통 `guardAgentTypes` 규칙 표(`references/template-args.md` 「guardAgentTypes 규칙 표」)로 대조한다 — 어느 단계키든 같다: (a) `'hq-builder'` 는 `builderApproved: true`(헤드리스 python 승인 = settings permissions.allow 조각 병합을 확인했다는 선언) + 그 단계의 산출·대상 파일에 `.md` 없음 (b) hq-* 노선 7종은 저마다 닫힌 출력 골격을 정의에 선언하므로, 고정 보고 형식 단계(`fixed`)에는 그 형식의 출처 노선(`format` — scout=`'hq-scout'` · build=`'hq-builder'` · refute=`'hq-refuter'` · audit=`'hq-auditor'`)만 설 수 있고, 형식이 템플릿 고유인 단계(sheet·check·run·review)에는 hq-* 전부 금지(범용만) (c) Write 없는 노선(`'hq-scout'`·`'hq-auditor'`·`'hq-refuter'`)과 초안 생산 관할이 없는 노선(`'hq-scribe'` 반영 전용 · `'hq-verdict'` 대조 전용)은 파일 산출 단계(research·candidate·spec·build·review·sheet) 금지 + Bash 없는 노선(`'hq-research'`·`'hq-scribe'`·`'hq-verdict'`·`'hq-refuter'`)은 명령 실행 단계(scout·build·check·run·audit) 금지 (d) 표 밖 노선은 `log` 경고. 어긋나면 스크립트가 발사 전 throw. 기본값은 전부 통과한다.
5. 발사 결과의 `runId`·스크립트 경로·transcriptDir 을 응답에 적는다(workflow-retry 입력). 저장 템플릿은 Audit 뒤에 결정지·리뷰 단계가 온다(Audit 결과를 입력으로 받는 산출 단계) — 아래 2단계 표의 "마지막 phase = hq-auditor" 는 즉석 골격 기준이다.

## 절차 — 즉석 골격(위 템플릿이 안 맞을 때)

### 1. 작업 목록 확정 — hq-scout (발사 전)
- 대상 파일·건수·범위가 불명하면 직접 호출 1회: `Agent(subagent_type="hq-scout", prompt="<절대경로> 에서 <무엇> 존재·개수·목록 보고")`.
- 받은 목록을 `args.items` 로 넣는다(저장 템플릿이면 그 템플릿의 배열 키 — `scouts`·`candidates`·`reports` 등, 계약표 참조). 스크립트 안에서 "먼저 찾아라"로 시작하지 않는다.
- 목록 0건이면 발사하지 않는다.

### 2. 노선 배치 — phase 마다 agentType 하나
| 일의 종류 | agentType | 산출 |
|---|---|---|
| 설계 질문 1개, 다출처 비교 | hq-research | `_workspace` 아래 초안 파일 1개(판정 열 공란) |
| 존재·개수·인용 | hq-scout | 응답 본문 |
| 코드(.py·.json·tools/**) 결함 1건 수리 | hq-builder | 8열 보고 |
| .md 문서 반영 | hq-scribe | applied.md |
| 산출물↔기대값 대조 | hq-verdict | verdict.md |
| 주장·설계 1건 반증 | hq-refuter | 발견표 + `반증: n건(치명 n) / 의심: m건` |
| 상류 보고 재실측 | hq-auditor | `[보고값|재실측값|명령|판정]` 표 |

- 마지막 phase 는 항상 hq-auditor 재실측이다. 앞 phase 응답 전문을 프롬프트에 넣는다.
- 한 phase 에 두 노선의 일을 섞지 않는다. 겹치면 표의 관할대로 phase 를 나눈다.
- `agentType` 이 안 잡히면(journal 의 해당 agent 에 agent_type 없음) 프롬프트 첫 줄에 "`<루트>/.claude/agents/<hq-*>.md` 노선 정의대로" 를 적어 후퇴한다.
- 항목별로 단계가 이어지면 `pipeline(ITEMS, s1, s2)`. 전 항목 결과가 함께 필요할 때만 `parallel`.

### 3. 스크립트 작성 — 아래 골격 그대로
- 바꾸는 곳은 `<...>` 자리와 phase 수뿐이다. RULES 블록·Audit phase·args 수신부는 그대로 둔다.
- `meta.name` = 케밥 `<주제>-<동사>` (예: `hq-refuter-build`). 재발사 키가 된다.
- `Date.now()`·`Math.random()`·`new Date()` 금지. 시각은 `args.stamp`.

### 4. 발사
- `Workflow({ script: <골격 원문>, args: { root, out, items, stamp } })` — 인라인 1회. 파일로 먼저 Write 하지 않는다(도구가 세션 디렉터리에 저장하고 경로를 돌려준다). 저장 템플릿은 `Workflow({ name, args })` — 「저장 템플릿 호출」 절.
- 도구 결과의 `runId`·스크립트 경로·transcriptDir 을 응답에 적는다 — workflow-retry 의 입력이다.

### 5. 완료 기준
- journal.jsonl 에 phase 전부의 반환값이 있다. null 건수는 `log()` 줄에 찍혀 있다.
- Audit 응답 마지막 줄이 `재실측 n건 중 불일치 m건` 형식이다.
- 산출 파일이 전부 `<루트>/_workspace/<주제>-<YYYY-MM-DD>/` 아래 절대경로로 나열됐다.
- 불일치 m > 0 이면 종료가 아니다 — 정정 목록을 들고 workflow-retry 로 간다.

## 스펙 골격 — 스크립트 원문

```js
export const meta = {
  name: '<주제>-<동사>',
  description: '<한 줄 — 무엇을 몇 건, 마지막에 무엇으로 감사>',
  phases: [
    { title: 'Do',    detail: '<agentType> <n>건 병렬' },
    { title: 'Audit', detail: 'hq-auditor 재실측' },
  ],
}

// 경로·목록·시각은 전부 args 로 받는다 — 상수 하드코딩 금지, Date.now() 금지.
const ROOT  = args.root    // '<루트 절대경로>'
const OUT   = args.out     // `${ROOT}/_workspace/<주제>-<YYYY-MM-DD>`
const ITEMS = args.items   // [{ id, path, ... }] — 1단계에서 받은 목록
const STAMP = args.stamp   // 'YYYY-MM-DD HH:MM' — 지휘부가 넣는다

const RULES = `# 규칙
- 절대경로만. settings*.json·레일(transfer-gate.py·hq-gate.json·install-global.py·agent-registry.json) 수정 금지.
- 사용자 홈 .claude/agents|skills|workflows 직접 쓰기 금지 — 전역 배치는 사용자 리뷰 뒤.
- .bak 필수. 관측 안 된 것을 성공으로 적지 마라. 개수는 명령 출력으로.
- 산출 파일은 ${OUT}/ 아래 절대경로로 보고.`

phase('Do')
const done = (await parallel(ITEMS.map((it) => () =>
  agent(
    `${RULES}

# 과제 — ${it.id}
<노선 정의가 요구하는 입력: 대상 절대경로 / 범위 / 기대 산출 파일 절대경로>`,
    { label: `do:${it.id}`, phase: 'Do', agentType: '<hq-*>' }
  ).then((r) => (r == null ? null : { id: it.id, r }))
))).filter(Boolean)
log(`완료 ${done.length}/${ITEMS.length} (null ${ITEMS.length - done.length})`)
if (done.length === 0) throw new Error('Do 단계 전건 실패')

phase('Audit')
const audit = await agent(
  `${RULES}

상류 보고를 재실측하라. 저장소 루트 ${ROOT}. 보고서:
${done.map((d) => `## ${d.id}\n${d.r}`).join('\n\n')}

마지막 줄: 재실측 n건 중 불일치 m건`,
  { label: 'audit', phase: 'Audit', agentType: 'hq-auditor', effort: 'high' }
)
return { stamp: STAMP, out: OUT, done: done.length, audit }
```

## 발사 호출 골격

```
Workflow({
  script: "<위 원문>",
  args: {
    root:  "<루트 절대경로>",
    out:   "<루트 절대경로>/_workspace/<주제>-<YYYY-MM-DD>",
    items: [{ "id": "<항목1>", "path": "<절대경로>" }],
    stamp: "<YYYY-MM-DD HH:MM>"
  }
})
```
