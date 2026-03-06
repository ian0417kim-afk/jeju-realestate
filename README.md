# 🏝 제주 부동산 사이트

제주도 부동산 매물 사이트 — GitHub Pages 배포용

---

## 📁 파일 구조

```
📁 jeju-realestate/
├── index.html              # 메인 페이지 (건드릴 필요 거의 없음)
├── data/
│   ├── listings.json       # ✅ 매물 추가/수정/삭제 여기서만!
│   ├── lang.json           # 3개국어 텍스트
│   └── config.json         # 환율, 연락처 설정
├── assets/
│   ├── css/style.css       # 디자인
│   └── js/app.js           # 기능
└── images/
    └── hero.jpg            # 메인 배경 이미지
```

---

## 🖼️ 매물 사진 업로드 방법

> **GitHub에 사진을 올리지 않습니다!** 용량 절약을 위해 외부 링크 사용.

1. [imgbb.com](https://imgbb.com) 접속 → 무료 가입
2. 사진 업로드 (권장: JPG, 640×480px 썸네일 / 1200×800px 상세)
3. **"Direct link"** 복사
4. `listings.json`의 `images` 배열에 링크 붙여넣기

---

## ✏️ 매물 추가 방법

`data/listings.json` 파일을 열고 `listings` 배열에 아래 형식으로 추가:

```json
{
  "id": 7,
  "type": "아파트",
  "deal": "매매",
  "title_ko": "매물 제목",
  "title_en": "Listing Title",
  "title_zh": "房源标题",
  "location_ko": "제주시 어딘가",
  "location_en": "Somewhere, Jeju",
  "location_zh": "济州市某处",
  "price_krw": 350000000,
  "monthly_deposit": null,
  "monthly_rent": null,
  "area_m2": 84,
  "floor": "5/15층",
  "built_year": 2020,
  "parking": true,
  "desc_ko": "매물 설명",
  "desc_en": "Description",
  "desc_zh": "房源描述",
  "images": [
    "https://imgbb.com/직링크1",
    "https://imgbb.com/직링크2"
  ],
  "featured": false
}
```

### type 값
`아파트` / `원투룸` / `빌라연립` / `단독주택` / `토지` / `건물` / `단기`

### deal 값
`매매` / `전세` / `월세` / `단기`

### 월세/단기 매물은
`price_krw: null` 로 설정하고 `monthly_deposit`과 `monthly_rent`를 입력

---

## 💰 환율 변경 방법

`data/config.json` 에서:
```json
"exchange": {
  "usd": 0.00075,   ← 1원 = 몇 달러 (예: 1달러=1333원이면 1/1333)
  "cny": 0.0054     ← 1원 = 몇 위안
}
```

---

## 📞 연락처 변경 방법

`data/config.json` 에서:
```json
"contact": {
  "phone": "010-0000-0000",
  "sms": "010-0000-0000",
  "kakao": "https://open.kakao.com/o/xxxxxxxx",
  "wechat": "위챗_아이디"
}
```

---

## 🚀 GitHub Pages 배포

1. GitHub 새 저장소 생성
2. 이 폴더 전체 업로드
3. Settings → Pages → Branch: `main` 선택 → Save
4. `https://사용자명.github.io/저장소명` 으로 접속

---

## 📐 사진 권장 규격

| 용도 | 크기 | 용량 |
|------|------|------|
| 목록 썸네일 | 640 × 480px | 500KB 이하 |
| 상세 사진 | 1200 × 800px | 500KB 이하 |
| 포맷 | JPG | 매물당 최대 10장 |
