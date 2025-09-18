"use client"

import * as React from "react"
import { CalendarIcon, Search, Filter, Download, Eye } from "lucide-react"
import { format } from "date-fns"

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

// Sample transport data
const sampleTransportData = [
  {
    id: 1,
    inDate: new Date("2024-01-15"),
    numberOfBundles: 25,
    freightCharges: 1500.00,
    invoiceNo: "INV-2024-001",
    amount: 12000.00,
    gst: 2160.00,
    totalAmount: 14160.00
  },
  {
    id: 2,
    inDate: new Date("2024-01-20"),
    numberOfBundles: 18,
    freightCharges: 1200.00,
    invoiceNo: "INV-2024-002",
    amount: 9500.00,
    gst: 1710.00,
    totalAmount: 11210.00
  },
  {
    id: 3,
    inDate: new Date("2024-02-05"),
    numberOfBundles: 32,
    freightCharges: 2000.00,
    invoiceNo: "INV-2024-003",
    amount: 15800.00,
    gst: 2844.00,
    totalAmount: 18644.00
  },
  {
    id: 4,
    inDate: new Date("2024-02-12"),
    numberOfBundles: 22,
    freightCharges: 1350.00,
    invoiceNo: "INV-2024-004",
    amount: 11200.00,
    gst: 2016.00,
    totalAmount: 13216.00
  },
  {
    id: 5,
    inDate: new Date("2024-02-18"),
    numberOfBundles: 28,
    freightCharges: 1750.00,
    invoiceNo: "INV-2024-005",
    amount: 13500.00,
    gst: 2430.00,
    totalAmount: 15930.00
  }
]

export default function TransportHistoryPage() {
  const [data, setData] = React.useState(sampleTransportData)
  const [filteredData, setFilteredData] = React.useState(sampleTransportData)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [dateFrom, setDateFrom] = React.useState<Date>()
  const [dateTo, setDateTo] = React.useState<Date>()

  // Filter function
  React.useEffect(() => {
    let filtered = data

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numberOfBundles.toString().includes(searchTerm)
      )
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(item => item.inDate >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter(item => item.inDate <= dateTo)
    }

    setFilteredData(filtered)
  }, [searchTerm, dateFrom, dateTo, data])

  const clearFilters = () => {
    setSearchTerm("")
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  const exportData = () => {
    // Simple CSV export functionality
    const headers = ["Date", "Invoice No", "Bundles", "Freight Charges", "Amount", "GST", "Total"]
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => [
        format(row.inDate, "yyyy-MM-dd"),
        row.invoiceNo,
        row.numberOfBundles,
        row.freightCharges,
        row.amount,
        row.gst,
        row.totalAmount
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "transport-history.csv"
    a.click()
    window.URL.revokeObjectURL(url)
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
                  <BreadcrumbPage>Transport History</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Transport History
                  </CardTitle>
                  <CardDescription>
                    View and filter all transport entries and records.
                  </CardDescription>
                </div>
                <Button onClick={exportData} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
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
                      placeholder="Search by invoice number or bundles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>


                  {/* Date From */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                        {dateFrom ? format(dateFrom, "PPP") : "Date From"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Date To */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                        {dateTo ? format(dateTo, "PPP") : "Date To"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Clear Filters */}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>

                {/* Results Count */}
                <div className="text-sm text-muted-foreground">
                  Showing {filteredData.length} of {data.length} records
                </div>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice No</TableHead>
                      <TableHead className="text-right">Bundles</TableHead>
                      <TableHead className="text-right">Freight (₹)</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                      <TableHead className="text-right">GST (₹)</TableHead>
                      <TableHead className="text-right">Total (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{format(item.inDate, "dd/MM/yyyy")}</TableCell>
                          <TableCell className="font-medium">{item.invoiceNo}</TableCell>
                          <TableCell className="text-right">{item.numberOfBundles}</TableCell>
                          <TableCell className="text-right">₹{item.freightCharges.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{item.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{item.gst.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">₹{item.totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No transport records found matching your filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Statistics */}
              {filteredData.length > 0 && (
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold">
                      {filteredData.reduce((sum, item) => sum + item.numberOfBundles, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Bundles</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold">
                      ₹{filteredData.reduce((sum, item) => sum + item.freightCharges, 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Freight</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold">
                      ₹{filteredData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold">
                      ₹{filteredData.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Grand Total</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
