import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for updating stock
const updateStockSchema = z.object({
  itemCode: z.string().optional(),
  itemName: z.string().min(1, "Item name is required").optional(),
  category: z.string().min(1, "Category is required").optional(),
  color: z.string().optional(),
  quantity: z.number().int().positive("Quantity must be a positive integer").optional(),
  unitPrice: z.number().positive("Unit price must be positive").optional(),
  supplier: z.string().min(1, "Supplier is required").optional(),
})

// GET /api/stock/[id] - Get single stock item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const stock = await prisma.stock.findUnique({
      where: { id },
    })

    if (!stock) {
      return NextResponse.json(
        { success: false, error: 'Stock item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: stock,
    })
  } catch (error) {
    console.error('Error fetching stock:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock item' },
      { status: 500 }
    )
  }
}

// PUT /api/stock/[id] - Update stock item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate the request body
    const validatedData = updateStockSchema.parse(body)

    // Check if stock exists
    const existingStock = await prisma.stock.findUnique({
      where: { id },
    })

    if (!existingStock) {
      return NextResponse.json(
        { success: false, error: 'Stock item not found' },
        { status: 404 }
      )
    }

    // Update the stock item
    const stock = await prisma.stock.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json({
      success: true,
      data: stock,
      message: 'Stock item updated successfully',
    })
  } catch (error) {
    console.error('Error updating stock:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update stock item' },
      { status: 500 }
    )
  }
}

// DELETE /api/stock/[id] - Delete stock item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if stock exists
    const existingStock = await prisma.stock.findUnique({
      where: { id },
    })

    if (!existingStock) {
      return NextResponse.json(
        { success: false, error: 'Stock item not found' },
        { status: 404 }
      )
    }

    // Delete the stock item
    await prisma.stock.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Stock item deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting stock:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete stock item' },
      { status: 500 }
    )
  }
}
