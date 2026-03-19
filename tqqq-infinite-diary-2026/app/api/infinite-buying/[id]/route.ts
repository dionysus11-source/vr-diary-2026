import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = request.headers.get('x-user-id')
  const { id } = await context.params
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  try {
    const rawData = await request.json()
    
    // For updates, the easiest way using Prisma while maintaining IDs is to delete existing trades and recreate them, or use a manual transaction.
    await prisma.$transaction(async (tx) => {
      // 1. Update basic fields
      await tx.infiniteRound.update({
        where: { id, userId },
        data: {
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
        }
      });
      
      // 2. Refresh buys
      if (rawData.buys) {
        await tx.infiniteTrade.deleteMany({ where: { roundBuyId: id } })
        if (rawData.buys.length > 0) {
          await tx.infiniteTrade.createMany({
            data: rawData.buys.map((b: any) => ({
              id: b.id,
              type: b.type,
              symbol: b.symbol,
              date: b.date,
              price: b.price,
              quantity: b.quantity,
              amount: b.amount,
              roundBuyId: id,
            }))
          })
        }
      }
      
      // 3. Refresh sells
      if (rawData.sells) {
        await tx.infiniteTrade.deleteMany({ where: { roundSellId: id } })
        if (rawData.sells.length > 0) {
          await tx.infiniteTrade.createMany({
            data: rawData.sells.map((s: any) => ({
              id: s.id,
              type: s.type,
              symbol: s.symbol,
              date: s.date,
              price: s.price,
              quantity: s.quantity,
              amount: s.amount,
              roundSellId: id,
            }))
          })
        }
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = request.headers.get('x-user-id')
  const { id } = await context.params
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  try {
    await prisma.infiniteRound.delete({
      where: { id, userId }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
