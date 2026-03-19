import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = request.headers.get('x-user-id') || searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const infiniteRounds = await prisma.infiniteRound.findMany({
      where: { userId },
      include: { buys: true, sells: true }
    });

    const vrInitialPortfolio = await prisma.vrInitialPortfolio.findFirst({ where: { userId } })
    const vrRecords = await prisma.vrRecord.findMany({ where: { userId }, orderBy: { date: 'desc' } })
    const vrRounds = await prisma.vrRound.findMany({ where: { userId }, include: { transactions: true } })

    const backupData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      userId,
      data: {
        infiniteBuying: { 
          rounds: infiniteRounds, 
          symbols: ["TQQQ", "SOXL"] // static mapping for sync brevity
        },
        valueRebalancing: {
          initialPortfolio: vrInitialPortfolio,
          records: vrRecords,
          rounds: vrRounds,
          transactions: vrRounds.flatMap((r: any) => r.transactions)
        }
      }
    }

    return NextResponse.json(backupData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
