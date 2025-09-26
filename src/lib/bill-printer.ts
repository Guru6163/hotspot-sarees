// Bill Printer Service for invoice/receipt printing
// Supports both thermal receipt printers and regular printers

export interface BillData {
  // Store Information
  storeName: string
  storeAddress: string
  storePhone: string
  storeGST: string
  
  // Invoice Details
  invoiceNumber: string
  customerName: string
  customerPhone?: string
  date: string
  time: string
  
  // Items
  items: {
    product: string
    productCode: string
    qty: number
    rate: number
    amount: number
    hsn?: string
  }[]
  
  // Totals
  totalItems: number
  subtotal: number
  discountAmount?: number
  taxAmount?: number
  totalAmount: number
  
  // Payment
  paymentMethod: string
  paymentAmount: number
  
  // Terms
  terms?: string[]
}

export interface BillPrinterConfig {
  printerName?: string
  width?: number // in mm
  height?: number // in mm
  fontSize?: number
  isThermal?: boolean
}

export class BillPrinterService {
  private config: BillPrinterConfig

  constructor(config: BillPrinterConfig = {}) {
    this.config = {
      printerName: 'Bill Printer',
      width: 80, // 80mm thermal printer width
      height: 0, // Auto height
      fontSize: 12,
      isThermal: true,
      ...config
    }
  }

  /**
   * Print a bill/invoice using browser printing only
   */
  async printBill(billData: BillData): Promise<{ success: boolean; message: string }> {
    try {
      // Use browser printing directly (no backend printer)
      await this.printWithBrowser(billData)
      
      return {
        success: true,
        message: 'Bill sent to printer successfully'
      }
      
    } catch (error) {
      console.error('Bill Printer Error:', error)
      return {
        success: false,
        message: `Failed to print bill: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }


  /**
   * Print using browser (fallback)
   */
  private async printWithBrowser(billData: BillData): Promise<void> {
    try {
      const printContent = this.generateBillHTML(billData)
      
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
   * Generate HTML for bill printing
   */
  private generateBillHTML(billData: BillData): string {
    const { storeName, storeAddress, storePhone, storeGST, invoiceNumber, customerName, customerPhone, date, time, items, totalItems, subtotal, discountAmount, taxAmount, totalAmount, paymentMethod, paymentAmount, terms } = billData

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${invoiceNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            width: 80mm;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 8px;
          }
          .store-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .store-details {
            font-size: 10px;
            margin-bottom: 8px;
          }
          .invoice-header {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 4px 0;
          }
          .customer-info {
            margin-bottom: 8px;
          }
          .customer-info div {
            margin-bottom: 2px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          .items-table th,
          .items-table td {
            border: none;
            padding: 2px 0;
            text-align: left;
            font-size: 10px;
          }
          .items-table th {
            border-bottom: 1px solid #000;
            font-weight: bold;
          }
          .items-table .qty,
          .items-table .rate,
          .items-table .amount {
            text-align: right;
          }
          .totals {
            border-top: 1px dashed #000;
            padding-top: 4px;
            margin-bottom: 8px;
          }
          .totals div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .total-amount {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #000;
            padding-top: 4px;
            margin-top: 4px;
          }
          .payment-info {
            margin-bottom: 8px;
            text-align: center;
          }
          .terms {
            font-size: 8px;
            margin-top: 8px;
            border-top: 1px dashed #000;
            padding-top: 4px;
          }
          .terms div {
            margin-bottom: 2px;
          }
          .footer {
            text-align: center;
            font-size: 8px;
            margin-top: 8px;
            border-top: 1px dashed #000;
            padding-top: 4px;
          }
          @media print {
            body { margin: 0; padding: 8px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">${storeName}</div>
          <div class="store-details">
            ${storeAddress}<br>
            Phone: ${storePhone}<br>
            GST: ${storeGST}
          </div>
        </div>

        <div class="invoice-header">SALES INVOICE</div>

        <div class="customer-info">
          <div><strong>Customer:</strong> ${customerName}</div>
          ${customerPhone ? `<div><strong>Mobile:</strong> ${customerPhone}</div>` : ''}
          <div><strong>Bill No:</strong> ${invoiceNumber}</div>
          <div><strong>Date & Time:</strong> ${date} - ${time}</div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th class="qty">Qty</th>
              <th class="rate">Rate</th>
              <th class="amount">Amt</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>
                  ${item.product}<br>
                  <small>Code: ${item.productCode}${item.hsn ? ` | HSN: ${item.hsn}` : ''}</small>
                </td>
                <td class="qty">${item.qty}</td>
                <td class="rate">₹${item.rate.toFixed(2)}</td>
                <td class="amount">₹${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div><span>Total Items:</span> <span>${totalItems}</span></div>
          <div><span>Subtotal:</span> <span>₹${subtotal.toFixed(2)}</span></div>
          ${discountAmount && discountAmount > 0 ? `<div><span>Discount:</span> <span>-₹${discountAmount.toFixed(2)}</span></div>` : ''}
          ${taxAmount && taxAmount > 0 ? `<div><span>Tax:</span> <span>₹${taxAmount.toFixed(2)}</span></div>` : ''}
          <div class="total-amount">
            <span>Total Amount:</span> <span>₹${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="payment-info">
          <div><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</div>
          <div><strong>Amount Paid:</strong> ₹${paymentAmount.toFixed(2)}</div>
        </div>

        ${terms && terms.length > 0 ? `
          <div class="terms">
            ${terms.map(term => `<div>${term}</div>`).join('')}
          </div>
        ` : ''}

        <div class="footer">
          <div>Bill No: ${invoiceNumber}</div>
          <div>Thank you for your business!</div>
        </div>

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
  }

  /**
   * Test printer connection (browser printing always available)
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Browser printing is always available'
    }
  }
}

// Export singleton instance
export const billPrinter = new BillPrinterService()
