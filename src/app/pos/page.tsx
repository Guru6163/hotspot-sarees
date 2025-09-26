"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Receipt,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  User,
  FileText,
  Calculator,
  ShoppingBag,
  Banknote,
  Smartphone,
  Printer,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import { getStockByBarcode, searchStocks, Stock } from "@/lib/api/stock";
import { createPurchase, CreatePurchaseData, Purchase } from "@/lib/api/billing";
import { billPrinter, BillData } from "@/lib/bill-printer";
import { toast } from "sonner";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { BarcodeScanner } from "@/components/barcode-scanner";

interface CartItem {
  stock: Stock;
  quantity: number;
  totalPrice: number;
}

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [error, setError] = useState("");
  const [lastCompletedPurchase, setLastCompletedPurchase] = useState<Purchase | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Customer information
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  
  // Discount information
  const [discountType, setDiscountType] = useState<"price" | "percentage">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  
  // Payment information
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("cash");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPurchaseCompleted, setIsPurchaseCompleted] = useState(false);
  
  // Split payment information
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<{
    cash: number;
    card: number;
    upi: number;
  }>({
    cash: 0,
    card: 0,
    upi: 0,
  });

  // Barcode scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Focus on barcode input when component mounts
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          console.log("Searching for:", searchQuery.trim());
          const response = await searchStocks(searchQuery.trim());
          console.log("Search response:", response);
          if (response.success) {
            setSearchResults(response.data);
            console.log("Search results:", response.data);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error("Error searching products:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms debounce
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate discount
  const discountAmount = (() => {
    if (!discountValue || discountValue === "") return 0;
    const value = parseFloat(discountValue);
    if (isNaN(value) || value < 0) return 0;
    
    if (discountType === "percentage") {
      return Math.min((subtotal * value) / 100, subtotal); // Cap at subtotal
    } else {
      return Math.min(value, subtotal); // Cap at subtotal
    }
  })();
  
  const finalTotal = subtotal - discountAmount;

  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await getStockByBarcode(barcode.trim());

      if (!response.success) {
        setError("error" in response ? response.error : "Product not found");
        toast.error("Product not found");
        return;
      }

      const stock = response.data;

      // Check if product is already in invoice
      const existingItemIndex = cart.findIndex(
        (item) => item.stock.id === stock.id
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += 1;
        updatedCart[existingItemIndex].totalPrice =
          updatedCart[existingItemIndex].quantity * stock.unitPrice;
        setCart(updatedCart);
        toast.success(`Updated quantity for ${stock.itemName}`);
      } else {
        // Add new item to invoice
        const newItem: CartItem = {
          stock,
          quantity: 1,
          totalPrice: stock.unitPrice,
        };
        setCart([...cart, newItem]);
        toast.success(`Added ${stock.itemName} to invoice`);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setError("Failed to fetch product");
      toast.error("Failed to fetch product");
    } finally {
      setIsLoading(false);
      setBarcodeInput("");
      // Refocus on barcode input
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleBarcodeScan(barcodeInput);
  };

  const handleBarcodeScanned = (barcode: string) => {
    // Set the scanned barcode in the input field
    setBarcodeInput(barcode);
    // Automatically process the scanned barcode
    handleBarcodeScan(barcode);
  };

  const handleProductSelect = (stock: Stock) => {
    // Check if product is already in invoice
    const existingItemIndex = cart.findIndex(
      (item) => item.stock.id === stock.id
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      updatedCart[existingItemIndex].totalPrice =
        updatedCart[existingItemIndex].quantity * stock.unitPrice;
      setCart(updatedCart);
      toast.success(`Updated quantity for ${stock.itemName}`);
    } else {
      // Add new item to invoice
      const newItem: CartItem = {
        stock,
        quantity: 1,
        totalPrice: stock.unitPrice,
      };
      setCart([...cart, newItem]);
      toast.success(`Added ${stock.itemName} to invoice`);
    }

    // Clear search
    setSearchQuery("");
    setSearchResults([]);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedCart = cart.map((item) => {
      if (item.stock.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: newQuantity * item.stock.unitPrice,
        };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.stock.id !== itemId));
    toast.success("Item removed from invoice");
  };

  const clearCart = () => {
    setCart([]);
    toast.success("Invoice cleared");
  };

  // Split payment helper functions
  const handleSplitPaymentChange = (method: "cash" | "card" | "upi", value: string) => {
    const numValue = parseFloat(value) || 0;
    setSplitPayments(prev => ({
      ...prev,
      [method]: numValue
    }));
  };

  const getSplitPaymentTotal = () => {
    return splitPayments.cash + splitPayments.card + splitPayments.upi;
  };

  const getSplitPaymentDifference = () => {
    return finalTotal - getSplitPaymentTotal();
  };

  const resetSplitPayments = () => {
    setSplitPayments({
      cash: 0,
      card: 0,
      upi: 0,
    });
  };

  const handleCompletePurchase = async () => {
    if (cart.length === 0) {
      toast.error("No items to purchase");
      return;
    }

    if (isProcessingPurchase) {
      return; // Prevent duplicate submissions
    }

    // Validate split payments if enabled
    if (isSplitPayment) {
      const splitTotal = getSplitPaymentTotal();
      const difference = getSplitPaymentDifference();
      
      if (Math.abs(difference) > 0.01) { // Allow for small floating point differences
        toast.error(`Split payment total (₹${splitTotal.toFixed(2)}) must equal the total amount (₹${finalTotal.toFixed(2)})`);
        return;
      }
      
      // Check that at least one payment method has an amount
      if (splitTotal === 0) {
        toast.error("Please enter amounts for at least one payment method");
        return;
      }
    }

    setIsProcessingPurchase(true);

    try {
      const purchaseData: CreatePurchaseData = {
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        notes: notes || undefined,
        subtotal,
        discountType: discountValue ? discountType : undefined,
        discountValue: discountValue ? parseFloat(discountValue) : undefined,
        discountAmount,
        taxAmount: 0, // Currently no tax
        totalAmount: finalTotal,
        paymentMethod: isSplitPayment ? "split" : paymentMethod, // Use "split" for split payments
        isSplitPayment,
        splitPayments: isSplitPayment ? [
          ...(splitPayments.cash > 0 ? [{ paymentMethod: "cash" as const, amount: splitPayments.cash }] : []),
          ...(splitPayments.card > 0 ? [{ paymentMethod: "card" as const, amount: splitPayments.card }] : []),
          ...(splitPayments.upi > 0 ? [{ paymentMethod: "upi" as const, amount: splitPayments.upi }] : []),
        ] : undefined,
        items: cart.map(item => ({
          stockId: item.stock.id,
          quantity: item.quantity,
          unitPrice: item.stock.unitPrice,
          totalPrice: item.totalPrice
        }))
      };

      const response = await createPurchase(purchaseData);

      if (response.success) {
        toast.success(`Purchase completed! Invoice: ${response.data.invoiceNumber} - Total: ₹${finalTotal.toFixed(2)}${discountAmount > 0 ? ` (Discount: ₹${discountAmount.toFixed(2)})` : ""}`);
        
        // Store the completed purchase for printing
        setLastCompletedPurchase(response.data);
        
        // Clear form
        clearCart();
        setCustomerName("");
        setCustomerPhone("");
        setCustomerEmail("");
        setNotes("");
        setDiscountValue("");
        setIsSplitPayment(false);
        resetSplitPayments();
        
        // Don't close the modal - show print confirmation instead
        setIsPurchaseCompleted(true);
      } else {
        toast.error("error" in response ? response.error : "Failed to complete purchase");
      }
    } catch (error) {
      console.error("Error completing purchase:", error);
      toast.error("Failed to complete purchase. Please try again.");
    } finally {
      setIsProcessingPurchase(false);
    }
  };

  const handlePrintBill = async () => {
    try {
      if (!lastCompletedPurchase) {
        toast.error("No purchase data available for printing");
        return;
      }
      
      const purchaseData = lastCompletedPurchase;

      // Prepare bill data for printing
      const billData: BillData = {
        // Store Information
        storeName: "HOTSPOT DSK TRADERS",
        storeAddress: "NO:1161Z/3, VELLORE ROAD, SEVOOR, CHEVUR, VELLORE- 632316",
        storePhone: "8111079499",
        storeGST: "33AASFD1146J1ZE",
        
        // Invoice Details
        invoiceNumber: purchaseData.invoiceNumber,
        customerName: purchaseData.customerName,
        customerPhone: purchaseData.customerPhone || undefined,
        date: new Date(purchaseData.createdAt).toLocaleDateString('en-IN'),
        time: new Date(purchaseData.createdAt).toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        
        // Items
        items: purchaseData.items.map((item) => ({
          product: item.stock.itemName,
          productCode: item.stock.stockID,
          qty: item.quantity,
          rate: item.unitPrice,
          amount: item.totalPrice,
          hsn: "620342" // Default HSN for clothing items
        })),
        
        // Totals
        totalItems: purchaseData.items.length,
        subtotal: purchaseData.subtotal,
        discountAmount: purchaseData.discountAmount,
        taxAmount: purchaseData.taxAmount,
        totalAmount: purchaseData.totalAmount,
        
        // Payment
        paymentMethod: purchaseData.isSplitPayment ? "Split Payment" : purchaseData.paymentMethod,
        paymentAmount: purchaseData.totalAmount,
        
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
  };

  const handleCloseModal = () => {
    setIsPaymentModalOpen(false);
    setIsPurchaseCompleted(false);
    setLastCompletedPurchase(null);
  };

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
                  <BreadcrumbPage>Point of Sale</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
         <div className="container mx-auto p-6 ">
           <div className="mb-6">
             <h1 className="text-3xl font-bold flex items-center gap-2">
               <Receipt className="h-8 w-8" />
               Billing System
             </h1>
             <p className="text-muted-foreground mt-2">
               Create invoices and process payments
             </p>
           </div>

          {/* Customer Details - Top Row */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="customerName" className="text-sm">Customer Name</Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="text-sm">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    placeholder="Enter phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail" className="text-sm">Email (Optional)</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="notes" className="text-sm">Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left Column (Wider) - Product Search + Products Table */}
            <div className="lg:col-span-3 space-y-6">
              {/* Product Search/Scan Area */}
              <Card className="border-2 ">
                <CardHeader className="">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Search Products or Scan Barcode
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Single Row Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Barcode Scanner */}
                    <div>
                      <Label className="text-sm font-medium">Barcode Scanner</Label>
                      <form onSubmit={handleBarcodeSubmit} className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            ref={barcodeInputRef}
                            type="text"
                            placeholder="Scan barcode or enter manually..."
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            disabled={isLoading}
                            className="flex-1 h-10"
                            autoComplete="off"
                          />
                          <BarcodeScanner
                            onScan={handleBarcodeScanned}
                            isOpen={isScannerOpen}
                            onOpenChange={setIsScannerOpen}
                          />
                          <Button
                            type="submit"
                            disabled={isLoading || !barcodeInput.trim()}
                            className="h-10"
                          >
                            {isLoading ? "..." : "Add"}
                          </Button>
                        </div>
                      </form>
                    </div>

                    {/* Product Search */}
                    <div>
                      <Label className="text-sm font-medium">Search Products</Label>
                      <Input
                        type="text"
                        placeholder="Type product name to search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* Search Results Dropdown */}
                  {searchQuery.length >= 2 && (
                    <div className="max-h-60 overflow-y-auto border rounded-md bg-background">
                      {isSearching ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          Searching...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          No products found
                        </div>
                      ) : (
                        <div className="p-1">
                          {searchResults.map((stock) => (
                            <div
                              key={stock.id}
                              className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                              onClick={() => handleProductSelect(stock)}
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {stock.itemName}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Badge variant="secondary" className="text-xs">
                                    {stock.stockID}
                                  </Badge>
                                  <span>{stock.category}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-sm">
                                  ₹{stock.unitPrice}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* List of Products Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      List of Products Table ({totalItems})
                    </CardTitle>
                    {cart.length > 0 && (
                      <Button variant="outline" size="sm" onClick={clearCart}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No items selected</p>
                      <p className="text-sm">Add products to start billing</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead className="w-[100px]">Price</TableHead>
                            <TableHead className="w-[100px]">Qty</TableHead>
                            <TableHead className="w-[120px] text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cart.map((item, index) => (
                            <TableRow key={item.stock.id}>
                              <TableCell className="font-medium">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {item.stock.itemName}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {item.stock.stockID}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {item.stock.category}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      • {item.stock.color}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>₹{item.stock.unitPrice}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() =>
                                      updateQuantity(
                                        item.stock.id,
                                        item.quantity - 1
                                      )
                                    }
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() =>
                                      updateQuantity(
                                        item.stock.id,
                                        item.quantity + 1
                                      )
                                    }
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ₹{item.totalPrice.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => removeFromCart(item.stock.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column (Narrower) - Total Amount, Discount, Complete Purchase */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Billing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Discount Section */}
                  <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-medium">Apply Discount</Label>
                    <div className="flex gap-2">
                      <Select value={discountType} onValueChange={(value: "price" | "percentage") => setDiscountType(value)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="price">₹</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="flex-1"
                        min="0"
                        step={discountType === "percentage" ? "0.1" : "1"}
                      />
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Discount: ₹{discountAmount.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 px-2 text-xs"
                          onClick={() => setDiscountValue("")}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({discountType === "percentage" ? `${discountValue}%` : `₹${discountValue}`})</span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (0%)</span>
                      <span>₹0.00</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount</span>
                      <span>₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          size="lg"
                          disabled={cart.length === 0}
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Complete Purchase
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={`max-w-md ${isSplitPayment ? 'max-h-[95vh] overflow-y-auto' : 'max-h-[90vh] overflow-y-auto'}`}>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {isPurchaseCompleted ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Purchase Completed
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-5 w-5" />
                                Complete Purchase
                              </>
                            )}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          {isPurchaseCompleted ? (
                            // Purchase Completed View
                            <>
                              <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-green-600">Purchase Completed Successfully!</h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Invoice: {lastCompletedPurchase?.invoiceNumber}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h3 className="font-medium">Purchase Summary</h3>
                                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Total Amount:</span>
                                    <span className="font-medium">₹{lastCompletedPurchase?.totalAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Payment Method:</span>
                                    <span className="font-medium capitalize">
                                      {lastCompletedPurchase?.isSplitPayment ? "Split Payment" : lastCompletedPurchase?.paymentMethod}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Customer:</span>
                                    <span className="font-medium">{lastCompletedPurchase?.customerName}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h3 className="font-medium">Next Steps</h3>
                                <p className="text-sm text-muted-foreground">
                                  Would you like to print the bill for this purchase?
                                </p>
                              </div>

                              <div className="flex gap-3">
                                <Button
                                  onClick={handlePrintBill}
                                  className="flex-1"
                                >
                                  <Printer className="h-4 w-4 mr-2" />
                                  Print Bill
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={handleCloseModal}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Close
                                </Button>
                              </div>
                            </>
                          ) : (
                            // Payment Form View
                            <>
                              {/* Customer Summary */}
                              <div className="space-y-3">
                                <h3 className="font-medium">Customer Details</h3>
                                <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Name:</span> {customerName || "Walk-in Customer"}
                                  </div>
                                  {customerPhone && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Phone:</span> {customerPhone}
                                    </div>
                                  )}
                                  {customerEmail && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Email:</span> {customerEmail}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Order Summary */}
                              <div className="space-y-3">
                                <h3 className="font-medium">Order Summary</h3>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Items ({totalItems})</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                  </div>
                                  {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                      <span>Discount</span>
                                      <span>-₹{discountAmount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <Separator />
                                  <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>₹{finalTotal.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Payment Method */}
                              <div className="space-y-3">
                                <h3 className="font-medium">Payment Method</h3>
                                
                                {/* Split Payment Toggle */}
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="split-payment"
                                    checked={isSplitPayment}
                                    onChange={(e) => {
                                      setIsSplitPayment(e.target.checked);
                                      if (!e.target.checked) {
                                        resetSplitPayments();
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                  <Label htmlFor="split-payment" className="text-sm cursor-pointer">
                                    Split Payment (Half Cash, Half Other)
                                  </Label>
                                </div>

                                {!isSplitPayment ? (
                                  <RadioGroup value={paymentMethod} onValueChange={(value: "cash" | "card" | "upi") => setPaymentMethod(value)}>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="cash" id="cash" />
                                      <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                                        <Banknote className="h-4 w-4" />
                                        Cash
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="card" id="card" />
                                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                                        <CreditCard className="h-4 w-4" />
                                        Card
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="upi" id="upi" />
                                      <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer">
                                        <Smartphone className="h-4 w-4" />
                                        UPI
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="text-sm text-gray-600 font-medium bg-blue-50 p-2 rounded">
                                      Total Amount: ₹{finalTotal.toFixed(2)}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                      {/* Cash Payment */}
                                      <div className="space-y-1">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                          <Banknote className="h-4 w-4" />
                                          Cash Amount
                                        </Label>
                                        <Input
                                          type="number"
                                          placeholder="0.00"
                                          value={splitPayments.cash || ""}
                                          onChange={(e) => handleSplitPaymentChange("cash", e.target.value)}
                                          step="0.01"
                                          min="0"
                                          max={finalTotal}
                                          className="text-sm"
                                        />
                                      </div>

                                      {/* Card Payment */}
                                      <div className="space-y-1">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                          <CreditCard className="h-4 w-4" />
                                          Card Amount
                                        </Label>
                                        <Input
                                          type="number"
                                          placeholder="0.00"
                                          value={splitPayments.card || ""}
                                          onChange={(e) => handleSplitPaymentChange("card", e.target.value)}
                                          step="0.01"
                                          min="0"
                                          max={finalTotal}
                                          className="text-sm"
                                        />
                                      </div>

                                      {/* UPI Payment */}
                                      <div className="space-y-1">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                          <Smartphone className="h-4 w-4" />
                                          UPI Amount
                                        </Label>
                                        <Input
                                          type="number"
                                          placeholder="0.00"
                                          value={splitPayments.upi || ""}
                                          onChange={(e) => handleSplitPaymentChange("upi", e.target.value)}
                                          step="0.01"
                                          min="0"
                                          max={finalTotal}
                                          className="text-sm"
                                        />
                                      </div>
                                    </div>

                                    {/* Split Payment Summary */}
                                    <div className="bg-gray-50 p-3 rounded-lg space-y-2 border">
                                      <div className="flex justify-between text-sm">
                                        <span>Split Total:</span>
                                        <span className="font-medium">₹{getSplitPaymentTotal().toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>Remaining:</span>
                                        <span className={`font-medium ${getSplitPaymentDifference() === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          ₹{getSplitPaymentDifference().toFixed(2)}
                                        </span>
                                      </div>
                                      {getSplitPaymentDifference() === 0 && getSplitPaymentTotal() > 0 && (
                                        <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3" />
                                          Payment amounts match total
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3">
                                <Button
                                  onClick={handleCompletePurchase}
                                  className="flex-1"
                                  disabled={isProcessingPurchase}
                                >
                                  {isProcessingPurchase ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Complete Purchase
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={handlePrintBill}
                                  disabled={isProcessingPurchase}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={clearCart}
                      disabled={cart.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Invoice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
