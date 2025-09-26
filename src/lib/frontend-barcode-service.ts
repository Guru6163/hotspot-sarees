// Frontend Barcode Service
// Handles all barcode printing through backend API calls only
// No direct printer access from frontend

export interface FrontendStickerData {
  stockID: string
  itemName: string
  category?: string
  unitPrice: number
  barcodeText: string
}

export interface FrontendBarcodeRequest {
  barcodeText: string
  label?: string
  quantity: number
}

export interface FrontendBulkRequest {
  items: Array<{
    stockID: string
    itemName: string
    category?: string
    unitPrice: number
    barcodeText: string
    quantity: number
  }>
}

export interface PrintResult {
  success: boolean
  message: string
  details?: Record<string, unknown>
}

export class FrontendBarcodeService {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api'
  }

  /**
   * Print single barcode sticker through backend
   */
  async printBarcodeSticker(request: FrontendBarcodeRequest): Promise<PrintResult> {
    try {
      console.log('Frontend: Sending barcode print request to backend:', request)
      
      const response = await fetch(`${this.baseUrl}/barcode-print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'single',
          ...request
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('Frontend: Backend barcode print successful:', result.message)
      } else {
        console.error('Frontend: Backend barcode print failed:', result.message)
      }
      
      return result
    } catch (error) {
      console.error('Frontend: Barcode print request failed:', error)
      return {
        success: false,
        message: `Failed to send print request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Print stock stickers through backend
   */
  async printStockStickers(stickers: FrontendStickerData[], quantity: number): Promise<PrintResult> {
    try {
      console.log('Frontend: Sending stock stickers print request to backend:', { stickers: stickers.length, quantity })
      
      const response = await fetch(`${this.baseUrl}/tsc-print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stickers,
          quantity
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('Frontend: Backend stock stickers print successful:', result.message)
      } else {
        console.error('Frontend: Backend stock stickers print failed:', result.message)
      }
      
      return result
    } catch (error) {
      console.error('Frontend: Stock stickers print request failed:', error)
      return {
        success: false,
        message: `Failed to send print request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Print bulk stickers through backend
   */
  async printBulkStickers(request: FrontendBulkRequest): Promise<PrintResult> {
    try {
      console.log('Frontend: Sending bulk stickers print request to backend:', { items: request.items.length })
      
      const response = await fetch(`${this.baseUrl}/barcode-print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'bulk',
          ...request
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('Frontend: Backend bulk stickers print successful:', result.message)
      } else {
        console.error('Frontend: Backend bulk stickers print failed:', result.message)
      }
      
      return result
    } catch (error) {
      console.error('Frontend: Bulk stickers print request failed:', error)
      return {
        success: false,
        message: `Failed to send print request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Get printer status from backend
   */
  async getPrinterStatus(): Promise<PrintResult> {
    try {
      console.log('Frontend: Getting printer status from backend')
      
      const response = await fetch(`${this.baseUrl}/barcode-print`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('Frontend: Backend printer status retrieved:', result.message)
      } else {
        console.error('Frontend: Backend printer status failed:', result.message)
      }
      
      return result
    } catch (error) {
      console.error('Frontend: Printer status request failed:', error)
      return {
        success: false,
        message: `Failed to get printer status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Test printer connection through backend
   */
  async testPrinterConnection(): Promise<PrintResult> {
    try {
      console.log('Frontend: Testing printer connection through backend')
      
      const response = await fetch(`${this.baseUrl}/tsc-test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('Frontend: Backend printer connection test successful:', result.message)
      } else {
        console.error('Frontend: Backend printer connection test failed:', result.message)
      }
      
      return result
    } catch (error) {
      console.error('Frontend: Printer connection test request failed:', error)
      return {
        success: false,
        message: `Failed to test printer connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Get available printers from backend
   */
  async getAvailablePrinters(): Promise<PrintResult> {
    try {
      console.log('Frontend: Getting available printers from backend')
      
      const response = await fetch(`${this.baseUrl}/tsc-print`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('Frontend: Backend available printers retrieved:', result.message)
      } else {
        console.error('Frontend: Backend available printers failed:', result.message)
      }
      
      return result
    } catch (error) {
      console.error('Frontend: Available printers request failed:', error)
      return {
        success: false,
        message: `Failed to get available printers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      }
    }
  }
}

// Export singleton instance
export const frontendBarcodeService = new FrontendBarcodeService()
