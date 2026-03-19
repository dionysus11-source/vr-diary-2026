import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = request.headers.get('x-user-id') || searchParams.get('userId')
  
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // Create user if not exists
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId }
  })

  const rounds = await prisma.infiniteRound.findMany({
    where: { userId },
    include: { buys: true, sells: true }
  })
  
  return NextResponse.json(rounds)
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  try {
    const rawData = await request.json()
    // Frontend Round object to Prisma Schema
    const newRound = await prisma.infiniteRound.create({
      data: {
        id: rawData.id,
        userId,
        roundNumber: rawData.roundNumber,
        symbol: rawData.symbol,
        status: rawData.status,
        totalSeedAmount: rawData.totalSeedAmount,
        tryAmount: rawData.tryAmount,
        averageBuyPrice: rawData.averageBuyPrice,
        totalBuyQuantity: rawData.totalBuyQuantity,
        totalSellQuantity: rawData.totalSellQuantity,
        remainingQuantity: rawData.remainingQuantity,
        totalBuyAmount: rawData.totalBuyAmount,
        totalSellAmount: rawData.totalSellAmount,
        netSellAmount: rawData.netSellAmount,
        currentPrice: rawData.currentPrice,
        profitRate: rawData.profitRate,
        realizedProfitRate: rawData.realizedProfitRate,
        unrealizedProfitRate: rawData.unrealizedProfitRate,
        profitAmount: rawData.profitAmount,
        realizedProfitAmount: rawData.realizedProfitAmount,
        unrealizedProfitAmount: rawData.unrealizedProfitAmount,
        buys: {
          create: (rawData.buys || []).map((b: any) => ({
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
          create: (rawData.sells || []).map((s: any) => ({
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
    return NextResponse.json(newRound)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
