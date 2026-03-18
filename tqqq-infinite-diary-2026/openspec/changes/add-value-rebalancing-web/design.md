# Design Document: 밸류 리밸런싱 웹 페이지

## Context
밸류 리밸런싱(Value Rebalancing, VR)은 TQQQ 레버리지 ETF 투자 전략으로, V값을 기반으로 매수/매도 시점을 결정한다. 현재 Python CLI로 구현되어 있으며, 이를 웹 인터페이스로 통합하여 사용자가 더 편리하게 사용할 수 있게 해야 한다.

**기존 CLI 기능:**
- V값 계산: v2 = v1 + pool/10 + (e-v1)/6.32
- 평가금액: E = 종가 × 주식수
- 리밸런싱 신호: V값 ±15% 변화 시 BUY/SELL
- 벤치마크 비교: 전액 TQQQ 투자 시나리오
- 차수 관리: 2주 단위 매수/매도 기록

**제약 조건:**
- 기존 무한 매수법 페이지는 변경 없음 유지
- 탭 기반 네비게이션으로 두 전략 전환
- 오프라인 동작 가능 (localStorage)
- 단일 종목(TQQQ)에 집중

## Goals / Non-Goals

**Goals:**
- CLI 기능을 웹 UI로 완벽하게 재현
- 직관적인 탭 네비게이션 제공
- V값 계산 과정을 시각화
- 벤치마크와 실제 성과를 쉽게 비교
- 차수별 추적을 쉽게 관리

**Non-Goals:**
- 복잡한 포트폴리오 관리 (단일 종목 집중)
- 실시간 API 연동 (수동 입력 기반)
- 다중 종목 지원
- 소셜 기능 공유

## Decisions

### 1. 아키텍처: 왼쪽 사이드바 + 별도 라우트
**Decision**: layout.tsx에 왼쪽 사이드바를 추가하고, /value-rebalancing 라우트로 밸류 리밸런싱 전용 페이지 생성

**이유:**
- 기존 무한 매수법 페이지(app/page.tsx)는 전혀 수정하지 않음
- 두 전략의 데이터와 UI 완전 분리
- 사용자 경험 명확화 (왼쪽에서 전략 선택)

**구조:**
```
app/
├── layout.tsx          # 사이드바 레이아웃 추가
├── page.tsx            # 무한 매수법 (그대로 유지)
└── value-rebalancing/
    └── page.tsx        # 밸류 리밸런싱 전용 페이지 (새로 생성)
```

**대안 고려:**
- ❌ 탭 기반 페이지: app/page.tsx를 수정해야 함
- ❌ 하이브리드 페이지: 복잡도 증가

### 2. 데이터 저장: localStorage + JSON/CSV export
**Decision**: localStorage를 주 저장소로 사용, JSON 백업/복원과 CSV 내보내기 지원

**이유:**
- 오프라인 동작 가능
- 간단한 구현
- CLI와 데이터 호환성 유지
- 무한 매수법과 동일한 백업/복원 방식

**localStorage 키:**
- `value_rebalancing_db`: 밸류 리밸런싱 데이터 (무한 매수법과 분리)

**백업/복원 기능:**
- JSON 백업: 전체 데이터를 백업 파일로 다운로드
- JSON 복원: 백업 파일에서 데이터 복원
- CSV export: 외부 프로그램과 호환

**데이터 구조:**
```typescript
interface VRRecord {
  date: string
  price: number
  shares: number
  pool: number
  eValue: number
  vValue: number
  signal: 'BUY' | 'SELL' | 'HOLD'
  benchmarkShares: number
  benchmarkValue: number
  createdAt: string
}

interface VRInitialPortfolio {
  initialDate: string
  initialCash: number
  initialShares: number
  averagePrice: number
  totalInvested: number
}

interface VRDatabase {
  initialPortfolio: VRInitialPortfolio | null
  records: VRRecord[]
  rounds: VRRound[]
  transactions: VRTransaction[]
  lastUpdated: string
}

interface VRBackupData {
  version: string
  exportedAt: string
  data: VRDatabase
}
```

### 3. V값 계산: 순수 TypeScript 구현
**Decision**: Python CLI 로직을 그대로 TypeScript로 포팅

**핵심 함수:**
```typescript
function calculateV(
  eValue: number,
  pool: number,
  previousV: number | null
): number {
  if (previousV === null) {
    return eValue + (pool / 10)
  }
  return previousV + (pool / 10) + ((eValue - previousV) / 6.32)
}

function determineSignal(
  previousV: number,
  currentV: number
): 'BUY' | 'SELL' | 'HOLD' {
  const changeRate = (currentV - previousV) / previousV
  if (changeRate > 0.15) return 'BUY'
  if (changeRate < -0.15) return 'SELL'
  return 'HOLD'
}
```

### 4. 차트 라이브러리: Recharts
**Decision**: 기존 무한 매수법에서 사용하는 Recharts 그대로 사용

**이유:**
- 이미 프로젝트에 포함
- React 친화적
- TypeScript 지원

### 5. 차수 관리: 2주 단위 자동 계산
**Decision:** 첫 기록일을 기준으로 2주 단위로 자동 차수 할당

**구현:**
```typescript
function calculateRound(
  recordDate: string,
  firstRecordDate: string
): { roundId: string; startDate: string; endDate: string; roundNumber: number }
```

### 6. UI 컴포넌트 구조
```
components/
├── layout/
│   └── Sidebar.tsx                # 왼쪽 사이드바 네비게이션
└── value-rebalancing/
    ├── VRPage.tsx                 # 밸류 리밸런싱 메인 페이지
    ├── VRRoundList.tsx            # 차수 목록 (카드 형태)
    ├── VRRoundCard.tsx            # 개별 차수 카드
    ├── VRRoundDetailModal.tsx     # 차수 상세 모달
    ├── VRPortfolioCard.tsx        # 현재 포트폴리오 상태
    ├── VRVValueForm.tsx           # V값 계산 폼
    ├── VRSignalDisplay.tsx        # 신호 표시
    ├── VRBenchmarkTable.tsx       # 벤치마크 비교
    └── charts/
        ├── VValueChart.tsx        # V값 변화 차트
        ├── PerformanceChart.tsx   # 성과 비교 차트
        └── RoundChart.tsx         # 차수별 차트
```

**페이지 구성 (스크린샷 참고):**
```
밸류 리밸런싱 페이지
├── 상단: 현재 포트폴리오 상태 카드 (요약)
├── 중앙: 진행중 차수 목록 (카드 형태)
│   ├── 1차수 카드 (클릭 시 상세 모달)
│   ├── 2차수 카드 (클릭 시 상세 모달)
│   └── ...
└── 하단: V값 계산 폼 (새 리밸런싱 추가)
```

## Risks / Trade-offs

**Risk 1: 복잡한 V값 계산 이해도**
- **문제:** 사용자가 V값 공식을 이해하기 어려울 수 있음
- **완화:** 계산 과정을 시각화하고 툴팁 제공

**Risk 2: 데이터 호환성**
- **문제:** CLI CSV와 웹 데이터 형식 차이
- **완화:** CSV import/export 기능으로 호환성 유지

**Trade-off 1: 자동 vs 수동 가격 입력**
- 선택: 수동 입력 기반 (선택적 API)
- 이유: 단순성 유지, 오프라인 동작

**Trade-off 2: 실시간 vs 배치 차트 업데이트**
- 선택: 배치 업데이트 (사용자 액션 시)
- 이유: API 호출 최소화, 단순성

## Migration Plan

**Phase 1: 기본 구조**
1. 왼쪽 사이드바 레이아웃 추가
2. 밸류 리밸런싱 전용 페이지 생성 (/value-rebalancing)
3. 기존 무한 매수법 페이지 동작 확인

**Phase 2: 데이터 및 계산**
3. V값 계산 로직 구현
4. 데이터 저장 시스템 구현

**Phase 3: UI 개발**
5. 포트폴리오 상태 카드
6. V값 계산 폼
7. 신호 표시
8. 백업/복원 버튼 및 모달

**Phase 4: 차트 및 시각화**
8. V값 차트
9. 벤치마크 비교 차트
10. 차수 관리 UI

**Phase 5: 테스트 및 문서화**
11. 기능 테스트
12. 백업/복원 테스트
13. 사용자 가이드 작성
14. 백업/복원 사용법 문서화

**Rollback 계획:**
- layout.tsx에서 사이드바만 제거하면 기존 페이지로 복원
- /value-rebalancing 라우트만 삭제하면 됨
- 데이터는 별도 저장소로 분리되어 있어 안전
- 문제 시 사이드바만 비활성화하면 됨

## Open Questions

1. **CLI 데이터 마이그레이션:** 기존 CLI 사용자 데이터를 어떻게 가져올까요?
   - 제안: CSV import 기능 제공

2. **가격 데이터 소스:** 수동 입력 외에 API를 연동할까요?
   - 제안: 1단계에서는 수동 입력만, 2단계에서 선택적 API

3. **차수 기간:** 2주 단위를 고정할까요 아니면 사용자 설정 가능하게 할까요?
   - 제안: 초기에는 2주 고정, 향후 설정 가능
