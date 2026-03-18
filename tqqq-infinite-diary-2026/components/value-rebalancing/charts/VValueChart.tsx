"use client"

import { useState } from "react"
import { VRRecord } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

interface VValueChartProps {
  records: VRRecord[]
}

type IntervalType = "2weeks" | "1month" | "3months" | "6months" | "1year"

const INTERVAL_LABELS: Record<IntervalType, string> = {
  "2weeks": "2주",
  "1month": "1달",
  "3months": "3달",
  "6months": "6달",
  "1year": "1년",
}

// 데이터 개수 계산 (간격에 따라 표시할 라벨 수)
function calculateLabelInterval(totalData: number, intervalType: IntervalType): number {
  const baseInterval = {
    "2weeks": 1,      // 모두 표시
    "1month": 2,       // 2개 중 1개 표시
    "3months": 6,      // 6개 중 1개 표시
    "6months": 12,     // 12개 중 1개 표시
    "1year": 26,       // 26개 중 1개 표시
  }

  const interval = baseInterval[intervalType]

  // 데이터가 너무 적으면 간격 조정
  if (totalData <= interval) {
    return 1
  }

  return interval
}

export function VValueChart({ records }: VValueChartProps) {
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>("2weeks")

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>E값과 V±15% 기준선</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>아직 기록이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 날짜순 정렬 (오래된 순서)
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date))

  // X축 라벨 간격 계산
  const labelInterval = calculateLabelInterval(sortedRecords.length, selectedInterval)
  const filteredIndexes = sortedRecords
    .map((_, i) => i)
    .filter((i) => i % labelInterval === 0)

  // 데이터 추출
  const eValues = sortedRecords.map((r) => r.eValue)
  const vValues = sortedRecords.map((r) => r.vValue)
  const vUpper = vValues.map((v) => v * 1.15)
  const vLower = vValues.map((v) => v * 0.85)
  const pools = sortedRecords.map((r) => r.pool)

  // 전체 데이터 범위 (E값 + V±15%)
  const allValues = [...eValues, ...vUpper, ...vLower]
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const padding = (maxVal - minVal) * 0.1

  // Pool 범위
  const maxPool = Math.max(...pools)
  const minPool = Math.min(...pools)
  const poolPadding = (maxPool - minPool) * 0.1 || 100

  // 차트 높이
  const chartHeight = Math.max(250, sortedRecords.length * 30)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>E값과 V±15% 기준선</CardTitle>
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
        {/* 위쪽 차트: E값 + V±15% */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">E Value with V ±15% Reference Lines</h3>
          <div className="w-full overflow-x-auto">
            <div style={{ height: `${chartHeight}px` }} className="relative">
              {/* Y축 */}
              <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>${(maxVal + padding).toFixed(0)}</span>
                <span>${((maxVal + minVal) / 2).toFixed(0)}</span>
                <span>${(minVal - padding).toFixed(0)}</span>
              </div>

              {/* 차트 영역 */}
              <div className="ml-16 h-full relative border-l border-gray-200 dark:border-gray-700">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* V+15% 기준선 (검은색 점선) */}
                  <polyline
                    fill="none"
                    stroke="black"
                    strokeDasharray="5,5"
                    strokeWidth="2"
                    opacity="0.7"
                    points={sortedRecords.map((d, i) => {
                      const x = (i / (sortedRecords.length - 1)) * 100
                      const y = ((maxVal + padding - vUpper[i]) / (maxVal - minVal + 2 * padding)) * 100
                      return `${x},${y}`
                    }).join(" ")}
                  />

                  {/* V-15% 기준선 (검은색 점선) */}
                  <polyline
                    fill="none"
                    stroke="black"
                    strokeDasharray="5,5"
                    strokeWidth="2"
                    opacity="0.7"
                    points={sortedRecords.map((d, i) => {
                      const x = (i / (sortedRecords.length - 1)) * 100
                      const y = ((maxVal + padding - vLower[i]) / (maxVal - minVal + 2 * padding)) * 100
                      return `${x},${y}`
                    }).join(" ")}
                  />

                  {/* E값 선 (파란색) */}
                  <polyline
                    fill="none"
                    stroke="rgb(46 117 182)"
                    strokeWidth="3"
                    points={sortedRecords.map((d, i) => {
                      const x = (i / (sortedRecords.length - 1)) * 100
                      const y = ((maxVal + padding - eValues[i]) / (maxVal - minVal + 2 * padding)) * 100
                      return `${x},${y}`
                    }).join(" ")}
                  />

                  {/* 데이터 포인트 */}
                  {sortedRecords.map((d, i) => {
                    const x = (i / (sortedRecords.length - 1)) * 100
                    const y = ((maxVal + padding - eValues[i]) / (maxVal - minVal + 2 * padding)) * 100

                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="3"
                        fill="white"
                        stroke="rgb(46 117 182)"
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
              <span className="text-gray-600 dark:text-gray-400">E (Evaluation)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 border-t-2 border-dashed border-black rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">V ±15% (Bounds)</span>
            </div>
          </div>
        </div>

        {/* 아래쪽 차트: Pool 막대 그래프 */}
        <div>
          <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">Pool (Cash)</h3>
          <div style={{ height: `${chartHeight}px` }} className="relative">
            {/* Y축 */}
            <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>${(maxPool + poolPadding).toFixed(0)}</span>
              <span>${((maxPool + minPool) / 2).toFixed(0)}</span>
              <span>${Math.max(0, minPool - poolPadding).toFixed(0)}</span>
            </div>

            {/* 차트 영역 */}
            <div className="ml-16 h-full relative border-l border-gray-200 dark:border-gray-700">
              {sortedRecords.map((d, i) => {
                const barWidth = 80 / sortedRecords.length
                const x = (i / sortedRecords.length) * 100
                const barHeight = ((pools[i] - Math.max(0, minPool - poolPadding)) / (maxPool - Math.max(0, minPool - poolPadding) + 2 * poolPadding)) * 100

                return (
                  <div
                    key={i}
                    className="absolute bottom-0 bg-green-600 hover:bg-green-700 transition-colors border border-black"
                    style={{
                      left: `${x}%`,
                      width: `${barWidth}%`,
                      height: `${barHeight}%`,
                      minHeight: '2px'
                    }}
                  />
                )
              })}

              {/* Pool 값 표시 (데이터가 적을 때만) */}
              {sortedRecords.length <= 20 && sortedRecords.map((d, i) => {
                const barWidth = 80 / sortedRecords.length
                const x = (i / sortedRecords.length) * 100 + barWidth / 2
                const barHeight = ((pools[i] - Math.max(0, minPool - poolPadding)) / (maxPool - Math.max(0, minPool - poolPadding) + 2 * poolPadding)) * 100

                return (
                  <div
                    key={`label-${i}`}
                    className="absolute text-xs font-bold text-gray-900 dark:text-white"
                    style={{
                      left: `${x}%`,
                      bottom: `${barHeight}%`,
                      transform: 'translateX(-50%) translateY(-100%)'
                    }}
                  >
                    ${pools[i].toFixed(0)}
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
      </CardContent>
    </Card>
  )
}
