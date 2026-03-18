"use client"

import { useState } from "react"
import { setInitialPortfolio } from "@/lib/data/vr-storage"
import { ValueRebalancingCalculator } from "@/lib/calculations/vr-calculator"
import { addVRRecordWithRound } from "@/lib/data/vr-round-manager"

interface VRInitialPortfolioFormProps {
  onComplete: () => void
}

export function VRInitialPortfolioForm({ onComplete }: VRInitialPortfolioFormProps) {
  const [initialDate, setInitialDate] = useState(new Date().toISOString().split("T")[0])
  const [initialCash, setInitialCash] = useState("")
  const [initialShares, setInitialShares] = useState("")
  const [averagePrice, setAveragePrice] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const cash = parseFloat(initialCash)
      const shares = parseInt(initialShares)
      const price = parseFloat(averagePrice)

      // 검증
      if (isNaN(cash) || cash < 0) {
        throw new Error("유효한 초기 현금을 입력해주세요.")
      }
      if (isNaN(shares) || shares < 0) {
        throw new Error("유효한 주식수를 입력해주세요.")
      }
      if (isNaN(price) || price <= 0) {
        throw new Error("유효한 평단가를 입력해주세요.")
      }

      // 초기 포트폴리오 저장
      await setInitialPortfolio(initialDate, cash, shares, price)

      console.log('=== Creating first V record ===')

      // 첫 번째 V값 계산 (초기 포트폴리오로부터)
      const eValue = ValueRebalancingCalculator.calculateEvaluation(price, shares)
      const vValue = ValueRebalancingCalculator.calculateV(eValue, cash, null) // 첫 번째이므로 previousV는 null
      const signal: "BUY" | "SELL" | "HOLD" = "HOLD" // 첫 번째이므로 HOLD

      // 벤치마크 계산
      const totalInvested = ValueRebalancingCalculator.calculateTotalInvested(cash, shares, price)
      const benchmarkShares = ValueRebalancingCalculator.calculateBenchmarkShares(totalInvested, price)
      const benchmarkValue = ValueRebalancingCalculator.calculateBenchmarkValue(benchmarkShares, price)

      console.log('First V record:', { date: initialDate, price, shares, pool: cash, eValue, vValue, signal })

      // 첫 번째 리밸런싱 기록 저장 (차수 자동 계산 포함)
      await addVRRecordWithRound({
        date: initialDate,
        price,
        shares,
        pool: cash,
        eValue,
        vValue,
        signal,
        benchmarkShares,
        benchmarkValue,
        createdAt: new Date().toISOString(),
      })

      console.log('=== First V record created ===')

      // 완료 콜백
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "설정에 실패했습니다.")
      console.error('Error creating initial portfolio:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalInvested =
    initialCash && initialShares && averagePrice
      ? (
          parseFloat(initialCash) +
          parseInt(initialShares) * parseFloat(averagePrice)
        ).toFixed(2)
      : "0.00"

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        밸류 리밸런싱 시작하기
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          초기 포트폴리오 설정
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          밸류 리밸런싱을 시작하기 위해 초기 포트폴리오 정보를 입력하세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 초기 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              초기 날짜
            </label>
            <input
              type="date"
              value={initialDate}
              onChange={(e) => setInitialDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* 초기 현금 (Pool) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              초기 현금 (Pool) $
            </label>
            <input
              type="number"
              step="0.01"
              value={initialCash}
              onChange={(e) => setInitialCash(e.target.value)}
              placeholder="예: 100000"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* 초기 주식수 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              초기 주식수 (주)
            </label>
            <input
              type="number"
              value={initialShares}
              onChange={(e) => setInitialShares(e.target.value)}
              placeholder="예: 100"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* 평단가 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              평단가 $
            </label>
            <input
              type="number"
              step="0.01"
              value={averagePrice}
              onChange={(e) => setAveragePrice(e.target.value)}
              placeholder="예: 40.50"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* 총 투자 금액 (자동 계산) */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              총 투자 금액 (자동 계산)
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${totalInvested}
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : "설정 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
