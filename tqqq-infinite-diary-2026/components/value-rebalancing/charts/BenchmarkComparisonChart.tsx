"use client"

import { useState } from "react"
import { VRRecord, VRInitialPortfolio } from "@/types"
import { ValueRebalancingCalculator } from "@/lib/calculations/vr-calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

interface BenchmarkComparisonChartProps {
  records: VRRecord[]
  initialPortfolio: VRInitialPortfolio
}

type IntervalType = "2weeks" | "1month" | "3months" | "6months" | "1year"

const INTERVAL_LABELS: Record<IntervalType, string> = {
  "2weeks": "2주",
  "1month": "1달",
  "3months": "3달",
  "6months": "6달",
  "1year": "1년",
}

function calculateLabelInterval(totalData: number, intervalType: IntervalType): number {
  const baseInterval = {
    "2weeks": 1,
    "1month": 2,
    "3months": 6,
    "6months": 12,
    "1year": 26,
  }

  const interval = baseInterval[intervalType]

  if (totalData <= interval) {
    return 1
  }

  return interval
}

export function BenchmarkComparisonChart({
  records,
  initialPortfolio,
}: BenchmarkComparisonChartProps) {
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>("2weeks")

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>VR 총액 vs 벤치마크</CardTitle>
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

  // X축 라벨 간격 계산
  const labelInterval = calculateLabelInterval(sortedRecords.length, selectedInterval)
  const filteredIndexes = sortedRecords
    .map((_, i) => i)
    .filter((i) => i % labelInterval === 0)

  // VR 총액 계산
  const vrTotals = sortedRecords.map((record) => {
    const eValue = record.eValue
    const pool = record.pool
    return ValueRebalancingCalculator.calculateVRTotalValue(eValue, pool)
  })

  // 벤치마크 계산
  const benchmarkShares = ValueRebalancingCalculator.calculateBenchmarkShares(
    initialPortfolio.totalInvested,
    initialPortfolio.averagePrice
  )
  const benchmarks = sortedRecords.map((record) =>
    ValueRebalancingCalculator.calculateBenchmarkValue(benchmarkShares, record.price)
  )

  // 차이 계산
  const differences = vrTotals.map((vr, i) => vr - benchmarks[i])

  // 전체 범위
  const allValues = [...vrTotals, ...benchmarks]
  const minValue = Math.min(...allValues)
  const maxValue = Math.max(...allValues)
  const padding = (maxValue - minValue) * 0.1

  // 차이 범위
  const maxDiff = Math.max(...differences)
  const minDiff = Math.min(...differences)
  const diffPadding = (maxDiff - minDiff) * 0.1 || 100

  // 차트 높이
  const chartHeight = Math.max(250, sortedRecords.length * 30)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>VR 총액 vs 벤치마크</CardTitle>
          <select
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(e.target.value as IntervalType)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            {(Object.keys(INTERVAL_LABELS) as IntervalType[]).map((key) => (
              <option key={key} value={key}>
                {INTERVAL_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {/* 위쪽 차트: 총액 비교 */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">Total Amount Trend</h3>
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
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <clipPath id="chart-area">
                      <rect x="0" y="0" width="100" height="100" />
                    </clipPath>
                  </defs>

                  {/* 영역 채우기: VR가 리드할 때 */}
                  <polygon
                    fill="green"
                    opacity="0.2"
                    points={sortedRecords.map((d, i) => {
                      const x = (i / (sortedRecords.length - 1)) * 100
                      const vrY = ((maxValue + padding - vrTotals[i]) / (maxValue - minValue + 2 * padding)) * 100
                      const benchY = ((maxValue + padding - benchmarks[i]) / (maxValue - minValue + 2 * padding)) * 100
                      return vrTotals[i] > benchmarks[i] ? `${x},${vrY}` : `${x},${benchY}`
                    }).join(" ")}
                  />

                  {/* VR 총액 선 (파란색) */}
                  <polyline
                    fill="none"
                    stroke="rgb(46 117 182)"
                    strokeWidth="3"
                    points={sortedRecords.map((d, i) => {
                      const x = (i / (sortedRecords.length - 1)) * 100
                      const y = ((maxValue + padding - vrTotals[i]) / (maxValue - minValue + 2 * padding)) * 100
                      return `${x},${y}`
                    }).join(" ")}
                  />

                  {/* 벤치마크 선 (주황색) */}
                  <polyline
                    fill="none"
                    stroke="rgb(237 125 49)"
                    strokeWidth="3"
                    points={sortedRecords.map((d, i) => {
                      const x = (i / (sortedRecords.length - 1)) * 100
                      const y = ((maxValue + padding - benchmarks[i]) / (maxValue - minValue + 2 * padding)) * 100
                      return `${x},${y}`
                    }).join(" ")}
                  />

                  {/* 데이터 포인트: VR */}
                  {sortedRecords.map((d, i) => {
                    const x = (i / (sortedRecords.length - 1)) * 100
                    const y = ((maxValue + padding - vrTotals[i]) / (maxValue - minValue + 2 * padding)) * 100

                    return (
                      <circle
                        key={`vr-${i}`}
                        cx={x}
                        cy={y}
                        r="3"
                        fill="white"
                        stroke="rgb(46 117 182)"
                        strokeWidth="2"
                      />
                    )
                  })}

                  {/* 데이터 포인트: 벤치마크 */}
                  {sortedRecords.map((d, i) => {
                    const x = (i / (sortedRecords.length - 1)) * 100
                    const y = ((maxValue + padding - benchmarks[i]) / (maxValue - minValue + 2 * padding)) * 100

                    return (
                      <rect
                        key={`bench-${i}`}
                        x={x - 3}
                        y={y - 3}
                        width="6"
                        height="6"
                        fill="white"
                        stroke="rgb(237 125 49)"
                        strokeWidth="2"
                      />
                    )
                  })}
                </svg>

                {/* X축 라벨 */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  {sortedRecords.map((d, i) => (
                    filteredIndexes.includes(i) && (
                      <span key={d.date} className="transform -translate-x-1/2">
                        {d.date.slice(5)}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 범례 */}
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-blue-700 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">VR Total (E + Pool)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-orange-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Benchmark Total</span>
            </div>
          </div>
        </div>

        {/* 아래쪽 차트: 차이 막대 그래프 */}
        <div>
          <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">VR - Benchmark Difference</h3>
          <div style={{ height: `${chartHeight}px` }} className="relative">
            {/* Y축 */}
            <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>${(maxDiff + diffPadding).toFixed(0)}</span>
              <span>0</span>
              <span>${(minDiff - diffPadding).toFixed(0)}</span>
            </div>

            {/* 차트 영역 */}
            <div className="ml-16 h-full relative border-l border-gray-200 dark:border-gray-700">
              {/* 0선 (중앙) */}
              <div
                className="absolute left-0 right-0 border-t border-black bg-black"
                style={{
                  top: `${((maxDiff + diffPadding) / (maxDiff - minDiff + 2 * diffPadding)) * 100}%`,
                }}
              />

              {sortedRecords.map((d, i) => {
                const barWidth = 80 / sortedRecords.length
                const x = (i / sortedRecords.length) * 100
                const diff = differences[i]

                // 0선의 위치
                const zeroY = ((maxDiff + diffPadding) / (maxDiff - minDiff + 2 * diffPadding)) * 100
                const valueY = ((maxDiff + diffPadding - diff) / (maxDiff - minDiff + 2 * diffPadding)) * 100

                // 막대 높이와 위치
                const barTop = Math.min(zeroY, valueY)
                const barHeight = Math.abs(valueY - zeroY)
                const color = diff >= 0 ? "rgb(34 197 94)" : "rgb(239 68 68)"

                return (
                  <div
                    key={i}
                    className="absolute hover:opacity-80 transition-opacity border border-black"
                    style={{
                      left: `${x}%`,
                      width: `${barWidth}%`,
                      top: `${barTop}%`,
                      height: `${barHeight}%`,
                      backgroundColor: color,
                      minHeight: '2px'
                    }}
                  />
                )
              })}

              {/* 차이 값 표시 (데이터가 적을 때만) */}
              {sortedRecords.length <= 20 && sortedRecords.map((d, i) => {
                const barWidth = 80 / sortedRecords.length
                const x = (i / sortedRecords.length) * 100 + barWidth / 2
                const diff = differences[i]

                const zeroY = ((maxDiff + diffPadding) / (maxDiff - minDiff + 2 * diffPadding)) * 100
                const valueY = ((maxDiff + diffPadding - diff) / (maxDiff - minDiff + 2 * diffPadding)) * 100

                const labelY = diff >= 0 ? valueY : valueY
                const labelOffset = diff >= 0 ? -4 : 4

                return (
                  <div
                    key={`label-${i}`}
                    className="absolute text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap"
                    style={{
                      left: `${x}%`,
                      top: `${labelY}%`,
                      transform: `translateX(-50%) translateY(${labelOffset}px)`
                    }}
                  >
                    {diff >= 0 ? "+" : ""}${diff.toFixed(0)}
                  </div>
                )
              })}

              {/* X축 라벨 */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                {sortedRecords.map((d, i) => (
                  filteredIndexes.includes(i) && (
                    <span key={d.date} className="transform -translate-x-1/2">
                      {d.date.slice(5)}
                    </span>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 요약 통계 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">현재 VR 총액</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${vrTotals[vrTotals.length - 1].toFixed(2)}
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">현재 벤치마크</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              ${benchmarks[benchmarks.length - 1].toFixed(2)}
            </p>
          </div>

          <div
            className={`p-4 rounded-lg ${
              differences[differences.length - 1] >= 0
                ? "bg-green-50 dark:bg-green-900/20"
                : "bg-red-50 dark:bg-red-900/20"
            }`}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">현재 차이</p>
            <p
              className={`text-2xl font-bold ${
                differences[differences.length - 1] >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {differences[differences.length - 1] >= 0 ? "+" : ""}${differences[differences.length - 1].toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
