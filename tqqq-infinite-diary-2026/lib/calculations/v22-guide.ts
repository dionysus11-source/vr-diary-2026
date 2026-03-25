import { Round } from "@/types"

export type GuideState = "firstHalf" | "secondHalf" | "quarterStopLoss" | "completed"

export interface V22GuideInfo {
  tryAmount: number
  tValue: number
  starPercentage: number
  state: GuideState
  averagePrice: number
  buyPoint: number
  sellPoint: number
  locAverageQuantity: number
  locStarQuantity: number
  quarterSellShares: number
  remainingSellShares: number
  currentInvestedAmount: number
}

/**
 * 1회 매수 시도액 도출
 * (사용자가 명시한 tryAmount가 있으면 최우선 적용, 없으면 첫 매수 금액 기준)
 */
export function getTryAmount(round: Round): number {
  if (round.tryAmount && round.tryAmount > 0) return round.tryAmount
  if (!round.buys || round.buys.length === 0) return 0
  // 첫 매수를 1회 시도액으로 간주
  return round.buys[0].amount
}

/**
 * T값(회차) 계산
 * 누적 매수 금액 / 1회 매수 시도액 (소수점 둘째 자리에서 올림)
 * 예: 2.88 -> 2.9
 */
export function calculateTValue(totalBuyAmount: number, tryAmount: number): number {
  if (tryAmount <= 0) return 0
  const rawT = totalBuyAmount / tryAmount
  // 소수점 셋째 자리에서 반올림 → 두 번째 자리까지 표시
  return Math.round(rawT * 100) / 100
}

/**
 * 별(Star) 퍼센트 계산
 * (10 - T/2)%
 */
export function calculateStarPercentage(tValue: number): number {
  return 10 - tValue / 2
}

/**
 * 현재 V2.2 가이드 상태 도출
 */
export function getGuideState(round: Round, tValue: number): GuideState {
  if (round.status === "completed" || round.remainingQuantity === 0) {
    return "completed"
  }

  // 쿼터 손절모드 룰: 원금 소진 (T >= 39.1)
  // 단, 매도 성립으로 보유 수량이 줄어들거나 하는 복귀 조건이 있으면 후반전 복귀.
  // 이 시스템에서는 순수하게 T값만으로 쿼터손절 진입을 판단합니다.
  // 사용자가 리셋(리밸런싱)을 하여 T값을 낮추지 않는 한 39.1 이상은 쿼터손절 가이드를 보여줍니다.
  if (tValue >= 39.1) {
    return "quarterStopLoss"
  }
  
  if (tValue >= 20) {
    return "secondHalf"
  }
  
  return "firstHalf"
}

/**
 * 라운드 객체에서 전체 V2.2 가이드 정보 추출
 */
export function getV22GuideInfo(round: Round): V22GuideInfo {
  const tryAmount = getTryAmount(round)
  
  // 매도(쿼터매도 등)가 발생하면 남아있는 수량에 대한 투자원금만 T값 계산에 반영
  const currentInvestedAmount = round.remainingQuantity > 0 
    ? round.remainingQuantity * (round.averageBuyPrice || 0)
    : round.totalBuyAmount
    
  const tValue = calculateTValue(currentInvestedAmount, tryAmount)
  const starPercentage = calculateStarPercentage(tValue)
  const state = getGuideState(round, tValue)
  const averagePrice = round.averageBuyPrice || 0

  // 매도 포인트: 평단가 + 평단가 * 별퍼센트 / 100 (소수점 2자리 반올림)
  const sellPoint = Math.round(averagePrice * (1 + starPercentage / 100) * 100) / 100

  // 매수 포인트: 매도 포인트 - 0.01
  const buyPoint = Math.round((sellPoint - 0.01) * 100) / 100

  // LOC 매수 수량 계산
  // 1회 구매 금액을 반으로 나누어 각각 평단가로 나눔 (소수점 버림)
  const halfAmount = tryAmount / 2
  const locAverageQuantity = averagePrice > 0 ? Math.floor(halfAmount / averagePrice) : 0
  const locStarQuantity = averagePrice > 0 ? Math.floor(halfAmount / averagePrice) : 0

  // 매도 수량 계산 (전체 수량의 25%와 나머지 75%)
  const quarterSellShares = Math.floor(round.remainingQuantity / 4)
  const remainingSellShares = round.remainingQuantity - quarterSellShares

  return {
    tryAmount,
    tValue,
    starPercentage,
    state,
    averagePrice,
    buyPoint,
    sellPoint,
    locAverageQuantity,
    locStarQuantity,
    quarterSellShares,
    remainingSellShares,
    currentInvestedAmount
  }
}

/**
 * 특정 가격 기준 퍼센티지 적용 가격 도출 (소수점 2자리 반올림)
 */
export function applyPercentage(price: number, percentage: number): number {
  const adjusted = price * (1 + percentage / 100)
  return Math.round(adjusted * 100) / 100
}
