"use client"

import { VRRecord, VRInitialPortfolio } from "@/types"
import { ValueRebalancingCalculator } from "@/lib/calculations/vr-calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

interface BenchmarkComparisonChartProps {
  records: VRRecord[]
  initialPortfolio: VRInitialPortfolio
}

export function BenchmarkComparisonChart({
  records,
  initialPortfolio,
}: BenchmarkComparisonChartProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>VR vs 벤치마크 비교</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>아직 기록이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 날짜순 정렬
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date))

  // 벤치마크 계산
  const benchmarkShares = ValueRebalancingCalculator.calculateBenchmarkShares(
    initialPortfolio.totalInvested,
    initialPortfolio.averagePrice
  )

  // 데이터 추출
  const comparisonData = sortedRecords.map((record) => {
    const eValue = record.eValue
    const pool = record.pool
    const vrTotal = ValueRebalancingCalculator.calculateVRTotalValue(eValue, pool)
    const benchmarkValue = ValueRebalancingCalculator.calculateBenchmarkValue(
      benchmarkShares,
      record.price
    )

    return {
      date: record.date,
      vrTotal,
      benchmarkValue,
      difference: vrTotal - benchmarkValue,
      differenceRate: ((vrTotal - benchmarkValue) / benchmarkValue) * 100,
    }
  })

  // 차트 범위
  const allValues = comparisonData.flatMap((d) => [d.vrTotal, d.benchmarkValue])
  const minValue = Math.min(...allValues)
  const maxValue = Math.max(...allValues)
  const padding = (maxValue - minValue) * 0.1

  // 차트 높이
  const chartHeight = Math.max(300, comparisonData.length * 40)

  return (
    <Card>
      <CardHeader>
        <CardTitle>VR vs 벤치마크 비교</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div style={{ height: `${chartHeight}px` }} className="relative">
            {/* Y축 */}
            <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>${(maxValue + padding).toFixed(0)}</span>
              <span>${((maxValue + minValue) / 2).toFixed(0)}</span>
              <span>${(minValue - padding).toFixed(0)}</span>
            </div>

            {/* 차트 영역 */}
            <div className="ml-16 h-full relative border-l border-gray-200 dark:border-gray-700">
              {/* 0% 기준선 (초기 투자금액) */}
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-gray-400 dark:border-gray-500"
                style={{
                  top: `${((maxValue + padding - initialPortfolio.totalInvested) / (maxValue - minValue + 2 * padding)) * 100}%`,
                }}
              />

              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                {/* VR 라인 */}
                <polyline
                  fill="none"
                  stroke="rgb(59 130 246)"
                  strokeWidth="3"
                  points={comparisonData.map((d, i) => {
                    const x = (i / (comparisonData.length - 1)) * 100
                    const y = ((maxValue + padding - d.vrTotal) / (maxValue - minValue + 2 * padding)) * 100
                    return `${x}%,${y}%`
                  }).join(" ")}
                />

                {/* 벤치마크 라인 */}
                <polyline
                  fill="none"
                  stroke="rgb(156 163 175)"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  points={comparisonData.map((d, i) => {
                    const x = (i / (comparisonData.length - 1)) * 100
                    const y = ((maxValue + padding - d.benchmarkValue) / (maxValue - minValue + 2 * padding)) * 100
                    return `${x}%,${y}%`
                  }).join(" ")}
                />
              </svg>

              {/* X축 라벨 */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                {comparisonData.map((d) => (
                  <span key={d.date} className="transform -translate-x-1/2">
                    {d.date.slice(5)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 범례 */}
        <div className="flex justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-blue-600 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">VR 전략</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 border-t-4 border-gray-400 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">벤치마크 (전액 TQQQ)</span>
          </div>
        </div>

        {/* 요약 통계 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">현재 VR 가치</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${comparisonData[comparisonData.length - 1].vrTotal.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">현재 벤치마크</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              ${comparisonData[comparisonData.length - 1].benchmarkValue.toFixed(2)}
            </p>
          </div>

          <div
            className={`p-4 rounded-lg ${
              comparisonData[comparisonData.length - 1].difference >= 0
                ? "bg-green-50 dark:bg-green-900/20"
                : "bg-red-50 dark:bg-red-900/20"
            }`}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">차이</p>
            <p
              className={`text-2xl font-bold ${
                comparisonData[comparisonData.length - 1].difference >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {comparisonData[comparisonData.length - 1].difference >= 0 ? "+" : ""}
              ${comparisonData[comparisonData.length - 1].difference.toFixed(2)}
              <span className="text-sm ml-1">
                ({comparisonData[comparisonData.length - 1].differenceRate >= 0 ? "+" : ""}
                {comparisonData[comparisonData.length - 1].differenceRate.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
