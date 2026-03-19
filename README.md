# TeamDash

팀 프로젝트 관리 웹 애플리케이션

## 주요 기능

- **대시보드** - 프로젝트/작업 현황 한눈에 확인
- **프로젝트 관리** - 프로젝트 생성, 상세 보기, 진행률 추적
- **작업 보드** - 칸반 보드 (할일 / 진행중 / 완료)
- **팀 관리** - 팀원 역할 관리 (소유자 / 관리자 / 멤버)
- **활동 내역** - 프로젝트 활동 타임라인
- **프로필 사진 크롭** - 업로드 시 원형 크롭 UI로 사진 편집
- **반응형 UI** - 모바일 / 태블릿 / 데스크톱 최적화
- **Google 로그인** - OAuth 2.0 인증

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4
- **State**: Zustand (localStorage 영속화)
- **Auth**: Google OAuth (@react-oauth/google)
- **UI**: Lucide React, react-easy-crop, wave-gradient

## 실행

```bash
npm install
npm run dev
```

`http://localhost:3000`에서 확인

## 환경 변수

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## 배포

Vercel에 배포: [teamdash-web.vercel.app](https://teamdash-web.vercel.app)

## 라우트

| 경로 | 설명 |
|------|------|
| `/` | 대시보드 |
| `/projects` | 프로젝트 목록 |
| `/projects/new` | 프로젝트 생성 |
| `/projects/[id]` | 프로젝트 상세 |
| `/tasks` | 작업 보드 |
| `/tasks/new` | 작업 생성 |
| `/tasks/[id]` | 작업 상세 |
| `/team` | 팀 관리 |
| `/activities` | 활동 내역 |
| `/settings` | 설정 |
