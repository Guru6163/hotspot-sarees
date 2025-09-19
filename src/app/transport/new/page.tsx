"use client"

import * as React from "react"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { createTransport } from "@/lib/api/transport"

const transportFormSchema = z.object({
  inDate: z.date({
    required_error: "In Date is required.",
  }),
  numberOfBundles: z.string().min(1, "Number of bundles is required"),
  freightCharges: z.string().min(1, "Freight charges is required"),
  invoiceNo: z.string().min(1, "Invoice number is required"),
  amount: z.string().min(1, "Amount is required"),
  gst: z.string().min(1, "GST is required"),
})

type TransportFormValues = z.infer<typeof transportFormSchema>

export default function AddNewTransportEntryPage() {
  const [totalAmount, setTotalAmount] = React.useState<number>(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const router = useRouter()

  const form = useForm<TransportFormValues>({
    resolver: zodResolver(transportFormSchema),
    defaultValues: {
      numberOfBundles: "",
      freightCharges: "",
      invoiceNo: "",
      amount: "",
      gst: "",
    },
  })

  // Calculate total amount when amount or GST changes
  const amount = form.watch("amount")
  const gst = form.watch("gst")

  React.useEffect(() => {
    const amountNum = parseFloat(amount) || 0
    const gstNum = parseFloat(gst) || 0
    setTotalAmount(amountNum + gstNum)
  }, [amount, gst])

  async function onSubmit(data: TransportFormValues) {
    try {
      setIsSubmitting(true)
      
      const transportData = {
        inDate: data.inDate.toISOString(),
        numberOfBundles: parseInt(data.numberOfBundles),
        freightCharges: parseFloat(data.freightCharges),
        invoiceNo: data.invoiceNo,
        amount: parseFloat(data.amount),
        gst: parseFloat(data.gst),
      }

      await createTransport(transportData)
      
      toast.success("Transport entry created successfully!")
      form.reset()
      setTotalAmount(0)
      router.push("/transport/history")
    } catch (error) {
      console.error("Error creating transport entry:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create transport entry")
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
                  <BreadcrumbPage>Transport Management - Add New Entry</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="mx-auto w-full max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Transport Entry
                </CardTitle>
                <CardDescription>
                  Enter transport details for tracking freight and billing information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* In Date */}
                      <FormField
                        control={form.control}
                        name="inDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>In Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="w-full pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Number of Bundles */}
                      <FormField
                        control={form.control}
                        name="numberOfBundles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Bundles</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter number of bundles"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Freight Charges */}
                      <FormField
                        control={form.control}
                        name="freightCharges"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Freight Charges (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter freight charges"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Invoice Number */}
                      <FormField
                        control={form.control}
                        name="invoiceNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter invoice number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Amount */}
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter amount"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* GST */}
                      <FormField
                        control={form.control}
                        name="gst"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter GST amount"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Total Amount Display */}
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Amount:</span>
                        <span className="text-lg font-bold">
                          ₹{totalAmount.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Amount + GST = Total Amount
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit" className="flex-1" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Submit Transport Entry"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          form.reset()
                          setTotalAmount(0)
                        }}
                      >
                        Reset Form
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
