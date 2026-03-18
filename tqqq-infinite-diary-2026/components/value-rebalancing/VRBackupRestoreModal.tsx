"use client"

import { useState } from "react"

interface VRBackupRestoreModalProps {
  onClose: () => void
}

export function VRBackupRestoreModal({ onClose }: VRBackupRestoreModalProps) {
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleBackup = () => {
    try {
      const { downloadVRJSONBackup } = require("@/lib/data/vr-storage")
      downloadVRJSONBackup()
      onClose()
    } catch (error) {
      console.error("Backup failed:", error)
    }
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsRestoring(true)
    setRestoreError("")

    try {
      const { restoreVRFromJSONBackup } = require("@/lib/data/vr-storage")
      await restoreVRFromJSONBackup(file)

      // 성공하면 페이지 새로고침
      window.location.reload()
    } catch (error) {
      setRestoreError(error instanceof Error ? error.message : "복원에 실패했습니다.")
      setIsRestoring(false)
    }
  }

  const handleCSVExport = async () => {
    try {
      const { loadVRRecords, downloadVRCSV } = require("@/lib/data/vr-storage")
      const records = await loadVRRecords()
      downloadVRCSV(records)
    } catch (error) {
      console.error("CSV export failed:", error)
    }
  }

  const handleDeleteAll = () => {
    if (showDeleteConfirm) {
      // 확인 상태면 실제 삭제
      try {
        localStorage.removeItem("value_rebalancing_db")
        window.location.reload()
      } catch (error) {
        console.error("Delete failed:", error)
      }
    } else {
      // 처음 클릭이면 확인 상태로 변경
      setShowDeleteConfirm(true)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            백업/복원
          </h2>

          <div className="space-y-4">
            {/* JSON 백업 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                JSON 백업
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                전체 데이터를 JSON 파일로 백업합니다.
              </p>
              <button
                onClick={handleBackup}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                백업 파일 다운로드
              </button>
            </div>

            {/* JSON 복원 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                JSON 복원
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                백업 파일에서 데이터를 복원합니다.
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  disabled={isRestoring}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    dark:file:bg-blue-900/30 dark:file:text-blue-300"
                />
              </label>
              {restoreError && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  {restoreError}
                </p>
              )}
            </div>

            {/* CSV 내보내기 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                CSV 내보내기
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                리밸런싱 기록을 CSV 파일로 내보냅니다.
              </p>
              <button
                onClick={handleCSVExport}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                CSV 다운로드
              </button>
            </div>

            {/* 모든 데이터 삭제 */}
            <div className="border border-red-200 dark:border-red-900 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-red-900 dark:text-red-300">
                ⚠️ 모든 데이터 삭제
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {showDeleteConfirm
                  ? "정말 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다!"
                  : "초기 포트폴리오 설정과 모든 리밸런싱 기록을 삭제합니다."}
              </p>
              <div className="flex gap-2">
                {showDeleteConfirm ? (
                  <>
                    <button
                      onClick={handleDeleteAll}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      확인 (삭제)
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleDeleteAll}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    모든 데이터 삭제
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
