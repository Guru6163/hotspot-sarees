export interface Transport {
  id: string
  inDate: string
  numberOfBundles: number
  freightCharges: number
  invoiceNo: string
  amount: number
  gst: number
  totalAmount: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTransportData {
  inDate: string
  numberOfBundles: number
  freightCharges: number
  invoiceNo: string
  amount: number
  gst: number
  notes?: string
}

export interface UpdateTransportData {
  inDate?: string
  numberOfBundles?: number
  freightCharges?: number
  invoiceNo?: string
  amount?: number
  gst?: number
  notes?: string
}

export interface TransportFilters {
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface TransportResponse {
  transports: Transport[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Fetch all transport records with optional filtering
export async function getTransports(filters: TransportFilters = {}): Promise<TransportResponse> {
  const params = new URLSearchParams()
  
  if (filters.search) params.append("search", filters.search)
  if (filters.dateFrom) params.append("dateFrom", filters.dateFrom)
  if (filters.dateTo) params.append("dateTo", filters.dateTo)
  if (filters.page) params.append("page", filters.page.toString())
  if (filters.limit) params.append("limit", filters.limit.toString())

  const response = await fetch(`/api/transport?${params.toString()}`)
  
  if (!response.ok) {
    throw new Error("Failed to fetch transport records")
  }
  
  return response.json()
}

// Fetch a specific transport record by ID
export async function getTransport(id: string): Promise<Transport> {
  const response = await fetch(`/api/transport/${id}`)
  
  if (!response.ok) {
    throw new Error("Failed to fetch transport record")
  }
  
  return response.json()
}

// Create a new transport record
export async function createTransport(data: CreateTransportData): Promise<Transport> {
  const response = await fetch("/api/transport", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create transport record")
  }
  
  return response.json()
}

// Update an existing transport record
export async function updateTransport(id: string, data: UpdateTransportData): Promise<Transport> {
  const response = await fetch(`/api/transport/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update transport record")
  }
  
  return response.json()
}

// Delete a transport record
export async function deleteTransport(id: string): Promise<void> {
  const response = await fetch(`/api/transport/${id}`, {
    method: "DELETE",
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete transport record")
  }
}
