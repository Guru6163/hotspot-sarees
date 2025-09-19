import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

// Validation schema for transport data
const createTransportSchema = z.object({
  inDate: z.string().transform((str) => new Date(str)),
  numberOfBundles: z.number().int().positive("Number of bundles must be a positive integer"),
  freightCharges: z.number().positive("Freight charges must be positive"),
  invoiceNo: z.string().min(1, "Invoice number is required"),
  amount: z.number().positive("Amount must be positive"),
  gst: z.number().min(0, "GST cannot be negative"),
  notes: z.string().optional(),
})

// const updateTransportSchema = createTransportSchema.partial()

// GET /api/transport - Get all transport records with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: {
      OR?: Array<{
        invoiceNo?: {
          contains: string;
          mode: 'insensitive';
        };
        numberOfBundles?: {
          equals: number | undefined;
        };
      }>;
      inDate?: {
        gte?: Date;
        lte?: Date;
      };
    } = {}

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: "insensitive" } },
        { numberOfBundles: { equals: parseInt(search) || undefined } },
      ]
    }

    if (dateFrom || dateTo) {
      where.inDate = {}
      if (dateFrom) {
        where.inDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.inDate.lte = new Date(dateTo)
      }
    }

    // Get transport records with pagination
    const [transports, total] = await Promise.all([
      prisma.transport.findMany({
        where,
        orderBy: { inDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.transport.count({ where }),
    ])

    return NextResponse.json({
      transports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching transport records:", error)
    return NextResponse.json(
      { error: "Failed to fetch transport records" },
      { status: 500 }
    )
  }
}

// POST /api/transport - Create a new transport record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = createTransportSchema.parse(body)

    // Calculate total amount
    const totalAmount = validatedData.amount + validatedData.gst

    // Check if invoice number already exists
    const existingTransport = await prisma.transport.findUnique({
      where: { invoiceNo: validatedData.invoiceNo },
    })

    if (existingTransport) {
      return NextResponse.json(
        { error: "Invoice number already exists" },
        { status: 400 }
      )
    }

    // Create the transport record
    const transport = await prisma.transport.create({
      data: {
        ...validatedData,
        totalAmount,
      },
    })

    return NextResponse.json(transport, { status: 201 })
  } catch (error) {
    console.error("Error creating transport record:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create transport record" },
      { status: 500 }
    )
  }
}
