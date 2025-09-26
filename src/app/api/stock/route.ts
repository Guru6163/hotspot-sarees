import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Function to generate a unique stockID with HS-#### format
async function generateStockID(): Promise<string> {
  let counter = 1
  
  while (true) {
    // Generate HS-#### format with zero-padded numbers
    const stockID = `HS-${counter.toString().padStart(4, '0')}`
    
    // Check if this stockID already exists
    const existingStock = await prisma.stock.findUnique({
      where: { stockID }
    })
    
    if (!existingStock) {
      return stockID
    }
    
    counter++
  }
}

// Validation schema for creating stock
const createStockSchema = z.object({
  itemCode: z.string().optional(),
  itemName: z.string().min(1, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  color: z.string().optional(),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unitPrice: z.number().positive("Unit price must be positive"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  supplier: z.string().min(1, "Supplier is required"),
})

// GET /api/stock - Get all stock items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      category?: string;
      OR?: Array<{
        itemName: {
          equals?: string;
          startsWith?: string;
          contains?: string;
          mode: 'insensitive';
        };
      }>;
    } = {}
    if (category) {
      where.category = category
    }
    if (search) {
      where.OR = [
        // Exact matches first (highest priority)
        { itemName: { equals: search, mode: 'insensitive' } },
        // Starts with matches (second priority)
        { itemName: { startsWith: search, mode: 'insensitive' } },
        // Contains matches (lowest priority)
        { itemName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [stocks, total] = await Promise.all([
      prisma.stock.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stock.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: stocks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching stocks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stocks' },
      { status: 500 }
    )
  }
}

// POST /api/stock - Create new stock item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = createStockSchema.parse(body)

    // Calculate profit fields
    const profitAmount = validatedData.sellingPrice - validatedData.unitPrice
    const profitPercentage = (profitAmount / validatedData.unitPrice) * 100

    // Generate unique stockID
    const stockID = await generateStockID()

    // Create the stock item with generated stockID and calculated profit fields
    const stock = await prisma.stock.create({
      data: {
        ...validatedData,
        stockID,
        profitAmount,
        profitPercentage,
      },
    })

    return NextResponse.json({
      success: true,
      data: stock,
      message: 'Stock item created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating stock:', error)
    
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
      { success: false, error: 'Failed to create stock item' },
      { status: 500 }
    )
  }
}
