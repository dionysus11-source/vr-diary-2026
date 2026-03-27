"use client"

import { useState } from "react"
import { VRPortfolioStatus } from "@/types"
import { updateLatestVRRecord } from "@/lib/data/vr-storage"

interface VRPortfolioEditModalProps {
  status: VRPortfolioStatus
  onClose: () => void
  onComplete: () => void
}

export function VRPortfolioEditModal({ status, onClose, onComplete }: VRPortfolioEditModalProps) {
  const [shares, setShares] = useState(status.shares.toString())
  const [pool, setPool] = useState(status.pool.toString())
  const [vValue, setVValue] = useState(status.vValue.toString())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const parsedShares = parseInt(shares)
      const parsedPool = parseFloat(pool)
      const parsedVValue = parseFloat(vValue)

      if (isNaN(parsedShares) || parsedShares < 0) {
        throw new Error("유효한 주식수를 입력해주세요.")
      }
      if (isNaN(parsedPool) || parsedPool < 0) {
        throw new Error("유효한 현금을 입력해주세요.")
      }
      if (isNaN(parsedVValue) || parsedVValue < 0) {
        throw new Error("유효한 V값을 입력해주세요.")
      }

      await updateLatestVRRecord(parsedShares, parsedPool, parsedVValue)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              포트폴리오 기록 수정
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            실제 계좌 정보와 다를 경우, 주식수, 현금, V값을 수정하여 동기화할 수 있습니다. 
            (가장 최신 기록이 덮어씌워집니다)
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                현재 주식수
              </label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                현재 현금 (Pool)
              </label>
              <input
                type="number"
                step="0.01"
                value={pool}
                onChange={(e) => setPool(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                현재 V값
              </label>
              <input
                type="number"
                step="0.01"
                value={vValue}
                onChange={(e) => setVValue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "수정 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
