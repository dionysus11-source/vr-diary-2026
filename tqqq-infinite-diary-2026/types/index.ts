// 종목 타입
export type Symbol = "TQQQ" | "SOXL" | string

// 거래 유형
export type TradeType = "buy" | "sell"

// 회차 상태
export type RoundStatus = "active" | "completed"

// 매수/매도 거래 기록
export interface Trade {
  id: string
  type: TradeType
  symbol: Symbol
  date: string // ISO 8601 format (YYYY-MM-DD)
  price: number // 주당 가격
  quantity: number // 수량
  amount: number // 금액 (price × quantity)
}

// 회차 데이터
export interface Round {
  id: string
  roundNumber: number
  symbol: Symbol
  status: RoundStatus
  totalSeedAmount?: number // 총 투자 원금 (Seed)
  tryAmount?: number // 1회 매수 시도액
  buys: Trade[] // 분할 매수 기록
  sells: Trade[] // 분할 매도 기록 (중간 매도 포함)
  averageBuyPrice: number // 평균 매수 단가
  totalBuyQuantity: number // 총 매수 수량
  totalSellQuantity: number // 총 매도 수량
  remainingQuantity: number // 남은 수량
  totalBuyAmount: number // 총 매수액
  totalSellAmount: number // 총 매도액
  netSellAmount: number // 순 매도액 (총 매도액 - 해당 분분 매수액)
  currentPrice?: number // 현재 가격 (진행중인 회차의 경우)
  profitRate?: number // 수익률 (%) - 실현 + 미실현
  realizedProfitRate?: number // 실현 수익률 (%)
  unrealizedProfitRate?: number // 미실현 수익률 (%)
  profitAmount?: number // 총 수익금
  realizedProfitAmount?: number // 실현 수익금
  unrealizedProfitAmount?: number // 미실현 수익금
  createdAt: string
  updatedAt: string
}

// 통계 데이터
export interface Statistics {
  totalRounds: number
  completedRounds: number
  activeRounds: number
  averageProfitRate: number
  maxProfitRate: number
  maxProfitRound: number
  minProfitRate: number
  minProfitRound: number
  winRate: number // 승률 (%)
  standardDeviation?: number // 수익률 표준편차
  maxDrawdown?: number // MDD (%)
  averageLoss?: number // 평균 손실액
  averageProfit?: number // 평균 수익액
  profitLossRatio?: number // 손익비
}

// 데이터베이스 구조
export interface Database {
  rounds: Round[]
  symbols: Symbol[]
  lastUpdated: string
}

// 카드 표시 모드
export type CardViewMode = "compact" | "detailed"

// 탭 필터
export type TabFilter = "all" | "active" | "completed"

// 현재 가격 입력
export interface CurrentPriceInput {
  roundId: string
  price: number
  date: string
}

// ====================
// 밸류 리밸런싱 타입
// ====================

// 리밸런싱 신호 타입
export type VRSignalType = "BUY" | "SELL" | "HOLD"

// 리밸런싱 기록
export interface VRRecord {
  date: string // YYYY-MM-DD
  price: number // TQQQ 종가
  shares: number // 주식수 (VR)
  pool: number // 현금 (VR)
  eValue: number // 평가금액 (E = 종가 × 주식수)
  vValue: number // 계산된 V값
  signal: VRSignalType // BUY/SELL/HOLD
  benchmarkShares: number // 벤치마크 주식수 (초기 전액 TQQQ 투자)
  benchmarkValue: number // 벤치마크 가치 (benchmarkShares * 현재 종가)
  createdAt: string // ISO 타임스탬프
}

// 초기 포트폴리오
export interface VRInitialPortfolio {
  initialDate: string // 초기 설정 날짜
  initialCash: number // 초기 현금(Pool)
  initialShares: number // 초기 주식수
  averagePrice: number // 평단가
  totalInvested: number // 총 투자 금액
}

// 차수 매수/매도 거래
export interface VRTransaction {
  id: string
  roundId: string // 차수 ID (예: "1차수")
  date: string
  type: "BUY" | "SELL"
  shares: number // 주식수 변화
  price: number // 종가
  totalAmount: number // 총 금액
  sharesAfter: number // 거래 후 주식수
  poolAfter: number // 거래 후 현금
  notes: string // 메모
  createdAt: string
}

// 차수 정보
export interface VRRound {
  roundId: string // 차수 ID (예: "1차수")
  roundNumber: number // 차수 번호
  startDate: string // 차수 시작일
  endDate: string // 차수 종료일
  initialShares: number // 초기 주식수
  initialPool: number // 초기 현금
  finalShares: number // 최종 주식수
  finalPool: number // 최종 현금
  sharesChange: number // 주식수 변화 (최종 - 초기)
  poolChange: number // 현금 변화 (최종 - 초기)
  transactions: VRTransaction[] // 거래 내역
  isActive: boolean // 진행중 여부
  createdAt: string
  updatedAt: string
}

// 밸류 리밸런싱 데이터베이스
export interface VRDatabase {
  initialPortfolio: VRInitialPortfolio | null
  records: VRRecord[]
  rounds: VRRound[]
  transactions: VRTransaction[]
  lastUpdated: string
}

// 밸류 리밸런싱 백업 데이터
export interface VRBackupData {
  version: string
  exportedAt: string
  data: VRDatabase
}

// 밸류 리밸런싱 포트폴리오 상태
export interface VRPortfolioStatus {
  shares: number // 현재 주식수
  pool: number // 현재 현금
  eValue: number // 평가금액
  vValue: number // V값
  signal: VRSignalType // 현재 신호
  benchmarkShares: number // 벤치마크 주식수
  benchmarkValue: number // 벤치마크 가치
  totalValue: number // VR 총 자산 (E + Pool)
  difference: number // VR vs 벤치마크 차이
  differenceRate: number // 차이율 (%)
}
