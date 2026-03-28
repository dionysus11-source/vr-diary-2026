import { Round, Trade } from "@/types"

/**
 * 평균 매수 단가 계산 (이동평균법 지원: 매도 시 남은 평단가 유지, 소수점 셋째 자리에서 반올림)
 */
export function calculateAverageBuyPrice(buys: Trade[], sells: Trade[] = []): number {
  if (buys.length === 0) return 0
  
  // 모든 거래를 시간순서(오름차순)로 정렬
  // 날짜가 같을 경우 보통 매수 후 매도가 일어남을 가정하여 우선순위 부여
  const allTrades = [
    ...buys.map(b => ({ ...b, sortPriority: 0 })),
    ...sells.map(s => ({ ...s, sortPriority: 1 }))
  ].sort((a, b) => {
    const timeA = new Date(a.date).getTime()
    const timeB = new Date(b.date).getTime()
    if (timeA === timeB) {
      return a.sortPriority - b.sortPriority
    }
    return timeA - timeB
  })

  let currentQuantity = 0
  let currentTotalCost = 0

  for (const trade of allTrades) {
    if (trade.type === "buy") {
      currentQuantity += trade.quantity
      currentTotalCost += trade.amount
    } else if (trade.type === "sell") {
      if (currentQuantity > 0) {
        const avgPrice = currentTotalCost / currentQuantity
        currentQuantity -= trade.quantity
        if (currentQuantity <= 0) {
          currentQuantity = 0
          currentTotalCost = 0
        } else {
          currentTotalCost = currentQuantity * avgPrice
        }
      }
    }
  }

  if (currentQuantity > 0) {
    const finalAvg = currentTotalCost / currentQuantity
    return finalAvg // 별도 반올림 없이 원본 소수점 그대로 반환 (원금 계산의 정확도를 위해, 화면 표출 시에만 formatPrice가 반올림함)
  }

  return 0
}
/**
 * 회차 총 매수 수량 계산
 */
export function calculateTotalBuyQuantity(buys: Trade[]): number {
  return buys.reduce((sum, buy) => sum + buy.quantity, 0)
}

/**
 * 회차 총 매도 수량 계산
 */
export function calculateTotalSellQuantity(sells: Trade[]): number {
  return sells.reduce((sum, sell) => sum + sell.quantity, 0)
}

/**
 * 회차 총 매수액 계산
 */
export function calculateTotalBuyAmount(buys: Trade[]): number {
  return buys.reduce((sum, buy) => sum + buy.amount, 0)
}

/**
 * 회차 총 매도액 계산
 */
export function calculateTotalSellAmount(sells: Trade[]): number {
  return sells.reduce((sum, sell) => sum + sell.amount, 0)
}

/**
 * 실현 수익금 계산 (분할 매도 지원)
 * 각 매도마다 (매도 가격 - 평균 매수가) × 수량으로 계산
 */
export function calculateRealizedProfit(
  sells: Trade[],
  averageBuyPrice: number
): number {
  if (sells.length === 0) return 0

  return sells.reduce((sum, sell) => {
    const profitPerUnit = sell.price - averageBuyPrice
    return sum + (profitPerUnit * sell.quantity)
  }, 0)
}

/**
 * 실현 수익률 계산
 * 총 매도액 / (총 매도 수량 × 평균 매수가) - 1
 */
export function calculateRealizedProfitRate(
  sells: Trade[],
  averageBuyPrice: number
): number {
  if (sells.length === 0 || averageBuyPrice === 0) return 0

  const totalSellAmount = calculateTotalSellAmount(sells)
  const totalSellQuantity = calculateTotalSellQuantity(sells)
  const totalBuyCost = totalSellQuantity * averageBuyPrice

  if (totalBuyCost === 0) return 0
  return ((totalSellAmount - totalBuyCost) / totalBuyCost) * 100
}

/**
 * 미실현 수익금 계산
 */
export function calculateUnrealizedProfit(
  remainingQuantity: number,
  currentPrice: number,
  averageBuyPrice: number
): number {
  if (remainingQuantity === 0) return 0
  return (currentPrice - averageBuyPrice) * remainingQuantity
}

/**
 * 미실현 수익률 계산
 */
export function calculateUnrealizedProfitRate(
  currentPrice: number,
  averageBuyPrice: number
): number {
  if (averageBuyPrice === 0) return 0
  return ((currentPrice - averageBuyPrice) / averageBuyPrice) * 100
}

/**
 * 회차 데이터 업데이트 (계산된 값들)
 * 분할 매도를 지원하도록 수정
 */
export function updateRoundCalculations(
  round: Round,
  currentPrice?: number
): Round {
  const totalBuyQuantity = calculateTotalBuyQuantity(round.buys)
  const totalSellQuantity = calculateTotalSellQuantity(round.sells)
  const remainingQuantity = totalBuyQuantity - totalSellQuantity

  const totalBuyAmount = calculateTotalBuyAmount(round.buys)
  const totalSellAmount = calculateTotalSellAmount(round.sells)
  const averageBuyPrice = calculateAverageBuyPrice(round.buys, round.sells)

  // 파라미터로 전달된 currentPrice가 있으면 사용, 없으면 round.currentPrice 사용
  const priceToUse = currentPrice !== undefined ? currentPrice : round.currentPrice

  // 실현 수익
  const realizedProfitAmount = calculateRealizedProfit(round.sells, averageBuyPrice)
  const realizedProfitRate = calculateRealizedProfitRate(round.sells, averageBuyPrice)

  // 미실현 수익 (남은 수량이 있는 경우만)
  let unrealizedProfitAmount: number | undefined
  let unrealizedProfitRate: number | undefined

  if (remainingQuantity > 0 && priceToUse) {
    unrealizedProfitAmount = calculateUnrealizedProfit(
      remainingQuantity,
      priceToUse,
      averageBuyPrice
    )
    unrealizedProfitRate = calculateUnrealizedProfitRate(priceToUse, averageBuyPrice)
  }

  // 총 수익
  const profitAmount = realizedProfitAmount + (unrealizedProfitAmount || 0)

  // 총 수익률 (전체 투자액 대비)
  let profitRate: number | undefined
  if (totalBuyAmount > 0) {
    profitRate = (profitAmount / totalBuyAmount) * 100
  }

  // 상태 업데이트: 전부 매도하면 completed
  let status = round.status
  if (remainingQuantity === 0 && totalSellQuantity > 0) {
    status = "completed"
  }

  return {
    ...round,
    status,
    totalBuyQuantity,
    totalSellQuantity,
    remainingQuantity,
    totalBuyAmount,
    totalSellAmount,
    netSellAmount: totalSellAmount - (totalSellQuantity * averageBuyPrice),
    averageBuyPrice,
    currentPrice: priceToUse,
    profitAmount,
    profitRate,
    realizedProfitAmount,
    realizedProfitRate,
    unrealizedProfitAmount,
    unrealizedProfitRate,
  }
}

/**
 * 보유 기간 계산 (일수)
 */
export function calculateHoldingPeriod(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 연환산 수익률 계산
 */
export function calculateAnnualizedProfitRate(
  profitRate: number,
  holdingDays: number
): number {
  if (holdingDays <= 0) return 0
  const rate = profitRate / 100
  const annualized = (Math.pow(1 + rate, 365 / holdingDays) - 1) * 100
  return annualized
}
