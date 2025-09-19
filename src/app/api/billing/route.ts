import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Function to generate a unique invoice number
async function generateInvoiceNumber(): Promise<string> {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  
  // Get count of purchases today
  const startOfDay = new Date(year, today.getMonth(), today.getDate())
  const endOfDay = new Date(year, today.getMonth(), today.getDate() + 1)
  
  const todayCount = await prisma.purchase.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay
      }
    }
  })
  
  const sequence = String(todayCount + 1).padStart(4, '0')
  return `INV-${year}${month}${day}-${sequence}`
}

// Validation schema for creating a purchase
const createPurchaseSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  subtotal: z.number().positive("Subtotal must be positive"),
  discountType: z.enum(["percentage", "price"]).optional(),
  discountValue: z.number().min(0).optional(),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().positive("Total amount must be positive"),
  paymentMethod: z.enum(["cash", "card", "upi"]),
  items: z.array(z.object({
    stockId: z.string().min(1, "Stock ID is required"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    unitPrice: z.number().positive("Unit price must be positive"),
    totalPrice: z.number().positive("Total price must be positive")
  })).min(1, "At least one item is required")
})

// POST /api/billing - Create a new purchase/bill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = createPurchaseSchema.parse(body)

    // Generate unique invoice number outside transaction
    const invoiceNumber = await generateInvoiceNumber()

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check stock availability and calculate total
      const stockUpdates = []
      const stockItems = []
      
      // First, get all stock items in one query
      const stockIds = validatedData.items.map(item => item.stockId)
      const stocks = await tx.stock.findMany({
        where: { id: { in: stockIds } }
      })

      // Create a map for quick lookup
      const stockMap = new Map(stocks.map(stock => [stock.id, stock]))

      // Validate stock availability
      for (const item of validatedData.items) {
        const stock = stockMap.get(item.stockId)

        if (!stock) {
          throw new Error(`Stock item with ID ${item.stockId} not found`)
        }

        if (stock.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${stock.itemName}. Available: ${stock.quantity}, Required: ${item.quantity}`)
        }

        stockUpdates.push({
          id: item.stockId,
          newQuantity: stock.quantity - item.quantity
        })
        stockItems.push(stock)
      }

      // Update stock quantities in batch
      await Promise.all(stockUpdates.map(update => 
        tx.stock.update({
          where: { id: update.id },
          data: { quantity: update.newQuantity }
        })
      ))

      // Create the purchase record
      const purchase = await tx.purchase.create({
        data: {
          invoiceNumber,
          customerName: validatedData.customerName,
          customerPhone: validatedData.customerPhone,
          customerEmail: validatedData.customerEmail,
          notes: validatedData.notes,
          subtotal: validatedData.subtotal,
          discountType: validatedData.discountType,
          discountValue: validatedData.discountValue,
          discountAmount: validatedData.discountAmount,
          taxAmount: validatedData.taxAmount,
          totalAmount: validatedData.totalAmount,
          paymentMethod: validatedData.paymentMethod,
          items: {
            create: validatedData.items.map(item => ({
              stockId: item.stockId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            }))
          }
        },
        include: {
          items: {
            include: {
              stock: true
            }
          }
        }
      })

      return purchase
    }, {
      timeout: 30000, // Increased timeout to 30 seconds
      isolationLevel: 'ReadCommitted' // Use a more permissive isolation level
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Purchase completed successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating purchase:', error)
    
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

    // Handle transaction-specific errors
    if (error instanceof Error) {
      if (error.message.includes('Transaction') || error.message.includes('transaction')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Database transaction failed. Please try again.',
            details: 'The operation could not be completed due to a database transaction issue.'
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process purchase' },
      { status: 500 }
    )
  }
}

// GET /api/billing - Get purchase history with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const customerName = searchParams.get('customerName')
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      customerName?: { contains: string; mode: 'insensitive' }
      paymentMethod?: string
      createdAt?: { gte?: Date; lte?: Date }
    } = {}
    
    if (customerName) {
      where.customerName = { contains: customerName, mode: 'insensitive' }
    }
    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              stock: true
            }
          }
        }
      }),
      prisma.purchase.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: purchases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}
