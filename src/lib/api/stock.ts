// Stock API utility functions
export interface Stock {
  id: string
  stockID: string
  itemCode: string | null
  itemName: string
  category: string
  color: string
  quantity: number
  unitPrice: number
  supplier: string
  createdAt: string
  updatedAt: string
}

export interface CreateStockData {
  itemCode?: string
  itemName: string
  category: string
  color: string
  quantity: number
  unitPrice: number
  supplier: string
}

export interface UpdateStockData {
  itemCode?: string
  itemName?: string
  category?: string
  color?: string
  quantity?: number
  unitPrice?: number
  supplier?: string
}

export interface StockListResponse {
  success: boolean
  data: Stock[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface StockResponse {
  success: boolean
  data: Stock
  message?: string
}

export interface ApiError {
  success: false
  error: string
  details?: unknown[]
}

// Create a new stock item
export async function createStock(data: CreateStockData): Promise<StockResponse | ApiError> {
  const response = await fetch('/api/stock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  return response.json()
}

// Get all stock items with optional filtering
export async function getStocks(params?: {
  page?: number
  limit?: number
  category?: string
  search?: string
}): Promise<StockListResponse | ApiError> {
  const searchParams = new URLSearchParams()
  
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.category) searchParams.set('category', params.category)
  if (params?.search) searchParams.set('search', params.search)

  const response = await fetch(`/api/stock?${searchParams.toString()}`)
  return response.json()
}

// Get a single stock item by ID
export async function getStock(id: string): Promise<StockResponse | ApiError> {
  const response = await fetch(`/api/stock/${id}`)
  return response.json()
}

// Update a stock item
export async function updateStock(id: string, data: UpdateStockData): Promise<StockResponse | ApiError> {
  const response = await fetch(`/api/stock/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  return response.json()
}

// Delete a stock item
export async function deleteStock(id: string): Promise<{ success: boolean; message?: string } | ApiError> {
  const response = await fetch(`/api/stock/${id}`, {
    method: 'DELETE',
  })

  return response.json()
}

// Get stock item by stockID (barcode)
export async function getStockByBarcode(stockID: string): Promise<StockResponse | ApiError> {
  const response = await fetch(`/api/stock/barcode/${stockID}`)
  return response.json()
}

// Search stocks by name or item code
export async function searchStocks(query: string): Promise<StockListResponse | ApiError> {
  const response = await fetch(`/api/stock?search=${encodeURIComponent(query)}&limit=10`)
  return response.json()
}
