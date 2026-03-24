import { Round, Trade, Symbol } from "@/types"
import { v4 as uuidv4 } from "uuid"
import { getKoreanDate } from "@/lib/utils/timezone"

/**
 * 새로운 거래 생성
 */
export function createTrade(
  symbol: Symbol,
  type: "buy" | "sell",
  price: number,
  quantity: number,
  date?: string
): Trade {
  return {
    id: uuidv4(),
    type,
    symbol,
    date: date || getKoreanDate(),
    price,
    quantity,
    amount: price * quantity,
  }
}

/**
 * 새로운 회차 생성
 */
export function createRound(
  symbol: Symbol,
  roundNumber: number,
  buys: Trade[],
  totalSeedAmount?: number,
  tryAmount?: number,
  version: string = "2.2",
  mode: string = "일반모드"
): Round {
  const now = new Date().toISOString()

  return {
    id: uuidv4(),
    roundNumber,
    symbol,
    status: "active",
    version,
    mode,
    totalSeedAmount,
    tryAmount,
    buys,
    sells: [],
    averageBuyPrice: 0, // updateRoundCalculations에서 계산
    totalBuyQuantity: 0,
    totalSellQuantity: 0,
    remainingQuantity: 0,
    totalBuyAmount: 0,
    totalSellAmount: 0,
    netSellAmount: 0,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 회차에 매수 추가
 */
export function addBuyToRound(round: Round, buy: Trade): Round {
  return {
    ...round,
    buys: [...round.buys, buy],
    updatedAt: new Date().toISOString(),
  }
}

/**
 * 회차에 매도 추가
 */
export function addSellToRound(round: Round, sell: Trade): Round {
  return {
    ...round,
    sells: [...round.sells, sell],
    updatedAt: new Date().toISOString(),
  }
}

/**
 * 회차 완료 처리 (deprecated - updateRoundCalculations에서 자동 처리)
 * @deprecated 회차는 자동으로 완료 상태로 변경됩니다 (남은 수량이 0일 때)
 */
export function completeRound(round: Round, sell: Trade): Round {
  return {
    ...round,
    sells: [...round.sells, sell],
    status: "completed",
    updatedAt: new Date().toISOString(),
  }
}

/**
 * 거래 ID로 회차 찾기
 */
export function findRoundByTradeId(rounds: Round[], tradeId: string): Round | undefined {
  return rounds.find((round) =>
    round.buys.some((buy) => buy.id === tradeId) || round.sells.some((sell) => sell.id === tradeId)
  )
}

/**
 * 거래 형식화 (표시용)
 */
export function formatTrade(trade: Trade): string {
  const typeLabel = trade.type === "buy" ? "매수" : "매도"
  const price = formatPrice(trade.price)
  const quantity = formatQuantity(trade.quantity)
  const amount = formatAmount(trade.amount)

  return `${typeLabel} ${trade.symbol} ${price} × ${quantity} = ${amount}`
}

/**
 * 가격 형식화
 */
export function formatPrice(price: number | undefined): string {
  if (price === undefined || Number.isNaN(price)) return "$0.00"
  return `$${price.toFixed(2)}`
}

/**
 * 수량 형식화
 */
export function formatQuantity(quantity: number | undefined): string {
  if (quantity === undefined || Number.isNaN(quantity)) return "0"
  return quantity.toLocaleString()
}

/**
 * 금액 형식화
 */
export function formatAmount(amount: number | undefined): string {
  if (amount === undefined || Number.isNaN(amount)) return "$0.00"
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * 수익률 형식화
 */
export function formatProfitRate(rate: number | undefined): string {
  if (rate === undefined || Number.isNaN(rate)) return "0.00%"
  const sign = rate >= 0 ? "+" : ""
  return `${sign}${rate.toFixed(2)}%`
}

/**
 * 날짜 형식화
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * 수익/손실 색상 클래스
 */
export function getProfitColorClass(rate?: number): string {
  if (rate === undefined) return "text-gray-500"
  if (rate > 0) return "text-profit"
  if (rate < 0) return "text-loss"
  return "text-gray-500"
}

/**
 * 수익/손실 배경 색상 클래스
 */
export function getProfitBgClass(rate?: number): string {
  if (rate === undefined) return "bg-gray-100 dark:bg-gray-800"
  if (rate > 0) return "bg-green-50 dark:bg-green-900/20"
  if (rate < 0) return "bg-red-50 dark:bg-red-900/20"
  return "bg-gray-100 dark:bg-gray-800"
}

/**
 * 상태별 색상 클래스
 */
export function getStatusColorClass(status: "active" | "completed"): string {
  return status === "active" ? "text-active" : "text-gray-600"
}

/**
 * 상태별 배경 색상 클래스
 */
export function getStatusBgClass(status: "active" | "completed"): string {
  return status === "active"
    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
}
