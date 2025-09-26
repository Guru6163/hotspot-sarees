// Custom TSC Printer implementation based on @dlwlrma00/tsc-printer-js
// This avoids import issues and provides direct TSC printer functionality

// Dynamic import for USB to handle platform-specific builds
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let usb: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let usbDetection: any = null

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  usb = require('usb')
  console.log('USB module loaded successfully')
} catch (error) {
  console.warn('USB module not available:', error)
  console.log('Trying alternative USB detection methods...')
  
  // Try alternative USB detection for Windows
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    usbDetection = require('node-hid')
    console.log('node-hid module loaded as fallback')
  } catch (hidError) {
    console.warn('node-hid also not available:', hidError)
  }
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
      console.log('Initializing USB detection...')
      console.log('USB module available:', !!usb)
      console.log('Platform:', process.platform)
      
      if (!usb) {
        console.warn('USB module not available - TSC printer functionality disabled')
        console.log('This usually means the USB module failed to load. Common causes:')
        console.log('1. Missing native dependencies (node-gyp, python, build tools)')
        console.log('2. Windows: Missing Visual Studio Build Tools')
        console.log('3. Permission issues on Windows')
        return
      }

      // Expanded TSC printer vendor IDs for better Windows 10 compatibility
      const tscVendorIds = [
        0x04b8, // TSC
        0x04e8, // Samsung
        0x0fe6, // Other thermal printer vendors
        0x04f9, // Brother
        0x03f0, // HP
        0x04b3, // Zebra
        0x0bda, // Realtek (some thermal printers)
        0x1a86, // QinHeng Electronics (common in thermal printers)
        0x0483, // STMicroelectronics
        0x04d8, // Microchip Technology
        0x04ca, // Lite-On Technology
        0x04e6, // WinChipHead
        0x04e7, // WinChipHead
        0x04e9, // Samsung
        0x04ea, // Samsung
        0x04eb, // Samsung
        0x04ec, // Samsung
        0x04ed, // Samsung
        0x04ee, // Samsung
        0x04ef, // Samsung
        0x04f0, // Samsung
        0x04f1, // Samsung
        0x04f2, // Samsung
        0x04f3, // Samsung
        0x04f4, // Samsung
        0x04f5, // Samsung
        0x04f6, // Samsung
        0x04f7, // Samsung
        0x04f8, // Samsung
        0x04fa, // Samsung
        0x04fb, // Samsung
        0x04fc, // Samsung
        0x04fd, // Samsung
        0x04fe, // Samsung
        0x04ff, // Samsung
      ]
      
      // Find TSC printer device
      console.log('Getting USB device list...')
      const devices = usb.getDeviceList()
      console.log(`Found ${devices.length} USB devices`)
      
      // Log all devices for debugging
      console.log('All USB devices:')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      devices.forEach((d: any, index: number) => {
        console.log(`Device ${index}:`, {
          vendorId: d.deviceDescriptor.idVendor,
          productId: d.deviceDescriptor.idProduct,
          vendorIdHex: '0x' + d.deviceDescriptor.idVendor.toString(16).padStart(4, '0'),
          productIdHex: '0x' + d.deviceDescriptor.idProduct.toString(16).padStart(4, '0'),
          isTSCPrinter: tscVendorIds.includes(d.deviceDescriptor.idVendor)
        })
      })
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.device = devices.find((device: any) => 
        tscVendorIds.includes(device.deviceDescriptor.idVendor)
      )

      if (this.device) {
        console.log('TSC Printer detected:', {
          vendorId: this.device.deviceDescriptor.idVendor,
          productId: this.device.deviceDescriptor.idProduct,
          vendorIdHex: '0x' + this.device.deviceDescriptor.idVendor.toString(16).padStart(4, '0'),
          productIdHex: '0x' + this.device.deviceDescriptor.idProduct.toString(16).padStart(4, '0')
        })
      } else {
        console.log('No TSC printer detected in the filtered list')
        console.log('Looking for any thermal printer devices...')
        
        // Check for any devices that might be thermal printers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const potentialPrinters = devices.filter((d: any) => {
          const vendorId = d.deviceDescriptor.idVendor
          return vendorId === 0x04b8 || vendorId === 0x04e8 || vendorId === 0x0fe6 || 
                 vendorId === 0x04f9 || vendorId === 0x03f0 || vendorId === 0x04b3
        })
        
        if (potentialPrinters.length > 0) {
          console.log('Found potential thermal printer devices:', potentialPrinters.map((d: { deviceDescriptor: { idVendor: number; idProduct: number } }) => ({
            vendorId: d.deviceDescriptor.idVendor,
            productId: d.deviceDescriptor.idProduct,
            vendorIdHex: '0x' + d.deviceDescriptor.idVendor.toString(16).padStart(4, '0'),
            productIdHex: '0x' + d.deviceDescriptor.idProduct.toString(16).padStart(4, '0')
          })))
        } else {
          console.log('No thermal printer devices found')
        }
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
   * Get available TSC printers and all USB devices for manual selection
   */
  getAvailablePrinters(): Array<{ 
    vendorId: number; 
    productId: number; 
    name: string; 
    isTSCPrinter: boolean;
    vendorIdHex: string;
    productIdHex: string;
    deviceInfo?: string;
  }> {
    try {
      // Try primary USB detection first
      if (usb) {
        return this.getUSBDevices()
      }
      
      // Try fallback detection methods
      if (usbDetection) {
        return this.getHIDDevices()
      }
      
      // If no USB detection available, return empty array
      console.warn('No USB detection methods available')
      return []
    } catch (error) {
      console.error('Error getting available printers:', error)
      return []
    }
  }

  /**
   * Get devices using primary USB module
   */
  private getUSBDevices(): Array<{ 
    vendorId: number; 
    productId: number; 
    name: string; 
    isTSCPrinter: boolean;
    vendorIdHex: string;
    productIdHex: string;
    deviceInfo?: string;
  }> {
    try {
      if (!usb) {
        return []
      }

      const devices = usb.getDeviceList()
      console.log(`USB: Found ${devices.length} devices`)
      
      // Expanded TSC printer vendor IDs for better Windows 10 compatibility
      const tscVendorIds = [
        0x04b8, // TSC
        0x04e8, // Samsung
        0x0fe6, // Other thermal printer vendors
        0x04f9, // Brother
        0x03f0, // HP
        0x04b3, // Zebra
        0x0bda, // Realtek (some thermal printers)
        0x1a86, // QinHeng Electronics (common in thermal printers)
        0x0483, // STMicroelectronics
        0x04d8, // Microchip Technology
        0x04ca, // Lite-On Technology
        0x04e6, // WinChipHead
        0x04e7, // WinChipHead
        0x04e9, // Samsung
        0x04ea, // Samsung
        0x04eb, // Samsung
        0x04ec, // Samsung
        0x04ed, // Samsung
        0x04ee, // Samsung
        0x04ef, // Samsung
        0x04f0, // Samsung
        0x04f1, // Samsung
        0x04f2, // Samsung
        0x04f3, // Samsung
        0x04f4, // Samsung
        0x04f5, // Samsung
        0x04f6, // Samsung
        0x04f7, // Samsung
        0x04f8, // Samsung
        0x04fa, // Samsung
        0x04fb, // Samsung
        0x04fc, // Samsung
        0x04fd, // Samsung
        0x04fe, // Samsung
        0x04ff, // Samsung
      ]

      const allDevices = devices.map((device: { deviceDescriptor: { idVendor: number; idProduct: number; iProduct?: number; iManufacturer?: number } }) => {
        const vendorId = device.deviceDescriptor.idVendor
        const productId = device.deviceDescriptor.idProduct
        const isTSCPrinter = tscVendorIds.includes(vendorId)
        
        // Try to get device description for better identification
        let deviceInfo = 'Unknown Device'
        try {
          if (device.deviceDescriptor.iProduct) {
            deviceInfo = String(device.deviceDescriptor.iProduct)
          } else if (device.deviceDescriptor.iManufacturer) {
            deviceInfo = String(device.deviceDescriptor.iManufacturer)
          }
        } catch {
          // Ignore errors when accessing device strings
        }

        const vendorIdHex = '0x' + vendorId.toString(16).padStart(4, '0')
        const productIdHex = '0x' + productId.toString(16).padStart(4, '0')
        
        return {
          vendorId,
          productId,
          vendorIdHex,
          productIdHex,
          isTSCPrinter,
          name: isTSCPrinter 
            ? `TSC Printer (${deviceInfo}) - VID:${vendorIdHex} PID:${productIdHex}`
            : `USB Device (${deviceInfo}) - VID:${vendorIdHex} PID:${productIdHex}`,
          deviceInfo
        }
      })

      // Sort with TSC printers first, then others
      return allDevices.sort((a: { isTSCPrinter: boolean; name: string }, b: { isTSCPrinter: boolean; name: string }) => {
        if (a.isTSCPrinter && !b.isTSCPrinter) return -1
        if (!a.isTSCPrinter && b.isTSCPrinter) return 1
        return a.name.localeCompare(b.name)
      })
      
    } catch (error) {
      console.error('Error getting available printers:', error)
      return []
    }
  }

  /**
   * Select a specific printer by vendor and product ID
   */
  selectPrinter(vendorId: number, productId: number): { success: boolean; message: string } {
    try {
      if (!usb) {
        return {
          success: false,
          message: 'USB module not available. TSC printer functionality is disabled on this platform.'
        }
      }

      const devices = usb.getDeviceList()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectedDevice = devices.find((device: any) => 
        device.deviceDescriptor.idVendor === vendorId && 
        device.deviceDescriptor.idProduct === productId
      )

      if (selectedDevice) {
        this.device = selectedDevice
        console.log('Selected printer:', {
          vendorId: selectedDevice.deviceDescriptor.idVendor,
          productId: selectedDevice.deviceDescriptor.idProduct,
          vendorIdHex: '0x' + selectedDevice.deviceDescriptor.idVendor.toString(16).padStart(4, '0'),
          productIdHex: '0x' + selectedDevice.deviceDescriptor.idProduct.toString(16).padStart(4, '0')
        })
        
        return {
          success: true,
          message: `Successfully selected printer VID:${vendorId.toString(16)} PID:${productId.toString(16)}`
        }
      } else {
        return {
          success: false,
          message: `Printer not found with VID:${vendorId.toString(16)} PID:${productId.toString(16)}`
        }
      }
    } catch (error) {
      console.error('Error selecting printer:', error)
      return {
        success: false,
        message: `Failed to select printer: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
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
   * Get devices using HID fallback (better for Windows)
   */
  private getHIDDevices(): Array<{ 
    vendorId: number; 
    productId: number; 
    name: string; 
    isTSCPrinter: boolean;
    vendorIdHex: string;
    productIdHex: string;
    deviceInfo?: string;
  }> {
    try {
      if (!usbDetection) {
        return []
      }

      console.log('Using HID fallback detection...')
      const devices = usbDetection.devices()
      console.log(`HID: Found ${devices.length} devices`)
      
      // TSC printer vendor IDs
      const tscVendorIds = [
        0x04b8, // TSC
        0x04e8, // Samsung
        0x0fe6, // Other thermal printer vendors
        0x04f9, // Brother
        0x03f0, // HP
        0x04b3, // Zebra
        0x0bda, // Realtek
        0x1a86, // QinHeng Electronics
        0x0483, // STMicroelectronics
        0x04d8, // Microchip Technology
        0x04ca, // Lite-On Technology
      ]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allDevices = devices.map((device: any) => {
        const vendorId = device.vendorId
        const productId = device.productId
        const isTSCPrinter = tscVendorIds.includes(vendorId)
        
        const vendorIdHex = '0x' + vendorId.toString(16).padStart(4, '0')
        const productIdHex = '0x' + productId.toString(16).padStart(4, '0')
        
        return {
          vendorId,
          productId,
          vendorIdHex,
          productIdHex,
          isTSCPrinter,
          name: isTSCPrinter 
            ? `TSC Printer (HID) - VID:${vendorIdHex} PID:${productIdHex}`
            : `USB Device (HID) - VID:${vendorIdHex} PID:${productIdHex}`,
          deviceInfo: device.product || 'Unknown Device'
        }
      })

      // Sort with TSC printers first, then others
      return allDevices.sort((a: { isTSCPrinter: boolean; name: string }, b: { isTSCPrinter: boolean; name: string }) => {
        if (a.isTSCPrinter && !b.isTSCPrinter) return -1
        if (!a.isTSCPrinter && b.isTSCPrinter) return 1
        return a.name.localeCompare(b.name)
      })
      
    } catch (error) {
      console.error('Error getting HID devices:', error)
      return []
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
