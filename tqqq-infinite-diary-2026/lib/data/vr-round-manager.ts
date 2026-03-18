import { VRRecord, VRRound, VRTransaction } from "@/types"
import { addVRRound, addVRTransaction, loadVRRecords, addVRRecord as addRecord, getVRRound, loadVRRounds, loadVRDatabase, saveVRDatabase } from "@/lib/data/vr-storage"
import { ValueRebalancingCalculator } from "@/lib/calculations/vr-calculator"

/**
 * 차수 활성 상태 계산 (날짜 기반)
 * @param endDate - 차수 종료일
 * @returns 활성 상태 (true: 진행중, false: 완료)
 */
function calculateRoundActiveStatus(endDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // 시간 초기화

  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  return today <= end
}

/**
 * 리밸런싱 기록 추가 시 차수 자동 계산 및 업데이트
 */
export async function addVRRecordWithRound(record: VRRecord): Promise<void> {
  // 기존 기록 가져오기
  const existingRecords = await loadVRRecords()

  // 첫 번째 기록 날짜 찾기 (기존 레코드가 있으면 가장 오래된 것, 없으면 현재 레코드)
  const firstRecordDate = existingRecords.length > 0
    ? existingRecords[existingRecords.length - 1].date
    : record.date

  console.log('=== addVRRecordWithRound ===')
  console.log('Existing records:', existingRecords.length)
  console.log('First record date:', firstRecordDate)
  console.log('New record date:', record.date)

  // 차수 계산
  const [startDate, endDate, roundNumber] = ValueRebalancingCalculator.calculateRoundPeriod(
    record.date,
    firstRecordDate
  )
  const roundId = ValueRebalancingCalculator.getRoundId(record.date, firstRecordDate)

  console.log('Calculated round:', roundId, 'Period:', startDate, 'to', endDate, 'Number:', roundNumber)

  // 기존 차수가 있는지 확인
  const existingRound = await getVRRound(roundId)

  if (existingRound) {
    // 기존 차수 업데이트
    const isActive = calculateRoundActiveStatus(endDate)
    const updatedRound: VRRound = {
      ...existingRound,
      finalShares: record.shares,
      finalPool: record.pool,
      sharesChange: record.shares - existingRound.initialShares,
      poolChange: record.pool - existingRound.initialPool,
      isActive,
      updatedAt: new Date().toISOString(),
    }

    await addVRRound(updatedRound)
  } else {
    // 새 차수 생성
    const isActive = calculateRoundActiveStatus(endDate)
    const newRound: VRRound = {
      roundId,
      roundNumber,
      startDate,
      endDate,
      initialShares: record.shares,
      initialPool: record.pool,
      finalShares: record.shares,
      finalPool: record.pool,
      sharesChange: 0, // 첫 기록이므로 변화 없음
      poolChange: 0,
      transactions: [],
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await addVRRound(newRound)
  }

  // 리밸런싱 기록 추가
  await addRecord(record)
}

/**
 * 차수 완료 처리
 */
export async function completeRound(roundId: string): Promise<void> {
  const round = await getVRRound(roundId)

  if (!round) {
    throw new Error(`차수를 찾을 수 없습니다: ${roundId}`)
  }

  // 차수를 완료 상태로 변경
  const completedRound: VRRound = {
    ...round,
    isActive: false,
    updatedAt: new Date().toISOString(),
  }

  await addVRRound(completedRound)
}

/**
 * 매수/매도 거래 기록 추가
 */
export async function addVRTransactionRecord(
  roundId: string,
  type: "BUY" | "SELL",
  shares: number,
  price: number,
  notes: string = ""
): Promise<void> {
  const round = await getVRRound(roundId)

  if (!round) {
    throw new Error(`차수를 찾을 수 없습니다: ${roundId}`)
  }

  const totalAmount = shares * price
  const sharesAfter = type === "BUY"
    ? round.finalShares + shares
    : round.finalShares - shares
  const poolAfter = type === "BUY"
    ? round.finalPool - totalAmount
    : round.finalPool + totalAmount

  // 거래 기록 생성
  const transaction: VRTransaction = {
    id: `${roundId}-${Date.now()}`,
    roundId,
    date: new Date().toISOString().split("T")[0],
    type,
    shares,
    price,
    totalAmount,
    sharesAfter,
    poolAfter,
    notes,
    createdAt: new Date().toISOString(),
  }

  await addVRTransaction(transaction)

  // 차수 업데이트
  const updatedRound: VRRound = {
    ...round,
    finalShares: sharesAfter,
    finalPool: poolAfter,
    sharesChange: sharesAfter - round.initialShares,
    poolChange: poolAfter - round.initialPool,
    transactions: [...round.transactions, transaction],
    updatedAt: new Date().toISOString(),
  }

  await addVRRound(updatedRound)
}

/**
 * 거래 기록 삭제
 */
export async function deleteVRTransaction(transactionId: string): Promise<void> {
  const db = await loadVRDatabase()

  // 거래 삭제
  db.transactions = db.transactions.filter((t) => t.id !== transactionId)

  // 해당 차수의 거래 내역만 남기기
  const remainingTransactions = db.transactions.filter((t) => {
    const round = db.rounds.find((r) => r.roundId === t.roundId)
    return round !== undefined
  })

  // 각 차수를 처음부터 다시 계산
  for (const round of db.rounds) {
    const roundTransactions = remainingTransactions.filter((t) => t.roundId === round.roundId)

    // 초기 상태부터 시작
    let currentShares = round.initialShares
    let currentPool = round.initialPool

    // 모든 거래를 순서대로 적용
    for (const transaction of roundTransactions) {
      if (transaction.type === "BUY") {
        currentShares += transaction.shares
        currentPool -= transaction.totalAmount
      } else {
        currentShares -= transaction.shares
        currentPool += transaction.totalAmount
      }
    }

    // 차수 업데이트
    round.finalShares = currentShares
    round.finalPool = currentPool
    round.sharesChange = currentShares - round.initialShares
    round.poolChange = currentPool - round.initialPool
    round.transactions = roundTransactions
    round.updatedAt = new Date().toISOString()
  }

  await saveVRDatabase(db)
}

/**
 * 모든 차수의 활성 상태 업데이트 (날짜 기반 자동 계산)
 */
export async function updateAllRoundsActiveStatus(): Promise<void> {
  const db = await loadVRDatabase()

  for (const round of db.rounds) {
    const isActive = calculateRoundActiveStatus(round.endDate)
    if (round.isActive !== isActive) {
      round.isActive = isActive
      round.updatedAt = new Date().toISOString()
    }
  }

  await saveVRDatabase(db)
}
