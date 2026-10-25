---
name: lessons-record
description: 런·예제·조사가 끝나 확정된 관측(verdict.md·record.md·감사 보고)을 호출자가 L번호까지 채번한 초안으로 준 뒤 교훈록 docs/harness-lessons.md 와 원장 docs/harness-ledger.md 에 고정하는 2단계 절차 — 반영(hq-scribe team-run 스펙) → 재실측(hq-auditor). 트리거 예 — "교훈 기록해" · "원장 갱신해" · "L번호 이어서 채번". 확정 관측 파일·채번된 초안이 없으면 쓰지 않는다 — 관측 없이 교훈을 창작하지 않고, 초안 작성(범용 Agent 또는 예제 team-run 의 example-recorder)과 채번 기준 실측은 호출자 몫이라 이 스킬 안에서 하지 않는다. 교훈록·원장 파일이 없는 프로젝트, PASS/FAIL 판정(hq-verdict), 조사 자체에는 쓰지 않는다.
---

# lessons-record

`<루트>` = 프로젝트 루트 절대경로(이 사본: `D:/manhattan/fat-man/_apps/tjedu` · 원본: harness `D:/manhattan/fat-man/harness`). 스펙·프롬프트에 적을 때 절대경로로 치환한다.

## 입력 — 호출자가 준비한다(이 스킬은 만들지 않는다)
- 확정 관측 파일 절대경로 1개 이상 — verdict.md · record.md · 감사 보고. 없으면 부르지 않는다.
- 채번 기준 3값 — 호출자가 `<루트>` 에서 아래 명령 출력으로 확정한 최대 L · L 총수 · ✅ 총수(2단계 재실측의 기준값이 된다). 결번이 있어도 채우지 않는다 — 새 번호는 최대 L 다음부터.
```
grep -o '^\*\*L[0-9]*\.' <루트>/docs/harness-lessons.md | grep -o '[0-9]*' | sort -n | tail -1
grep -c '^\*\*L[0-9]*\.' <루트>/docs/harness-lessons.md
grep -c '| ✅ |' <루트>/docs/harness-ledger.md
```
- 초안 파일 절대경로 `<루트>/_workspace/roads/runs/<RUN>/lessons-draft.md` — L번호가 최대 L + 1 부터 채번된 상태. 출처는 입력 종류로 갈린다:
  - 예제 team-run 산출 폴더(survey.md · run.md · score.md 가 있다): example-recorder 의 `record.md` 가 초안이다 — 그 계약대로 score.md 가 없거나 BLOCKED 면 `NO-LESSON` 이 나오고, 그러면 이 스킬을 부르지 않는다.
  - 런·조사·감사 보고(score.md 가 없다): 호출자가 범용 `Agent(prompt=...)` 로 초안을 만든다 — example-recorder 를 부르지 않는다(입력 계약이 달라 NO-LESSON 으로 끝난다). 프롬프트에 넣을 것: 관측 파일 절대경로 전부 · 최대 L · 출력 절대경로 · 아래 형식 · 건수 예제(주제)당 3~5건 · 관측 파일에 없는 문장 금지.
  - 형식(두 갈래 공통): 섹션 헤딩 `## <예제 또는 주제> — <한 줄> — <YYYY-MM-DD> 완주`, 항목 `**Lnn. <제목>.**` + 근거(명령·파일:행 인용) + `→ 설계 반영:` 한 줄. 원장 행이 있으면 갱신안 1줄 `| <n> | <예제> | <유형> | ✅ | L<a>–L<b> |`.
- 대상 문서 — 교훈록 `<루트>/docs/harness-lessons.md`, 원장 `<루트>/docs/harness-ledger.md`(원장 행이 있는 예제일 때만).
- 런 작업공간 `<루트>/_workspace/roads/runs/<RUN>/`.

## 절차 — 2단계(초안 작성·채번 실측은 입력 조건이지 단계가 아니다)

### 1. 반영 — hq-scribe (team-run 스펙)
1. `<루트>/_workspace/roads/spec-template-hq-scribe.json` 을 `<루트>/_workspace/roads/spec-<RUN>-scribe.json` 으로 복사. `<<RUN>>` 치환.
2. `<<TASK>>` 골격:
```
초안 <루트>/_workspace/roads/runs/<RUN>/lessons-draft.md 를 반영하라. 호출자 기준값: 최대 L<max> / L 총수 <count> / ✅ 총수 <ok>.
- 교훈록 <루트>/docs/harness-lessons.md: `## 다음 예제 대기열` 절 바로 앞에 초안 섹션을 이어붙인다. 기존 형식 유지. 대기열 절은 건드리지 않는다.
- 원장 <루트>/docs/harness-ledger.md: <n>행만 지점 패치 — 상태 ⬜/🔄 를 ✅ 로, 교훈 열을 L<a>–L<b> 로.
- 두 파일 .bak 필수(겹치면 다음 번호) — Bash 가 없으니 Read 한 원문을 `<파일>.bakN` 으로 Write 한다. 반영 전 Grep 으로 L<a> 부재 확인(멱등). 이미 있으면 반영하지 않고 사유만 적는다.
- applied.md 에 반영한 원문, Grep `^\*\*L[0-9]*\.` 건수 전/후, 원장 <n>행 원문을 적는다.
```
3. `python <루트>/tools/spec-smoke.py <루트>/_workspace/roads/spec-<RUN>-scribe.json` — exit 0 확인.
4. `python <루트>/tools/team-run.py <루트>/_workspace/roads/spec-<RUN>-scribe.json --timeout 900`.

### 2. 재실측 — hq-auditor
`Agent(subagent_type="hq-auditor", prompt="<루트>/_workspace/roads/runs/<RUN>/applied.md 의 주장을 재실측. 저장소 루트 <루트>. 호출자 기준값: 최대 L<max> / L 총수 <count> / ✅ 총수 <ok>. 항목: L 총수(기준 + 초안 건수), 초안 첫 번호 = 기준 최대 L + 1 이고 연속인지, 결번·중복, .bak 실존과 diff 삭제 줄 0, 원장 <n>행 원문과 ✅ 총수, 대기열 절 미변경. 마지막 줄: 재실측 n건 중 불일치 m건")`.

## 완료 기준
- 불일치 m = 0.
- L 총수 = 호출자 기준 총수 + 초안 건수, 초안 번호는 기준 최대 L + 1 부터 연속, 결번 증가 0.
- ✅ 총수 = 호출자 기준값 + 갱신한 행 수.
- `.bak` 2개 실존, diff 삭제 줄 0.
- 불일치 m > 0 이면 정정 목록을 `<<TASK>>` 끝에 붙여 1단계를 1회 재실행하고 2단계를 다시 한다. 2회째도 불일치면 사용자에게 올린다.
