"use client"

import { useEffect, useState } from "react"
import { Round, TabFilter, CardViewMode, Trade } from "@/types"
import { loadRounds, addRound, getNextRoundNumber, updateRound } from "@/lib/data/storage"
import { createRound, createTrade, addBuyToRound, addSellToRound } from "@/lib/data/trades"
import { calculateStatistics, calculateAdvancedStatistics } from "@/lib/calculations/statistics"
import { fetchDailyPrices, clearAllPriceCache } from "@/lib/api/stockPrices"
import { getKoreanDate } from "@/lib/utils/timezone"
import { TabNavigation } from "@/components/ui/TabNavigation"
import { RoundCard } from "@/components/ui/RoundCard"
import { RoundDetailModal } from "@/components/ui/RoundDetailModal"
import { LoadingState } from "@/components/ui/LoadingState"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorState } from "@/components/ui/ErrorState"
import { Button } from "@/components/ui/Button"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { NewRoundModal } from "@/components/ui/NewRoundModal"
import { AddBuyModal } from "@/components/ui/AddBuyModal"
import { AddSellModal } from "@/components/ui/AddSellModal"
import { EditTradeModal } from "@/components/ui/EditTradeModal"
import { DeleteTradeModal } from "@/components/ui/DeleteTradeModal"
import { StatisticsCards } from "@/components/charts/StatisticsCards"
import { CumulativeProfitChart } from "@/components/charts/CumulativeProfitChart"
import { MDDChart } from "@/components/charts/MDDChart"

export default function Home() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabFilter>("all")
  const [viewMode, setViewMode] = useState<CardViewMode>("compact")
  const [selectedRound, setSelectedRound] = useState<Round | null>(null)
  const [showNewRoundModal, setShowNewRoundModal] = useState(false)
  const [showAddBuyModal, setShowAddBuyModal] = useState(false)
  const [showAddSellModal, setShowAddSellModal] = useState(false)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [showEditTradeModal, setShowEditTradeModal] = useState(false)
  const [deletingTrade, setDeletingTrade] = useState<Trade | null>(null)
  const [showDeleteTradeModal, setShowDeleteTradeModal] = useState(false)

  // 회차 데이터 불러오기
  const loadRoundsData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await loadRounds()

      // 진행중인 회차들의 현재 가격 업데이트
      const activeRounds = data.filter(r => r.status === "active")
      for (const round of activeRounds) {
        try {
          // 최신 종가 가져오기
          const today = getKoreanDate()
          const prices = await fetchDailyPrices(round.symbol, round.buys[0].date, today)
          if (prices.length > 0) {
            const latestPrice = prices[prices.length - 1].close
            // currentPrice 업데이트를 위해 updateRound 호출
            await updateRound(round.id, { currentPrice: latestPrice })
          }
        } catch (err) {
          console.error(`회차 #${round.roundNumber} 현재 가격 업데이트 실패:`, err)
        }
      }

      // 업데이트된 데이터 다시 로드
      const updatedData = await loadRounds()
      setRounds(updatedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로딩에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 한국시간 기반 날짜 매칭 변경으로 인해 캐시 삭제 (일회성)
    const cacheCleanupFlag = localStorage.getItem("cache_cleanup_v1")
    if (!cacheCleanupFlag) {
      clearAllPriceCache()
      localStorage.setItem("cache_cleanup_v1", "completed")
      console.log("🔄 종가 캐시가 초기화되었습니다")
    }

    loadRoundsData()
  }, [])

  // 필터링된 회차
  const filteredRounds = rounds.filter((round) => {
    if (activeTab === "all") return true
    if (activeTab === "active") return round.status === "active"
    if (activeTab === "completed") return round.status === "completed"
    return true
  })

  // 탭별 카운트
  const counts = {
    all: rounds.length,
    active: rounds.filter((r) => r.status === "active").length,
    completed: rounds.filter((r) => r.status === "completed").length,
  }

  // 통계 계산
  const statistics = calculateStatistics(rounds)
  const advancedStats = calculateAdvancedStatistics(rounds)

  // 현재 가격 업데이트 핸들러
  const handleUpdateCurrentPrice = async (price: number) => {
    if (!selectedRound) return

    // 현재 가격 업데이트 (updateRoundCalculations에서 자동으로 미실현 수익 계산됨)
    await updateRound(selectedRound.id, {
      currentPrice: price,
    })

    await loadRoundsData()

    // selectedRound 업데이트
    const updatedRounds = await loadRounds()
    const updated = updatedRounds.find((r) => r.id === selectedRound.id)
    if (updated) {
      setSelectedRound(updated)
    }
  }

  // 새 회차 생성 핸들러
  const handleCreateRound = async (symbol: string, firstBuyPrice: number, firstBuyQuantity: number) => {
    const nextRoundNumber = await getNextRoundNumber()
    const firstBuy = createTrade(symbol, "buy", firstBuyPrice, firstBuyQuantity)
    const newRound = createRound(symbol, nextRoundNumber, [firstBuy])
    await addRound(newRound)
    await loadRoundsData()
  }

  // 매수 추가 핸들러
  const handleAddBuy = async (price: number, quantity: number, date: string) => {
    if (!selectedRound) return

    const newBuy = createTrade(selectedRound.symbol, "buy", price, quantity, date)
    const updatedRound = addBuyToRound(selectedRound, newBuy)

    await updateRound(selectedRound.id, {
      buys: updatedRound.buys,
    })

    await loadRoundsData()

    // selectedRound 업데이트
    const updatedRounds = await loadRounds()
    const updated = updatedRounds.find((r) => r.id === selectedRound.id)
    if (updated) {
      setSelectedRound(updated)
    }
  }

  // 매도 추가 핸들러
  const handleAddSell = async (price: number, quantity: number, date: string) => {
    if (!selectedRound) return

    const newSell = createTrade(selectedRound.symbol, "sell", price, quantity, date)
    const updatedRound = addSellToRound(selectedRound, newSell)

    await updateRound(selectedRound.id, {
      sells: updatedRound.sells,
      status: updatedRound.status,
    })

    await loadRoundsData()

    // selectedRound 업데이트
    const updatedRounds = await loadRounds()
    const updated = updatedRounds.find((r) => r.id === selectedRound.id)
    if (updated) {
      setSelectedRound(updated)
    }
  }

  // 거래 수정 핸들러
  const handleEditTrade = async (price: number, quantity: number, date: string) => {
    if (!selectedRound || !editingTrade) return

    let updatedBuys = [...selectedRound.buys]
    let updatedSells = [...selectedRound.sells]

    if (editingTrade.type === "buy") {
      const index = updatedBuys.findIndex((b) => b.id === editingTrade.id)
      if (index !== -1) {
        updatedBuys[index] = {
          ...editingTrade,
          price,
          quantity,
          amount: price * quantity,
          date,
        }
      }
    } else {
      const index = updatedSells.findIndex((s) => s.id === editingTrade.id)
      if (index !== -1) {
        updatedSells[index] = {
          ...editingTrade,
          price,
          quantity,
          amount: price * quantity,
          date,
        }
      }
    }

    await updateRound(selectedRound.id, {
      buys: updatedBuys,
      sells: updatedSells,
    })

    await loadRoundsData()

    // selectedRound 업데이트
    const updatedRounds = await loadRounds()
    const updated = updatedRounds.find((r) => r.id === selectedRound.id)
    if (updated) {
      setSelectedRound(updated)
    }

    setEditingTrade(null)
  }

  // 거래 삭제 핸들러
  const handleDeleteTrade = async () => {
    if (!selectedRound || !deletingTrade) return

    let updatedBuys = [...selectedRound.buys]
    let updatedSells = [...selectedRound.sells]

    if (deletingTrade.type === "buy") {
      updatedBuys = updatedBuys.filter((b) => b.id !== deletingTrade.id)
    } else {
      updatedSells = updatedSells.filter((s) => s.id !== deletingTrade.id)
    }

    await updateRound(selectedRound.id, {
      buys: updatedBuys,
      sells: updatedSells,
    })

    await loadRoundsData()

    // selectedRound 업데이트
    const updatedRounds = await loadRounds()
    const updated = updatedRounds.find((r) => r.id === selectedRound.id)
    if (updated) {
      setSelectedRound(updated)
    }

    setDeletingTrade(null)
  }

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadRoundsData} />
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                무한 매수 다이어리 2026
              </h1>
              <p className="text-black dark:text-white mt-1">
                TQQQ/SOXL 무한 매수 회차별 수익률 추적 및 분석
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <ThemeToggle />
              <Button onClick={() => setViewMode(viewMode === "compact" ? "detailed" : "compact")}>
                {viewMode === "compact" ? "상세 모드" : "간결 모드"}
              </Button>
              <Button variant="primary" onClick={() => setShowNewRoundModal(true)}>
                + 새 회차
              </Button>
            </div>
          </div>
        </header>

        {/* Statistics */}
        <StatisticsCards statistics={{ ...statistics, ...advancedStats }} />

        {/* Charts Section */}
        {rounds.length > 0 && (
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4">누적 수익금 추이</h2>
                <CumulativeProfitChart rounds={rounds} />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4">최대 손실폭 (MDD)</h2>
                <MDDChart rounds={rounds} />
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
        />

        {/* Rounds Grid */}
        {filteredRounds.length === 0 ? (
          <EmptyState
            title="회차 기록이 없습니다"
            description={
              activeTab === "all"
                ? "아직 회차 기록이 없습니다. 첫 번째 회차를 시작해보세요!"
                : activeTab === "active"
                ? "진행중인 회차가 없습니다."
                : "완료된 회차가 없습니다."
            }
            action={{
              label: "+ 새 회차 시작",
              onClick: () => setShowNewRoundModal(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRounds.map((round) => (
              <RoundCard
                key={round.id}
                round={round}
                viewMode={viewMode}
                onClick={() => setSelectedRound(round)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Round Detail Modal */}
      {selectedRound && (
        <RoundDetailModal
          round={selectedRound}
          onClose={() => setSelectedRound(null)}
          onAddBuy={() => setShowAddBuyModal(true)}
          onAddSell={() => setShowAddSellModal(true)}
          onEditTrade={(trade) => {
            setEditingTrade(trade)
            setShowEditTradeModal(true)
          }}
          onDeleteTrade={(trade) => {
            setDeletingTrade(trade)
            setShowDeleteTradeModal(true)
          }}
          onDelete={() => console.log("Delete round")}
          onUpdateCurrentPrice={handleUpdateCurrentPrice}
        />
      )}

      {/* New Round Modal */}
      <NewRoundModal
        isOpen={showNewRoundModal}
        onClose={() => setShowNewRoundModal(false)}
        onSubmit={handleCreateRound}
      />

      {/* Add Buy Modal */}
      {selectedRound && (
        <AddBuyModal
          isOpen={showAddBuyModal}
          onClose={() => setShowAddBuyModal(false)}
          onSubmit={handleAddBuy}
          symbol={selectedRound.symbol}
        />
      )}

      {/* Add Sell Modal */}
      {selectedRound && (
        <AddSellModal
          isOpen={showAddSellModal}
          onClose={() => setShowAddSellModal(false)}
          onSubmit={handleAddSell}
          symbol={selectedRound.symbol}
          remainingQuantity={selectedRound.remainingQuantity}
          averageBuyPrice={selectedRound.averageBuyPrice}
        />
      )}

      {/* Edit Trade Modal */}
      {selectedRound && editingTrade && (
        <EditTradeModal
          isOpen={showEditTradeModal}
          onClose={() => {
            setShowEditTradeModal(false)
            setEditingTrade(null)
          }}
          onSubmit={handleEditTrade}
          trade={editingTrade}
        />
      )}

      {/* Delete Trade Modal */}
      {selectedRound && deletingTrade && (
        <DeleteTradeModal
          isOpen={showDeleteTradeModal}
          onClose={() => {
            setShowDeleteTradeModal(false)
            setDeletingTrade(null)
          }}
          onConfirm={handleDeleteTrade}
          trade={deletingTrade}
        />
      )}
    </main>
  )
}
