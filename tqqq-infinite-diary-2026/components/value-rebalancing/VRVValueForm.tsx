"use client"

import { useState } from "react"
import { addVRRecord } from "@/lib/data/vr-storage"
import { ValueRebalancingCalculator } from "@/lib/calculations/vr-calculator"
import { VRInitialPortfolio } from "@/types"
import { addVRRecordWithRound } from "@/lib/data/vr-round-manager"

interface VRVValueFormProps {
  initialPortfolio: VRInitialPortfolio
  previousRecord: { vValue: number; shares: number; pool: number } | null
  onComplete: () => void
}

export function VRVValueForm({ initialPortfolio, previousRecord, onComplete }: VRVValueFormProps) {
  // 첫번째 레코드인 경우 초기 포트폴리오 값 사용, 이후에는 이전 레코드 값 사용
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [price, setPrice] = useState("")
  const [shares, setShares] = useState(
    previousRecord?.shares.toString() || initialPortfolio.initialShares.toString()
  )
  const [pool, setPool] = useState(
    previousRecord?.pool.toString() || initialPortfolio.initialCash.toString()
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const priceNum = parseFloat(price)
      const sharesNum = parseInt(shares)
      const poolNum = parseFloat(pool)

      // 검증
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error("유효한 종가를 입력해주세요.")
      }
      if (isNaN(sharesNum) || sharesNum < 0) {
        throw new Error("유효한 주식수를 입력해주세요.")
      }
      if (isNaN(poolNum) || poolNum < 0) {
        throw new Error("유효한 현금을 입력해주세요.")
      }

      // 계산
      const eValue = ValueRebalancingCalculator.calculateEvaluation(priceNum, sharesNum)
      const previousV = previousRecord?.vValue || null
      const vValue = ValueRebalancingCalculator.calculateV(eValue, poolNum, previousV)
      const [signal] = ValueRebalancingCalculator.determineSignal(previousV || vValue, vValue)

      // 벤치마크 계산
      const benchmarkShares = ValueRebalancingCalculator.calculateBenchmarkShares(
        initialPortfolio.totalInvested,
        initialPortfolio.averagePrice
      )
      const benchmarkValue = ValueRebalancingCalculator.calculateBenchmarkValue(
        benchmarkShares,
        priceNum
      )

      // 기록 저장 (차수 자동 계산 포함)
      console.log('=== About to call addVRRecordWithRound ===')
      await addVRRecordWithRound({
        date,
        price: priceNum,
        shares: sharesNum,
        pool: poolNum,
        eValue,
        vValue,
        signal,
        benchmarkShares,
        benchmarkValue,
        createdAt: new Date().toISOString(),
      })
      console.log('=== addVRRecordWithRound completed ===')

      // 완료 콜백
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "계산에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 미리보기 계산
  const priceNum = parseFloat(price)
  const sharesNum = parseInt(shares)
  const poolNum = parseFloat(pool)

  const eValue =
    !isNaN(priceNum) && !isNaN(sharesNum)
      ? ValueRebalancingCalculator.calculateEvaluation(priceNum, sharesNum)
      : 0

  const previousV = previousRecord?.vValue || null
  const vValue =
    eValue > 0 && !isNaN(poolNum)
      ? ValueRebalancingCalculator.calculateV(eValue, poolNum, previousV)
      : 0

  const [signal, changeRate] =
    vValue > 0 && previousV
      ? ValueRebalancingCalculator.determineSignal(previousV, vValue)
      : ["HOLD", 0]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        V값 계산
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 날짜 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            날짜
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* TQQQ 종가 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            TQQQ 종가 $
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="예: 45.32"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* 현재 주식수 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            현재 주식수 (주)
          </label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* 현재 현금 (Pool) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            현재 현금 (Pool) $
          </label>
          <input
            type="number"
            step="0.01"
            value={pool}
            onChange={(e) => setPool(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* 계산 결과 미리보기 */}
        {vValue > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">평가금액 (E)</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ${eValue.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">이전 V값</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {previousV ? `$${previousV.toFixed(2)}` : "-"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">새 V값 (V2)</span>
              <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                ${vValue.toFixed(2)}
              </span>
            </div>
            {previousV && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">변화율</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {ValueRebalancingCalculator.formatChangeRate(changeRate)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">신호</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  signal === "BUY"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : signal === "SELL"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {signal === "BUY" ? "매수" : signal === "SELL" ? "매도" : "대기"}
              </span>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting || vValue === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "저장 중..." : "V값 계산 및 저장"}
        </button>
      </form>
    </div>
  )
}
