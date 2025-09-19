"use client"

import * as React from "react"
import { Plus, Package } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
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

const addStockFormSchema = z.object({
  itemCode: z.string().optional(),
  itemName: z.string().min(1, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  color: z.string().min(1, "Color is required"),
  quantity: z.string().min(1, "Quantity is required"),
  unitPrice: z.string().min(1, "Unit price is required"),
  supplier: z.string().min(1, "Supplier is required"),
})

type AddStockFormValues = z.infer<typeof addStockFormSchema>

export default function AddStockPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [lastCreatedStock, setLastCreatedStock] = React.useState<{stockID: string, itemName: string} | null>(null)
  
  const form = useForm<AddStockFormValues>({
    resolver: zodResolver(addStockFormSchema),
    defaultValues: {
      itemCode: "",
      itemName: "",
      category: "",
      color: "",
      quantity: "",
      unitPrice: "",
      supplier: "",
    },
  })

  async function onSubmit(data: AddStockFormValues) {
    setIsSubmitting(true)
    
    try {
      // Convert string values to appropriate types for API
      const payload = {
        itemCode: data.itemCode || undefined, // Convert empty string to undefined
        itemName: data.itemName,
        category: data.category,
        color: data.color,
        quantity: parseInt(data.quantity),
        unitPrice: parseFloat(data.unitPrice),
        supplier: data.supplier,
      }

      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        setLastCreatedStock({
          stockID: result.data.stockID,
          itemName: result.data.itemName
        })
        toast.success("Stock added successfully!", {
          description: `${result.data.itemName} has been added to inventory with Stock ID: ${result.data.stockID}`,
          duration: 6000,
        })
        form.reset()
      } else {
        toast.error("Failed to add stock", {
          description: result.error || 'Please check your input and try again',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error("Network error", {
        description: 'Failed to connect to server. Please try again.',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
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
                  <BreadcrumbPage>Warehouse - Add Stock</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Plus className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Add New Stock</h1>
            </div>
            <p className="text-muted-foreground">
              Add new inventory items to the warehouse stock.
            </p>
          </div>

          {/* Success Card - Show when stock is created */}
          {lastCreatedStock && (
            <div className="mb-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <Package className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800">Stock Added Successfully!</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-green-700">
                    <span className="font-medium">Item:</span> {lastCreatedStock.itemName}
                  </p>
                  <p className="text-green-700">
                    <span className="font-medium">Stock ID:</span> 
                    <span className="ml-2 rounded bg-green-100 px-2 py-1 font-mono text-sm font-bold text-green-800">
                      {lastCreatedStock.stockID}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setLastCreatedStock(null)}
                  className="mt-3 text-sm text-green-600 hover:text-green-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Category - Full width */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bridal">Bridal</SelectItem>
                        <SelectItem value="cotton">Cotton</SelectItem>
                        <SelectItem value="silk">Silk</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="traditional">Traditional</SelectItem>
                        <SelectItem value="party-wear">Party Wear</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color - Full width */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="yellow">Yellow</SelectItem>
                        <SelectItem value="pink">Pink</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="black">Black</SelectItem>
                        <SelectItem value="white">White</SelectItem>
                        <SelectItem value="cream">Cream</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="maroon">Maroon</SelectItem>
                        <SelectItem value="navy">Navy</SelectItem>
                        <SelectItem value="brown">Brown</SelectItem>
                        <SelectItem value="grey">Grey</SelectItem>
                        <SelectItem value="multicolor">Multicolor</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Second Row: Item Code and Item Name */}
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="itemCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Code (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., SS-BR-001"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Silk Saree - Red Bridal"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Third Row: Quantity, Unit Price, and Supplier */}
              <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter quantity"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter unit price"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter supplier name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Total Value Display */}
              <div className="rounded-lg border bg-muted/50 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium">Total Stock Value:</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{(parseFloat(form.watch("quantity") || "0") * parseFloat(form.watch("unitPrice") || "0")).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Quantity × Unit Price = Total Value
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" size="lg" className="px-8" disabled={isSubmitting}>
                  <Package className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Adding Stock...' : 'Add Stock'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    form.reset()
                    toast.info("Form reset", {
                      description: "All fields have been cleared",
                      duration: 2000,
                    })
                  }}
                  disabled={isSubmitting}
                >
                  Reset Form
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
