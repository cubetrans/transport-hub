# 🚦 교통덕후 허브

> 교통 덕후들을 위한 올인원 교통 플랫폼

버스 · 철도 · 차량 · 노선도 · 교통 지도 · 통계 등  
교통과 관련된 다양한 기능을 하나의 사이트에서 제공하는 프로젝트입니다.

---

## 📁 프로젝트 구조

```text
transport-hub/
│
├── index.html                  # 🏠 메인 홈
│
├── pages/                      # 각 기능별 페이지
│   ├── bus.html                # 🚌 버스
│   ├── railway.html            # 🚇 철도
│   ├── vehicles.html           # 🚆 차량 도감
│   ├── route-map.html          # 🗺️ 노선도 생성기
│   ├── map.html                # 📍 교통 지도
│   ├── statistics.html         # 📊 교통 통계
│   ├── random.html             # 🎲 랜덤 교통 미션
│   ├── search.html             # 🔎 통합 검색
│   └── mypage.html             # 👤 마이페이지
│
├── auth/                       # 🔐 회원 관련
│   ├── login.html              # 로그인
│   ├── signup.html             # 회원가입
│   └── reset-password.html     # 비밀번호 재설정
│
├── css/
│   ├── common.css              # 전체 사이트 공통 디자인
│   ├── home.css                # 홈 전용
│   ├── bus.css                 # 버스 전용
│   ├── railway.css             # 철도 전용
│   ├── route-map.css           # 노선도 생성기 전용
│   └── auth.css                # 로그인/회원가입 전용
│
├── js/
│   ├── common.js               # 공통 기능
│   ├── home.js                 # 홈 기능
│   ├── bus.js                  # 버스 기능
│   ├── railway.js              # 철도 기능
│   ├── vehicles.js             # 차량 도감
│   ├── route-map.js             # 노선도 생성기
│   ├── map.js                  # 교통 지도
│   ├── statistics.js           # 통계
│   ├── random.js               # 랜덤 미션
│   ├── search.js               # 통합 검색
│   └── mypage.js               # 마이페이지
│
├── supabase/
│   ├── client.js               # Supabase 연결
│   ├── auth.js                 # 로그인/회원가입
│   ├── profile.js              # 사용자 프로필
│   ├── favorites.js            # 즐겨찾기
│   └── saved-maps.js           # 저장한 노선도
│
├── assets/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── vehicles/
│   │   └── icons/
│   │
│   └── fonts/
│
└── README.md
