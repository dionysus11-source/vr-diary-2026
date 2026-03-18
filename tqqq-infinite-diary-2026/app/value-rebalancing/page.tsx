"use client"

import { useEffect, useState } from "react"
import { VRInitialPortfolio, VRRecord, VRRound, VRPortfolioStatus } from "@/types"
import { getInitialPortfolio, loadVRRecords, loadVRRounds } from "@/lib/data/vr-storage"
import { ValueRebalancingCalculator } from "@/lib/calculations/vr-calculator"
import { VRPortfolioCard } from "@/components/value-rebalancing/VRPortfolioCard"
import { VRInitialPortfolioForm } from "@/components/value-rebalancing/VRInitialPortfolioForm"
import { VRVValueForm } from "@/components/value-rebalancing/VRVValueForm"
import { VRRoundCard } from "@/components/value-rebalancing/VRRoundCard"
import { VRBackupRestoreModal } from "@/components/value-rebalancing/VRBackupRestoreModal"
import { VRRoundDetailModal } from "@/components/value-rebalancing/VRRoundDetailModal"
import { VRRecommendationModal } from "@/components/value-rebalancing/VRRecommendationModal"
import { VValueChart } from "@/components/value-rebalancing/charts/VValueChart"
import { BenchmarkComparisonChart } from "@/components/value-rebalancing/charts/BenchmarkComparisonChart"

export default function ValueRebalancingPage() {
  const [initialPortfolio, setInitialPortfolio] = useState<VRInitialPortfolio | null>(null)
  const [records, setRecords] = useState<VRRecord[]>([])
  const [rounds, setRounds] = useState<VRRound[]>([])
  const [loading, setLoading] = useState(true)
  const [showVValueForm, setShowVValueForm] = useState(false)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showRecommendationModal, setShowRecommendationModal] = useState(false)
  const [selectedRound, setSelectedRound] = useState<VRRound | null>(null)

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1)
  const roundsPerPage = 6

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    console.log('=== Loading data ===')
    try {
      // 모든 차수의 활성 상태 업데이트 (날짜 기반 자동 계산)
      const { updateAllRoundsActiveStatus } = require("@/lib/data/vr-round-manager")
      await updateAllRoundsActiveStatus()

      const [portfolio, recordList, roundList] = await Promise.all([
        getInitialPortfolio(),
        loadVRRecords(),
        loadVRRounds(),
      ])

      console.log('Loaded records:', recordList.length)
      console.log('Loaded rounds:', roundList.length)
      console.log('Rounds data:', roundList)

      // 차수를 최신이 위로 오도록 정렬 (roundNumber 기준 내림차순)
      const sortedRounds = [...roundList].sort((a, b) => b.roundNumber - a.roundNumber)

      setInitialPortfolio(portfolio)
      setRecords(recordList)
      setRounds(sortedRounds)
      setCurrentPage(1) // 데이터 로드 시 1페이지로 초기화
    } catch (error) {
      console.error("Failed to load VR data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInitialPortfolioComplete = () => {
    loadData()
  }

  const handleVValueFormComplete = () => {
    setShowVValueForm(false)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 초기 포트폴리오가 설정되지 않은 경우
  if (!initialPortfolio) {
    return <VRInitialPortfolioForm onComplete={handleInitialPortfolioComplete} />
  }

  // 현재 포트폴리오 상태 계산
  const latestRecord = records.length > 0 ? records[0] : null
  let portfolioStatus: VRPortfolioStatus | null = null

  if (latestRecord && initialPortfolio) {
    const eValue = latestRecord.eValue
    const pool = latestRecord.pool
    const vValue = latestRecord.vValue
    const signal = latestRecord.signal
    const totalValue = ValueRebalancingCalculator.calculateVRTotalValue(eValue, pool)

    const benchmarkShares = ValueRebalancingCalculator.calculateBenchmarkShares(
      initialPortfolio.totalInvested,
      initialPortfolio.averagePrice
    )
    const benchmarkValue = ValueRebalancingCalculator.calculateBenchmarkValue(
      benchmarkShares,
      latestRecord.price
    )

    const [difference, differenceRate] = ValueRebalancingCalculator.calculateDifference(
      totalValue,
      benchmarkValue
    )

    portfolioStatus = {
      shares: latestRecord.shares,
      pool,
      eValue,
      vValue,
      signal,
      benchmarkShares,
      benchmarkValue,
      totalValue,
      difference,
      differenceRate,
    }
  }

  const previousRecord = latestRecord
    ? {
        vValue: latestRecord.vValue,
        shares: latestRecord.shares,
        pool: latestRecord.pool,
      }
    : null

  // 페이지네이션 계산
  const totalPages = Math.ceil(rounds.length / roundsPerPage)
  const startIndex = (currentPage - 1) * roundsPerPage
  const endIndex = startIndex + roundsPerPage
  const currentRounds = rounds.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          밸류 리밸런싱
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBackupModal(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            백업/복원
          </button>
          <button
            onClick={() => setShowRecommendationModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            매수/매도 추천
          </button>
          <button
            onClick={() => setShowVValueForm(!showVValueForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            {showVValueForm ? "닫기" : "V값 계산"}
          </button>
        </div>
      </div>

      {/* V값 계산 폼 */}
      {showVValueForm && (
        <div className="mb-8">
          <VRVValueForm
            initialPortfolio={initialPortfolio}
            previousRecord={previousRecord}
            rounds={rounds}
            portfolioStatus={portfolioStatus}
            onComplete={handleVValueFormComplete}
          />
        </div>
      )}

      {/* 현재 포트폴리오 상태 카드 */}
      {portfolioStatus && <VRPortfolioCard status={portfolioStatus} />}

      {/* 차트들 */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 gap-6 mt-6">
          <VValueChart records={records} />
          <BenchmarkComparisonChart records={records} initialPortfolio={initialPortfolio} />
        </div>
      )}

      {/* 차수 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 mt-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          차수 목록 ({rounds.length}개)
        </h2>
        {rounds.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>아직 차수가 없습니다.</p>
            <p className="text-sm mt-2">첫 V값 계산을 시작해주세요.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentRounds.map((round) => (
                <VRRoundCard
                  key={round.roundId}
                  round={round}
                  onClick={() => setSelectedRound(round)}
                />
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  이전
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  다음
                </button>
              </div>
            )}

            {/* 페이지 정보 */}
            <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              총 {rounds.length}개 차수 중 {startIndex + 1}-{Math.min(endIndex, rounds.length)}개 표시
              (페이지 {currentPage}/{totalPages})
            </div>
          </>
        )}
      </div>

      {/* 백업/복원 모달 */}
      {showBackupModal && (
        <VRBackupRestoreModal onClose={() => setShowBackupModal(false)} />
      )}

      {/* 매수/매도 추천 모달 */}
      {showRecommendationModal && portfolioStatus && (
        <VRRecommendationModal
          vValue={portfolioStatus.vValue}
          shares={portfolioStatus.shares}
          pool={portfolioStatus.pool}
          onClose={() => setShowRecommendationModal(false)}
        />
      )}

      {/* 차수 상세 모달 */}
      {selectedRound && (
        <VRRoundDetailModal
          round={selectedRound}
          onClose={() => setSelectedRound(null)}
          onRefresh={() => loadData()}
          onUpdate={(updatedRound) => setSelectedRound(updatedRound)}
        />
      )}
    </div>
  )
}
