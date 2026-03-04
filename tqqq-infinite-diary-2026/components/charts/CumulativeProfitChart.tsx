"use client"

import { Round } from "@/types"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

interface CumulativeProfitChartProps {
  rounds: Round[]
  initialAmount?: number
}

export function CumulativeProfitChart({
  rounds,
  initialAmount = 0,
}: CumulativeProfitChartProps) {
  // 완료된 회차만 필터링하고 회차 번호순 정렬
  const completedRounds = rounds
    .filter((r) => r.status === "completed" && r.profitAmount !== undefined)
    .sort((a, b) => a.roundNumber - b.roundNumber)

  // 누적 수익금 계산
  let cumulativeAmount = initialAmount
  const data = completedRounds.map((round) => {
    cumulativeAmount += round.profitAmount || 0
    return {
      round: round.roundNumber,
      cumulativeAmount,
    }
  })

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        표시할 데이터가 없습니다
      </div>
    )
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          <XAxis
            dataKey="round"
            label={{ value: "회차", position: "insideBottom", offset: -5, fill: "#000000" }}
            className="text-sm text-black dark:text-white"
            tick={{ fill: "#000000" }}
          />
          <YAxis
            label={{ value: "누적 자산 ($)", angle: -90, position: "insideLeft", fill: "#000000" }}
            className="text-sm text-black dark:text-white"
            tick={{ fill: "#000000" }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString()}`, "누적 자산"]}
            labelFormatter={(label) => `회차 ${label}`}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <ReferenceLine
            y={initialAmount}
            stroke="#666"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <Line
            type="monotone"
            dataKey="cumulativeAmount"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
