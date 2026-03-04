# Project Context

## Purpose
TQQQ/SOXL 무한 매수 전략의 회차별 수익률과 누적 수익금을 시각화하고 분석하는 웹 애플리케이션. 회차별 성과 추적, 리스크 분석(MDD), 수익률 통계를 제공하여 투자 의사결정을 지원한다.

## Tech Stack
- **프레임워크**: Next.js (React 18+ with App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **차트 라이브러리**: Recharts (또는 Chart.js)
- **데이터 저장**: 로컬 JSON 파일 (public/data/ 또는 localStorage)
- **상태 관리**: React Context API (또는 Zustand)
- **데이터 유효성 검사**: Zod

## Project Conventions

### Code Style
- ESLint + Prettier 사용
- 함수형 컴포넌트 + Hooks
- 타입 안전성 엄격 준수 (strict mode)
- 파일 명명 규칙: kebab-case (예: `round-list.tsx`)

### Architecture Patterns
- **Feature-based 폴더 구조**:
  ```
  app/
  ├── (dashboard)/
  │   ├── page.tsx          # 메인 대시보드
  │   ├── rounds/           # 회차 관리
  │   └── active/           # 진행중 회차 관리
  components/
  ├── charts/               # 차트 컴포넌트
  ├── ui/                   # 재사용 UI 컴포넌트
  └── forms/                # 입력 폼
  lib/
  ├── data/                 # 데이터 관리
  ├── calculations/         # 수익률/통계 계산
  └── validations/          # 데이터 검증
  types/                    # TypeScript 타입 정의
  ```
- **계산 로직 분리**: UI와 비즈니스 로직 분리
- **단일 책임 원칙**: 각 모듈은 하나의 명확한 책임만 담당

### Testing Strategy
- 단위 테스트: Vitest (계산 로직)
- 컴포넌트 테스트: React Testing Library (필요 시)
- 수동 테스트: 실제 데이터로 통합 테스트

### Git Workflow
- **브랜치**: feature/기능명, fix/버그명
- **커밋 메시지**: 한글, 명령어로 시작 ([추가], [수정], [삭제], [수정])
- 예: `[추가] 분할 매수 평균 단가 계산 기능`

## Domain Context

### 무한 매수 전략 용어
- **회차(Round)**: 한 번의 매수부터 매도까지의 완전한 주기
- **분할 매수**: 한 회차 내에서 여러 번에 나누어 매수하는 방식
- **평균 매수 단가**: 분할 매수 시 (총 매수액 / 총 수량)으로 계산
- **미실현 수익률**: 아직 매도하지 않은 진행중 회차의 현재 수익률
- **MDD (Maximum Drawdown)**: 최고점에서 최저점까지의 최대 손실률
- **승률**: 수익을 낸 회차 / 전체 완료 회차

### 종목
- **TQQQ**: ProShares UltraPro QQQ (NASDAQ 100 3x Leveraged ETF)
- **SOXL**: Direxion Daily Semiconductor Bull 3x Shares (반도체 3x Leveraged ETF)
- 추후 다른 종목 추가 가능

## Important Constraints
- **데이터 프라이버시**: 모든 데이터는 로컬에만 저장, 외부 전송 없음
- **오프라인 지원**: 데이터를 로컬 JSON에 저장하므로 오프라인에서도 동작 가능
- **간단한 배포**: Vercel/Netlify 등의 정적 호스팅으로 쉽게 배포 가능
- **데이터 내보내기**: 사용자가 언제든 CSV로 데이터 백업 가능

## External Dependencies
- **외부 API**: 현재는 사용하지 않음 (향후 주식 가격 API 연동 시 추가)
- **차트 라이브러리**: Recharts (MIT 라이선스)
- **데이터 검증**: Zod (MIT 라이선스)
