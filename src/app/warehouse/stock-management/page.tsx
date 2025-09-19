"use client"

import * as React from "react"
import { 
  Search, 
  Filter, 
  Download, 
  Trash2,
  Package,
  AlertTriangle,
  Loader2,
  RefreshCw,
  QrCode
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { AppSidebar } from "@/components/app-sidebar"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getStocks, deleteStock, type Stock } from "@/lib/api/stock"
import JsBarcode from "jsbarcode"

// Print barcode form schema
const printBarcodeSchema = z.object({
  quantity: z.string().min(1, "Number of stickers is required"),
})

type PrintBarcodeFormValues = z.infer<typeof printBarcodeSchema>

export default function StockManagementPage() {
  const [filteredStocks, setFilteredStocks] = React.useState<Stock[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalItems, setTotalItems] = React.useState(0)
  
  // Modal states
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [barcodeModalOpen, setBarcodeModalOpen] = React.useState(false)
  const [selectedStock, setSelectedStock] = React.useState<Stock | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [generatingBarcode, setGeneratingBarcode] = React.useState(false)
  const [barcodePreview, setBarcodePreview] = React.useState<string>("")

  const barcodeForm = useForm<PrintBarcodeFormValues>({
    resolver: zodResolver(printBarcodeSchema),
    defaultValues: {
      quantity: "1",
    },
  })

  // Fetch stocks from API
  const fetchStocks = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...(categoryFilter !== "all" && { category: categoryFilter }),
        ...(searchTerm && { search: searchTerm }),
      }
      
      const response = await getStocks(params)
      
      if (response.success) {
        setFilteredStocks(response.data)
        setTotalPages(response.pagination.pages)
        setTotalItems(response.pagination.total)
      } else {
        toast.error("Failed to fetch stocks", {
          description: 'error' in response ? response.error : 'Unknown error',
        })
      }
    } catch (error) {
      console.error('Error fetching stocks:', error)
      toast.error("Network error", {
        description: "Failed to load stock data",
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, categoryFilter, searchTerm])

  // Initial load and refetch when filters change
  React.useEffect(() => {
    fetchStocks()
  }, [fetchStocks])

  // Handle search with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Handle category filter change
  React.useEffect(() => {
    setCurrentPage(1) // Reset to first page when filtering
  }, [categoryFilter])

  const clearFilters = () => {
    setSearchTerm("")
    setCategoryFilter("all")
    setCurrentPage(1)
  }

  const exportData = () => {
    const headers = ["Item Code", "Item Name", "Category", "Color", "Quantity", "Unit Price", "Selling Price", "Profit Amount", "Profit %", "Total Value", "Supplier", "Created At"]
    const csvContent = [
      headers.join(","),
      ...filteredStocks.map(row => [
        row.itemCode || "",
        `"${row.itemName}"`,
        row.category,
        row.color,
        row.quantity,
        row.unitPrice,
        row.sellingPrice || "",
        row.profitAmount || "",
        row.profitPercentage ? `${row.profitPercentage.toFixed(1)}%` : "",
        (row.quantity * row.unitPrice).toFixed(2),
        `"${row.supplier}"`,
        format(new Date(row.createdAt), "yyyy-MM-dd")
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `stock-management-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }


  // Handle delete
  const handleDelete = (stock: Stock) => {
    setSelectedStock(stock)
    setDeleteDialogOpen(true)
  }

  // Handle print barcodes
  const handlePrintBarcodes = (stock: Stock) => {
    // Check if stock quantity is 0
    if (stock.quantity === 0) {
      toast.error("Cannot generate barcodes", {
        description: "Stock quantity is 0. Please add stock before generating barcodes.",
      })
      return
    }
    
    setSelectedStock(stock)
    setBarcodeModalOpen(true)
    generateBarcodePreview(stock)
  }

  // Generate barcode preview for modal
  const generateBarcodePreview = (stock: Stock) => {
    try {
      // Create barcode text using StockID
      const barcodeText = stock.stockID
      const canvas = document.createElement("canvas")
      
      // Set higher resolution for better quality
      canvas.width = 300
      canvas.height = 80
      
      JsBarcode(canvas, barcodeText, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: false,
        background: "#ffffff",
        lineColor: "#000000"
      })
      
      setBarcodePreview(canvas.toDataURL("image/png"))
    } catch (error) {
      console.error('Error generating barcode preview:', error)
      setBarcodePreview("")
    }
  }

  const generateBarcodeStickers = async (data: PrintBarcodeFormValues) => {
    if (!selectedStock) return
    
    setGeneratingBarcode(true)
    try {
      // Check if stock quantity is 0
      if (selectedStock.quantity === 0) {
        toast.error("Cannot generate barcodes", {
          description: "Stock quantity is 0. Please add stock before generating barcodes.",
        })
        setGeneratingBarcode(false)
        return
      }
      
      const quantity = parseInt(data.quantity)
      
      // Validate quantity
      if (quantity < 1 || quantity > 100) {
        toast.error("Invalid quantity", {
          description: "Please enter a quantity between 1 and 100 stickers",
        })
        setGeneratingBarcode(false)
        return
      }
      
      const barcodeText = selectedStock.stockID // Use StockID for barcode
      
      // 3-inch thermal printer specifications
      // 3 inches = 76.2mm, at 203 DPI (typical thermal printer)
      const thermalWidth = 576 // 3 inches at 203 DPI
      
      // 25x50mm sticker size at 203 DPI
      const stickerHeight = 406 // 50mm at 203 DPI
      
      // Create main canvas for thermal printer with higher resolution
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("Could not create canvas context")
      }

      // Set canvas size for thermal printer - allow for all requested stickers
      // Use higher resolution for better quality
      canvas.width = thermalWidth * 2 // Double resolution
      canvas.height = quantity * stickerHeight * 2 // Double resolution
      
      // Scale the context for higher resolution
      ctx.scale(2, 2)
      
      // White background (scaled coordinates)
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, thermalWidth, quantity * stickerHeight)
      
      // Generate stickers
      for (let i = 0; i < quantity; i++) {
        const y = i * stickerHeight
        
        // Calculate center position for content
        const centerX = thermalWidth / 2
        
        // Product information above barcode - simplified
        ctx.fillStyle = "#000000"
        ctx.textAlign = "center"
        
        // Product name and color on same line (truncated if too long)
        let itemName = selectedStock.itemName
        if (itemName.length > 15) {
          itemName = itemName.substring(0, 12) + "..."
        }
        
        const colorText = selectedStock.color && selectedStock.color !== "Not Specified" 
          ? ` - ${selectedStock.color.toUpperCase()}` 
          : ""
        
        ctx.font = "bold 11px Arial"
        ctx.fillText(`${itemName}${colorText}`, centerX, y + 15)
        
        // Create barcode for this sticker with higher quality
        const barcodeCanvas = document.createElement("canvas")
        // Set higher resolution for better quality
        barcodeCanvas.width = 400
        barcodeCanvas.height = 100
        
        JsBarcode(barcodeCanvas, barcodeText, {
          format: "CODE128",
          width: 2, // Slightly thicker bars for better readability
          height: 50, // Taller barcode for better scanning
          displayValue: false, // Don't show text below barcode
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000"
        })
        
        // Center the barcode (reduced gap from text)
        const barcodeX = centerX - barcodeCanvas.width / 2
        const barcodeY = y + 25
        ctx.drawImage(barcodeCanvas, barcodeX, barcodeY)
      }

      // Download the image
      const link = document.createElement("a")
      link.download = `thermal-stickers-${selectedStock.stockID}-${quantity}pcs.png`
      link.href = canvas.toDataURL("image/png")
      link.click()

      toast.success("Thermal printer stickers generated!", {
        description: `Generated ${quantity} stickers for ${selectedStock.itemName} (3-inch thermal printer)`,
        duration: 4000,
      })
      
      setBarcodeModalOpen(false)
    } catch (error) {
      console.error('Error generating thermal stickers:', error)
      toast.error("Failed to generate stickers", {
        description: "Please try again",
      })
    } finally {
      setGeneratingBarcode(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedStock) return
    
    setDeleting(true)
    try {
      const response = await deleteStock(selectedStock.id)

      if (response.success) {
        toast.success("Stock deleted successfully!", {
          description: `${selectedStock.itemName} has been removed from inventory`,
        })
        setDeleteDialogOpen(false)
        fetchStocks() // Refresh data
      } else {
        toast.error("Failed to delete stock", {
          description: 'error' in response ? response.error : 'Unknown error',
        })
      }
    } catch (error) {
      console.error('Error deleting stock:', error)
      toast.error("Network error", {
        description: "Failed to delete stock",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Calculate summary stats
  const totalStock = filteredStocks.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = filteredStocks.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

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
                  <BreadcrumbPage>Warehouse - Stock Management</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
                <p className="text-xs text-muted-foreground">Unique products</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStock}</div>
                <p className="text-xs text-muted-foreground">Units in stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Page</CardTitle>
                <AlertTriangle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentPage} / {totalPages}</div>
                <p className="text-xs text-muted-foreground">Page navigation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Current page value</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Stock Management
                  </CardTitle>
                  <CardDescription>
                    View and manage all warehouse stock items.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={fetchStocks} variant="outline" size="sm" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button onClick={exportData} variant="outline" size="sm" disabled={loading}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters Section */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Search */}
                  <div className="flex items-center gap-2 min-w-[300px]">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by Stock ID, item name, code, or supplier..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                      uppercase={false}
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="bridal">Bridal</SelectItem>
                      <SelectItem value="cotton">Cotton</SelectItem>
                      <SelectItem value="silk">Silk</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="traditional">Traditional</SelectItem>
                      <SelectItem value="party-wear">Party Wear</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear Filters */}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>

                {/* Results Count */}
                <div className="text-sm text-muted-foreground">
                  Showing {filteredStocks.length} items on page {currentPage} of {totalPages} (Total: {totalItems} items)
                </div>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading stock data...</span>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Stock ID</TableHead>
                          <TableHead>Item Code</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Color</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price (₹)</TableHead>
                          <TableHead className="text-right">Selling Price (₹)</TableHead>
                          <TableHead className="text-right">Profit (₹)</TableHead>
                          <TableHead className="text-right">Profit %</TableHead>
                          <TableHead className="text-right">Total Value (₹)</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStocks.length > 0 ? (
                          filteredStocks.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono font-bold text-primary">
                                <span className="rounded bg-primary/10 px-2 py-1 text-xs">
                                  {item.stockID}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono">{item.itemCode || "N/A"}</TableCell>
                              <TableCell className="font-medium">{item.itemName}</TableCell>
                              <TableCell className="capitalize">{item.category}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                  {item.color}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                              <TableCell className="text-right">₹{item.unitPrice.toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                {item.sellingPrice ? `₹${item.sellingPrice.toLocaleString()}` : "N/A"}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.profitAmount ? (
                                  <span className={`font-medium ${item.profitAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    ₹{item.profitAmount.toLocaleString()}
                                  </span>
                                ) : "N/A"}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.profitPercentage ? (
                                  <span className={`font-medium ${item.profitPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {item.profitPercentage.toFixed(1)}%
                                  </span>
                                ) : "N/A"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ₹{(item.quantity * item.unitPrice).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-sm">{item.supplier}</TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(item.createdAt), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handlePrintBarcodes(item)}
                                    title="Print Thermal Stickers"
                                    className="text-blue-600 hover:text-blue-700"
                                    disabled={item.quantity === 0}
                                  >
                                    <QrCode className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDelete(item)}
                                    title="Delete Stock"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                              No stock items found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>


        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{selectedStock?.itemName}</strong> (Stock ID: {selectedStock?.stockID}) from your inventory.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Stock"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Print Barcodes Modal */}
        <Dialog open={barcodeModalOpen} onOpenChange={(open) => {
          setBarcodeModalOpen(open)
          if (!open) {
            setBarcodePreview("")
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Print Thermal Stickers
              </DialogTitle>
              <DialogDescription>
                Generate thermal printer stickers for <strong>{selectedStock?.itemName}</strong> (Stock ID: {selectedStock?.stockID})
                <br />
                <span className="text-xs text-muted-foreground">
                  Optimized for 3-inch thermal printer (25x50mm stickers)
                </span>
              </DialogDescription>
            </DialogHeader>
            <Form {...barcodeForm}>
              <form onSubmit={barcodeForm.handleSubmit(generateBarcodeStickers)} className="space-y-4">
                <FormField
                  control={barcodeForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Stickers</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="Enter number of stickers"
                          {...field}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Optimized for 3-inch thermal printer (25x50mm stickers)
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Preview Information */}
                <div className="rounded-lg border bg-muted/50 p-3">
                  <h4 className="text-sm font-medium mb-3">Thermal Sticker Preview</h4>
                  
                  {/* Visual Barcode Preview */}
                  {barcodePreview && (
                    <div className="mb-4 p-3 bg-white rounded border-2 border-dashed border-gray-300 text-center">
                      <div className="text-xs text-gray-500 mb-2">Barcode Preview</div>
                      <div className="flex justify-center">
                        <Image 
                          src={barcodePreview} 
                          alt="Barcode Preview" 
                          width={200}
                          height={40}
                          className="max-w-full h-auto"
                          style={{ maxHeight: '40px' }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        Stock ID: {selectedStock?.stockID}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div><strong>Item:</strong> {selectedStock?.itemName}</div>
                    <div><strong>Category:</strong> {selectedStock?.category}</div>
                    <div><strong>Color:</strong> {selectedStock?.color}</div>
                    <div><strong>Stock ID:</strong> {selectedStock?.stockID}</div>
                    <div><strong>Item Code:</strong> {selectedStock?.itemCode || "N/A"}</div>
                    <div><strong>Format:</strong> CODE128 Barcode with Stock ID</div>
                    <div><strong>Size:</strong> 25x50mm (3-inch thermal printer)</div>
                    <div><strong>Layout:</strong> Product name and color on one line, Stock ID in barcode</div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBarcodeModalOpen(false)}
                    disabled={generatingBarcode}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={generatingBarcode}>
                    {generatingBarcode ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate Thermal Stickers
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}