"use client"

import { useState } from "react"
import { Trade } from "@/types"

interface DeleteTradeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  trade: Trade | null
}

export function DeleteTradeModal({ isOpen, onClose, onConfirm, trade }: DeleteTradeModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !trade) return null

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm()
      onClose()
    } catch (error) {
      alert(error instanceof Error ? error.message : "거래 삭제에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const tradeTypeLabel = trade.type === "buy" ? "매수" : "매도"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {tradeTypeLabel} 내역 삭제
          </h2>

          <div className="mb-6">
            <p className="text-black dark:text-white mb-4">
              정말로 이 {tradeTypeLabel} 내역을 삭제하시겠습니까?
            </p>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">종목:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{trade.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">일자:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{trade.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">가격:</span>
                  <span className="font-medium text-gray-900 dark:text-white">${trade.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">수량:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{trade.quantity.toLocaleString()}주</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1 mt-2">
                  <span className="text-black dark:text-white">금액:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${trade.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {trade.type === "buy" && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                ⚠️ 매수 내역을 삭제하면 평균 매수가와 보유 수량이 다시 계산됩니다.
              </p>
            )}
            {trade.type === "sell" && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                ⚠️ 매도 내역을 삭제하면 실현 수익과 보유 수량이 다시 계산됩니다.
              </p>
            )}
          </div>

          {/* 버튼 그룹 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
