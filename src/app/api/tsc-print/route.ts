import { NextRequest, NextResponse } from 'next/server'
import { serverTSCPrinter, TSCPrintRequest } from '@/lib/server-tsc-printer'

export async function POST(request: NextRequest) {
  try {
    const body: TSCPrintRequest = await request.json()
    
    // Validate request
    if (!body.stickers || !Array.isArray(body.stickers) || body.stickers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid request: stickers array is required' },
        { status: 400 }
      )
    }

    if (!body.quantity || body.quantity < 1) {
      return NextResponse.json(
        { success: false, message: 'Invalid request: quantity must be at least 1' },
        { status: 400 }
      )
    }

    // Print stickers using server-side TSC printer
    const result = await serverTSCPrinter.printStickers(body)
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 500 })
    }
    
  } catch (error) {
    console.error('TSC Print API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get available printers
    const printers = serverTSCPrinter.getAvailablePrinters()
    
    return NextResponse.json({
      success: true,
      printers,
      message: `Found ${printers.length} TSC printer(s)`
    })
    
  } catch (error) {
    console.error('TSC Print API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}
