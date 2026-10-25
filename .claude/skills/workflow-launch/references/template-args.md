# 저장 템플릿 4종 — args 계약표

정본은 코드다: `<루트>/.claude/workflows/<name>.js` 의 args 검사 줄(`need`·`needList`·`fileNameOnly`·각 템플릿의 throw). 이 표는 그 요약이며, 표와 코드가 다르면 코드가 맞다. `<루트>` = 프로젝트 루트 절대경로. 스테이징 사본 `<루트>/tools/hooks/global-workflows/` 는 정본과 cmp 동일을 유지한다.

## 공통 — 4종 동일 블록

| 키 | 필수 | 형식 | 어긋나면 |
|---|---|---|---|
| args 자체 | 필수 | JSON 객체 — 문자열·배열로 감싸지 않는다 | throw `args 없음` |
| `root` | 필수 | 절대경로(`C:/...` 또는 `/...`) | throw |
| `out` | 필수 | 절대경로 `<root>/_workspace/<주제>-<YYYY-MM-DD>` | throw |
| `stamp` | 필수 | 문자열 `'YYYY-MM-DD HH:MM'` — `date '+%Y-%m-%d %H:%M'` 출력 | 부재만 throw — 형식은 호출자 책임 |
| `rules` | 선택 | 문자열 — RULES 블록 끝에 덧붙일 추가 규칙 | 문자열이 아니면 무시 |
| `agentTypes` | 선택 | `{ <단계키>: '<hq-*>' \| null }` — null = 범용 워크플로 서브에이전트 | 노선 배치는 아래 「guardAgentTypes 규칙 표」로 throw / 단계키 밖 키는 `log` 경고 뒤 무시 |
| `effort` | 선택 | `{ <단계키>: 'low'\|'medium'\|'high'\|'xhigh'\|'max' \| null }` — null = 세션 상속 | 위와 같음 |
| `audit.checks` | 선택 | `[문자열]` — 감사에 추가할 확인 명령 | 배열이 아니면 무시 |
| `file` 류 전부 | — | 파일명만 — `/`·`\`·절대경로 금지, `out` 아래에 생긴다 | throw |

## guardAgentTypes 규칙 표 — 4종 공통, 단계키 전부에 같은 규칙(키별 검사 없음)

정본은 공통 블록의 `guardAgentTypes(args, STAGE_KEYS)` 1함수다. 각 템플릿은 자기 단계키의 STAGE_KEYS(`files` = 그 단계가 쓰는 산출 파일 / `scope` = 쓰지 않고 작용하는 대상 파일 / `exec` = 프롬프트가 명령 실행(ls·wc -l·grep -c·검사 명령 재실행·py_compile)을 요구 / `fixed` = 고정 보고 형식 요구 / `format` = 그 고정 형식이 어느 노선 정의 원문에서 왔는가 — 없으면 템플릿 고유 형식)만 넘기고, 함수는 기본값을 합친 노선(기본 노선도 검사)을 아래 노선 도구표(ROUTES)와 대조해 규칙을 단계키마다 적용한다. 어느 단계키에 두든 같다. 노선 이름 목록으로 검사하지 않는다 — 도구 보유·초안 관할·고정 형식 출처로 검사한다(5차 반증 #1~#8 — Write 만 보고 Bash 를 안 봐서 audit·check·run·build 에 Bash 없는 노선이 통과하던 결함 / 6차 반증 #1~#6 — own 을 2개 노선에만 두고 5개를 "단계 형식의 출처" 로 일괄 제외해 홈 단계 밖 fixed 단계(refute=hq-auditor · sheet=hq-scribe · audit=hq-scout · check=hq-builder)에서 침묵하고, files 단계에 반영·대조 전용 노선(spec=hq-verdict · candidate=hq-scribe)이 통과하던 결함 — 두 번 다 클래스 수리).

노선 도구표 ROUTES(코드 원문 요약 — 값의 출처는 `<루트>/.claude/agents/<노선>.md` frontmatter `tools:` 행과 입출력 절, 표와 코드가 다르면 코드가 맞다). 7개 노선 전부가 own(스스로 선언한 닫힌 출력 골격)을 갖는다 — (b) 는 own 유무가 아니라 단계의 `format` 과 노선 이름의 일치로 본다:

| 노선 | Write | Bash | draft(초안·새 산출 생산 관할) | own(스스로 선언한 닫힌 출력 골격) |
|---|---|---|---|---|
| `hq-research` | ✓ | — | ✓ | 닫힌 8절 골격(제목·순서 고정) |
| `hq-scout` | — | ✓ | — | 보고 순서 고정 — 실측(명령 출력 인용) → 요지 → 미확인 목록 |
| `hq-builder` | ✓ | ✓ | ✓(코드만 — (a)) | 보고서 골격 8행 열 고정(패치 대상 … 못 한 것) |
| `hq-scribe` | ✓ | — | —(반영 전용, 초안 생산 금지) | applied.md — 반영 항목별 한 줄 + SKIPPED 목록 |
| `hq-verdict` | ✓ | — | —(대조 전용) | verdict.md 표 열 고정(항목\|기대\|실제\|결론\|근거\|비고) + 합계 줄 |
| `hq-refuter` | — | — | — | 닫힌 6절 + 마지막 줄 `반증: n건(치명 n) / 의심: m건` |
| `hq-auditor` | — | ✓ | — | 닫힌 6절 + 마지막 줄 `감사: 주장 N건 중 일치 a / 불일치 b / 재현 불가 c / 미검 d — 정정 b건` |

| 규칙 | 노선 | 조건 | 결과 |
|---|---|---|---|
| (a) | `hq-builder` | 어느 단계키든 지정 | `builderApproved !== true` 면 throw(헤드리스 python 승인 = settings permissions.allow 조각 병합을 확인했다는 선언 — 선언은 관측이 아니며, 거부되면 Run 보고 첫 줄 `RERUN-NEEDED`) |
| (a) | `hq-builder` | 그 단계의 `files` ∪ `scope` 에 `.md` | throw — hq-builder 관할은 코드뿐(자기 정의로 BLOCKED) |
| (b) | hq-* 전부(own 은 7개 노선 모두에 있다) | 그 단계가 `fixed` 이고 그 단계의 `format`(고정 형식 출처 노선)이 그 노선이 아니다 | throw — 한 응답이 두 고정 형식을 동시에 낼 수 없다. `format` 없는 fixed 단계(sheet·check·run·review — 템플릿 고유 형식)는 hq-* 전부 throw, 범용만 |
| (c) | Write 없는 노선 — `hq-scout` · `hq-auditor` · `hq-refuter` | 그 단계에 `files` 있음 | throw — 파일을 만들 수 없다 |
| (c) | draft 없는 노선 — `hq-scribe`(반영 전용) · `hq-verdict`(대조 전용) | 그 단계에 `files` 있음 | throw — 초안·새 산출을 내지 않는 관할이다 |
| (c) | Bash 없는 노선 — `hq-research` · `hq-scribe` · `hq-verdict` · `hq-refuter` | 그 단계가 `exec`(명령 실행 요구) | throw — 명령을 돌릴 수 없다 |
| (d) | ROUTES(hq-research·hq-scout·hq-builder·hq-scribe·hq-verdict·hq-refuter·hq-auditor) 밖 값 | 어느 단계키든 | throw 아님 — `log` 경고(정의 파일·도구 보유·초안 관할·닫힌 골격 유무는 호출자 확인) |
| (d) | `agentTypes`·`effort` 의 키가 그 템플릿 단계키 밖 | — | throw 아님 — `log` 경고 뒤 무시 |
| 자기검사 | STAGE_KEYS(템플릿 코드) | `format` 이 ROUTES 밖 이름 · `fixed` 아닌 단계에 `format` · `format` 노선 자신이 그 단계의 (c) 를 못 넘음 | throw — 템플릿 오류(표↔노선 정의 드리프트를 발사 전에 드러낸다) |
| — | `null` | 어느 단계키든 | 범용 워크플로 서브에이전트 — 규칙 적용 없음 |

템플릿별 STAGE_KEYS(코드 원문 요약 — 표와 코드가 다르면 코드가 맞다). `format` 이 있는 단계는 그 노선만, `format` 없는 fixed 단계는 범용만 설 수 있다:

| 템플릿 | 단계키 | `files` | `scope` | `exec` | `fixed` | `format` |
|---|---|---|---|---|---|---|
| hq-understand | `scout` | — | — | ✓(실측 = 명령 출력 인용) | ✓(보고 순서) | `hq-scout` |
| | `research` | `research[].file` | — | — | — | — |
| | `audit` | — | — | ✓(AUDIT: ls·wc -l·grep -c·재실행) | ✓(AUDIT_TAIL) | `hq-auditor` |
| hq-design | `candidate` | `candidates[].file` | — | — | — | — |
| | `refute` | — | — | — | ✓(REFUTE_TAIL) | `hq-refuter` |
| | `audit` | — | — | ✓(AUDIT) | ✓(AUDIT_TAIL) | `hq-auditor` |
| | `sheet` | `sheet.file` | — | — | ✓(1-b 절·마지막 줄) | —(템플릿 고유 → 범용만) |
| hq-build | `spec` | `spec.file` | — | — | — | — |
| | `build` | `build.targets` | — | ✓(ls·py_compile·회귀) | ✓(7항 보고 — 패치 대상 \| .bak 경로 \| diff +/- \| 구문 검사 \| 음성 검증 명령·결과 \| 회귀 전후 \| 못 한 것) | `hq-builder` |
| | `check` | — | — | ✓(검사 명령 그대로 재실행) | ✓(마지막 줄 `check: …`) | —(템플릿 고유 → 범용만) |
| | `refute` | — | — | — | ✓(REFUTE_TAIL) | `hq-refuter` |
| | `run` | — | `build.targets` | ✓(명령·exit 보고) | ✓(RERUN-NEEDED 첫 줄·보고 순서) | —(템플릿 고유 → 범용만) |
| | `audit` | — | — | ✓(AUDIT) | ✓(AUDIT_TAIL) | `hq-auditor` |
| | `review` | `review.file` | — | — | ✓(마지막 다섯 줄) | —(템플릿 고유 → 범용만) |
| hq-audit | `audit` | — | — | ✓(AUDIT) | ✓(AUDIT_TAIL) | `hq-auditor` |

기본값(각 템플릿 절의 "기본 …")은 전부 통과한다. 예 — hq-build `agentTypes.spec: 'hq-builder'` 는 `spec.file`(.md)로 (a) throw, `agentTypes.build: 'hq-builder'` + `build.targets` 에 `.md` 는 (a) throw, hq-understand `agentTypes.audit: 'hq-research'|'hq-scout'` 는 (b) throw(format hq-auditor — 6차 #3), hq-design `agentTypes.refute: 'hq-auditor'` 는 (b) throw(format hq-refuter — 6차 #1), hq-design `agentTypes.sheet: 'hq-scribe'` 와 hq-build `agentTypes.check|run: 'hq-builder'`(승인 있어도)·`agentTypes.check: 'hq-auditor'` 는 템플릿 고유 형식으로 (b) throw(6차 #2·#4), hq-build `agentTypes.spec: 'hq-verdict'` 와 hq-design `agentTypes.candidate: 'hq-scribe'` 는 draft 로 (c) throw(6차 #5·#6), hq-design `agentTypes.candidate: 'hq-scout'` 는 Write 로 (c) throw, hq-audit `agentTypes.audit: 'hq-refuter'` 는 (b) throw(exec 의 (c) 도 해당).

## hq-understand — Scout → Research → Audit

단계키 `scout` · `research` · `audit` (기본 hq-scout / hq-research / hq-auditor, effort null / high / high)

| 키 | 필수 | 형식 |
|---|---|---|
| `scouts` | 필수 ≥1 | `[{ id, task }]` — task 에 절대경로·질문 |
| `research` | 필수 ≥1 | `[{ id, question, file }]` — file 은 파일명만 |

throw: 노선 배치(규칙 표 — `agentTypes.scout` 는 `'hq-scout'` 외 hq-* 전부 (b) · `agentTypes.audit` 는 `'hq-auditor'` 외 hq-* 전부 (b) · `agentTypes.research = 'hq-scout|hq-auditor|hq-refuter'` 는 Write 로 (c) · `'hq-scribe|hq-verdict'` 는 draft 로 (c) · `'hq-builder'` 는 `.md` 로 (a)) · Scout 전건 null · Audit null. Research 일부 null 은 미산출로 log 와 감사 프롬프트에 id 로 남는다(통과 아님).

```
Workflow({ name: "hq-understand", args: { root: "<루트>", out: "<루트>/_workspace/<주제>-<YYYY-MM-DD>", stamp: "<YYYY-MM-DD HH:MM>",
  scouts: [{ id: "skills", task: "<루트>/.claude/skills 아래 SKILL.md 개수·이름·wc -l" }],
  research: [{ id: "q1", question: "<설계 질문 — 절대경로·출처 포함>", file: "q1.md" }] } })
```

## hq-design — Candidates → Refute → Audit → Decision Sheet

단계키 `candidate` · `refute` · `audit` · `sheet` (기본 hq-research / hq-refuter / hq-auditor / **null 범용**, effort 전부 high)

| 키 | 필수 | 형식 |
|---|---|---|
| `inputs` | 필수 | 문자열 — 입력 자료 절대경로 목록 블록 |
| `candidates` | 필수 ≥1 | `[{ id, question, file }]` |
| `sheet` | 필수 | `{ file, decisions: [문자열 ≥1] }` |
| `directives` | 선택 | 문자열 — 설계 제약(위반 금지) |
| `lenses` | 선택 | `[{ id, prompt }]` — 주면 기본 3종(facts / legacy / blunder)을 통째로 대체 |
| `minCandidates` | 선택 | 정수(기본 1) — 후보안 응답 수가 이보다 적으면 throw |

throw: 노선 배치(규칙 표 — `agentTypes.refute` 는 `'hq-refuter'` 외 hq-* 전부 (b) · `agentTypes.audit` 는 `'hq-auditor'` 외 hq-* 전부 (b) · `agentTypes.sheet` 는 hq-* 전부 (b, 템플릿 고유 형식 — `'hq-builder'` 는 `.md` 로 (a) 먼저) · `agentTypes.candidate = 'hq-scout|hq-auditor|hq-refuter'` 는 Write 로 (c) · `'hq-scribe|hq-verdict'` 는 draft 로 (c) · `'hq-builder'` 는 `.md` 로 (a)) · 후보안 < minCandidates · Refute 전건 null · Audit null · Decision Sheet null. 렌즈 일부 null 은 "미반증"으로 결정지 1-b 절에 이름으로 남고 치명 카운트에 들어가지 않는다 — 결정지 마지막 줄 `치명 반증: n건 / 미반증: k건 / 결정 요청: n건`.

```
Workflow({ name: "hq-design", args: { root: "<루트>", out: "<루트>/_workspace/<주제>-<YYYY-MM-DD>", stamp: "<YYYY-MM-DD HH:MM>",
  inputs: "# 입력\n- <절대경로1>\n- <절대경로2>",
  candidates: [{ id: "a", question: "<후보 A 질문>", file: "design-a.md" }, { id: "b", question: "<후보 B 질문>", file: "design-b.md" }],
  sheet: { file: "DECISION-SHEET.md", decisions: ["<결정 요청 1>"] } } })
```

## hq-build — Spec → Build → Check → Refute → Run → Audit → Review

단계키 `spec` · `build` · `check` · `refute` · `run` · `audit` · `review` (기본 hq-research / **null 범용** / **null 범용** / hq-refuter / **null 범용** / hq-auditor / **null 범용**; effort high / null / null / high / high / high / high). check 기본이 hq-auditor 에서 null 로 바뀐 사유: check 의 마지막 줄 `check: 명령 n건 중 exit≠0 m건` 은 hq-auditor 정의의 닫힌 6절·`감사: …` 줄이 아니라 템플릿 고유 형식이라 규칙 (b) 아래서 hq-auditor 도 설 수 없다(키별 예외 금지 — 6차 반증 #4 의 클래스 귀결). check 결과는 Audit(hq-auditor)이 재실측한다.

| 키 | 필수 | 형식 |
|---|---|---|
| `spec` | 필수 | `{ question, sources: [절대경로 \| URL], file }` |
| `build` | 필수 | `{ task, targets: [절대경로 ≥1], regress: [명령] }` |
| `check` | 필수 | `{ cmds: [명령 ≥1] }` — 그대로 재실행·원문 인용 |
| `run` | 필수 | `{ task, cmds: [명령], expect }` |
| `review` | 필수 | `{ file }` |
| `refute` | 선택 | `{ lenses: [{ id, prompt }], targets: [절대경로] }` — 기본 렌즈 hardcode / silent / scope, 기본 대상 build.targets |
| `builderApproved` | 조건부 필수 | `true` — 어느 단계키든 `'hq-builder'` 를 둘 때(규칙 표 (a)). 헤드리스 python 승인(settings permissions.allow 조각 병합)을 확인했다는 호출자 선언 — 선언은 관측이 아니며, 거부되면 Run 보고 첫 줄 `RERUN-NEEDED` 로 돌아온다 |

throw: 노선 배치(규칙 표 — 어느 키든 `'hq-builder'` 인데 `builderApproved !== true` (a) · `agentTypes.spec|review = 'hq-builder'` 는 `.md` 산출 파일로 (a) · `agentTypes.build = 'hq-builder'` + `build.targets` 에 `.md` (a) · `agentTypes.build` 는 `'hq-builder'` 외 hq-* 전부 (b) · `agentTypes.refute` 는 `'hq-refuter'` 외 전부 (b) · `agentTypes.audit` 는 `'hq-auditor'` 외 전부 (b) · `agentTypes.check|run|review` 는 hq-* 전부 (b, 템플릿 고유 형식 — `'hq-auditor'`·`'hq-builder'` 포함) · `agentTypes.spec = 'hq-scout|hq-auditor|hq-refuter'` 는 Write 로 (c) · `'hq-scribe|hq-verdict'` 는 draft 로 (c)) · Spec / Build / Check / Run / Audit / Review null · Refute 전건 null. 렌즈 일부 null 은 "미반증"으로 리뷰에 남고 치명 카운트에 들어가지 않는다 — 리뷰 마지막 다섯 줄 중 `미반증: k건`.

```
Workflow({ name: "hq-build", args: { root: "<루트>", out: "<루트>/_workspace/<주제>-<YYYY-MM-DD>", stamp: "<YYYY-MM-DD HH:MM>",
  spec: { question: "<스펙 질문>", sources: ["<절대경로>"], file: "spec.md" },
  build: { task: "<빌드 과제 — .bak·지점 패치>", targets: ["<절대경로>"], regress: ["python <루트>/tools/harness-check.py <경로> --scope ours"] },
  check: { cmds: ["<검사 명령>"] },
  run: { task: "<실주행 과제>", cmds: ["<명령>"], expect: "<기대 관측>" },
  review: { file: "REVIEW.md" } } })
```
hq-builder 를 태울 때만: `agentTypes: { build: "hq-builder" }, builderApproved: true` 를 위 args 에 더한다(`build.targets` 는 코드 파일만 — 규칙 표 (a)). build 외 키에는 hq-builder 를 둘 수 없다 — spec·review 는 산출 파일이 `.md` 라 (a), check·run·review 는 템플릿 고유 고정 형식이라 (b).

## hq-audit — Audit

단계키 `audit` (기본 hq-auditor, effort high)

| 키 | 필수 | 형식 |
|---|---|---|
| `reports` | 필수 ≥1 | `[{ id, path: 절대경로 \| text: 본문, checks?: [명령] }]` — path·text 중 하나 |
| `baseline` | 선택 | 문자열 — 이전 값(비교 기준) |

throw: 노선 배치(규칙 표 — `agentTypes.audit` 는 `'hq-auditor'` 외 hq-* 전부 (b); Bash 없는 `'hq-refuter|hq-scribe|hq-verdict|hq-research'` 는 `exec` 의 (c) 도 해당) · Audit 전건 null. 일부 null 은 `unaudited` 로 반환값에 id 가 남는다. 주의: 보고서 파일이 없으면 auditor 가 `없음: <경로>` 한 줄을 내며 그것도 응답으로 집계된다(REVIEW 반증 T#5 — 미수정) — 반환값 `audits[].tail` 이 `없음:` 으로 시작하는 건은 감사가 아니다.

```
Workflow({ name: "hq-audit", args: { root: "<루트>", out: "<루트>/_workspace/<주제>-<YYYY-MM-DD>", stamp: "<YYYY-MM-DD HH:MM>",
  reports: [{ id: "build", path: "<보고서 절대경로>", checks: ["<재실측 명령>"] }] } })
```

## 발사 전 검증 목록(호출자)

1. `root`·`out` 절대경로, `out` 이 `_workspace` 아래.
2. `stamp` = `date '+%Y-%m-%d %H:%M'` 출력.
3. 필수 배열 ≥1, 원소 필수 필드 전부 비어 있지 않음, `file` 류 파일명만.
4. `agentTypes`·`effort` 키 ⊆ 그 템플릿 단계키.
5. `agentTypes` 를 「guardAgentTypes 규칙 표」에 대조 — (a) hq-builder 면 `builderApproved: true` + 그 단계 `files`·`scope` 에 `.md` 없음 (b) `fixed` 단계에는 그 단계 `format` 의 노선만(scout=hq-scout · build=hq-builder · refute=hq-refuter · audit=hq-auditor), `format` 없는 fixed 단계(sheet·check·run·review)는 범용만 (c) Write 없는 노선(hq-scout·hq-auditor·hq-refuter)과 draft 없는 노선(hq-scribe·hq-verdict)은 `files` 단계 금지 + Bash 없는 노선(hq-research·hq-scribe·hq-verdict·hq-refuter)은 `exec` 단계 금지. 기본값이면 전부 통과.
6. 배열·객체를 JSON 문자열로 감싸지 않았다.
