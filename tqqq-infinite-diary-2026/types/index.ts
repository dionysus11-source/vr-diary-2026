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
