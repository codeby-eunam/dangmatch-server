# 🍽️ Dangmatch (당맛치) - **배포 URL**: `https://Dangmatch.vercel.app`

> "오늘 뭐 먹지?" 고민을 끝내는 맛집 토너먼트 앱

주변 식당을 스와이프로 고르고, 1v1 토너먼트로 오늘의 우승 맛집을 결정하는 웹 서비스입니다.

**1차 MVP 배포 완료** 🎉  
Built with **Claude Code** (Vibe Coding) · 2025.02

---

## 📌 프로젝트 개요

"오늘 뭐 먹을지 모르겠어"라는 일상적인 고민을 **게임화된 토너먼트**로 해결합니다.  
주변 식당을 스와이프로 필터링한 뒤, 1v1 대결 방식으로 최종 우승 식당을 선택하는 서비스입니다.

### 🎨 디자인 철학

- **간결함** — 3초 안에 이해 가능한 UI
- **재미** — 게임화된 선택 경험
- **속도** — 빠른 로딩, 즉각적인 반응

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| 상태관리 | Zustand |
| API | 카카오맵 REST API |
| 배포 | Vercel |

---

## 🚀 주요 기능

### 사용자 플로우

```
시작 화면
    ↓
위치 설정 (현재 위치 GPS or 키워드 검색)
    ↓
반경 선택 (현재 위치만 / 지역 검색 시 3km 자동 적용)
    ↓
스와이프 필터링 (최대 45개 식당 카드)
    ↓
토너먼트 (1v1 대결)
    ↓
결과 (우승 식당 + 카카오맵 링크)
```

### 기능 상세

#### 1. 위치 설정 (`/location`)
- 현재 위치 자동 감지 (Geolocation API)
- 키워드 지역 검색 ("강남역", "홍대입구역" 등)

#### 2. 반경 선택 (`/radius`)
- 도보 가까이 (500m) / 도보 멀리 (1km)
- 차량 가까이 (3km) / 차량 멀리 (5km)
- 지역 검색 시 3km 자동 적용 (이 단계 생략)

#### 3. 스와이프 필터링 (`/restaurants`)
- 주변 식당 최대 45개 카드 표시
- 오른쪽 스와이프 → 토너먼트 후보 추가
- 왼쪽 스와이프 → 제외
- 2개 이상 선택 시 토너먼트 시작 가능
- 1개 선택 시 바로 우승 화면으로 이동

#### 4. 토너먼트 (`/tournament`)
- 선택된 식당 1v1 대결
- 선택 수에 따라 자동으로 라운드 구성 (2의 거듭제곱)
- 실시간 진행 상황 표시

#### 5. 결과 (`/result`)
- 우승 식당 정보 표시
- 카카오맵 바로가기 링크
- 결과 이미지 공유 기능
- "처음부터 다시" 버튼

---

## 🔑 핵심 알고리즘

### 토너먼트 로직

```typescript
// 선택된 식당 → 2의 거듭제곱 라운드 자동 구성
// 승자만 다음 라운드 진출
// 상태 관리: currentRound, currentMatchIndex, nextRoundWinners
```

### 위치 기반 검색

- **현재 위치**: Geolocation → 위도/경도 → 반경 검색
- **지역 검색**: 키워드 검색 → 좌표 추출 → 반경 검색 (fallback: 주소 검색)

### 카카오 API 호출 방식

- 쿼리: "음식점"
- 페이지네이션 3페이지 **병렬 호출** → 중복 제거 → 최대 45개
- 응답의 `category_name` 파싱으로 카테고리 분류

---

## 📂 프로젝트 구조

```
tournament-food/
├── app/
│   ├── api/kakao/
│   │   ├── nearby/route.ts           # 주변 식당 검색 (3페이지 병렬, 최대 45개)
│   │   └── search-location/route.ts  # 지역 키워드 검색
│   ├── location/                     # 위치 설정
│   ├── radius/                       # 반경 선택
│   ├── restaurants/                  # 스와이프 필터링
│   ├── tournament/                   # 토너먼트
│   ├── result/                       # 결과
│   └── page.tsx                      # 시작 화면
├── lib/
│   ├── store/tournament.ts           # Zustand 스토어
│   └── utils/tournament.ts           # 토너먼트 로직
├── types/index.ts                    # 공통 타입 정의
└── .env.local                        # 환경 변수
```

---

## 🔧 로컬 개발 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.local 생성)
KAKAO_REST_API_KEY=your_kakao_rest_api_key

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

---

## 🗺️ 개발 로드맵

### ✅ 1차 MVP — 핵심 플로우 (완료)
- 위치 설정 → 반경 선택 → 식당 목록 → 토너먼트 → 결과
- 지인 5명 테스트 완료

### 🚧 2차 MVP — 공유 & 바이럴
- 스와이프 필터링
- 결과 이미지 공유 (html2canvas)
- 시작 화면 개선
- 에러 처리 강화
- 카테고리 필터 (한식/중식/일식/양식/분식/카페)

### 📋 3차 MVP — 사용성 개선
- 로딩 애니메이션
- 모바일 최적화
- 식당 정보 보강 (이미지, 영업시간, 전화)

---

## 🔗 링크

- **배포 URL**: `https://Dangmatch.vercel.app`
- **카카오 개발자 콘솔**: https://developers.kakao.com

---

## 📝 라이선스

MIT License
