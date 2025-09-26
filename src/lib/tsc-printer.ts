// Note: @dlwlrma00/tsc-printer-js is a Node.js library that requires USB access
// For browser environments, we'll use a simulated TSC printer approach
// that generates TSPL commands and uses browser printing

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

export class TSCPrinterService {
  private config: TSCPrinterConfig
  private tspCommands: string[] = []

  constructor(config: TSCPrinterConfig = {}) {
    this.config = {
      printerName: 'TSC TE244',
      width: 76.2, // 3 inches in mm
      height: 25, // 25mm height for single sticker
      dpi: 203, // TSC TE244 DPI
      ...config
    }
  }

  /**
   * Print thermal stickers with 2-column layout
   * @param stickers Array of sticker data
   * @param quantity Number of stickers to print
   */
  async printStickers(stickers: StickerData[], quantity: number): Promise<void> {
    try {
      // Try server-side printing first (real TSC printer)
      const serverResult = await this.printWithServer(stickers, quantity)
      if (serverResult.success) {
        console.log('Successfully printed to TSC printer:', serverResult.message)
        return
      }
      
      // Fallback to browser printing if server printing fails
      console.warn('Server printing failed, falling back to browser printing:', serverResult.message)
      await this.printWithBrowserFallback(stickers, quantity)
      
    } catch (error) {
      console.error('TSC Printer Error:', error)
      throw new Error(`Failed to print stickers: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Add TSPL commands for a single sticker
   */
  private addSingleStickerCommands(sticker: StickerData, x: number, y: number): void {
    const { stockID, itemName, category, unitPrice, barcodeText } = sticker
    
    // Truncate long text for thermal printer
    const truncatedItemName = itemName.length > 15 ? itemName.substring(0, 12) + '...' : itemName
    const truncatedCategory = category && category.length > 8 ? category.substring(0, 6) + '...' : category
    
    // 1. Stock ID at the top
    this.addTSPCommand(`TEXT ${x + 1},${y + 2},"TSS24.BF2",0,1,1,"${stockID}"`)
    
    // 2. Barcode in the middle
    this.addTSPCommand(`BARCODE ${x + 1},${y + 8},"128",40,1,0,2,2,"${barcodeText}"`)
    
    // 3. Product name - category - price at the bottom
    const productLine = `${truncatedItemName} - ${truncatedCategory || 'N/A'} - ₹${unitPrice}`
    this.addTSPCommand(`TEXT ${x + 1},${y + 18},"TSS24.BF2",0,1,1,"${productLine}"`)
  }

  /**
   * Print a single barcode sticker (for generic barcode generator)
   */
  async printBarcodeSticker(barcodeText: string, label: string = 'Barcode Label'): Promise<void> {
    try {
      // Create a mock sticker for server printing
      const mockSticker: StickerData = {
        stockID: barcodeText,
        itemName: label,
        category: 'Barcode',
        unitPrice: 0,
        barcodeText: barcodeText
      }

      // Try server-side printing first
      const serverResult = await this.printWithServer([mockSticker], 1)
      if (serverResult.success) {
        console.log('Successfully printed barcode to TSC printer:', serverResult.message)
        return
      }
      
      // Fallback to browser printing
      console.warn('Server printing failed, falling back to browser printing:', serverResult.message)
      await this.printWithBrowserFallback([mockSticker], 1)
      
    } catch (error) {
      console.error('TSC Printer Error:', error)
      throw new Error(`Failed to print barcode sticker: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Add a TSPL command to the command list
   */
  private addTSPCommand(command: string): void {
    this.tspCommands.push(command)
  }

  /**
   * Print using server-side TSC printer API
   */
  private async printWithServer(stickers: StickerData[], quantity: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/tsc-print', {
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
      return result
    } catch (error) {
      console.error('Server print error:', error)
      return {
        success: false,
        message: `Server communication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Fallback browser printing with TSPL commands
   */
  private async printWithBrowserFallback(stickers: StickerData[], quantity: number): Promise<void> {
    try {
      // Calculate rows needed (2 stickers per row)
      const stickersPerRow = 2
      const rowsNeeded = Math.ceil(quantity / stickersPerRow)
      
      // Generate TSPL commands for TSC printer
      this.tspCommands = []
      this.addTSPCommand(`SIZE 76.2 mm, ${25 * rowsNeeded} mm`)
      this.addTSPCommand('GAP 2 mm, 0 mm')
      this.addTSPCommand('DIRECTION 0')
      this.addTSPCommand('CLS')

      // Generate stickers in 2-column layout
      for (let i = 0; i < quantity; i++) {
        const sticker = stickers[i % stickers.length] // Cycle through stickers if needed
        const row = Math.floor(i / stickersPerRow)
        const col = i % stickersPerRow
        
        // Calculate position for this sticker
        const x = col * 38.1 // 38.1mm per column (76.2mm / 2)
        const y = row * 25 // 25mm per row
        
        this.addSingleStickerCommands(sticker, x, y)
      }

      // Add print command
      this.addTSPCommand('PRINT 1,1')
      
      // Use browser printing with TSPL commands
      await this.printWithBrowser()
      
    } catch (error) {
      console.error('Browser fallback print error:', error)
      throw new Error(`Failed to print: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Print using browser with TSPL commands
   */
  private async printWithBrowser(): Promise<void> {
    try {
      // Create a visual representation of the TSPL commands for browser printing
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>TSC TE244 Thermal Printer Output</title>
          <style>
            @page {
              size: 76.2mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 8px;
              line-height: 1.2;
              width: 76.2mm;
              background: white;
            }
            .tsp-commands {
              white-space: pre-line;
              padding: 2mm;
            }
            .printer-info {
              background: #f0f0f0;
              padding: 1mm;
              margin-bottom: 1mm;
              font-size: 6px;
            }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="printer-info">
            TSC TE244 Thermal Printer Commands (Browser Fallback)<br>
            Generated: ${new Date().toLocaleString()}
          </div>
          <div class="tsp-commands">${this.tspCommands.join('\n')}</div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            };
          </script>
        </body>
        </html>
      `
      
      const printWindow = window.open('', '_blank', 'width=400,height=600')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
        }, 1000)
      } else {
        throw new Error("Could not open print window. Please check popup blockers.")
      }
    } catch (error) {
      console.error('Browser Print Error:', error)
      throw new Error(`Failed to print: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get available printers from server
   */
  async getAvailablePrinters(): Promise<string[]> {
    try {
      const response = await fetch('/api/tsc-print')
      const result = await response.json()
      
      if (result.success && result.printers) {
        return result.printers.map((printer: { name: string }) => printer.name)
      }
      
      // Fallback to default list if server fails
      return [
        'TSC TE244',
        'TSC TTP-244 Plus',
        'TSC TTP-247',
        'TSC TTP-342',
        'TSC TTP-343'
      ]
    } catch (error) {
      console.error('Error getting available printers:', error)
      // Fallback to default list
      return [
        'TSC TE244',
        'TSC TTP-244 Plus',
        'TSC TTP-247',
        'TSC TTP-342',
        'TSC TTP-343'
      ]
    }
  }

  /**
   * Test printer connection using server API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/tsc-test')
      const result = await response.json()
      
      if (result.success) {
        console.log('TSC Printer Connection Test:', result.message)
        return true
      } else {
        console.warn('TSC Printer Connection Test Failed:', result.message)
        return false
      }
    } catch (error) {
      console.error('TSC Printer Connection Test Failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const tscPrinter = new TSCPrinterService()
