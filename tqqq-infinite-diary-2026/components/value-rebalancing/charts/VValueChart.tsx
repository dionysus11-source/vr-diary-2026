"use client"

import { VRRecord } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

interface VValueChartProps {
  records: VRRecord[]
}

export function VValueChart({ records }: VValueChartProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>V값 변화 추이</CardTitle>
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

  // V값 데이터 추출
  const vValueData = sortedRecords.map((record) => ({
    date: record.date,
    vValue: record.vValue,
    signal: record.signal,
  }))

  // 최대/최소 V값 (Y축 범위)
  const vValues = vValueData.map((d) => d.vValue)
  const minV = Math.min(...vValues)
  const maxV = Math.max(...vValues)
  const padding = (maxV - minV) * 0.1

  // 차트 높이
  const chartHeight = Math.max(300, vValueData.length * 40)

  return (
    <Card>
      <CardHeader>
        <CardTitle>V값 변화 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div style={{ height: `${chartHeight}px` }} className="relative">
            {/* Y축 라인 */}
            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{(maxV + padding).toFixed(0)}</span>
              <span>{((maxV + minV) / 2).toFixed(0)}</span>
              <span>{(minV - padding).toFixed(0)}</span>
            </div>

            {/* 차트 영역 */}
            <div className="ml-12 h-full relative border-l border-gray-200 dark:border-gray-700">
              {/* 수평선 (중간값) */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-gray-300 dark:border-gray-600"
                style={{
                  top: `${((maxV - (maxV + minV) / 2) / (maxV - minV + 2 * padding)) * 100}%`,
                }}
              />

              {/* V값 선 그래프 */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="rgb(59 130 246)"
                  strokeWidth="2"
                  points={vValueData.map((d, i) => {
                    const x = (i / (vValueData.length - 1)) * 100
                    const y = ((maxV + padding - d.vValue) / (maxV - minV + 2 * padding)) * 100
                    return `${x}%,${y}%`
                  }).join(" ")}
                />

                {/* 데이터 포인트 */}
                {vValueData.map((d, i) => {
                  const x = (i / (vValueData.length - 1)) * 100
                  const y = ((maxV + padding - d.vValue) / (maxV - minV + 2 * padding)) * 100

                  const fillColor = d.signal === "BUY"
                    ? "rgb(34 197 94)"
                    : d.signal === "SELL"
                    ? "rgb(239 68 68)"
                    : "rgb(156 163 175)"

                  return (
                    <circle
                      key={i}
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill={fillColor}
                    />
                  )
                })}
              </svg>

              {/* X축 라벨 */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                {vValueData.map((d) => (
                  <span key={d.date} className="transform -translate-x-1/2">
                    {d.date.slice(5)} {/* MM-DD 형식 */}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 범례 */}
        <div className="flex justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-600 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">V값</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="16" height="16">
              <circle cx="8" cy="8" r="4" fill="rgb(34 197 94)" />
            </svg>
            <span className="text-gray-600 dark:text-gray-400">매수 신호</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="16" height="16">
              <circle cx="8" cy="8" r="4" fill="rgb(239 68 68)" />
            </svg>
            <span className="text-gray-600 dark:text-gray-400">매도 신호</span>
          </div>
        </div>

        {/* 테이블 */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-4 text-gray-600 dark:text-gray-400 font-semibold">날짜</th>
                <th className="text-right py-2 px-4 text-gray-600 dark:text-gray-400 font-semibold">V값</th>
                <th className="text-center py-2 px-4 text-gray-600 dark:text-gray-400 font-semibold">신호</th>
              </tr>
            </thead>
            <tbody>
              {vValueData.map((d) => (
                <tr key={d.date} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 px-4 text-gray-900 dark:text-white">{d.date}</td>
                  <td className="py-2 px-4 text-right font-mono text-gray-900 dark:text-white">
                    ${d.vValue.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        d.signal === "BUY"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : d.signal === "SELL"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {d.signal === "BUY" ? "매수" : d.signal === "SELL" ? "매도" : "대기"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
