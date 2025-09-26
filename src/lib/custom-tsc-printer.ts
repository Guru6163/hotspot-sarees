// Custom TSC Printer implementation based on @dlwlrma00/tsc-printer-js
// This avoids import issues and provides direct TSC printer functionality

// Dynamic import for USB to handle platform-specific builds
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let usb: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  usb = require('usb')
} catch (error) {
  console.warn('USB module not available:', error)
}

export interface TSCPrinterConfig {
  printerName?: string
  width?: number // in mm
  height?: number // in mm
  dpi?: number
}

export interface StickerData {
  stockID: string
  itemName: string
  category?: string
  unitPrice: number
  barcodeText: string
}

export class CustomTSCPrinter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private device: any = null
  private config: TSCPrinterConfig

  constructor(config: TSCPrinterConfig = {}) {
    this.config = {
      printerName: 'TSC TE244',
      width: 76.2, // 3 inches in mm
      height: 25, // 25mm height for single sticker
      dpi: 203, // TSC TE244 DPI
      ...config
    }
    
    this.initializeUSB()
  }

  /**
   * Initialize USB device detection for TSC printers
   */
  private initializeUSB(): void {
    try {
      if (!usb) {
        console.warn('USB module not available - TSC printer functionality disabled')
        return
      }

      // Common TSC printer vendor IDs
      const tscVendorIds = [0x04b8, 0x04e8, 0x0fe6] // TSC, Samsung, and other thermal printer vendors
      
      // Find TSC printer device
      const devices = usb.getDeviceList()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.device = devices.find((device: any) => 
        tscVendorIds.includes(device.deviceDescriptor.idVendor)
      )

      if (this.device) {
        console.log('TSC Printer detected:', {
          vendorId: this.device.deviceDescriptor.idVendor,
          productId: this.device.deviceDescriptor.idProduct
        })
      } else {
        console.log('No TSC printer detected. Available devices:', 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          devices.map((d: any) => ({ 
            vendorId: d.deviceDescriptor.idVendor, 
            productId: d.deviceDescriptor.idProduct 
          }))
        )
      }
    } catch (error) {
      console.error('USB initialization error:', error)
    }
  }

  /**
   * Print thermal stickers using real TSC printer
   */
  async printStickers(stickers: StickerData[], quantity: number): Promise<{ success: boolean; message: string }> {
    try {
      if (!usb) {
        return {
          success: false,
          message: 'USB module not available. TSC printer functionality is disabled on this platform.'
        }
      }

      if (!this.device) {
        return {
          success: false,
          message: 'TSC printer not detected. Please ensure your TSC TE244 is connected via USB.'
        }
      }

      // Generate TSPL commands for the stickers
      const tspCommands = this.generateTSPLCommands(stickers, quantity)
      
      // Convert TSPL commands to binary data for printer
      const binaryData = this.convertTSPLToBinary(tspCommands)
      
      // Send to printer using Writev2() for better compatibility
      await this.writeToPrinter(binaryData)
      
      return {
        success: true,
        message: `Successfully printed ${quantity} stickers to TSC TE244`
      }
      
    } catch (error) {
      console.error('TSC Printer Error:', error)
      return {
        success: false,
        message: `Print failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Generate TSPL commands for stickers
   */
  private generateTSPLCommands(stickers: StickerData[], quantity: number): string[] {
    const commands: string[] = []
    const stickersPerRow = 2
    const rowsNeeded = Math.ceil(quantity / stickersPerRow)
    
    // Printer setup commands
    commands.push(`SIZE 76.2 mm, ${25 * rowsNeeded} mm`)
    commands.push('GAP 2 mm, 0 mm')
    commands.push('DIRECTION 0')
    commands.push('CLS')
    
    // Generate stickers in 2-column layout
    for (let i = 0; i < quantity; i++) {
      const sticker = stickers[i % stickers.length]
      const row = Math.floor(i / stickersPerRow)
      const col = i % stickersPerRow
      
      const x = col * 38.1 // 38.1mm per column
      const y = row * 25 // 25mm per row
      
      // Add sticker commands
      this.addStickerCommands(commands, sticker, x, y)
    }
    
    // Print command
    commands.push('PRINT 1,1')
    
    return commands
  }

  /**
   * Add TSPL commands for a single sticker
   */
  private addStickerCommands(commands: string[], sticker: StickerData, x: number, y: number): void {
    const { stockID, itemName, category, unitPrice, barcodeText } = sticker
    
    // Truncate long text for thermal printer
    const truncatedItemName = itemName.length > 15 ? itemName.substring(0, 12) + '...' : itemName
    const truncatedCategory = category && category.length > 8 ? category.substring(0, 6) + '...' : category
    
    // 1. Stock ID at the top
    commands.push(`TEXT ${x + 1},${y + 2},"TSS24.BF2",0,1,1,"${stockID}"`)
    
    // 2. Barcode in the middle
    commands.push(`BARCODE ${x + 1},${y + 8},"128",40,1,0,2,2,"${barcodeText}"`)
    
    // 3. Product name - category - price at the bottom
    const productLine = `${truncatedItemName} - ${truncatedCategory || 'N/A'} - ₹${unitPrice}`
    commands.push(`TEXT ${x + 1},${y + 18},"TSS24.BF2",0,1,1,"${productLine}"`)
  }

  /**
   * Convert TSPL commands to binary data for printer
   */
  private convertTSPLToBinary(commands: string[]): Buffer[] {
    const binaryData: Buffer[] = []
    
    for (const command of commands) {
      // Convert TSPL command to binary format
      const commandBuffer = Buffer.from(command + '\r\n', 'utf8')
      binaryData.push(commandBuffer)
    }
    
    return binaryData
  }

  /**
   * Write data to TSC printer using USB communication
   * Based on the Writev2 method from the original library
   */
  private async writeToPrinter(arrData: Buffer[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        this.device.open()
        console.log('DEVICE CONNECTION OPEN')

        const iface = this.device.interface(0)

        const closeConnection = () => {
          if (iface) {
            try {
              this.device.close()
            } catch {
              setTimeout(closeConnection, 1000)
            }
          }
        }

        // Handle Linux/Android kernel driver
        if (/^linux/.test(process.platform) || /^android/.test(process.platform)) {
          console.log('Linux detected!')
          if (iface.isKernelDriverActive()) {
            try {
              iface.detachKernelDriver()
            } catch (e) {
              console.error("[ERROR] Could not detach kernel driver:", e)
            }
          }
        }

        iface.claim()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const outEndpoint = iface.endpoints.find((endpoint: any) => endpoint.direction === 'out')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inEndpoint = iface.endpoints.find((endpoint: any) => endpoint.direction === 'in')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _resolve = (printResult?: any) => {
          inEndpoint.stopPoll(() => {
            iface.release(() => {
              console.log('USB PRINT COMPLETE!')
              resolve(printResult)
            })
          })
        }

        inEndpoint.startPoll(2, 8)

        let finish = false
        const transferred = false

        // Process each data buffer
        for (let index = 0; index < arrData.length; index++) {
          const data = arrData[index]
          
          // Writing data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          outEndpoint.transfer(data, (err: any) => {
            console.log('TRANSFER DATA BUFFER:', data)

            if (arrData.length - 1 === index) {
              _resolve({ success: true })
            }

            if (err) {
              _resolve({ success: false, err })
            }
          })

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          outEndpoint.on('error', (e: any) => {
            console.warn('Out endpoint error:', e)
            closeConnection()
            reject(e)
          })

          // Receiving data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inEndpoint.on('data', (data: any) => {
            console.log('RECEIVING DATA...')

            if (!finish && data.length !== 0) {
              finish = true
              if (transferred) {
                _resolve()
              }
            }
          })

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inEndpoint.on('error', (e: any) => {
            console.warn('In endpoint error:', e)
            reject(e)
          })
        }

      } catch (error) {
        console.error('USB communication error:', error)
        reject(error)
      }
    })
  }

  /**
   * Get available TSC printers
   */
  getAvailablePrinters(): Array<{ vendorId: number; productId: number; name: string }> {
    try {
      if (!usb) {
        console.warn('USB module not available')
        return []
      }

      const devices = usb.getDeviceList()
      const tscDevices = devices
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((device: any) => {
          const vendorId = device.deviceDescriptor.idVendor
          return [0x04b8, 0x04e8, 0x0fe6].includes(vendorId) // TSC and thermal printer vendor IDs
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((device: any) => ({
          vendorId: device.deviceDescriptor.idVendor,
          productId: device.deviceDescriptor.idProduct,
          name: `TSC Printer (VID: ${device.deviceDescriptor.idVendor.toString(16)}, PID: ${device.deviceDescriptor.idProduct.toString(16)})`
        }))
      
      return tscDevices
    } catch (error) {
      console.error('Error getting available printers:', error)
      return []
    }
  }

  /**
   * Test printer connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!usb) {
        return {
          success: false,
          message: 'USB module not available. TSC printer functionality is disabled on this platform.'
        }
      }

      if (!this.device) {
        return {
          success: false,
          message: 'No TSC printer detected'
        }
      }

      // Test with a simple command
      const testCommands = ['SIZE 76.2 mm, 25 mm', 'CLS', 'PRINT 1,1']
      const binaryData = this.convertTSPLToBinary(testCommands)
      
      await this.writeToPrinter(binaryData)
      
      return {
        success: true,
        message: 'TSC printer connection test successful'
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Close printer connection
   */
  closeConnection(): void {
    if (this.device) {
      this.device.close()
      this.device = null
    }
  }
}

// Export singleton instance
export const customTSCPrinter = new CustomTSCPrinter()
