import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/billing/[id] - Get a single purchase by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            stock: true
          }
        },
        payments: true
      }
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: purchase,
    })
  } catch (error) {
    console.error('Error fetching purchase:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase' },
      { status: 500 }
    )
  }
}
