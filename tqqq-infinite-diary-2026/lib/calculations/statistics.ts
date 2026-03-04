import { Round, Statistics } from "@/types"
import { max } from "lodash"

/**
 * 기초 통계 계산
 */
export function calculateStatistics(rounds: Round[]): Statistics {
  const completedRounds = rounds.filter((r) => r.status === "completed")
  const activeRounds = rounds.filter((r) => r.status === "active")

  const totalRounds = rounds.length
  const completedCount = completedRounds.length
  const activeCount = activeRounds.length

  if (completedCount === 0) {
    return {
      totalRounds,
      completedRounds: completedCount,
      activeRounds: activeCount,
      averageProfitRate: 0,
      maxProfitRate: 0,
      maxProfitRound: 0,
      minProfitRate: 0,
      minProfitRound: 0,
      winRate: 0,
    }
  }

  const profitRates = completedRounds
    .map((r) => r.profitRate || 0)
    .filter((rate) => rate !== undefined)

  const averageProfitRate =
    profitRates.reduce((sum, rate) => sum + rate, 0) / profitRates.length

  const maxProfitRate = Math.max(...profitRates)
  const minProfitRate = Math.min(...profitRates)

  const maxProfitRound =
    completedRounds.find((r) => r.profitRate === maxProfitRate)?.roundNumber || 0
  const minProfitRound =
    completedRounds.find((r) => r.profitRate === minProfitRate)?.roundNumber || 0

  const winningRounds = profitRates.filter((rate) => rate > 0).length
  const winRate = (winningRounds / completedCount) * 100

  return {
    totalRounds,
    completedRounds: completedCount,
    activeRounds: activeCount,
    averageProfitRate,
    maxProfitRate,
    maxProfitRound,
    minProfitRate,
    minProfitRound,
    winRate,
  }
}

/**
 * 고급 통계 계산
 */
export function calculateAdvancedStatistics(rounds: Round[]): Partial<Statistics> {
  const completedRounds = rounds.filter((r) => r.status === "completed")

  if (completedRounds.length === 0) {
    return {}
  }

  const profitRates = completedRounds
    .map((r) => r.profitRate || 0)
    .filter((rate) => rate !== undefined)

  const profitAmounts = completedRounds
    .map((r) => r.profitAmount || 0)
    .filter((amount) => amount !== undefined)

  // 표준편차 계산
  const standardDeviation = calculateStandardDeviation(profitRates)

  // MDD 계산
  const maxDrawdown = calculateMDD(rounds)

  // 평균 수익/손실 계산
  const profits = profitAmounts.filter((amount) => amount > 0)
  const losses = profitAmounts.filter((amount) => amount < 0)

  const averageProfit =
    profits.length > 0
      ? profits.reduce((sum, p) => sum + p, 0) / profits.length
      : 0

  const averageLoss =
    losses.length > 0
      ? losses.reduce((sum, l) => sum + l, 0) / losses.length
      : 0

  // 손익비
  const profitLossRatio =
    averageLoss !== 0 ? Math.abs(averageProfit / averageLoss) : 0

  return {
    standardDeviation,
    maxDrawdown,
    averageProfit,
    averageLoss: Math.abs(averageLoss),
    profitLossRatio,
  }
}

/**
 * 표준편차 계산
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const squaredDifferences = values.map((val) => Math.pow(val - mean, 2))
  const variance =
    squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length

  return Math.sqrt(variance)
}

/**
 * 최대 손실폭 (MDD) 계산
 */
function calculateMDD(rounds: Round[]): number {
  if (rounds.length === 0) return 0

  let peak = -Infinity
  let maxDrawdown = 0

  rounds.forEach((round) => {
    const profitRate = round.profitRate || 0

    if (profitRate > peak) {
      peak = profitRate
    }

    const drawdown = peak - profitRate
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  })

  return maxDrawdown
}
