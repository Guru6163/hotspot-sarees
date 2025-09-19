import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

// Validation schema for transport data
const updateTransportSchema = z.object({
  inDate: z.string().transform((str) => new Date(str)).optional(),
  numberOfBundles: z.number().int().positive("Number of bundles must be a positive integer").optional(),
  freightCharges: z.number().positive("Freight charges must be positive").optional(),
  invoiceNo: z.string().min(1, "Invoice number is required").optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  gst: z.number().min(0, "GST cannot be negative").optional(),
  notes: z.string().optional(),
})

// GET /api/transport/[id] - Get a specific transport record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transport = await prisma.transport.findUnique({
      where: { id: params.id },
    })

    if (!transport) {
      return NextResponse.json(
        { error: "Transport record not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(transport)
  } catch (error) {
    console.error("Error fetching transport record:", error)
    return NextResponse.json(
      { error: "Failed to fetch transport record" },
      { status: 500 }
    )
  }
}

// PUT /api/transport/[id] - Update a specific transport record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = updateTransportSchema.parse(body)

    // Check if transport record exists
    const existingTransport = await prisma.transport.findUnique({
      where: { id: params.id },
    })

    if (!existingTransport) {
      return NextResponse.json(
        { error: "Transport record not found" },
        { status: 404 }
      )
    }

    // If invoice number is being updated, check for duplicates
    if (validatedData.invoiceNo && validatedData.invoiceNo !== existingTransport.invoiceNo) {
      const duplicateTransport = await prisma.transport.findUnique({
        where: { invoiceNo: validatedData.invoiceNo },
      })

      if (duplicateTransport) {
        return NextResponse.json(
          { error: "Invoice number already exists" },
          { status: 400 }
        )
      }
    }

    // Calculate total amount if amount or GST is being updated
    const amount = validatedData.amount ?? existingTransport.amount
    const gst = validatedData.gst ?? existingTransport.gst
    const totalAmount = amount + gst

    // Update the transport record
    const transport = await prisma.transport.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        totalAmount,
      },
    })

    return NextResponse.json(transport)
  } catch (error) {
    console.error("Error updating transport record:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update transport record" },
      { status: 500 }
    )
  }
}

// DELETE /api/transport/[id] - Delete a specific transport record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if transport record exists
    const existingTransport = await prisma.transport.findUnique({
      where: { id: params.id },
    })

    if (!existingTransport) {
      return NextResponse.json(
        { error: "Transport record not found" },
        { status: 404 }
      )
    }

    // Delete the transport record
    await prisma.transport.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Transport record deleted successfully" })
  } catch (error) {
    console.error("Error deleting transport record:", error)
    return NextResponse.json(
      { error: "Failed to delete transport record" },
      { status: 500 }
    )
  }
}
