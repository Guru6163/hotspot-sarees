// Server-side TSC printer service using our custom TSC printer implementation
// This runs on the server and can communicate with USB-connected TSC printers

import { customTSCPrinter, StickerData as CustomStickerData } from './custom-tsc-printer'

export interface ServerStickerData {
  stockID: string
  itemName: string
  category?: string
  unitPrice: number
  barcodeText: string
}

export interface TSCPrintRequest {
  stickers: ServerStickerData[]
  quantity: number
  printerVendorId?: number
  printerProductId?: number
}

export class ServerTSCPrinterService {
  constructor() {
    // Custom TSC printer is already initialized
    console.log('Server TSC Printer Service initialized')
    
    // Check if USB functionality is available
    try {
      const printers = customTSCPrinter.getAvailablePrinters()
      if (printers.length === 0) {
        console.log('No TSC printers detected or USB module not available')
      } else {
        console.log(`Found ${printers.length} TSC printer(s)`)
      }
    } catch (error) {
      console.warn('TSC printer detection failed:', error)
    }
  }

  /**
   * Print thermal stickers using real TSC printer
   */
  async printStickers(request: TSCPrintRequest): Promise<{ success: boolean; message: string }> {
    try {
      const { stickers, quantity } = request
      
      // Convert server sticker data to custom sticker data
      const customStickers: CustomStickerData[] = stickers.map(sticker => ({
        stockID: sticker.stockID,
        itemName: sticker.itemName,
        category: sticker.category,
        unitPrice: sticker.unitPrice,
        barcodeText: sticker.barcodeText
      }))
      
      // Use custom TSC printer to print stickers
      const result = await customTSCPrinter.printStickers(customStickers, quantity)
      
      return result
      
    } catch (error) {
      console.error('TSC Printer Error:', error)
      return {
        success: false,
        message: `Print failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }


  /**
   * Get available TSC printers
   */
  getAvailablePrinters(): Array<{ vendorId: number; productId: number; name: string }> {
    return customTSCPrinter.getAvailablePrinters()
  }

  /**
   * Test printer connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return await customTSCPrinter.testConnection()
  }

  /**
   * Close printer connection
   */
  closeConnection(): void {
    customTSCPrinter.closeConnection()
  }
}

// Export singleton instance
export const serverTSCPrinter = new ServerTSCPrinterService()
