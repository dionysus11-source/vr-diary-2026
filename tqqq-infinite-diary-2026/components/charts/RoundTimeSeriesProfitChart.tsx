"use client"

import { useEffect, useState } from "react"
import { Round, Trade } from "@/types"
import { fetchDailyPrices, DailyPrice } from "@/lib/api/stockPrices"
import { formatPrice, formatDate } from "@/lib/data/trades"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts"

interface RoundTimeSeriesProfitChartProps {
  round: Round
}

interface ChartData {
  date: string
  dateDisplay: string
  closePrice: number
  averageBuyPrice: number // 해당 시점까지의 평단가
  profitRate: number
  profitAmount: number
  event?: string
}

export function RoundTimeSeriesProfitChart({ round }: RoundTimeSeriesProfitChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 차트 데이터 계산
  useEffect(() => {
    const calculateChartData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 디버깅: 회차 정보 출력
        console.log("🔍 회차 정보:", {
          symbol: round.symbol,
          status: round.status,
          매수수: round.buys.length,
          매도수: round.sells.length,
          매수내역: round.buys.map(b => ({ 날짜: b.date, 가격: b.price, 수량: b.quantity })),
          평단가: round.averageBuyPrice
        })

        // 날짜 범위 계산
        const firstBuyDate = round.buys[0]?.date
        const lastDate =
          round.status === "completed" && round.sells.length > 0
            ? round.sells[round.sells.length - 1].date
            : new Date().toISOString().split("T")[0]

        console.log("📅 데이터 범위:", { firstBuyDate, lastDate })

        if (!firstBuyDate || !lastDate) {
          setError("날짜 정보가 없습니다.")
          return
        }

        // 종가 데이터 가져오기
        const prices = await fetchDailyPrices(round.symbol, firstBuyDate, lastDate)

        console.log("📊 가져온 종가 데이터 수:", prices.length)
        console.log("📊 가져온 종가 날짜:", prices.map(p => p.date))

        // 매수일별로 가격 데이터 생성 (매수일의 종가가 API에 없는 경우 대응)
        const buyDates = [...new Set(round.buys.map(b => b.date))] // 중복 제거
        const buyPrices: DailyPrice[] = buyDates.map(date => {
          const existingPrice = prices.find(p => p.date === date)
          if (existingPrice) {
            return existingPrice
          }

          // 매수일의 데이터가 없으면 가장 가까운 날짜의 가격 사용
          // 모든 날짜는 한국시간 기준으로 변환되어 있음
          const previousPrice = prices
            .filter(p => p.date <= date)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

          const nextPrice = prices
            .filter(p => p.date > date)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

          // 더 가까운 날짜 선택
          const price = previousPrice?.close || nextPrice?.close || round.averageBuyPrice

          console.log(`⚠️ ${date} (한국시간) 데이터 없음 → ${previousPrice?.date || nextPrice?.date || '평단가'} 사용`)

          return { date, close: price }
        })

        console.log("📊 생성한 매수일 가격:", buyPrices.map(p => ({ date: p.date, price: p.close })))

        // 종가 데이터 + 매수일 데이터 합치기
        const allPrices = [...prices, ...buyPrices]
          .filter((price, index, self) => index === self.findIndex(p => p.date === price.date)) // 중복 제거
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        console.log("📊 합친 후 전체 날짜:", allPrices.map(p => p.date))

        // 차트 데이터 생성 (평단가 추이 포함, 매도일에는 실제 매도가 사용)
        const data: ChartData[] = allPrices.map((price) => {
          // 해당 날짜에 매도가 있는지 확인
          const sellOnThisDate = round.sells.find((s) => s.date === price.date)

          // 매도일이면 실제 매도가 사용, 아니면 종가 사용
          const actualPrice = sellOnThisDate ? sellOnThisDate.price : price.close

          // 해당 날짜까지의 매수 내역 계산 (평단가 추이)
          const buysUpToDate = round.buys.filter((b) => b.date <= price.date)
          const totalBuyAmount = buysUpToDate.reduce((sum, b) => sum + b.amount, 0)
          const totalBuyQuantity = buysUpToDate.reduce((sum, b) => sum + b.quantity, 0)
          const averageBuyPriceAtDate = totalBuyQuantity > 0 ? totalBuyAmount / totalBuyQuantity : 0

          // 디버깅: 매수일에 평단가 계산 로그
          if (round.buys.some((b) => b.date === price.date)) {
            console.log(`📅 ${price.date} 매수일 디버깅:`, {
              매수수: buysUpToDate.length,
              총금액: totalBuyAmount,
              총수량: totalBuyQuantity,
              평단가: averageBuyPriceAtDate,
              매수내역: buysUpToDate.map(b => ({ 날짜: b.date, 가격: b.price, 수량: b.quantity }))
            })
          }

          // 해당 날짜까지의 매도 내역 계산
          const sellsUpToDate = round.sells.filter((s) => s.date <= price.date)
          const totalSellQuantity = sellsUpToDate.reduce((sum, s) => sum + s.quantity, 0)
          const remainingQuantity = totalBuyQuantity - totalSellQuantity

          // 수익률 계산
          let profitRate = 0
          let profitAmount = 0

          if (averageBuyPriceAtDate > 0) {
            // 항상 현재 가격과 평단가로 수익률 계산
            profitRate = ((actualPrice - averageBuyPriceAtDate) / averageBuyPriceAtDate) * 100

            // 수익금은 보유 수량만큼만 계산 (전체 청산 후에는 0)
            if (remainingQuantity > 0) {
              profitAmount = (actualPrice - averageBuyPriceAtDate) * remainingQuantity
            } else {
              // 완료된 회차: 실제 총 수익금 사용
              profitAmount = round.profitAmount || 0
            }
          }

          // 이벤트 확인 (매수/매도)
          let event: string | undefined
          const buyEvent = round.buys.find((b) => b.date === price.date)
          if (buyEvent) event = "매수"
          if (sellOnThisDate) event = "매도"

          return {
            date: price.date,
            dateDisplay: formatDate(price.date),
            closePrice: actualPrice, // 실제 매도가 또는 종가
            averageBuyPrice: averageBuyPriceAtDate,
            profitRate,
            profitAmount,
            event,
          }
        })

        setChartData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "데이터 로딩에 실패했습니다")
      } finally {
        setLoading(false)
      }
    }

    calculateChartData()
  }, [round])

  // 수익률 색상 계산
  const getProfitColor = (rate: number) => {
    if (rate > 0) return "#10b981" // 초록색
    if (rate < 0) return "#ef4444" // 빨간색
    return "#6b7280" // 회색
  }

  // 평단가 범위 계산 (Y축 스케일 조정)
  const avgPrices = chartData.map(d => d.averageBuyPrice).filter(p => p > 0)
  const minAvgPrice = avgPrices.length > 0 ? Math.min(...avgPrices) * 0.99 : 0
  const maxAvgPrice = avgPrices.length > 0 ? Math.max(...avgPrices) * 1.01 : 100

  // 로딩 상태
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">종가 데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            종가 데이터를 가져올 수 없습니다. 나중에 다시 시도해주세요.
          </p>
        </div>
      </div>
    )
  }

  // 데이터 없음
  if (chartData.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-500 dark:text-gray-400">표시할 데이터가 없습니다</p>
      </div>
    )
  }

  // 수익률 색상 (마지막 데이터 기준)
  const lastProfitRate = chartData[chartData.length - 1]?.profitRate || 0
  const areaColor = getProfitColor(lastProfitRate)

  return (
    <div className="w-full">
      {/* 요약 정보 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">평균 매수가</div>
          <div className="text-lg font-semibold">{formatPrice(round.averageBuyPrice)}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            {round.status === "active" ? "현재 종가" : "최종 종가"}
          </div>
          <div className="text-lg font-semibold">
            {formatPrice(chartData[chartData.length - 1]?.closePrice || 0)}
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
            <XAxis
              dataKey="dateDisplay"
              className="text-sm text-black dark:text-white"
              tick={{ fill: "#000000" }}
              tickFormatter={(value) => {
                // 날짜 형식 간소화 (월-일)
                const parts = value.split(".")
                if (parts.length >= 2) {
                  return `${parts[1]}.${parts[2]}`
                }
                return value
              }}
            />
            <YAxis
              yAxisId="price"
              orientation="left"
              label={{ value: "가격 ($)", angle: -90, position: "insideLeft", fill: "#000000" }}
              className="text-sm text-black dark:text-white"
              tick={{ fill: "#000000" }}
              domain={[minAvgPrice, "auto"]}
            />
            <YAxis
              yAxisId="rate"
              orientation="right"
              label={{ value: "수익률", angle: 90, position: "insideRight", fill: "#000000" }}
              className="text-sm text-black dark:text-white"
              tick={{ fill: "#000000" }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload as ChartData
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold mb-2">{data.dateDisplay} (한국시간)</p>
                      <p className="text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          {data.event === "매도" ? "매도가" : "종가"}:{" "}
                        </span>
                        <span className="font-medium">{formatPrice(data.closePrice)}</span>
                      </p>
                      <p className="text-xs">
                        <span className="text-gray-600 dark:text-gray-400">평단가: </span>
                        <span className="font-medium text-orange-600">{formatPrice(data.averageBuyPrice)}</span>
                      </p>
                      <p className="text-xs">
                        <span className="text-gray-600 dark:text-gray-400">수익률: </span>
                        <span className={`font-medium ${data.profitRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {data.profitRate >= 0 ? "+" : ""}
                          {data.profitRate.toFixed(2)}%
                        </span>
                      </p>
                      <p className="text-xs">
                        <span className="text-gray-600 dark:text-gray-400">수익금: </span>
                        <span className={`font-medium ${data.profitAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {data.profitAmount >= 0 ? "+" : ""}
                          {formatPrice(data.profitAmount)}
                        </span>
                      </p>
                      {data.event && (
                        <p className="text-xs font-semibold text-blue-600 mt-1">📍 {data.event}</p>
                      )}
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine
              yAxisId="rate"
              y={0}
              stroke="#666"
              strokeWidth={1}
            />
            <Area
              yAxisId="rate"
              dataKey="profitRate"
              fill={areaColor}
              fillOpacity={0.1}
              stroke="none"
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="closePrice"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="종가"
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="averageBuyPrice"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={true}
              name="평단가"
            />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="profitRate"
              stroke={areaColor}
              strokeWidth={2}
              dot={false}
              name="수익률"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
