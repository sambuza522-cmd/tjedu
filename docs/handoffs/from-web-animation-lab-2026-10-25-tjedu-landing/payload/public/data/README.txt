나라 추가 = 데이터 파일 하나(data/<코드>.js) + 나라 말 원고 한 벌. common.js·ru.js·index.html·app.js·style.css 는 손대지 않는다.
   common.js = 나라 공용(운영 회사 · 패밀리 사이트). 「확인」 행이 회사 값을 쓸 때는 value 대신 from: 'company.reg' 처럼 경로만 적는다. 바닥글의 지금 사이트 = 나라 파일 brand.domain 과 같은 항목. 라벨 'ft.opBy'·'ft.family' 는 원고에.
1. data/tj.js 를 data/<코드>.js 로 복사하고, C.country.tj 와 code: 'tj' 를 새 코드로 바꾼다(예: uz).
2. 채울 키: local·open·defaultLang · names(ru 격 3개·현지어·ko) · capital · brand(name 은 상호가 정해지면, 그 전엔 null) · drum · hero(글자 6자 이하)
   · board.cells(w = 가장 긴 값 글자 수, val = 'byUni' | 'cat' | 'blank' | 글자) · rows(행마다 src) · sources(src 마다 근거 파일:행)
   · cites(원고 문장 속 사실 = 출처 키) · messengers · email · seminar · links · community(도착 뒤 커뮤니티: url 이 생긴 뒤에만 그린다) · routes · copy.<현지어>.
   · colors = flag-based key color; check-country checks contrast
3. 사실(등급·순서·날짜·금액)은 출처가 있는 것만. 없으면 칸을 빈 판으로 둔다(판 칸 val: 'blank', 행은 value 없이). 값이 생기면 행에 value: '…' 또는 { ru: '…', <현지어>: '…' }.
4. copy.<현지어>.t 는 ru.js 의 t 와 키가 같고 값이 비지 않아야 한다. 원고는 모어 검수본만(러시아 글자로 대체 금지 — 틀은 빠진 키를 다른 언어로 메우지 않는다). meta.forbidden 에 현지어 금지어 목록.
5. drum = 빈칸 + 러시아 대문자 + 현지어 대문자(라틴 나라는 A-Z 와 고유 글자) + D + 0-9 + 부호. 판 값 글자는 전부 여기에.
6. 글꼴: fonts.alphabet 에 현지어 글자 전부(조합형 글자는 미리 합친 글자로), fonts.sample 에 고유 글자. 실제로 그려지는지는 검사기가 크롬으로 열어 잰다(7).
   대체 글꼴로 떨어진 글자가 나오면 fonts.google·sans·mono 를 바꾼다.
7. 검사: node check-country.mjs <코드>  (크롬 필요, 경로는 CAEDU_CHROME) 결과가 RESULT PASS 일 때만 연다.  주소: index.html?c=<코드>&l=<언어>
8. 주소에 없는 나라를 적으면 기본 나라(tj) 주소로 바뀌어 열리고 콘솔에 오류가 찍힌다. 열리지 않은 언어를 적으면 그 나라 기본 언어 주소로 바뀐다.
