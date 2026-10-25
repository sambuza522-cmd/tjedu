---
name: workflow-retry
description: 이미 발사한 Workflow 런을 다시 돌리는 절차 — journal.jsonl 로 멈춘 phase·사유를 먼저 고정하고(hq-scout), 스크립트 파일에 사유 주석 1줄을 Edit 한 뒤 scriptPath+resumeFromRunId 로 재발사한다. 비교용 N회 반복은 resumeFromRunId 없이 args.run 으로 구분해 발사한다. 트리거 예 — "다시 돌려" · "이어서 해" · "5번 돌려서 비교해". 새 워크플로 작성은 workflow-launch 로 보낸다. 사유 기록 없는 즉시 재발사, 수정 없이 같은 스크립트·같은 args 재발사, 3회째 재발사는 금지 — 사용자에게 올린다.
---

# workflow-retry

`<루트>` = 프로젝트 루트 절대경로(이 사본: `D:/manhattan/fat-man/_apps/tjedu` · 원본: harness `D:/manhattan/fat-man/harness`). 프롬프트·args 에 적을 때 절대경로로 치환한다.

## 입력
- 직전 Workflow 도구 결과의 `runId`, 스크립트 경로(세션 디렉터리의 `.js`), `transcriptDir`(journal.jsonl 위치).
- 셋 중 하나라도 없으면 재발사하지 않는다 — 사용자에게 runId 를 묻는다.

## 절차

### 1. 멈춘 지점 고정 — hq-scout
`Agent(subagent_type="hq-scout", prompt="<transcriptDir>/journal.jsonl 에서 phase 별 agent 반환 건수·null 건수·오류 문자열 원문·마지막 기록 줄 보고. 스크립트 <경로> 의 meta.name 과 phase 제목 목록도.")`
- 받을 것: 멈춘 phase 이름, null·오류 건수, 오류 원문.
- journal 이 없으면 `<transcriptDir>/agent-*.jsonl` 파일 수와 각 파일 마지막 줄을 대신 보고받는다.

### 2. 갈래 선택
| 상황(1단계 보고) | 갈래 |
|---|---|
| 스크립트 오류(구문·undefined·schema 불만족) | A — 수정 후 재개 |
| agent null·중단(skip·API 종료), 스크립트 오류 없음 | A — 주석만 추가하고 재개 |
| 결과는 나왔으나 Audit 불일치 m > 0 | A — 정정 목록을 해당 phase 프롬프트에 붙여 재개 |
| 같은 스크립트를 N회 독립 실행해 비교 | B — 반복 발사 |
| 2회 재발사 뒤에도 같은 phase 에서 멈춤 | 중단 — 사용자에게 runId 계보·사유 원문·갈래 이력 |

### 3-A. 수정 후 재개
1. 스크립트의 `meta` 블록 바로 아래에 주석 1줄 Edit: `// retry <n> <- <runId>: <멈춘 phase> / <사유 원문 요약> / <고친 것>`.
2. 고칠 곳만 Edit. 앞쪽 `agent()` 호출은 건드리지 않는다(캐시 접두 유지 — 바뀐 첫 호출부터 재실행된다). 전면 재작성 금지.
3. `Workflow({ scriptPath: "<경로>", resumeFromRunId: "<runId>", args: <동일 args> })`.
4. args 를 바꾸면 캐시 전부 무효다 — 바꿀 때는 1번 주석에 바뀐 키를 적는다.

### 3-B. 반복 발사 — 비교용
1. `Workflow({ scriptPath: "<경로>", args: { ...동일, run: i } })` 를 i = 1..N 순차 발사. `resumeFromRunId` 는 넣지 않는다. 같은 args 는 캐시 재사용이라 비교가 되지 않는다.
2. 스크립트가 `args.run` 을 label 또는 프롬프트에 넣지 않으면 먼저 3-A 1~2번으로 넣는다.
3. N개 결과 비교는 hq-auditor(수치 재실측) 또는 hq-verdict(기대값 대조)로 보낸다 — journal 절대경로 N개를 프롬프트에 넣는다. 지휘부가 눈으로 비교하지 않는다.

### 4. 완료 기준
- 새 runId 의 journal.jsonl 에 phase 전부의 반환값이 있다.
- 스크립트의 `// retry` 주석 줄 수 = 재발사 횟수.
- 재발사 횟수 ≤ 2. 3회째는 발사 대신 사용자 보고.
- 최종 응답에 runId 계보(원본 → retry 1 → retry 2)와 각 갈래를 적는다.
