import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stock/barcode/[stockID] - Get stock item by stockID (barcode)
export async function GET(
  request: NextRequest,
  { params }: { params: { stockID: string } }
) {
  try {
    const stock = await prisma.stock.findUnique({
      where: { stockID: params.stockID },
    })

    if (!stock) {
      return NextResponse.json(
        { success: false, error: 'Product not found with this barcode' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: stock,
    })
  } catch (error) {
    console.error('Error fetching stock by stockID:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
