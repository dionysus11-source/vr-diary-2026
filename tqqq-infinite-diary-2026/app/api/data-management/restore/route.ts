import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  try {
    const payload = await request.json()
    // Payload should have data.infiniteBuying and data.valueRebalancing
    const data = payload.data
    
    if (!data || !data.infiniteBuying || !data.valueRebalancing) {
      return NextResponse.json({ error: 'Invalid backup payload format' }, { status: 400 })
    }

    await prisma.$transaction(async (tx: any) => {
      // 1. Wipe current user data
      await tx.infiniteRound.deleteMany({ where: { userId } })
      await tx.vrInitialPortfolio.deleteMany({ where: { userId } })
      await tx.vrRecord.deleteMany({ where: { userId } })
      await tx.vrRound.deleteMany({ where: { userId } })
      
      // 2. Restore Infinite Buying
      for (const round of data.infiniteBuying.rounds || []) {
        await tx.infiniteRound.create({
          data: {
            id: round.id,
            userId,
            roundNumber: round.roundNumber,
            symbol: round.symbol,
            status: round.status,
            totalSeedAmount: round.totalSeedAmount,
            tryAmount: round.tryAmount,
            averageBuyPrice: round.averageBuyPrice,
            totalBuyQuantity: round.totalBuyQuantity,
            totalSellQuantity: round.totalSellQuantity,
            remainingQuantity: round.remainingQuantity,
            totalBuyAmount: round.totalBuyAmount,
            totalSellAmount: round.totalSellAmount,
            netSellAmount: round.netSellAmount,
            currentPrice: round.currentPrice,
            profitRate: round.profitRate,
            realizedProfitRate: round.realizedProfitRate,
            unrealizedProfitRate: round.unrealizedProfitRate,
            profitAmount: round.profitAmount,
            realizedProfitAmount: round.realizedProfitAmount,
            unrealizedProfitAmount: round.unrealizedProfitAmount,
            buys: {
              create: (round.buys || []).map((b: any) => ({
                id: b.id,
                type: b.type,
                symbol: b.symbol,
                date: b.date,
                price: b.price,
                quantity: b.quantity,
                amount: b.amount,
              }))
            },
            sells: {
              create: (round.sells || []).map((s: any) => ({
                id: s.id,
                type: s.type,
                symbol: s.symbol,
                date: s.date,
                price: s.price,
                quantity: s.quantity,
                amount: s.amount,
              }))
            }
          }
        })
      }

      // 3. Restore Value Rebalancing
      const vr = data.valueRebalancing
      if (vr.initialPortfolio) {
         await tx.vrInitialPortfolio.create({
           data: {
             userId,
             initialDate: vr.initialPortfolio.initialDate,
             initialCash: vr.initialPortfolio.initialCash,
             initialShares: vr.initialPortfolio.initialShares,
             averagePrice: vr.initialPortfolio.averagePrice,
             totalInvested: vr.initialPortfolio.totalInvested,
           }
         })
       }
       
       if (vr.records?.length > 0) {
         await tx.vrRecord.createMany({
           data: vr.records.map((r: any) => ({
             userId,
             date: r.date,
             price: r.price,
             shares: r.shares,
             pool: r.pool,
             eValue: r.eValue,
             vValue: r.vValue,
             signal: r.signal,
             benchmarkShares: r.benchmarkShares,
             benchmarkValue: r.benchmarkValue,
           }))
         })
       }
       
       if (vr.rounds?.length > 0) {
         for (const round of vr.rounds) {
            await tx.vrRound.create({
              data: {
                id: round.roundId || round.id,
                userId,
                roundNumber: round.roundNumber,
                startDate: round.startDate,
                endDate: round.endDate,
                initialShares: round.initialShares,
                initialPool: round.initialPool,
                finalShares: round.finalShares,
                finalPool: round.finalPool,
                sharesChange: round.sharesChange,
                poolChange: round.poolChange,
                isActive: round.isActive,
                transactions: {
                  create: (round.transactions || []).map((t: any) => ({
                    id: t.id,
                    date: t.date,
                    type: t.type,
                    shares: t.shares,
                    price: t.price,
                    totalAmount: t.totalAmount,
                    sharesAfter: t.sharesAfter,
                    poolAfter: t.poolAfter,
                    notes: t.notes || "",
                  }))
                }
              }
            })
         }
       }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
