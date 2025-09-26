// Enhanced Backend TSC Printer Service
// Handles all barcode printing operations from the backend only
// No frontend printing dependencies

import { customTSCPrinter, StickerData as CustomStickerData } from './custom-tsc-printer'
import { backendPrintLogger, PrintLogEntry, PrintMetrics } from './backend-print-logger'

export interface BackendStickerData {
  stockID: string
  itemName: string
  category?: string
  unitPrice: number
  barcodeText: string
}

export interface BackendPrintRequest {
  stickers: BackendStickerData[]
  quantity: number
  printerVendorId?: number
  printerProductId?: number
}

export interface BarcodePrintRequest {
  barcodeText: string
  label?: string
  quantity: number
  width?: number
  height?: number
}

export interface BulkPrintRequest {
  items: Array<{
    stockID: string
    itemName: string
    category?: string
    unitPrice: number
    barcodeText: string
    quantity: number
  }>
}

export class BackendTSCPrinterService {
  private isInitialized = false
  private availablePrinters: Array<{ vendorId: number; productId: number; name: string }> = []

  constructor() {
    this.initialize()
  }

  /**
   * Initialize the backend printer service
   */
  private async initialize(): Promise<void> {
    try {
      console.log('Initializing Backend TSC Printer Service...')
      
      // Get available printers
      this.availablePrinters = customTSCPrinter.getAvailablePrinters()
      
      if (this.availablePrinters.length > 0) {
        console.log(`Found ${this.availablePrinters.length} TSC printer(s):`, this.availablePrinters)
      } else {
        console.log('No TSC printers detected. Service will use fallback methods.')
      }
      
      this.isInitialized = true
      console.log('Backend TSC Printer Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Backend TSC Printer Service:', error)
      this.isInitialized = false
    }
  }

  /**
   * Print thermal stickers using backend TSC printer
   */
  async printStickers(request: BackendPrintRequest): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
    const startTime = Date.now()
    const logId = backendPrintLogger.logPrintRequest(
      'stickers', 
      request.quantity, 
      { 
        itemsCount: request.stickers.length,
        stickers: request.stickers.map(s => ({ stockID: s.stockID, itemName: s.itemName }))
      }
    )

    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const { stickers, quantity } = request
      
      // Convert backend sticker data to custom sticker data
      const customStickers: CustomStickerData[] = stickers.map(sticker => ({
        stockID: sticker.stockID,
        itemName: sticker.itemName,
        category: sticker.category,
        unitPrice: sticker.unitPrice,
        barcodeText: sticker.barcodeText
      }))
      
      console.log(`Backend printing ${quantity} stickers for ${stickers.length} items`)
      
      // Use custom TSC printer to print stickers
      const result = await customTSCPrinter.printStickers(customStickers, quantity)
      
      const responseTime = Date.now() - startTime
      
      if (result.success) {
        console.log('Backend print successful:', result.message)
        backendPrintLogger.logPrintSuccess(logId, responseTime, {
          printedQuantity: quantity,
          itemsCount: stickers.length,
          result: result.message
        })
        
        return {
          success: true,
          message: result.message,
          details: {
            printedQuantity: quantity,
            itemsCount: stickers.length,
            responseTime,
            timestamp: new Date().toISOString()
          }
        }
      } else {
        console.error('Backend print failed:', result.message)
        backendPrintLogger.logPrintError(logId, new Error(result.message), {
          printedQuantity: quantity,
          itemsCount: stickers.length,
          responseTime
        })
        return result
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      console.error('Backend TSC Printer Error:', error)
      
      backendPrintLogger.logPrintError(logId, error instanceof Error ? error : new Error(String(error)), {
        printedQuantity: request.quantity,
        itemsCount: request.stickers.length,
        responseTime
      })
      
      return {
        success: false,
        message: `Backend print failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          responseTime,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Print single barcode sticker
   */
  async printBarcodeSticker(request: BarcodePrintRequest): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
    try {
      const { barcodeText, label = 'Barcode Label', quantity } = request
      
      // Create mock sticker data for barcode printing
      const stickerData: BackendStickerData = {
        stockID: barcodeText,
        itemName: label,
        category: 'Barcode',
        unitPrice: 0,
        barcodeText: barcodeText
      }

      console.log(`Backend printing ${quantity} barcode stickers for: ${barcodeText}`)
      
      const result = await this.printStickers({
        stickers: [stickerData],
        quantity
      })

      if (result.success) {
        return {
          success: true,
          message: `Successfully printed ${quantity} barcode stickers for ${barcodeText}`,
          details: {
            barcodeText,
            label,
            printedQuantity: quantity,
            timestamp: new Date().toISOString()
          }
        }
      }

      return result
      
    } catch (error) {
      console.error('Backend barcode print error:', error)
      return {
        success: false,
        message: `Barcode print failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          barcodeText: request.barcodeText,
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Print bulk stickers for multiple items
   */
  async printBulkStickers(request: BulkPrintRequest): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
    try {
      const { items } = request
      
      console.log(`Backend bulk printing for ${items.length} different items`)
      
      let totalPrinted = 0
      const results = []
      
      for (const item of items) {
        const stickerData: BackendStickerData = {
          stockID: item.stockID,
          itemName: item.itemName,
          category: item.category,
          unitPrice: item.unitPrice,
          barcodeText: item.barcodeText
        }

        const result = await this.printStickers({
          stickers: [stickerData],
          quantity: item.quantity
        })

        results.push({
          stockID: item.stockID,
          itemName: item.itemName,
          quantity: item.quantity,
          success: result.success,
          message: result.message
        })

        if (result.success) {
          totalPrinted += item.quantity
        }
      }

      const successCount = results.filter(r => r.success).length
      const totalItems = items.length

      return {
        success: successCount > 0,
        message: `Bulk print completed: ${successCount}/${totalItems} items successful, ${totalPrinted} total stickers printed`,
        details: {
          totalItems,
          successfulItems: successCount,
          totalPrinted,
          results,
          timestamp: new Date().toISOString()
        }
      }
      
    } catch (error) {
      console.error('Backend bulk print error:', error)
      return {
        success: false,
        message: `Bulk print failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Get available TSC printers
   */
  getAvailablePrinters(): Array<{ vendorId: number; productId: number; name: string }> {
    return this.availablePrinters
  }

  /**
   * Test printer connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
    try {
      const result = await customTSCPrinter.testConnection()
      
      backendPrintLogger.logConnectionTest(result.success, result.message, {
        availablePrinters: this.availablePrinters.length
      })
      
      return {
        success: result.success,
        message: result.message,
        details: {
          availablePrinters: this.availablePrinters.length,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      backendPrintLogger.logConnectionTest(false, `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        error: error instanceof Error ? error.stack : String(error)
      })
      
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Get printer status and capabilities
   */
  getPrinterStatus(): { 
    initialized: boolean
    availablePrinters: number
    printers: Array<{ vendorId: number; productId: number; name: string }>
    timestamp: string
  } {
    return {
      initialized: this.isInitialized,
      availablePrinters: this.availablePrinters.length,
      printers: this.availablePrinters,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Get print logs and metrics
   */
  getPrintLogs(): {
    recentLogs: PrintLogEntry[]
    errorLogs: PrintLogEntry[]
    metrics: PrintMetrics
    successRate: number
  } {
    return {
      recentLogs: backendPrintLogger.getRecentLogs(50),
      errorLogs: backendPrintLogger.getErrorLogs(20),
      metrics: backendPrintLogger.getMetrics(),
      successRate: backendPrintLogger.getSuccessRate()
    }
  }

  /**
   * Export print logs for debugging
   */
  exportPrintLogs(): string {
    return backendPrintLogger.exportLogs()
  }

  /**
   * Close printer connection
   */
  closeConnection(): void {
    customTSCPrinter.closeConnection()
    console.log('Backend TSC printer connection closed')
  }
}

// Export singleton instance
export const backendTSCPrinter = new BackendTSCPrinterService()
