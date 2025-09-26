"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { 
  Calendar, 
  Filter, 
  Search, 
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Receipt,
  Printer
} from "lucide-react"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

import { getPurchases, type Purchase } from "@/lib/api/billing"
import { billPrinter, BillData } from "@/lib/bill-printer"
import { toast } from "sonner"

interface FilterState {
  customerName: string
  paymentMethod: string
  startDate: string
  endDate: string
}

export default function TransactionHistoryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    customerName: "",
    paymentMethod: "",
    startDate: "",
    endDate: ""
  })

  // Fetch purchases with current filters and pagination
  const fetchPurchases = useCallback(async (page: number = currentPage, filterState: FilterState = filters) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = {
        page,
        limit: itemsPerPage,
        ...(filterState.customerName && { customerName: filterState.customerName }),
        ...(filterState.paymentMethod && { paymentMethod: filterState.paymentMethod }),
        ...(filterState.startDate && { startDate: filterState.startDate }),
        ...(filterState.endDate && { endDate: filterState.endDate })
      }

      const response = await getPurchases(params)
      
      if (response.success) {
        setPurchases(response.data)
        setTotalPages(response.pagination.pages)
        setTotalItems(response.pagination.total)
        setCurrentPage(response.pagination.page)
      } else {
        setError('error' in response ? response.error : "Failed to fetch transactions")
      }
    } catch (err) {
      setError("An error occurred while fetching transactions")
      console.error("Error fetching purchases:", err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters, itemsPerPage])

  // Initial load
  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filtering
    fetchPurchases(1, newFilters)
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchPurchases(page, filters)
  }

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    setItemsPerPage(Number(newItemsPerPage))
    setCurrentPage(1)
    fetchPurchases(1, filters)
  }

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters: FilterState = {
      customerName: "",
      paymentMethod: "",
      startDate: "",
      endDate: ""
    }
    setFilters(clearedFilters)
    setCurrentPage(1)
    fetchPurchases(1, clearedFilters)
  }

  // Refresh data
  const refreshData = () => {
    fetchPurchases(currentPage, filters)
  }

  // Get payment method badge variant
  const getPaymentMethodBadge = (purchase: Purchase) => {
    if (purchase.isSplitPayment && purchase.payments && purchase.payments.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">Split</Badge>
          {purchase.payments.map((payment, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {payment.paymentMethod}: ₹{payment.amount.toFixed(2)}
            </Badge>
          ))}
        </div>
      )
    }
    
    switch (purchase.paymentMethod) {
      case "cash":
        return <Badge variant="secondary">Cash</Badge>
      case "card":
        return <Badge variant="default">Card</Badge>
      case "upi":
        return <Badge variant="outline">UPI</Badge>
      case "split":
        return <Badge variant="secondary">Split Payment</Badge>
      default:
        return <Badge variant="outline">{purchase.paymentMethod}</Badge>
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, hh:mm a')
  }

  // Handle bill printing
  const handlePrintBill = async (purchase: Purchase) => {
    try {
      // Prepare bill data for printing
      const billData: BillData = {
        // Store Information
        storeName: "HOTSPOT DSK TRADERS",
        storeAddress: "NO:1161Z/3, VELLORE ROAD, SEVOOR, CHEVUR, VELLORE- 632316",
        storePhone: "8111079499",
        storeGST: "33AASFD1146J1ZE",
        
        // Invoice Details
        invoiceNumber: purchase.invoiceNumber,
        customerName: purchase.customerName,
        customerPhone: purchase.customerPhone,
        date: new Date(purchase.createdAt).toLocaleDateString('en-IN'),
        time: new Date(purchase.createdAt).toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        
        // Items
        items: purchase.items.map((item) => ({
          product: item.stock.itemName,
          productCode: item.stock.stockID,
          qty: item.quantity,
          rate: item.unitPrice,
          amount: item.totalPrice,
          hsn: "620342" // Default HSN for clothing items
        })),
        
        // Totals
        totalItems: purchase.items.length,
        subtotal: purchase.subtotal,
        discountAmount: purchase.discountAmount,
        taxAmount: purchase.taxAmount,
        totalAmount: purchase.totalAmount,
        
        // Payment
        paymentMethod: purchase.isSplitPayment ? "Split Payment" : purchase.paymentMethod,
        paymentAmount: purchase.totalAmount,
        
        // Terms
        terms: [
          "STRICTLY NO CASH REFUND",
          "EXCHANGE WITHIN 3 DAYS (BILL AND PRICE TAG MUST)",
          "NO EXCHANGE ON ACCESSORIES, BLAZER, SHOE AND DAMAGE MADE BY CUSTOMER",
          "THANK YOU VISIT AGAIN!!!"
        ]
      };

      const result = await billPrinter.printBill(billData);
      
      if (result.success) {
        toast.success("Bill sent to printer!");
      } else {
        toast.error(`Print failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Error printing bill:", error);
      toast.error("Failed to print bill. Please try again.");
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"  
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">
                    Hotspot Sarees
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/pos">
                    Billing
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Transaction History</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Receipt className="h-8 w-8" />
                Transaction History
              </h1>
              <p className="text-muted-foreground">
                View and manage all purchase transactions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={refreshData} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page {currentPage} of {totalPages}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.ceil(totalItems / itemsPerPage)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter transactions by customer, payment method, or date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-search">Customer Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customer-search"
                  placeholder="Search customer..."
                  value={filters.customerName}
                  onChange={(e) => handleFilterChange("customerName", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select
                value={filters.paymentMethod || "all"}
                onValueChange={(value) => handleFilterChange("paymentMethod", value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <div className="text-sm text-muted-foreground">
              Showing {purchases.length} of {totalItems} transactions
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            All purchase transactions with details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">
                          {purchase.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{purchase.customerName}</div>
                            {purchase.customerPhone && (
                              <div className="text-sm text-muted-foreground">
                                {purchase.customerPhone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(purchase.createdAt)}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(purchase)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {purchase.items.length} item{purchase.items.length !== 1 ? 's' : ''}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(purchase.totalAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintBill(purchase)}
                              title="Print Bill"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedPurchase(purchase)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Transaction Details</DialogTitle>
                                <DialogDescription>
                                  Invoice: {purchase.invoiceNumber}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedPurchase && (
                                <div className="space-y-4">
                                  {/* Customer Info */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Customer Name</Label>
                                      <p className="text-sm">{selectedPurchase.customerName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Phone</Label>
                                      <p className="text-sm">{selectedPurchase.customerPhone || 'N/A'}</p>
                                    </div>
                                  </div>
                                  
                                  <Separator />
                                  
                                  {/* Items */}
                                  <div>
                                    <Label className="text-sm font-medium">Items Purchased</Label>
                                    <div className="mt-2 space-y-2">
                                      {selectedPurchase.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                                          <div>
                                            <p className="font-medium">{item.stock.itemName}</p>
                                            <p className="text-sm text-muted-foreground">
                                              {item.stock.category} - {item.stock.color}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                                            </p>
                                          </div>
                                          <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <Separator />
                                  
                                  {/* Pricing Summary */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span>Subtotal:</span>
                                      <span>{formatCurrency(selectedPurchase.subtotal)}</span>
                                    </div>
                                    {selectedPurchase.discountAmount > 0 && (
                                      <div className="flex justify-between text-green-600">
                                        <span>Discount:</span>
                                        <span>-{formatCurrency(selectedPurchase.discountAmount)}</span>
                                      </div>
                                    )}
                                    {selectedPurchase.taxAmount > 0 && (
                                      <div className="flex justify-between">
                                        <span>Tax:</span>
                                        <span>{formatCurrency(selectedPurchase.taxAmount)}</span>
                                      </div>
                                    )}
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                      <span>Total:</span>
                                      <span>{formatCurrency(selectedPurchase.totalAmount)}</span>
                                    </div>
                                  </div>
                                  
                                  <Separator />
                                  
                                  {/* Payment Information */}
                                  <div>
                                    <Label className="text-sm font-medium">Payment Information</Label>
                                    <div className="mt-2">
                                      {selectedPurchase.isSplitPayment && selectedPurchase.payments && selectedPurchase.payments.length > 0 ? (
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="secondary">Split Payment</Badge>
                                          </div>
                                          <div className="space-y-1">
                                            {selectedPurchase.payments.map((payment, index) => (
                                              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-sm font-medium capitalize">{payment.paymentMethod}</span>
                                                <span className="text-sm font-medium">{formatCurrency(payment.amount)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                          <span className="text-sm font-medium capitalize">
                                            {selectedPurchase.paymentMethod === "split" ? "Split Payment" : selectedPurchase.paymentMethod}
                                          </span>
                                          <span className="text-sm font-medium">{formatCurrency(selectedPurchase.totalAmount)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {selectedPurchase.notes && (
                                    <>
                                      <Separator />
                                      <div>
                                        <Label className="text-sm font-medium">Notes</Label>
                                        <p className="text-sm mt-1">{selectedPurchase.notes}</p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && purchases.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="items-per-page" className="text-sm">Items per page:</Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={handleItemsPerPageChange}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    if (pageNum > totalPages) return null
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({totalItems} total items)
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
