"use client"

import { useState } from "react"
import { getOrCreateDeviceId } from "@/lib/utils/auth"

export default function SettingsPage() {
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreMessage, setRestoreMessage] = useState("")
  const [isError, setIsError] = useState(false)

  const handleBackup = async () => {
    try {
      const userId = getOrCreateDeviceId()
      const res = await fetch(`/api/data-management/backup?userId=${userId}`, {
        headers: { "x-user-id": userId }
      })

      if (!res.ok) throw new Error("백업 데이터를 가져오지 못했습니다.")

      const backupData = await res.json()
      const jsonStr = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" })
      const link = document.createElement("a")
      
      const url = URL.createObjectURL(blob)
      const timestamp = new Date().toISOString().split("T")[0]
      link.setAttribute("href", url)
      link.setAttribute("download", `tqqq-vr-diary-full-backup-${timestamp}.json`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm("전체 데이터를 복원하시겠습니까? 기존 데이터는 모두 삭제되고 백업 파일의 내용으로 덮어씌워집니다.")) {
      e.target.value = ""
      return
    }

    try {
      setIsRestoring(true)
      setRestoreMessage("복원 중...")
      setIsError(false)

      const text = await file.text()
      const backupData = JSON.parse(text)

      if (backupData.version !== "2.0" && backupData.version !== "1.0") {
        throw new Error("지원하지 않는 백업 파일 형식입니다.")
      }

      const userId = getOrCreateDeviceId()
      const res = await fetch(`/api/data-management/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify(backupData)
      })

      if (!res.ok) {
        let msg = "서버 복원 처리에 실패했습니다.";
        try {
          const errData = await res.json();
          if (errData.error) msg = errData.error;
        } catch(e) {}
        throw new Error(msg)
      }

      setRestoreMessage("✅ 복원이 성공적으로 완료되었습니다. 변경사항을 반영하기 위해 페이지를 새로고침 해주세요.")
      setIsError(false)
    } catch (error: any) {
      console.error(error)
      setRestoreMessage("❌ 복원 실패: " + error.message)
      setIsError(true)
    } finally {
      setIsRestoring(false)
      e.target.value = ""
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">환경설정</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2 dark:text-white">데이터 관리 (Data Management)</h2>
          <p className="text-gray-600 dark:text-gray-400">
            무한 매수법 및 밸류 리밸런싱 전체 데이터를 포함하여 서버 계정에 동기화된 모든 정보를 통째로 백업하거나 복원합니다.
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Backup Section */}
          <section>
            <h3 className="text-lg font-medium mb-4 dark:text-white">전체 데이터 백업</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              현재 저장된 모든 투자 기록을 JSON 파일로 다운로드합니다. 이 파일은 다른 기기에서 복원할 때 사용할 수 있습니다.
            </p>
            <button
              onClick={handleBackup}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📥 전체 데이터 다운로드 (백업)
            </button>
          </section>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Restore Section */}
          <section>
            <h3 className="text-lg font-medium mb-4 dark:text-white">전체 데이터 복원</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              저장해둔 백업 파일(.json)을 업로드하여 데이터를 복구합니다. <strong className="text-red-500">주의: 현재 데이터는 모두 삭제되고 백업 파일 내용으로 덮어씌워집니다.</strong>
            </p>
            <div className="flex flex-col gap-4 max-w-md">
              <label 
                className={`
                  flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer
                  hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                  ${isRestoring ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600'}
                `}
              >
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  {isRestoring ? "복원 처리 중..." : "📂 백업 파일 선택 (.json)"}
                </span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleRestore}
                  disabled={isRestoring}
                />
              </label>

              {restoreMessage && (
                <div className={`p-3 rounded text-sm ${isError ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                  {restoreMessage}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
