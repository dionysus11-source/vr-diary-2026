"use client"

import { Round, Trade } from "@/types"
import { formatPrice, formatQuantity, formatAmount, formatProfitRate, formatDate, getProfitColorClass } from "@/lib/data/trades"
import { Button } from "./Button"
import { useState } from "react"
import { RoundTimeSeriesProfitChart } from "@/components/charts/RoundTimeSeriesProfitChart"
import { V22Guide } from "./V22Guide"

interface RoundDetailModalProps {
  round: Round
  onClose: () => void
  onAddBuy: () => void
  onAddSell: () => void
  onEditTrade: (trade: Trade) => void
  onDeleteTrade: (trade: Trade) => void
  onDelete: () => void
  onUpdateCurrentPrice: (price: number) => void
  onUpdateRoundSettings: (totalSeedAmount?: number, tryAmount?: number) => void
}

export function RoundDetailModal({
  round,
  onClose,
  onAddBuy,
  onAddSell,
  onEditTrade,
  onDeleteTrade,
  onDelete,
  onUpdateCurrentPrice,
  onUpdateRoundSettings,
}: RoundDetailModalProps) {
  const [currentPriceInput, setCurrentPriceInput] = useState("")
  const profitColor = getProfitColorClass(round.profitRate)

  const handleCurrentPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(currentPriceInput.replace(/,/g, ""))
    if (!isNaN(price) && price > 0) {
      onUpdateCurrentPrice(price)
      setCurrentPriceInput("")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">회차 {round.roundNumber} 상세 정보</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* V2.2 가이드 영역 추가 */}
          <V22Guide round={round} />

         {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-black dark:text-white">종목</div>
              <div className="font-semibold">{round.symbol}</div>
            </div>
            <div>
              <div className="text-sm text-black dark:text-white">상태</div>
              <div className="font-semibold">
                {round.status === "active" ? "진행중" : "완료"}
              </div>
            </div>
            <div>
              <div className="text-sm text-black dark:text-white">총 원금(Seed)</div>
              <div className="font-semibold">
                {round.totalSeedAmount !== undefined ? formatAmount(round.totalSeedAmount) : "미설정"}
              </div>
            </div>
            <div>
              <div className="text-sm text-black dark:text-white">1회 시도액</div>
              <div className="font-semibold">
                {round.tryAmount !== undefined ? formatAmount(round.tryAmount) : "미설정 (자동)"}
              </div>
            </div>
            <div>
              <div className="text-sm text-black dark:text-white">평균 매수 단가</div>
              <div className="font-semibold">{formatPrice(round.averageBuyPrice)}</div>
            </div>
            <div>
              <div className="text-sm text-black dark:text-white">총 매수 수량</div>
              <div className="font-semibold">{formatQuantity(round.totalBuyQuantity)}주</div>
            </div>
            <div>
              <div className="text-sm text-black dark:text-white">매도 수량</div>
              <div className="font-semibold">
                {round.totalSellQuantity > 0 ? formatQuantity(round.totalSellQuantity) + "주" : "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-black dark:text-white">보유 수량</div>
              <div className="font-semibold">{formatQuantity(round.remainingQuantity)}주</div>
            </div>
            <div>
              <div className="text-sm text-black dark:text-white">총 매수액</div>
              <div className="font-semibold">{formatAmount(round.totalBuyAmount)}</div>
            </div>
            {round.totalSellAmount > 0 && (
              <>
                <div>
                  <div className="text-sm text-black dark:text-white">실현 수익금</div>
                  <div className={`font-semibold ${getProfitColorClass(round.realizedProfitRate)}`}>
                    {formatAmount(round.realizedProfitAmount || 0)}
                    <span className="ml-2 text-sm">
                      {round.realizedProfitRate !== undefined ? formatProfitRate(round.realizedProfitRate) : "-"}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-black dark:text-white">미실현 수익금</div>
                  <div className={`font-semibold ${getProfitColorClass(round.unrealizedProfitRate)}`}>
                    {round.unrealizedProfitAmount !== undefined ? formatAmount(round.unrealizedProfitAmount) : "-"}
                    <span className="ml-2 text-sm">
                      {round.unrealizedProfitRate !== undefined ? formatProfitRate(round.unrealizedProfitRate) : "-"}
                    </span>
                  </div>
                </div>
              </>
            )}
            {round.totalSellAmount === 0 && (
              <div>
                <div className="text-sm text-black dark:text-white">미실현 수익</div>
                <div className={`font-semibold ${profitColor}`}>
                  {round.profitAmount !== undefined ? formatAmount(round.profitAmount) : "-"}
                  <span className="ml-2">
                    {round.profitRate !== undefined ? formatProfitRate(round.profitRate) : "-"}
                  </span>
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-black dark:text-white">매수일</div>
              <div className="font-semibold">{formatDate(round.buys[0]?.date || "")}</div>
            </div>
            {round.sells.length > 0 && (
              <div>
                <div className="text-sm text-black dark:text-white">최종 매도일</div>
                <div className="font-semibold">{formatDate(round.sells[round.sells.length - 1]?.date || "")}</div>
              </div>
            )}
          </div>

          {/* Time Series Profit Chart */}
          <div>
            <h3 className="font-semibold mb-3">시계열 수익률 추이</h3>
            <RoundTimeSeriesProfitChart round={round} />
          </div>

          {/* Split Buy History */}
          {round.buys.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">분할 매수 내역</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left">순서</th>
                      <th className="px-3 py-2 text-left">일자</th>
                      <th className="px-3 py-2 text-right">가격</th>
                      <th className="px-3 py-2 text-right">수량</th>
                      <th className="px-3 py-2 text-right">금액</th>
                      <th className="px-3 py-2 text-center">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {round.buys.map((buy, index) => (
                      <tr key={buy.id} className="border-t dark:border-gray-700">
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">{formatDate(buy.date)}</td>
                        <td className="px-3 py-2 text-right">{formatPrice(buy.price)}</td>
                        <td className="px-3 py-2 text-right">{formatQuantity(buy.quantity)}</td>
                        <td className="px-3 py-2 text-right">{formatAmount(buy.amount)}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => onEditTrade(buy)}
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              title="수정"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => onDeleteTrade(buy)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              title="삭제"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                      <td className="px-3 py-2" colSpan={5}>
                        합계
                      </td>
                      <td className="px-3 py-2 text-right">{formatAmount(round.totalBuyAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sell History */}
          {round.sells.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">매도 내역</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left">순서</th>
                      <th className="px-3 py-2 text-left">일자</th>
                      <th className="px-3 py-2 text-right">가격</th>
                      <th className="px-3 py-2 text-right">수량</th>
                      <th className="px-3 py-2 text-right">금액</th>
                      <th className="px-3 py-2 text-center">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {round.sells.map((sell, index) => (
                      <tr key={sell.id} className="border-t dark:border-gray-700">
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">{formatDate(sell.date)}</td>
                        <td className="px-3 py-2 text-right">{formatPrice(sell.price)}</td>
                        <td className="px-3 py-2 text-right">{formatQuantity(sell.quantity)}</td>
                        <td className="px-3 py-2 text-right">{formatAmount(sell.amount)}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => onEditTrade(sell)}
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              title="수정"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => onDeleteTrade(sell)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              title="삭제"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                      <td className="px-3 py-2" colSpan={5}>
                        합계
                      </td>
                      <td className="px-3 py-2 text-right">{formatAmount(round.totalSellAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">실현 수익금</span>
                  <span className={`font-semibold ${getProfitColorClass(round.realizedProfitRate)}`}>
                    {formatAmount(round.realizedProfitAmount || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Current Price Input (Active Rounds) */}
          {round.status === "active" && (
            <div>
              <h3 className="font-semibold mb-2">현재 가격 업데이트</h3>
              <form onSubmit={handleCurrentPriceSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={currentPriceInput}
                  onChange={(e) => setCurrentPriceInput(e.target.value)}
                  placeholder="현재 가격 입력 (예: 45.32)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
                <Button type="submit" size="md">
                  업데이트
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
          {round.status === "active" && (
              <>
              <Button onClick={() => onUpdateRoundSettings()} variant="secondary">
                설정 편집
              </Button>
              <Button onClick={onAddBuy} variant="secondary">
                매수 추가
              </Button>
              {round.remainingQuantity > 0 && (
                <Button onClick={onAddSell} variant="primary">
                  매도 추가
                </Button>
              )}
            </>
          )}
          <Button onClick={onDelete} variant="danger">
            회차 삭제
          </Button>
        </div>
      </div>
    </div>
  )
}
