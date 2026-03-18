"use client"

import { VRRound } from "@/types"

interface VRRoundCardProps {
  round: VRRound
  onClick: () => void
}

export function VRRoundCard({ round, onClick }: VRRoundCardProps) {
  const {
    roundId,
    startDate,
    endDate,
    initialShares,
    initialPool,
    finalShares,
    finalPool,
    sharesChange,
    poolChange,
    isActive,
  } = round

  // 수익/손실 계산
  const totalValue = finalShares * 50 + finalPool // 종가 50으로 가정 (실제로는 전달받아야 함)
  const initialTotalValue = initialShares * 50 + initialPool
  const profit = totalValue - initialTotalValue
  const profitRate = initialTotalValue > 0 ? (profit / initialTotalValue) * 100 : 0

  return (
    <div
      onClick={onClick}
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-gray-800"
    >
      {/* 헤더: 차수번호와 상태 */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {roundId}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {startDate} ~ {endDate}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {isActive ? (
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">
              진행중
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-sm font-semibold">
              완료
            </span>
          )}
          <div className={`text-lg font-bold ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {profit >= 0 ? "+" : ""}{profitRate.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* 수량 및 현금 변화 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">주식수 변화</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {sharesChange >= 0 ? "+" : ""}{sharesChange}주
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {initialShares} → {finalShares}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">현금 변화</p>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {poolChange >= 0 ? "+" : ""}${poolChange.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ${initialPool.toFixed(0)} → ${finalPool.toFixed(0)}
          </p>
        </div>
      </div>

      {/* 현재 상태 요약 */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">현재 주식수</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {finalShares}주
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">현재 현금</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              ${finalPool.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* 클릭 안내 */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          클릭하여 상세 정보 보기
        </p>
      </div>
    </div>
  )
}
