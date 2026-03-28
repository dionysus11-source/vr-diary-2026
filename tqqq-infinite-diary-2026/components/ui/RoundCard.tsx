import { Round } from "@/types"
import { CardViewMode } from "@/types"
import { formatPrice, formatQuantity, formatAmount, formatProfitRate, formatDate, getStatusBgClass, getProfitColorClass } from "@/lib/data/trades"

interface RoundCardProps {
  round: Round
  viewMode: CardViewMode
  onClick: () => void
}

export function RoundCard({ round, viewMode, onClick }: RoundCardProps) {
  const isCompact = viewMode === "compact"
  const statusBg = getStatusBgClass(round.status)
  const profitColor = getProfitColorClass(round.profitRate)

  const hasSeed = !!round.totalSeedAmount && round.totalSeedAmount > 0
  
  // 현재 투입 원금 (매도로 인해 줄어든 수량 반영)
  const currentInvestedAmount = round.remainingQuantity > 0 
    ? round.remainingQuantity * (round.averageBuyPrice || 0)
    : round.totalBuyAmount

  // T값(진행률) 표시용 투자원금 (단순 손익 합산 기준: 총매수 - 총매도)
  const tValueInvestedAmount = round.remainingQuantity > 0
    ? round.totalBuyAmount - (round.totalSellAmount || 0)
    : round.totalBuyAmount

  const progressRatio = hasSeed ? Math.min(tValueInvestedAmount / round.totalSeedAmount!, 1) : 0
  const progressPercent = (progressRatio * 100).toFixed(1)

  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-lg
        ${statusBg}
        ${round.status === "active" ? "border-l-4 border-l-blue-500" : ""}
        ${round.status === "completed" && round.profitRate && round.profitRate > 0 ? "border-l-4 border-l-green-500" : ""}
        ${round.status === "completed" && round.profitRate && round.profitRate < 0 ? "border-l-4 border-l-red-500" : ""}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
              {round.symbol}
            </h3>
            <span className="px-2.5 py-1 text-sm font-semibold rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {round.roundNumber}회차
            </span>
            <span className="px-2.5 py-1 text-sm font-semibold rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
              v{round.version || "2.2"}
            </span>
            <span className={`px-2 py-0.5 text-xs font-bold rounded ${round.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
              {round.status === "active" ? "진행중" : "완료"}
            </span>
          </div>
        </div>
        <div className={`text-right ${profitColor} font-semibold`}>
          {round.profitRate !== undefined ? formatProfitRate(round.profitRate) : "-"}
        </div>
      </div>

      {/* Progress Bar (진행중 & 시드 설정됨) */}
      {round.status === "active" && hasSeed && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">진행도 (시드 소진율)</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-blue-100 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Compact Mode */}
      {isCompact && (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-black dark:text-white">평균 단가</span>
            <span className="font-medium">{formatPrice(round.averageBuyPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black dark:text-white">수량</span>
            <span className="font-medium">
              {formatQuantity(round.remainingQuantity)}주
              {round.totalSellQuantity > 0 && (
                <span className="text-black dark:text-white text-xs ml-1">
                  (총 {formatQuantity(round.totalBuyQuantity)}주)
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-black dark:text-white">매입금액</span>
            <span className="font-medium">
              {formatAmount(currentInvestedAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-black dark:text-white">매수일</span>
            <span className="font-medium">{formatDate(round.buys[0]?.date || "")}</span>
          </div>
        </div>
      )}

      {/* Detailed Mode */}
      {!isCompact && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <div className="text-black dark:text-white text-xs">평균 단가</div>
              <div className="font-medium">{formatPrice(round.averageBuyPrice)}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <div className="text-black dark:text-white text-xs">보유 수량</div>
              <div className="font-medium">
                {formatQuantity(round.remainingQuantity)}주
                {round.totalSellQuantity > 0 && (
                  <div className="text-xs text-black dark:text-white">/ 총 {formatQuantity(round.totalBuyQuantity)}주</div>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <div className="text-black dark:text-white text-xs">매입금액</div>
              <div className="font-medium text-sm">
                {formatAmount(currentInvestedAmount)}
              </div>
            </div>
            {round.totalSellAmount > 0 && (
              <>
                <div className="bg-white dark:bg-gray-800 p-2 rounded">
                  <div className="text-black dark:text-white text-xs">실현 수익금</div>
                  <div className={`font-medium ${getProfitColorClass(round.realizedProfitRate)}`}>
                    {formatAmount(round.realizedProfitAmount || 0)}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 rounded">
                  <div className="text-black dark:text-white text-xs">미실현 수익금</div>
                  <div className={`font-medium ${getProfitColorClass(round.unrealizedProfitRate)}`}>
                    {round.unrealizedProfitAmount !== undefined ? formatAmount(round.unrealizedProfitAmount) : "-"}
                  </div>
                </div>
              </>
            )}
            {round.totalSellAmount === 0 && (
              <div className="bg-white dark:bg-gray-800 p-2 rounded">
                <div className="text-black dark:text-white text-xs">미실현 수익금</div>
                <div className={`font-medium ${profitColor}`}>
                  {round.unrealizedProfitAmount !== undefined ? formatAmount(round.unrealizedProfitAmount) : "-"}
                </div>
              </div>
            )}
          </div>

          {/* Split Buy History */}
          {round.buys.length > 1 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="text-xs text-black dark:text-white mb-1">분할 매수 내역</div>
              {round.buys.map((buy, index) => (
                <div key={buy.id} className="text-xs bg-white dark:bg-gray-800 p-1.5 rounded mb-1">
                  <span className="font-medium">{index + 1}. </span>
                  {formatPrice(buy.price)} × {formatQuantity(buy.quantity)} = {formatAmount(buy.amount)}
                  <span className="text-black dark:text-white ml-2">({formatDate(buy.date)})</span>
                </div>
              ))}
            </div>
          )}

          {/* Sell Info */}
          {round.sells.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="text-xs text-black dark:text-white mb-1">매도 내역</div>
              {round.sells.map((sell, index) => (
                <div key={sell.id} className="text-xs bg-white dark:bg-gray-800 p-1.5 rounded mb-1">
                  <span className="font-medium">{index + 1}. </span>
                  {formatPrice(sell.price)} × {formatQuantity(sell.quantity)} = {formatAmount(sell.amount)}
                  <span className="text-black dark:text-white ml-2">({formatDate(sell.date)})</span>
                </div>
              ))}
              {round.sells.length > 1 && (
                <div className="text-xs text-black dark:text-white mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                  총 매도: {formatAmount(round.totalSellAmount)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
