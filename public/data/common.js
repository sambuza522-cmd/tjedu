/* 공용 데이터 — 다섯 나라가 같이 쓴다(언어 없음). 바닥글의 운영 회사 · 패밀리 사이트.
   라벨(«Ведёт» · «Наши сайты»)은 원고 쪽(ru.js 의 t · 나라 파일 copy)에 있다. 회사 이름은 적힌 그대로, latin 은 로마자 표기.
   family: 순서 = 바닥글 순서. 지금 사이트 = 나라 파일 brand.domain 과 domain 이 같은 항목(링크 아님). 틀은 name 을 그린다(ko 는 한국어 쪽 몫 — 지금 틀은 tg·ru 뿐).
   주소 = 운영 https://<domain>/ · 로컬(file: · localhost · 127.0.0.1)에서는 lab(이 쪽 index.html 기준 상대 경로), lab 이 null 이면 늘 운영 주소. */
(function (C) {
  C.common = {
    /* reg = 사업자등록번호 · address = 법정 주소(한국어 그대로) · phone.display = 외국 독자용 국제 표기, phone.tel = tel: 링크 값 */
    company: {
      name: '(주)중앙솔루션', latin: 'Joongang Solution Co., Ltd.',
      reg: '456-88-02999',
      address: '경기도 고양시 덕양구 꽃마을로 36, 디엠씨스타비즈6에스티 12층 1201호 (향동동)',
      phone: { display: '+82 2-6403-1588', tel: '+82264031588' },
      email: 'martinmart@naver.com'
    },
    /* 한글 대체 글꼴(회사 이름·주소) — 나라 sans 뒤에만 붙는다. Google Fonts 에서 company 의 한글 글자만(text=) 받는다 */
    hangul: { family: 'IBM Plex Sans KR', google: 'family=IBM+Plex+Sans+KR:wght@400' },
    family: [
      { id: 'vatan', name: 'Ватан', lang: 'tg', domain: 'vatan.kr', lab: '../vatan-landing.html' },
      { id: 'tjedu', name: 'TJEDU', lang: null, domain: 'tjedu.kr', lab: 'index.html?c=tj' },
      { id: 'cabridge', name: 'CA Bridge', lang: 'en', domain: 'cabridge.kr', lab: null },
      { id: 'helpers', name: 'The Helpers', ko: '헬퍼스', lang: 'en', domain: 'helpers.co.kr', lab: '../helpers/index.html' },
      { id: 'datahub', name: 'CA Datahub', lang: 'en', domain: 'ca.saasmate.dev', lab: null },
      /* 타지크·러시아 쪽은 도메인 글자 그대로(지어낸 라틴 상호 없음). 한국어 이름(ko)은 한글 글꼴을 싣는 한국어 쪽에서만 */
      { id: 'martinmart', name: 'martinmart.co.kr', ko: '마트인마트', lang: null, domain: 'martinmart.co.kr', lab: null }
    ]
  };
})(window.CAEDU = window.CAEDU || { lang: {}, country: {} });
