// Billing API utility functions
export interface PurchaseItem {
  stockId: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface SplitPayment {
  paymentMethod: "cash" | "card" | "upi"
  amount: number
}

export interface CreatePurchaseData {
  customerName: string
  customerPhone?: string
  customerEmail?: string
  notes?: string
  subtotal: number
  discountType?: "percentage" | "price"
  discountValue?: number
  discountAmount?: number
  taxAmount?: number
  totalAmount: number
  paymentMethod: "cash" | "card" | "upi" | "split" // For backward compatibility
  isSplitPayment?: boolean
  splitPayments?: SplitPayment[] // For split payments
  items: PurchaseItem[]
}

export interface PaymentDetail {
  id: string
  purchaseId: string
  paymentMethod: string
  amount: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface Purchase {
  id: string
  invoiceNumber: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  notes: string | null
  subtotal: number
  discountType: string | null
  discountValue: number | null
  discountAmount: number
  taxAmount: number
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  isSplitPayment: boolean
  createdAt: string
  updatedAt: string
  items: PurchaseItemWithStock[]
  payments?: PaymentDetail[] // Split payments
}

export interface PurchaseItemWithStock {
  id: string
  purchaseId: string
  stockId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  createdAt: string
  stock: {
    id: string
    stockID: string
    itemName: string
    category: string
    color: string
  }
}

export interface PurchaseListResponse {
  success: boolean
  data: Purchase[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface PurchaseResponse {
  success: boolean
  data: Purchase
  message?: string
}

export interface ApiError {
  success: false
  error: string
  details?: unknown[]
}

// Create a new purchase/bill
export async function createPurchase(data: CreatePurchaseData): Promise<PurchaseResponse | ApiError> {
  const response = await fetch('/api/billing', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  return response.json()
}

// Get purchase history with optional filtering
export async function getPurchases(params?: {
  page?: number
  limit?: number
  customerName?: string
  paymentMethod?: string
  startDate?: string
  endDate?: string
}): Promise<PurchaseListResponse | ApiError> {
  const searchParams = new URLSearchParams()
  
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.customerName) searchParams.set('customerName', params.customerName)
  if (params?.paymentMethod) searchParams.set('paymentMethod', params.paymentMethod)
  if (params?.startDate) searchParams.set('startDate', params.startDate)
  if (params?.endDate) searchParams.set('endDate', params.endDate)

  const response = await fetch(`/api/billing?${searchParams.toString()}`)
  return response.json()
}

// Get a single purchase by ID
export async function getPurchase(id: string): Promise<PurchaseResponse | ApiError> {
  const response = await fetch(`/api/billing/${id}`)
  return response.json()
}
