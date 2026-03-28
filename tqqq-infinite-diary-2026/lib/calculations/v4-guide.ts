import { Round, Trade } from "@/types"

export type V4GuideMode = "일반모드" | "리버스모드"
export type V4GuideState = "normalFirstHalf" | "normalSecondHalf" | "reverseFirstDay" | "reverseNextDays" | "completed"

export interface V4GuideInfo {
  mode: V4GuideMode
  state: V4GuideState
  tValue: number
  starPercentage: number
  tryAmount: number
  averagePrice: number
  starPoint: number // 별지점 가격
  
  sellPoint: number // 지정가 매도 목표가 (TQQQ +15%, SOXL +20%)
  locBuyQuantityAverage?: number // 전반전 평단 LOC 수량
  locBuyQuantityStar?: number // 전반/후반 별지점 LOC 수량
  
  quarterSellShares?: number // 일반모드 쿼터 매도 수량
  remainingSellShares?: number // 일반모드 지정가 매도 수량
  
  reverseSellShares?: number // 리버스모드 매도 시도 수량
  reverseBuyAmount?: number // 리버스모드 매수 시도 금액 (쿼터매수)
  
  splitCount: number // 20, 30, 40 분할 (기본 40 설정)
  remainingBudget: number // 현재 잔금
}

/**
 * 1. 거래 내역을 시간순으로 정렬하여 현재의 T값과 잔금을 구하는 함수
 */
export function calculateV4State(round: Round, splitCount: number = 40): { tValue: number, remainingBudget: number, mode: V4GuideMode } {
  let t = 0
  const initialBudget = round.totalSeedAmount || (round.buys[0] ? round.buys[0].amount * splitCount : 0)
  let remainingBudget = initialBudget
  let mode: V4GuideMode = round.mode as V4GuideMode || "일반모드"

  // 모든 거래를 날짜순으로 정렬
  const allTrades: Trade[] = [...round.buys, ...round.sells].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  // 날짜별 그룹화하여 같은 날 일어난 매수/매도를 분석
  const tradesByDate: Record<string, Trade[]> = {}
  allTrades.forEach(trade => {
    if (!tradesByDate[trade.date]) tradesByDate[trade.date] = []
    tradesByDate[trade.date].push(trade)
  })

  const dates = Object.keys(tradesByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  // T값 리플레이 로직
  dates.forEach(date => {
    const dailyTrades = tradesByDate[date]
    const buys = dailyTrades.filter(t => t.type === 'buy')
    const sells = dailyTrades.filter(t => t.type === 'sell')
    
    // 잔금 업데이트
    buys.forEach(b => remainingBudget -= b.amount)
    sells.forEach(s => remainingBudget += s.amount)

    if (mode === "일반모드") {
      // 일반모드 T값 변동 규칙:
      // 쿼터매도 (전체 물량의 약 1/4 매도)
      if (sells.length > 0) {
        // 정확히 1/4 매도인지 판별하는 로직 (단순화: 매도 발생 시 전체 지정가 매도(종료)가 아니면 쿼터매도로 간주)
        // 종료 매도가 아니면 T = T * 0.75
        // (단순화를 위해 일단 매도가 있으면 T * 0.75로 계산, 차후 고도화 가능)
        t = t * 0.75
      }
      
      if (buys.length > 0) {
        // 전반전 0.5 매수 vs 1회 분량 매수
        if (t < splitCount / 2 && buys.length === 1) {
          // 절반만 체결되었을 경우 추정 (단순화: 0.5 더함)
          t += 0.5
        } else {
          t += 1
        }
      }

      // 원금 소진 (T > 분할수 - 1) 체크하여 리버스모드 진입
      if (t > splitCount - 1) {
        mode = "리버스모드"
      }
    } else {
      // 리버스모드
      if (sells.length > 0) {
        t = splitCount === 20 ? t * 0.9 : t * 0.95
      }
      if (buys.length > 0) {
        t = splitCount === 20 ? t + (20 - t) * 0.25 : t + (40 - t) * 0.25
      }
      
      // 복귀 조건 체결(종가가 -15%/-20% 이상)은 여기서 정확히 계산하기 어려우므로,
      // round.mode가 일반모드로 강제 변경되어 있으면 그걸 따르도록 처리해야하지만, 
      // 이 리플레이는 상태만 추정하는 용도로 씁니다.
    }
  })

  // Round 객체에 명시된 모드가 우선
  if (round.mode === "리버스모드") mode = "리버스모드"
  else if (round.mode === "일반모드" && t <= splitCount - 1) mode = "일반모드"

  return { 
    tValue: Math.round(t * 100) / 100, 
    remainingBudget, 
    mode 
  }
}

/**
 * 2. 별지점(★) % 계산 (일반모드)
 */
export function calculateStarPercentage(tValue: number, symbol: string, splitCount: number): number {
  if (symbol.toUpperCase().includes("TQQQ")) {
    return splitCount === 20 ? 15 - 1.5 * tValue : 15 - 0.75 * tValue
  } else {
    return splitCount === 20 ? 20 - 2 * tValue : 20 - tValue
  }
}

/**
 * 3. 별지점 가격 계산
 */
export function calculateStarPoint(averagePrice: number, starPercentage: number): number {
  return Math.round(averagePrice * (1 + starPercentage / 100) * 100) / 100
}

/**
 * 4. 전체 V4.0 가이드 정보 추출
 */
export function getV4GuideInfo(round: Round): V4GuideInfo {
  // 총 차수 계산 (기본값 40)
  const tryAmountBase = round.tryAmount || (round.buys[0] ? round.buys[0].amount : 0)
  const splitCount: number = (round.totalSeedAmount && tryAmountBase > 0)
    ? (round.totalSeedAmount / tryAmountBase)
    : 40

  const { tValue, remainingBudget, mode } = calculateV4State(round, splitCount)
  const averagePrice = round.averageBuyPrice || 0
  const isTQQQ = round.symbol.toUpperCase().includes("TQQQ")
  
  if (round.status === "completed" || round.remainingQuantity === 0) {
    return {
      mode: "일반모드", state: "completed", tValue, starPercentage: 0,
      tryAmount: 0, averagePrice, starPoint: 0, sellPoint: 0, splitCount, remainingBudget
    }
  }

  // 1회 시도액 계산: 현재 잔금 / (전체 분할수 - T)
  const tryAmount = Math.max(0, remainingBudget / Math.max(1, (splitCount - tValue)))

  if (mode === "일반모드") {
    const starPercentage = calculateStarPercentage(tValue, round.symbol, splitCount)
    const starPoint = calculateStarPoint(averagePrice, starPercentage)
    const sellPoint = Math.round(averagePrice * (1 + (isTQQQ ? 0.15 : 0.20)) * 100) / 100
    const state: V4GuideState = tValue < splitCount / 2 ? "normalFirstHalf" : "normalSecondHalf"
    
    const halfAmount = tryAmount / 2
    const locBuyQuantityAverage = averagePrice > 0 ? Math.floor(halfAmount / averagePrice) : 0
    const locBuyQuantityStar = starPoint > 0 ? Math.floor(halfAmount / starPoint) : 0
    
    const quarterSellShares = Math.floor(round.remainingQuantity / 4)
    const remainingSellShares = round.remainingQuantity - quarterSellShares
    
    return {
      mode, state, tValue, starPercentage, tryAmount, averagePrice, starPoint, sellPoint,
      locBuyQuantityAverage, locBuyQuantityStar, quarterSellShares, remainingSellShares,
      splitCount, remainingBudget
    }
  } else {
    // 리버스모드
    // 리버스모드 별지점은 직전 5거래일 종가의 평균이 필요하나, 현재 API 구조상 평균단가를 임시로 사용
    // 실제 구현시 차트 데이터를 불러와서 별지점을 덮어써야 함.
    const starPoint = averagePrice 
    
    // 현재 리버스 첫날인지 둘째날인지 구별하기 위한 상태 추정 (전날 매도가 리버스모드에서 일어났는지)
    const state: V4GuideState = "reverseNextDays" // 일단 둘째날 이후로 가정 (첫날 무조건 매도는 사용자가 수동입력)
    
    const divisor = splitCount === 20 ? 10 : 20
    const reverseSellShares = Math.floor(round.remainingQuantity / divisor)
    const reverseBuyAmount = remainingBudget / 4
    const sellPoint = Math.round(averagePrice * (1 + (isTQQQ ? 0.15 : 0.20)) * 100) / 100

    return {
      mode, state, tValue, starPercentage: 0, tryAmount: 0, averagePrice, starPoint, sellPoint,
      reverseSellShares, reverseBuyAmount, splitCount, remainingBudget
    }
  }
}
