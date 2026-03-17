"use client"

import { useState, useRef } from "react"
import { downloadJSONBackup, restoreFromJSONBackup } from "@/lib/data/storage"

interface BackupRestoreModalProps {
  isOpen: boolean
  onClose: () => void
  onRestore: () => Promise<void>
}

export function BackupRestoreModal({ isOpen, onClose, onRestore }: BackupRestoreModalProps) {
  const [loading, setLoading] = useState(false)
  const [backupMessage, setBackupMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  // 백업(내보내기) 핸들러
  const handleBackup = async () => {
    try {
      setLoading(true)
      setBackupMessage("")
      downloadJSONBackup()
      setBackupMessage("백업 파일이 다운로드되었습니다")
      setTimeout(() => setBackupMessage(""), 3000)
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "백업에 실패했습니다")
      setTimeout(() => setBackupMessage(""), 5000)
    } finally {
      setLoading(false)
    }
  }

  // 복원(가져오기) 핸들러
  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault()

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      alert("복원할 파일을 선택해주세요")
      return
    }

    if (!file.name.endsWith(".json")) {
      alert("JSON 파일만 가능합니다")
      return
    }

    const confirmed = confirm(
      "⚠️ 주의: 현재 데이터가 모두 삭제되고 백업 파일로 대체됩니다.\n\n정말 복원하시겠습니까?"
    )

    if (!confirmed) return

    try {
      setLoading(true)
      await restoreFromJSONBackup(file)
      await onRestore()
      setBackupMessage("복원이 완료되었습니다")
      setTimeout(() => {
        setBackupMessage("")
        handleClose()
      }, 1500)
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "복원에 실패했습니다")
      setTimeout(() => setBackupMessage(""), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setBackupMessage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            데이터 백업/복원
          </h2>

          <div className="space-y-6">
            {/* 백업 섹션 */}
            <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                📥 백업 (내보내기)
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                현재 모든 데이터를 JSON 파일로 다운로드합니다
              </p>
              <button
                type="button"
                onClick={handleBackup}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? "백업 중..." : "백업 파일 다운로드"}
              </button>
            </div>

            {/* 복원 섹션 */}
            <div className="bg-orange-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                📤 복원 (가져오기)
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                백업 파일에서 데이터를 복원합니다
                <br />
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  ⚠️ 현재 데이터가 모두 대체됩니다
                </span>
              </p>
              <form onSubmit={handleRestore}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  disabled={loading}
                  className="w-full text-sm text-gray-900 dark:text-white file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-blue-300 dark:hover:file:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? "복원 중..." : "복원 실행"}
                </button>
              </form>
            </div>

            {/* 메시지 표시 */}
            {backupMessage && (
              <div
                className={`text-sm p-3 rounded-md ${
                  backupMessage.includes("실패") || backupMessage.includes("잘못")
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                }`}
              >
                {backupMessage}
              </div>
            )}

            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
