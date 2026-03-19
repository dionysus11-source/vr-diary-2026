import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = request.headers.get('x-user-id') || searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  await prisma.user.upsert({ where: { id: userId }, update: {}, create: { id: userId } })

  const initialPortfolio = await prisma.vrInitialPortfolio.findFirst({ where: { userId } })
  const records = await prisma.vrRecord.findMany({ where: { userId }, orderBy: { date: 'desc' } })
  const rounds = await prisma.vrRound.findMany({ where: { userId }, include: { transactions: true } })
  
  return NextResponse.json({
    initialPortfolio,
    records,
    rounds: rounds.map((r: any) => ({
      ...r,
      roundId: r.id,
      transactions: r.transactions.map((t: any) => ({
        ...t,
        roundId: t.vrRoundId
      }))
    })),
    transactions: rounds.flatMap((r: any) => 
      r.transactions.map((t: any) => ({
        ...t,
        roundId: t.vrRoundId
      }))
    )
  })
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  try {
    const data = await request.json()
    
    await prisma.$transaction(async (tx: any) => {
       await tx.vrInitialPortfolio.deleteMany({ where: { userId } })
       await tx.vrRecord.deleteMany({ where: { userId } })
       await tx.vrRound.deleteMany({ where: { userId } }) 
       
       if (data.initialPortfolio) {
         await tx.vrInitialPortfolio.create({
           data: {
             userId,
             initialDate: data.initialPortfolio.initialDate,
             initialCash: data.initialPortfolio.initialCash,
             initialShares: data.initialPortfolio.initialShares,
             averagePrice: data.initialPortfolio.averagePrice,
             totalInvested: data.initialPortfolio.totalInvested,
           }
         })
       }
       
       if (data.records?.length > 0) {
         await tx.vrRecord.createMany({
           data: data.records.map((r: any) => ({
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
       
       if (data.rounds?.length > 0) {
         for (const round of data.rounds) {
            await tx.vrRound.create({
              data: {
                id: round.roundId,
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
                  create: round.transactions.map((t: any) => ({
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
