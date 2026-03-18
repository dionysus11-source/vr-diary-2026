/**
 * 밸류 리밸싱 매수/매도 추천 계산기
 */
export class VRRecommendationCalculator {
  /**
   * 매수/매도 추천 계획 계산
   *
   * @param vValue - 현재 V값
   * @param shares - 현재 주식수
   * @param pool - 현재 Pool
   * @param sharesPerOrder - 한 주문당 주식수 (기본값: 1)
   * @returns BUY/SELL 시나리오 계획
   */
  static calculateRecommendation(
    vValue: number,
    shares: number,
    pool: number,
    sharesPerOrder: number = 1,
    poolLimitPercent: number = 80
  ) {
    // V값 ±15% 계산
    const vValueMin = vValue * 0.85 // 매수 밴드
    const vValueMax = vValue * 1.15 // 매도 밴드

    // Pool 한도 (전체 Pool의 지정한 %만 사용하도록 제한)
    const poolLimit = pool * (poolLimitPercent / 100)

    // BUY 시나리오 계획 (최소 밴드)
    const buyPlan = this.createBuyPlan(
      vValueMin,
      shares,
      pool,
      poolLimit,
      sharesPerOrder
    )

    // SELL 시나리오 계획 (최대 밴드)
    const sellPlan = this.createSellPlan(
      vValueMax,
      shares,
      pool,
      sharesPerOrder
    )

    return {
      inputSummary: {
        vValue,
        vValueMin,
        vValueMax,
        shares,
        pool,
        poolLimit,
        sharesPerOrder,
      },
      buyScenario: buyPlan,
      sellScenario: sellPlan,
    }
  }

  /**
   * BUY 시나리오 계획 (최소 밴드)
   */
  private static createBuyPlan(
    vValue: number,
    shares: number,
    pool: number,
    poolLimit: number,
    sharesPerOrder: number
  ) {
    const orders: Array<{
      orderNum: number
      price: number
      shares: number
      totalAmount: number
      poolAfter: number
      sharesAfter: number
    }> = []

    let currentShares = shares
    const initialPool = pool
    const availablePool = Math.min(pool, poolLimit)
    let currentPool = availablePool
    let orderNum = 1

    // Pool 한도 내에서 N주씩 매수
    while (currentPool > 0) {
      // 1주당 가격 = V값 / 현재 주식수
      const pricePerShare = vValue / currentShares

      // N주 매수 가격
      const totalCost = pricePerShare * sharesPerOrder

      // Pool 한도 체크
      if (currentPool < totalCost) {
        break
      }

      // N주 매수
      currentPool -= totalCost
      currentShares += sharesPerOrder

      orders.push({
        orderNum,
        price: Math.round(pricePerShare * 100) / 100,
        shares: sharesPerOrder,
        totalAmount: Math.round(totalCost * 100) / 100,
        poolAfter: Math.round((initialPool - (availablePool - currentPool)) * 100) / 100,
        sharesAfter: Math.round(currentShares),
      })

      orderNum++

      // 안전장치: 무한 루프 방지
      if (orderNum > 10000) {
        break
      }
    }

    const totalSharesBought = orders.length * sharesPerOrder
    const totalUsed = availablePool - currentPool

    return {
      vValue,
      initialShares: shares,
      initialPool: pool,
      poolLimit,
      availablePool,
      sharesPerOrder,
      totalOrders: orders.length,
      totalSharesToBuy: totalSharesBought,
      totalUsed,
      finalPool: Math.round(initialPool - totalUsed),
      finalShares: Math.round(currentShares),
      orders,
    }
  }

  /**
   * SELL 시나리오 계획 (최대 밴드)
   */
  private static createSellPlan(
    vValue: number,
    shares: number,
    pool: number,
    sharesPerOrder: number
  ) {
    const orders: Array<{
      orderNum: number
      price: number
      shares: number
      totalAmount: number
      poolAfter: number
      sharesAfter: number
    }> = []

    let currentShares = shares
    let currentPool = pool
    let orderNum = 1

    // 보유 주식의 30%까지만 매도 (리밸런싱 원칙)
    const maxSellable = Math.floor(shares * 0.3)
    let soldCount = 0

    // 30% 범위 내에서 N주씩 매도
    while (soldCount < maxSellable && currentShares >= sharesPerOrder) {
      // 1주당 가격 = V값 / 현재 주식수
      const pricePerShare = vValue / currentShares

      // N주 매도 가격
      const totalAmount = pricePerShare * sharesPerOrder

      // N주 매도
      currentPool += totalAmount
      currentShares -= sharesPerOrder
      soldCount += sharesPerOrder

      orders.push({
        orderNum,
        price: Math.round(pricePerShare * 100) / 100,
        shares: sharesPerOrder,
        totalAmount: Math.round(totalAmount * 100) / 100,
        poolAfter: Math.round(currentPool * 100) / 100,
        sharesAfter: Math.round(currentShares),
      })

      orderNum++

      // 안전장치: 무한 루프 방지
      if (orderNum > 10000) {
        break
      }
    }

    const totalSharesSold = orders.length * sharesPerOrder

    return {
      vValue,
      initialShares: shares,
      initialPool: pool,
      sellRatio: 0.3,
      sharesPerOrder,
      totalOrders: orders.length,
      totalSharesToSell: totalSharesSold,
      finalPool: Math.round(currentPool * 100) / 100,
      orders,
    }
  }
}
