import { NextRequest, NextResponse } from 'next/server'
import { backendTSCPrinter, BarcodePrintRequest, BulkPrintRequest } from '@/lib/backend-tsc-printer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle single barcode print
    if (body.type === 'single' || !body.type) {
      const barcodeRequest: BarcodePrintRequest = body
      
      if (!barcodeRequest.barcodeText || !barcodeRequest.quantity) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid request: barcodeText and quantity are required',
            details: {
              received: { barcodeText: !!barcodeRequest.barcodeText, quantity: !!barcodeRequest.quantity },
              timestamp: new Date().toISOString()
            }
          },
          { status: 400 }
        )
      }

      console.log(`Backend barcode print request: ${barcodeRequest.barcodeText} x${barcodeRequest.quantity}`)
      const result = await backendTSCPrinter.printBarcodeSticker(barcodeRequest)
      
      return NextResponse.json(result, { 
        status: result.success ? 200 : 500 
      })
    }
    
    // Handle bulk barcode print
    else if (body.type === 'bulk') {
      const bulkRequest: BulkPrintRequest = body
      
      if (!bulkRequest.items || !Array.isArray(bulkRequest.items) || bulkRequest.items.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid request: items array is required for bulk print',
            details: {
              received: { items: bulkRequest.items?.length || 0 },
              timestamp: new Date().toISOString()
            }
          },
          { status: 400 }
        )
      }

      console.log(`Backend bulk barcode print request: ${bulkRequest.items.length} items`)
      const result = await backendTSCPrinter.printBulkStickers(bulkRequest)
      
      return NextResponse.json(result, { 
        status: result.success ? 200 : 500 
      })
    }
    
    else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request type. Use "single" or "bulk"',
          details: {
            receivedType: body.type,
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('Barcode Print API Error:', error)
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
    // Get printer status and test connection
    const status = backendTSCPrinter.getPrinterStatus()
    const connectionTest = await backendTSCPrinter.testConnection()
    
    return NextResponse.json({
      success: true,
      status,
      connectionTest,
      message: `Backend barcode printing service status: ${status.initialized ? 'Ready' : 'Not initialized'}`
    })
    
  } catch (error) {
    console.error('Barcode Print API Error:', error)
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
