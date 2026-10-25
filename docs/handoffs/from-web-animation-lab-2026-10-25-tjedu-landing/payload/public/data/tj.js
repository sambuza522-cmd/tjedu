/* 타지키스탄 — 나라 데이터 한 벌. 새 나라 = 이 파일을 복사해 값만 바꾼다(README.txt).
   사실 행은 src 키를 가진다. 그 키를 sources 에서 찾으면 근거 파일:행. 값이 없는 칸은 빈 판으로 둔다(지어내지 않는다).
   값이 생기면 그 행에 value: '…' 또는 value: { ru: '…', tg: '…' } 를 넣는다(rows.ledger · rows.check). 판 칸 val: 'byUni' · 'cat' · 'blank' · 글자.
   copy.tg = 현지어 원고(문안 초안, 모어 검수 전). 키 집합은 ru.js 의 t 와 같아야 한다(check-country.mjs). */
(function (C) {
  C.country.tj = {
    code: 'tj',
    local: 'tg',
    defaultLang: 'tg',
    open: ['tg', 'ru'],
    names: {
      ru: { nom: 'Таджикистан', gen: 'Таджикистана', loc: 'Таджикистане' },
      tg: { nom: 'Тоҷикистон' },
      ko: { nom: '타지키스탄' }
    },
    capital: { ru: 'Душанбе', tg: 'Душанбе', ko: '두샨베' },
    brand: { code: 'TJ', suffix: 'EDU', name: null, domain: 'tjedu.kr' },
    /* 키 색 = 국기 초록. key(판·단추·링크, 종이 위 4.5:1 이상) · keyOnInk(검은 판 글자, 먹 위 4.5:1 이상) · keyOnInkLg(먹 위 큰 글자) · keyRipe(판 칸이 멈출 때 한 번).
       대비는 check-country.mjs 가 잰다. name = 판 색 이름, 공개 언어마다(원고 'theme.toKey' 의 {color}). ru 는 'табло'(중성)에 맞춘 꼴 */
    colors: { key: '#197B30', keyOnInk: '#26BD4A', keyOnInkLg: '#1E953A', keyRipe: '#177D2F', name: { ru: 'зелёное', tg: 'сабз' } },

    /* 글꼴 요구: 현지어 글자 범위(alphabet) + 렌더 확인 샘플(sample). 판 글꼴은 고정폭 */
    fonts: {
      google: 'family=IBM+Plex+Sans:wght@400;500;700&family=Geist+Mono:wght@500;700',
      sans: ['IBM Plex Sans'],
      mono: ['Geist Mono'],
      alphabet: 'АБВГҒДЕЁЖЗИӢЙКҚЛМНОПРСТУӮФХҲЧҶШЪЭЮЯабвгғдеёжзиӣйкқлмнопрстуӯфхҳчҷшъэюя',
      sample: 'ҒғӢӣҚқӮӯҲҳҶҷЁё«»—'
    },
    /* 출발판 드럼 글자표: 빈칸 + 러시아 대문자 + 타지크 6자 대문자 + 라틴 D + 숫자 + 부호 */
    drum: ' АБВГҒДЕЁЖЗИӢЙКҚЛМНОПРСТУӮФХҲЧҶШЩЪЫЬЭЮЯD0123456789·—/-',

    hero: { text: 'D-2', src: 'FB:D-02' },
    board: {
      cells: [
        { key: 'admit', w: 11, val: 'byUni', src: 'FB:5-b-21' },
        { key: 'uni', w: 10, val: 'cat', src: 'FB:E-03' },
        { key: 'cost', w: 11, val: 'blank', src: 'FB:J-07' },
        { key: 'steps', w: 1, val: '3', src: 'FB:D-01' }
      ]
    },

    rows: {
      categories: [
        { n: 1, src: 'FB:D-06', also: 'FB:E-03' },
        { n: 2, src: 'FB:E-03' },
        { n: 3, src: 'FB:D-09' },
        { n: 4, src: 'FB:D-09' },
        { n: 5, src: 'FB:D-07' }
      ],
      categoryDefault: 2,
      ledger: [
        { n: 1, tag: true, src: 'FB:J-07', also: 'FB:5-b-11' },
        { n: 2, src: 'FB:J-07' },
        { n: 3, src: 'FB:B-12' },
        { n: 4, src: 'D3' }
      ],
      ledgerBlank: 6,
      guard: { src: 'FB:C-02', also: 'FB:C-03', step: 2 },
      steps: [
        { n: 1, src: 'FB:D-01' },
        { n: 2, src: 'FB:C-01' },
        { n: 3, src: 'FB:D-01' }
      ],
      axes: [
        { id: 'prog', step: 3, def: 'a', src: 'FB:D-02' },
        { id: 'loc', step: 2, def: 'a', src: 'FB:C-01' },
        { id: 'topik', step: 1, def: 'a', src: 'FB:G-10' }
      ],
      /* from = 공용 데이터(common.js) 경로 — 회사 값은 거기 한 곳에만 적는다. 값 없는 행(대표·교육부 강령)은 빈 판 그대로 */
      check: [
        { n: 1, from: 'company.reg', src: 'CO1' },
        { n: 2, src: 'D1' },
        { n: 3, from: 'company.address', src: 'CO1' },
        { n: 4, src: 'D4' }
      ],
      checkBlank: 8
    },

    /* 근거 — FB = ca-bridge/2026-10-23-tj-landing/facts-bank.md, D = tjedu.md 10절 열린 결정 */
    sources: {
      'FB:D-01': { ref: 'facts-bank.md:105', note: 'standard admission letter, then financial proof, then consulate D-2/D-4' },
      'FB:D-02': { ref: 'facts-bank.md:106', note: 'D-2 degree study, D-4 general training (language)' },
      'FB:D-06': { ref: 'facts-bank.md:110', note: 'top certified: screened by standard admission letter only' },
      'FB:D-07': { ref: 'facts-bank.md:111', note: 'visa precision: issuance prohibited in principle, from 2026 2nd semester for 1 year' },
      'FB:D-09': { ref: 'facts-bank.md:113', note: 'uncertified general and stricter screening lists not published' },
      'FB:E-03': { ref: 'facts-bank.md:131', note: 'certified: simplified visa screening; lists posted on Study in Korea' },
      'FB:C-01': { ref: 'facts-bank.md:89', note: 'financial requirement is a university notice, differs abroad vs in Korea' },
      'FB:C-02': { ref: 'facts-bank.md:90', note: 'minimum balance' },
      'FB:C-03': { ref: 'facts-bank.md:91', note: 'balance certificate' },
      'FB:G-10': { ref: 'facts-bank.md:167', note: 'Korean level requirement varies by university' },
      'FB:J-07': { ref: 'facts-bank.md:209', note: 'tuition and living costs not surveyed: no value' },
      'FB:5-b-11': { ref: 'facts-bank.md:298', note: 'tuition, dorm, living costs not surveyed; to be confirmed via university tuition disclosure (daehakalimi)' },
      'FB:5-a-4': { ref: 'facts-bank.md:268', note: 'IEQAS results of 2026-02-12 (press release distributed 2026-02-12)' },
      'FB:D-13': { ref: 'facts-bank.md:117', note: 'Ministry of Education code of conduct for agencies, announced 2026-09-08 [unverified draft]' },
      'FB:B-12': { ref: 'facts-bank.md:79', note: 'regular direct flight not confirmed: no value' },
      'FB:5-b-21': { ref: 'facts-bank.md:308', note: 'intake schedule source not confirmed: by university' },
      'FB:I-07': { ref: 'facts-bank.md:195', note: 'info session is a proposal only: not shown' },
      'D1': { ref: 'tjedu.md D1', note: 'company name and registration pending: blank' },
      'CO1': { ref: 'data/common.js company (operator details given by the user 2026-10-25)', note: 'Joongang Solution business registration no. 456-88-02999 and legal address' },
      'D3': { ref: 'tjedu.md D3', note: 'service fee disclosure pending: blank' },
      'D4': { ref: 'tjedu.md D4', note: 'licence and code signature pending: blank' }
    },

    /* 원고 문장 속 사실 = 출처 키(행에 붙지 않는 사실 문장만) */
    cites: { 's2.src': ['FB:5-a-4'], 'chk.4': ['FB:D-13'] },

    messengers: [
      { id: 'whatsapp', account: null },
      { id: 'telegram', account: null }
    ],
    email: null,
    seminar: { cities: [{ ru: 'Душанбе', tg: 'Душанбе', ko: '두샨베' }], show: false, src: 'FB:I-07' },
    links: { studyInKorea: 'https://www.studyinkorea.go.kr/' },
    /* 바닥글 ⑤ 도착 뒤 커뮤니티 한 줄 — url 이 생긴 뒤에만 그린다(tjedu.md 6절) */
    community: {
      url: null, name: 'vatan.kr',
      text: { ru: 'После приезда — открытое сообщество таджиков в Корее:', tg: 'Баъди омадан — ҷамъияти кушодаи тоҷикон дар Корея:' }
    },
    pages: [],
    routes: { uni: 'universities/', cost: 'costs/', docs: 'documents/', company: 'company/', consult: 'consult/', privacy: 'privacy/', terms: 'terms/' },

    copy: {
      tg: {
        meta: { code: 'tg', name: 'Тоҷикӣ', short: 'Тоҷ', forbidden: ['кафолат', '100%', 'бепул', 'ройгон'] },
        t: {
          'doc.title': 'Таҳсил дар Корея — аз саволи аввал то раводид',
          'doc.desc': 'Қабул, категорияи донишгоҳ, хароҷот ва қадамҳо то раводиди D-2 — дар як лавҳа. Савол — дар WhatsApp ё Telegram.',
          'a11y.skip': 'Ба мундариҷа',

          'nav.label': 'Бахшҳо',
          'nav.uni': 'Донишгоҳҳо',
          'nav.cost': 'Хароҷот',
          'nav.docs': 'Ҳуҷҷатҳо ва раводид',
          'nav.company': 'Дар бораи ширкат',
          'nav.consult': 'Машварат',
          'menu.open': 'Меню',
          'menu.close': 'Пӯшидан',
          'menu.title': 'Бахшҳои сайт',
          'lang.label': 'Забон',
          'theme.toMono': 'Лавҳа: сиёҳ',
          'theme.toKey': 'Лавҳа: {color}',

          'board.label': 'Лавҳа: қабул, категорияи донишгоҳ, хароҷот, қадамҳо',
          'board.route': '{capital} — Корея',
          'board.h.admit': 'ҚАБУЛ',
          'board.h.uni': 'ДОНИШГОҲ',
          'board.h.cost': 'ХАРОҶОТ',
          'board.h.steps': 'ҚАДАМҲО',
          'board.tag.admit': 'қарор: донишгоҳ',
          'board.tag.uni': 'Вазорати адлия ва маорифи Корея',
          'board.tag.cost': 'маблағ нишон дода нашудааст',
          'board.tag.steps': 'донишгоҳ · донишгоҳ · консулгарӣ',
          'board.empty': 'ҳанӯз интихоб нашудааст',
          'board.v.byUni': 'АЗ ДОНИШГОҲ',
          'board.d.byUni': 'аз рӯи донишгоҳ',
          'board.d.blank': 'нишон дода нашудааст',

          'cat.1.tile': 'БО ИМТИЁЗ',
          'cat.1.name': 'Сертификати IEQAS бо имтиёз',
          'cat.1.fact': 'Раводид — танҳо бо номаи стандартии қабул',
          'cat.2.tile': 'СЕРТИФИКАТ',
          'cat.2.name': 'Сертификати IEQAS',
          'cat.2.fact': 'Санҷиши раводид содда шудааст',
          'cat.3.tile': 'УМУМӢ',
          'cat.3.name': 'Бе сертификат — тартиби умумӣ',
          'cat.3.fact': 'Рӯйхат нашр намешавад',
          'cat.4.tile': 'ШАДИД',
          'cat.4.name': 'Бе сертификат — санҷиши шадиди раводид',
          'cat.4.fact': 'Рӯйхат нашр намешавад',
          'cat.5.tile': 'МАҲДУД',
          'cat.5.name': 'Маҳдудияти раводид',
          'cat.5.fact': 'Додани раводид асосан манъ аст — аз нимсолаи дуюми соли 2026 ба муддати як сол',

          's1.h1': 'Таҳсил дар Корея — аз саволи аввал то раводид',
          's1.lead': 'Қабул, донишгоҳ, хароҷот ва қадамҳо — дар як лавҳа',
          's1.ask': 'Савол додан',
          's1.hero': 'D-2 — раводиди таҳсил дар Корея',

          's2.h': 'Оё донишгоҳ боэътимод аст?',
          's2.sub': 'Категорияи донишгоҳ — арзёбии ҳукумати Корея (IEQAS)',
          's2.body': 'Санҷиши раводид аз категория вобаста аст. Категорияро интихоб кунед — он ба лавҳа мегузарад.',
          's2.src': 'Манбаъ: Вазорати адлия ва Вазорати маорифи Корея, хабарномаи 12.02.2026',
          's2.link': 'Санҷидани донишгоҳ — Study in Korea',
          's2.linkNote': 'Рӯйхати донишгоҳҳои сертификатдорро Study in Korea нашр мекунад',
          's2.rank': 'Категорияи {n} аз {total}',

          's3.h': 'Хароҷот чанд аст?',
          's3.body': 'Хароҷот аз чӣ иборат аст ва онро дар куҷо санҷидан мумкин.',
          's3.link': 'Хароҷот аз рӯи донишгоҳҳо',
          's3.row.1': 'Таҳсил',
          's3.row.2': 'Зиндагӣ дар Корея',
          's3.row.3': 'Роҳ',
          's3.row.4': 'Хизматҳои {brand}',
          's3.tag.1': 'донишгоҳ нашр мекунад',
          's3.guard': 'Тасдиқи маблағ — бақияи суратҳисоб, аз рӯи донишгоҳ',
          's3.guardNote': 'Ба хароҷот дохил намешавад: ин маблағест, ки дар суратҳисоб мемонад',
          's3.blank': 'маблағ нишон дода нашудааст',

          's4.h': 'Ҳуҷҷатҳо ва раводид — чӣ лозим?',
          's4.body': 'Се қадам, ҳар яке қарордиҳандаи худро дорад. Шартҳои худро қайд кунед — савол ба ҳамон ҷое меравад, ки қарор медиҳад.',
          's4.link': 'Рӯйхати ҳуҷҷатҳо',
          's4.who': 'Кӣ қарор медиҳад',
          's4.step.1': 'Номаи стандартии қабул',
          's4.step.2': 'Тасдиқи маблағ',
          's4.step.3': 'Аризаи раводид дар консулгарӣ',
          's4.dec.1': 'донишгоҳ',
          's4.dec.2': 'донишгоҳ',
          's4.dec.3': 'консулгарӣ',
          's4.strip': 'Шартҳои шумо',
          's4.slot': 'қадами {n}',

          'ax.prog': 'Барнома',
          'ax.prog.a': 'D-2',
          'ax.prog.a.d': 'таҳсил барои дараҷа',
          'ax.prog.b': 'D-4',
          'ax.prog.b.d': 'курси забон',
          'ax.loc': 'Ҷои супоридан',
          'ax.loc.a': 'аз {nom}',
          'ax.loc.b': 'дар Корея',
          'ax.topik': 'TOPIK',
          'ax.topik.a': 'нест',
          'ax.topik.b': 'ҳаст',
          'q.prog.a': 'D-2: барои раводид кадом ҳуҷҷатҳо лозиманд?',
          'q.prog.b': 'D-4: барои раводид кадом ҳуҷҷатҳо лозиманд?',
          'q.loc.a': 'Аз {nom} месупорам: дар суратҳисоб чӣ қадар бақия лозим?',
          'q.loc.b': 'Дар Корея месупорам: дар суратҳисоб чӣ қадар бақия лозим?',
          'q.topik.a': 'TOPIK надорам: қабул шудан мумкин аст?',
          'q.topik.b': 'TOPIK дорам: кадом сатҳ лозим?',

          's5.h': 'Савол диҳед',
          'd.l1': 'Салом!',
          'd.h.admit': 'Қабул',
          'd.h.uni': 'Категорияи донишгоҳ',
          'd.h.cost': 'Хароҷот',
          'd.h.steps': 'Қадамҳо',
          'd.l4': 'Саволи ман: ',
          's5.wa': 'WhatsApp',
          's5.tg': 'Telegram',
          's5.copy': 'Нусхаи матн',
          's5.copied': 'Матн нусха шуд',
          's5.note': 'Матн дар паёмрасон кушода мешавад — саволи худро илова кунед.',

          'chk.h': 'Моро санҷед',
          'chk.1': 'Рақами бақайдгирӣ',
          'chk.2': 'Роҳбар',
          'chk.3': 'Суроға',
          'chk.4': 'Кодекси Вазорати маорифи Корея барои агентиҳо',
          'chk.none': 'ҳанӯз нашр нашудааст',

          'ft.op': 'Ширкат',
          'ft.opBy': 'Идора',
          'ft.reg': 'Рақами бақайдгирӣ',
          'ft.addr': 'Суроға',
          'ft.tel': 'Телефон',
          'ft.mail': 'Почта',
          'ft.family': 'Сомонаҳои мо',
          'ft.contact': 'Тамос',
          'ft.lang': 'Забон',
          'ft.legal': 'Қоидаҳо',
          'ft.privacy': 'Сиёсати махфият',
          'ft.terms': 'Шартҳои истифода'
        }
      }
    }
  };
})(window.CAEDU = window.CAEDU || { lang: {}, country: {} });
