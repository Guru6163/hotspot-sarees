import { NextRequest, NextResponse } from 'next/server'
import { backendTSCPrinter, BackendPrintRequest, BarcodePrintRequest, BulkPrintRequest } from '@/lib/backend-tsc-printer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle different types of print requests
    if (body.type === 'barcode') {
      // Single barcode print request
      const barcodeRequest: BarcodePrintRequest = body
      
      if (!barcodeRequest.barcodeText || !barcodeRequest.quantity) {
        return NextResponse.json(
          { success: false, message: 'Invalid request: barcodeText and quantity are required' },
          { status: 400 }
        )
      }

      const result = await backendTSCPrinter.printBarcodeSticker(barcodeRequest)
      return NextResponse.json(result, { status: result.success ? 200 : 500 })
    }
    
    else if (body.type === 'bulk') {
      // Bulk print request
      const bulkRequest: BulkPrintRequest = body
      
      if (!bulkRequest.items || !Array.isArray(bulkRequest.items) || bulkRequest.items.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid request: items array is required' },
          { status: 400 }
        )
      }

      const result = await backendTSCPrinter.printBulkStickers(bulkRequest)
      return NextResponse.json(result, { status: result.success ? 200 : 500 })
    }
    
    else {
      // Standard stickers print request (backward compatibility)
      const printRequest: BackendPrintRequest = body
      
      // Validate request
      if (!printRequest.stickers || !Array.isArray(printRequest.stickers) || printRequest.stickers.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid request: stickers array is required' },
          { status: 400 }
        )
      }

      if (!printRequest.quantity || printRequest.quantity < 1) {
        return NextResponse.json(
          { success: false, message: 'Invalid request: quantity must be at least 1' },
          { status: 400 }
        )
      }

      // Print stickers using backend TSC printer
      const result = await backendTSCPrinter.printStickers(printRequest)
      
      if (result.success) {
        return NextResponse.json(result, { status: 200 })
      } else {
        return NextResponse.json(result, { status: 500 })
      }
    }
    
  } catch (error) {
    console.error('TSC Print API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get available printers and status
    const printers = backendTSCPrinter.getAvailablePrinters()
    const status = backendTSCPrinter.getPrinterStatus()
    
    return NextResponse.json({
      success: true,
      printers,
      status,
      message: `Found ${printers.length} TSC printer(s)`
    })
    
  } catch (error) {
    console.error('TSC Print API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}
