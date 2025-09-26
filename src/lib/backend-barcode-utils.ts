// Backend Barcode Generation Utilities
// Handles barcode generation and validation on the server side

export interface BarcodeData {
  text: string
  type: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39'
  format: 'svg' | 'png' | 'jpeg'
  width?: number
  height?: number
}

export interface BarcodeValidationResult {
  isValid: boolean
  message: string
  suggestions?: string[]
}

export class BackendBarcodeUtils {
  /**
   * Validate barcode text based on barcode type
   */
  static validateBarcodeText(text: string, type: BarcodeData['type']): BarcodeValidationResult {
    if (!text || text.trim().length === 0) {
      return {
        isValid: false,
        message: 'Barcode text cannot be empty'
      }
    }

    const cleanText = text.trim()

    switch (type) {
      case 'CODE128':
        // CODE128 can handle most ASCII characters
        if (cleanText.length > 80) {
          return {
            isValid: false,
            message: 'CODE128 barcode text cannot exceed 80 characters',
            suggestions: ['Use shorter text or consider CODE39']
          }
        }
        return { isValid: true, message: 'Valid CODE128 barcode text' }

      case 'EAN13':
        // EAN13 must be exactly 12 digits (13th digit is check digit)
        if (!/^\d{12}$/.test(cleanText)) {
          return {
            isValid: false,
            message: 'EAN13 barcode must be exactly 12 digits',
            suggestions: ['Ensure the text contains only numbers and is exactly 12 digits long']
          }
        }
        return { isValid: true, message: 'Valid EAN13 barcode text' }

      case 'UPC':
        // UPC must be exactly 11 digits (12th digit is check digit)
        if (!/^\d{11}$/.test(cleanText)) {
          return {
            isValid: false,
            message: 'UPC barcode must be exactly 11 digits',
            suggestions: ['Ensure the text contains only numbers and is exactly 11 digits long']
          }
        }
        return { isValid: true, message: 'Valid UPC barcode text' }

      case 'CODE39':
        // CODE39 can handle alphanumeric characters and some symbols
        if (!/^[A-Z0-9\-\.\s\$\/\+\%]+$/.test(cleanText)) {
          return {
            isValid: false,
            message: 'CODE39 barcode can only contain uppercase letters, numbers, and specific symbols',
            suggestions: ['Use only A-Z, 0-9, and symbols: - . $ / + %']
          }
        }
        if (cleanText.length > 43) {
          return {
            isValid: false,
            message: 'CODE39 barcode text cannot exceed 43 characters',
            suggestions: ['Use shorter text or consider CODE128']
          }
        }
        return { isValid: true, message: 'Valid CODE39 barcode text' }

      default:
        return {
          isValid: false,
          message: `Unknown barcode type: ${type}`
        }
    }
  }

  /**
   * Generate barcode data for thermal printing
   */
  static generateBarcodeData(text: string, type: BarcodeData['type'] = 'CODE128'): BarcodeData {
    const validation = this.validateBarcodeText(text, type)
    
    if (!validation.isValid) {
      throw new Error(`Invalid barcode data: ${validation.message}`)
    }

    return {
      text: text.trim(),
      type,
      format: 'svg', // SVG is best for thermal printers
      width: 200,
      height: 50
    }
  }

  /**
   * Generate TSPL barcode command for thermal printer
   */
  static generateTSPLBarcodeCommand(
    x: number, 
    y: number, 
    barcodeText: string, 
    type: BarcodeData['type'] = 'CODE128',
    height: number = 40,
    humanReadable: number = 1,
    rotation: number = 0,
    narrow: number = 2,
    wide: number = 2
  ): string {
    // Map barcode types to TSPL format
    const tspTypeMap: Record<BarcodeData['type'], string> = {
      'CODE128': '128',
      'EAN13': 'EAN13',
      'UPC': 'UPC',
      'CODE39': '39'
    }

    const tspType = tspTypeMap[type]
    if (!tspType) {
      throw new Error(`Unsupported barcode type for TSPL: ${type}`)
    }

    return `BARCODE ${x},${y},"${tspType}",${height},${humanReadable},${rotation},${narrow},${wide},"${barcodeText}"`
  }

  /**
   * Generate complete TSPL commands for barcode sticker
   */
  static generateBarcodeStickerTSPL(
    barcodeText: string,
    label: string = 'Barcode Label',
    width: number = 76.2,
    height: number = 25,
    barcodeType: BarcodeData['type'] = 'CODE128'
  ): string[] {
    const commands: string[] = []
    
    // Printer setup
    commands.push(`SIZE ${width} mm, ${height} mm`)
    commands.push('GAP 2 mm, 0 mm')
    commands.push('DIRECTION 0')
    commands.push('CLS')
    
    // Label text at the top
    commands.push(`TEXT 1,2,"TSS24.BF2",0,1,1,"${label}"`)
    
    // Barcode in the middle
    const barcodeCommand = this.generateTSPLBarcodeCommand(1, 8, barcodeText, barcodeType, 30, 1, 0, 2, 2)
    commands.push(barcodeCommand)
    
    // Barcode text at the bottom
    commands.push(`TEXT 1,18,"TSS24.BF2",0,1,1,"${barcodeText}"`)
    
    // Print command
    commands.push('PRINT 1,1')
    
    return commands
  }

  /**
   * Generate TSPL commands for stock item sticker with barcode
   */
  static generateStockStickerTSPL(
    stockID: string,
    itemName: string,
    category: string,
    unitPrice: number,
    barcodeText: string,
    width: number = 76.2,
    height: number = 25,
    barcodeType: BarcodeData['type'] = 'CODE128'
  ): string[] {
    const commands: string[] = []
    
    // Truncate long text for thermal printer
    const truncatedItemName = itemName.length > 15 ? itemName.substring(0, 12) + '...' : itemName
    const truncatedCategory = category && category.length > 8 ? category.substring(0, 6) + '...' : category
    
    // Printer setup
    commands.push(`SIZE ${width} mm, ${height} mm`)
    commands.push('GAP 2 mm, 0 mm')
    commands.push('DIRECTION 0')
    commands.push('CLS')
    
    // Stock ID at the top
    commands.push(`TEXT 1,2,"TSS24.BF2",0,1,1,"${stockID}"`)
    
    // Barcode in the middle
    const barcodeCommand = this.generateTSPLBarcodeCommand(1, 8, barcodeText, barcodeType, 30, 1, 0, 2, 2)
    commands.push(barcodeCommand)
    
    // Product name - category - price at the bottom
    const productLine = `${truncatedItemName} - ${truncatedCategory || 'N/A'} - ₹${unitPrice}`
    commands.push(`TEXT 1,18,"TSS24.BF2",0,1,1,"${productLine}"`)
    
    // Print command
    commands.push('PRINT 1,1')
    
    return commands
  }

  /**
   * Convert TSPL commands to binary data for printer
   */
  static convertTSPLToBinary(commands: string[]): Buffer[] {
    const binaryData: Buffer[] = []
    
    for (const command of commands) {
      // Convert TSPL command to binary format with proper line endings
      const commandBuffer = Buffer.from(command + '\r\n', 'utf8')
      binaryData.push(commandBuffer)
    }
    
    return binaryData
  }

  /**
   * Generate barcode for stock item
   */
  static generateStockBarcode(stockID: string, itemName: string): string {
    // Create a unique barcode based on stock ID and item name
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
    const cleanStockID = stockID.replace(/[^A-Z0-9]/g, '').toUpperCase()
    const cleanItemName = itemName.replace(/[^A-Z0-9]/g, '').toUpperCase().substring(0, 4)
    
    // Combine to create a unique barcode
    const barcodeText = `${cleanStockID}${cleanItemName}${timestamp}`.substring(0, 20)
    
    return barcodeText
  }

  /**
   * Validate and clean barcode text for printing
   */
  static sanitizeBarcodeText(text: string, type: BarcodeData['type'] = 'CODE128'): string {
    let cleanText = text.trim()
    
    switch (type) {
      case 'CODE128':
        // Remove any non-printable characters but keep most ASCII
        cleanText = cleanText.replace(/[\x00-\x1F\x7F]/g, '')
        break
        
      case 'EAN13':
      case 'UPC':
        // Keep only digits
        cleanText = cleanText.replace(/[^0-9]/g, '')
        break
        
      case 'CODE39':
        // Keep only CODE39 allowed characters
        cleanText = cleanText.replace(/[^A-Z0-9\-\.\s\$\/\+\%]/g, '').toUpperCase()
        break
    }
    
    return cleanText
  }
}

// Export utility functions
export const {
  validateBarcodeText,
  generateBarcodeData,
  generateTSPLBarcodeCommand,
  generateBarcodeStickerTSPL,
  generateStockStickerTSPL,
  convertTSPLToBinary,
  generateStockBarcode,
  sanitizeBarcodeText
} = BackendBarcodeUtils
