import { VRSignalType } from "@/types"

/**
 * 밸류 리밸런싱 계산기
 * 라오어 밸류 리밸런싱 공식 구현
 */
export class ValueRebalancingCalculator {
  // 상수
  private static readonly G = 10 // G값 고정
  private static readonly SQRT_G = Math.sqrt(10) // √10 ≈ 3.162
  private static readonly SIGNAL_THRESHOLD = 0.15 // ±15%

  /**
   * V값 계산
   * v2 = v1 + (pool/10) + (e-v1)/(2*√10)
   *
   * @param eValue - 평가금액 (E = 종가 × 주식수)
   * @param pool - 현금
   * @param previousV - 이전 V값 (초기값이 없는 경우 null)
   * @returns 계산된 V 값
   */
  static calculateV(
    eValue: number,
    pool: number,
    previousV: number | null
  ): number {
    if (previousV === null) {
      // 초기값인 경우: V = E + (pool/G)
      const vValue = eValue + pool / this.G
      return Math.round(vValue * 100) / 100
    }

    // 라오어 밸류 리밸런싱 공식
    // v2 = v1 + (pool/10) + (e-v1)/(2*√10)
    const vValue = previousV + pool / this.G + (eValue - previousV) / (2 * this.SQRT_G)
    return Math.round(vValue * 100) / 100
  }

  /**
   * 평가금액 계산
   * E = 종가 × 주식수
   *
   * @param price - TQQQ 종가
   * @param shares - 주식수
   * @returns 평가금액
   */
  static calculateEvaluation(price: number, shares: number): number {
    const eValue = price * shares
    return Math.round(eValue * 100) / 100
  }

  /**
   * 리밸런싱 신호 판별
   * 현재 V가 이전 V 대비 ±15% 범위를 벗어나는지 확인
   *
   * @param previousV - 이전 V값
   * @param currentV - 현재 V값
   * @returns [신호, 변화율]
   */
  static determineSignal(
    previousV: number,
    currentV: number
  ): [VRSignalType, number] {
    if (previousV === 0) {
      return ["HOLD", 0.0]
    }

    const changeRate = (currentV - previousV) / previousV

    if (changeRate > this.SIGNAL_THRESHOLD) {
      return ["BUY", changeRate]
    }

    if (changeRate < -this.SIGNAL_THRESHOLD) {
      return ["SELL", changeRate]
    }

    return ["HOLD", changeRate]
  }

  /**
   * 변화율을 포맷팅
   *
   * @param rate - 변화율 (소수점, 예: 0.15)
   * @returns 포맷팅된 문자열 (예: "+15.00%")
   */
  static formatChangeRate(rate: number): string {
    const sign = rate >= 0 ? "+" : ""
    return `${sign}${(rate * 100).toFixed(2)}%`
  }

  /**
   * 벤치마크 주식수 계산
   * 초기 전액 TQQQ 투자 시나리오
   *
   * @param totalInvested - 총 투자 금액
   * @param initialPrice - 초기 종가
   * @returns 벤치마크 주식수
   */
  static calculateBenchmarkShares(totalInvested: number, initialPrice: number): number {
    if (initialPrice === 0) return 0
    const shares = totalInvested / initialPrice
    return Math.round(shares * 100) / 100
  }

  /**
   * 벤치마크 가치 계산
   *
   * @param benchmarkShares - 벤치마크 주식수
   * @param currentPrice - 현재 종가
   * @returns 벤치마크 가치
   */
  static calculateBenchmarkValue(benchmarkShares: number, currentPrice: number): number {
    const value = benchmarkShares * currentPrice
    return Math.round(value * 100) / 100
  }

  /**
   * VR vs 벤치마크 차이 계산
   *
   * @param vrValue - VR 포트폴리오 가치 (E + Pool)
   * @param benchmarkValue - 벤치마크 가치
   * @returns [차이금액, 차이율]
   */
  static calculateDifference(
    vrValue: number,
    benchmarkValue: number
  ): [number, number] {
    const difference = vrValue - benchmarkValue
    const differenceRate = benchmarkValue !== 0 ? (difference / benchmarkValue) * 100 : 0

    return [
      Math.round(difference * 100) / 100,
      Math.round(differenceRate * 100) / 100,
    ]
  }

  /**
   * 차수 기간 계산 (첫 번째 기록 날짜를 기준으로 2주 단위)
   *
   * @param recordDate - 기준 날짜 (YYYY-MM-DD)
   * @param firstRecordDate - 첫 번째 기록 날짜
   * @returns [start_date, end_date, round_number]
   */
  static calculateRoundPeriod(
    recordDate: string,
    firstRecordDate: string
  ): [string, string, number] {
    const firstRecord = new Date(firstRecordDate)

    // 첫 번째 차수 시작일: 첫 번째 기록일
    const firstRoundStart = new Date(firstRecord)

    // 거래 날짜
    const transDate = new Date(recordDate)

    // 첫 번째 차수 종료일: 시작일 + 13일 (2주)
    const firstRoundEnd = new Date(firstRoundStart)
    firstRoundEnd.setDate(firstRoundEnd.getDate() + 13)

    let roundNumber: number
    let startDate: Date
    let endDate: Date

    // 거래일이 첫 번째 차수 범위 내인지 확인
    if (transDate <= firstRoundEnd) {
      roundNumber = 1
      startDate = firstRoundStart
      endDate = firstRoundEnd
    } else {
      // 첫 번째 차수 이후: 몇 번째 차수인지 계산
      const daysFromFirstStart = Math.floor((transDate.getTime() - firstRoundStart.getTime()) / (1000 * 60 * 60 * 24))
      roundNumber = Math.floor(daysFromFirstStart / 14) + 1

      // 해당 차수의 시작일과 종료일
      startDate = new Date(firstRoundStart)
      startDate.setDate(startDate.getDate() + (roundNumber - 1) * 14)

      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 13)
    }

    return [
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
      roundNumber,
    ]
  }

  /**
   * 차수 ID 생성
   *
   * @param recordDate - 기록 날짜
   * @param firstRecordDate - 첫 번째 기록 날짜
   * @returns 차수 ID (예: "1차수", "2차수")
   */
  static getRoundId(recordDate: string, firstRecordDate: string): string {
    const [, , roundNumber] = this.calculateRoundPeriod(recordDate, firstRecordDate)
    return `${roundNumber}차수`
  }

  /**
   * 총 투자 금액 계산
   *
   * @param initialCash - 초기 현금
   * @param initialShares - 초기 주식수
   * @param averagePrice - 평단가
   * @returns 총 투자 금액
   */
  static calculateTotalInvested(
    initialCash: number,
    initialShares: number,
    averagePrice: number
  ): number {
    const totalInvested = initialCash + initialShares * averagePrice
    return Math.round(totalInvested * 100) / 100
  }

  /**
   * VR 총 자산 계산
   *
   * @param eValue - 평가금액
   * @param pool - 현금
   * @returns VR 총 자산
   */
  static calculateVRTotalValue(eValue: number, pool: number): number {
    const totalValue = eValue + pool
    return Math.round(totalValue * 100) / 100
  }
}
