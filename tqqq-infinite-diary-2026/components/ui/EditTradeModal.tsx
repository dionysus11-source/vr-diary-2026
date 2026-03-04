"use client"

import { useState, useEffect } from "react"
import { Trade } from "@/types"

interface EditTradeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (price: number, quantity: number, date: string) => Promise<void>
  trade: Trade | null
}

export function EditTradeModal({ isOpen, onClose, onSubmit, trade }: EditTradeModalProps) {
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [date, setDate] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (trade) {
      setPrice(trade.price.toString())
      setQuantity(trade.quantity.toString())
      setDate(trade.date)
    }
  }, [trade])

  if (!isOpen || !trade) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const priceNum = Number.parseFloat(price)
    const quantityNum = Number.parseFloat(quantity)

    if (Number.isNaN(priceNum) || priceNum <= 0) {
      alert("유효한 가격을 입력해주세요")
      return
    }

    if (Number.isNaN(quantityNum) || quantityNum <= 0) {
      alert("유효한 수량을 입력해주세요")
      return
    }

    if (!date) {
      alert("날짜를 입력해주세요")
      return
    }

    try {
      setLoading(true)
      await onSubmit(priceNum, quantityNum, date)
      onClose()
    } catch (error) {
      alert(error instanceof Error ? error.message : "거래 수정에 실패했습니다")
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
            {tradeTypeLabel} 내역 수정 - {trade.symbol}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 가격 */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                {tradeTypeLabel} 가격 ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="예: 35.50"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 수량 */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                {tradeTypeLabel} 수량
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="예: 10"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 일자 */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                {tradeTypeLabel} 일자
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 예상 금액 표시 */}
            {price && quantity && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                <div className="text-sm text-black dark:text-white">
                  {tradeTypeLabel} 금액:{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${(Number.parseFloat(price) * Number.parseFloat(quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* 버튼 그룹 */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "수정 중..." : "수정"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
