"use client"

import * as React from "react"
import { QrCode, Download, Copy, RotateCcw } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import JsBarcode from "jsbarcode"

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
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

const barcodeFormSchema = z.object({
  text: z.string().min(1, "Text/Code is required"),
  format: z.string().min(1, "Barcode format is required"),
  stickerSize: z.string().min(1, "Sticker size is required"),
  width: z.string().min(1, "Width is required"),
  height: z.string().min(1, "Height is required"),
  displayValue: z.boolean(),
  fontSize: z.string().min(1, "Font size is required"),
  textAlign: z.string().min(1, "Text alignment is required"),
  textPosition: z.string().min(1, "Text position is required"),
  background: z.string().min(1, "Background color is required"),
  lineColor: z.string().min(1, "Line color is required"),
  quantity: z.string().min(1, "Quantity is required"),
})

type BarcodeFormValues = z.infer<typeof barcodeFormSchema>

export default function BarcodeGeneratePage() {
  const [generatedBarcode, setGeneratedBarcode] = React.useState<string>("")
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const form = useForm<BarcodeFormValues>({
    resolver: zodResolver(barcodeFormSchema),
    defaultValues: {
      text: "",
      format: "CODE128",
      stickerSize: "standard",
      width: "2",
      height: "80",
      displayValue: true,
      fontSize: "16",
      textAlign: "center",
      textPosition: "bottom",
      background: "#ffffff",
      lineColor: "#000000",
      quantity: "1",
    },
  })

  // Sticker size presets (optimized for saree stickers)
  const stickerPresets = {
    small: { width: "1.5", height: "60", fontSize: "12" }, // ~25mm x 15mm
    standard: { width: "2", height: "80", fontSize: "16" }, // ~31mm x 20mm (Standard retail)
    large: { width: "2.5", height: "100", fontSize: "18" }, // ~37mm x 25mm
    extraLarge: { width: "3", height: "120", fontSize: "20" }, // ~45mm x 30mm
  }

  // Update form values when sticker size changes
  const handleStickerSizeChange = (size: string) => {
    const preset = stickerPresets[size as keyof typeof stickerPresets]
    if (preset) {
      form.setValue("width", preset.width)
      form.setValue("height", preset.height)
      form.setValue("fontSize", preset.fontSize)
    }
  }

  const generateBarcode = (data: BarcodeFormValues) => {
    if (!canvasRef.current) return

    try {
      JsBarcode(canvasRef.current, data.text, {
        format: data.format,
        width: parseInt(data.width),
        height: parseInt(data.height),
        displayValue: data.displayValue,
        fontSize: parseInt(data.fontSize),
        textAlign: data.textAlign as "left" | "center" | "right",
        textPosition: data.textPosition as "top" | "bottom",
        background: data.background,
        lineColor: data.lineColor,
      })
      
      // Convert canvas to data URL
      const dataURL = canvasRef.current.toDataURL("image/png")
      setGeneratedBarcode(dataURL)
    } catch (error) {
      console.error("Error generating barcode:", error)
      alert("Error generating barcode. Please check your input.")
    }
  }

  const downloadBarcode = () => {
    if (!generatedBarcode) return

    const link = document.createElement("a")
    link.download = `barcode-${form.getValues("text")}.png`
    link.href = generatedBarcode
    link.click()
  }

  const downloadBulkStickers = () => {
    if (!generatedBarcode) return

    const quantity = parseInt(form.getValues("quantity"))
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx || !canvasRef.current) return

    // Calculate sticker sheet dimensions (A4 size optimization)
    const stickerWidth = canvasRef.current.width
    const stickerHeight = canvasRef.current.height
    const margin = 20
    const spacing = 10
    
    // Calculate how many stickers fit per row and column on A4
    const stickersPerRow = Math.floor((794 - 2 * margin) / (stickerWidth + spacing)) // A4 width ~794px at 96dpi
    const stickersPerCol = Math.floor((1123 - 2 * margin) / (stickerHeight + spacing)) // A4 height ~1123px at 96dpi
    const stickersPerPage = stickersPerRow * stickersPerCol

    // const totalPages = Math.ceil(quantity / stickersPerPage)
    
    // For simplicity, create a single sheet with as many as fit
    const actualStickers = Math.min(quantity, stickersPerPage)
    const rows = Math.ceil(actualStickers / stickersPerRow)
    
    canvas.width = 794 // A4 width
    canvas.height = Math.min(1123, margin * 2 + rows * (stickerHeight + spacing))
    
    // White background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw stickers
    for (let i = 0; i < actualStickers; i++) {
      const row = Math.floor(i / stickersPerRow)
      const col = i % stickersPerRow
      const x = margin + col * (stickerWidth + spacing)
      const y = margin + row * (stickerHeight + spacing)
      
      ctx.drawImage(canvasRef.current, x, y)
    }

    const link = document.createElement("a")
    link.download = `barcode-stickers-${form.getValues("text")}-${quantity}pcs.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const downloadThermalStickers = () => {
    if (!generatedBarcode) return

    const quantity = parseInt(form.getValues("quantity"))
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx || !canvasRef.current) return

    // TSC TE244 thermal printer specifications for 2-column printing
    // 3 inches = 76.2mm, at 203 DPI (typical thermal printer)
    const thermalWidth = 576 // 3 inches at 203 DPI
    const columnWidth = thermalWidth / 2 // 288 pixels per column (36mm each)
    const columnSpacing = 4 // 4 pixels spacing between columns
    
    // 25x50mm sticker size at 203 DPI
    const stickerHeight = 406 // 50mm at 203 DPI
    const rowSpacing = 4 // 4 pixels spacing between rows
    
    // Calculate layout for 2-column printing
    const stickersPerRow = 2
    const totalRows = Math.ceil(quantity / stickersPerRow)
    
    // Set canvas size for thermal printer - 2-column layout
    // Use higher resolution for better quality
    canvas.width = thermalWidth * 2 // Double resolution
    canvas.height = totalRows * (stickerHeight + rowSpacing) * 2 // Double resolution
    
    // Scale the context for higher resolution
    ctx.scale(2, 2)
    
    // White background (scaled coordinates)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, thermalWidth, totalRows * (stickerHeight + rowSpacing))
    
    // Generate stickers in 2-column layout
    for (let i = 0; i < quantity; i++) {
      const row = Math.floor(i / stickersPerRow)
      const col = i % stickersPerRow
      
      // Calculate position for this sticker
      const x = col * (columnWidth + columnSpacing)
      const y = row * (stickerHeight + rowSpacing)
      
      // Calculate center position for content within this column
      const centerX = x + columnWidth / 2
      
      // Create barcode for this sticker with higher quality
      const barcodeCanvas = document.createElement("canvas")
      // Set higher resolution for better quality
      barcodeCanvas.width = 300 // Smaller width for 2-column layout
      barcodeCanvas.height = 80
      
      JsBarcode(barcodeCanvas, form.getValues("text"), {
        format: form.getValues("format"),
        width: 1.5, // Slightly thinner bars for smaller width
        height: 40, // Shorter barcode for 2-column layout
        displayValue: form.getValues("displayValue"),
        fontSize: parseInt(form.getValues("fontSize")) - 2, // Smaller font for 2-column
        textAlign: form.getValues("textAlign") as "left" | "center" | "right",
        textPosition: form.getValues("textPosition") as "top" | "bottom",
        background: form.getValues("background"),
        lineColor: form.getValues("lineColor"),
        margin: 0
      })
      
      // Center the barcode within the column
      const barcodeX = centerX - barcodeCanvas.width / 2
      const barcodeY = y + 20
      ctx.drawImage(barcodeCanvas, barcodeX, barcodeY)
    }

    const link = document.createElement("a")
    link.download = `thermal-stickers-${form.getValues("text")}-${quantity}pcs-2col.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const copyToClipboard = async () => {
    if (!generatedBarcode) return

    try {
      const response = await fetch(generatedBarcode)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ])
      alert("Barcode copied to clipboard!")
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      alert("Failed to copy barcode to clipboard.")
    }
  }

  const resetForm = () => {
    form.reset()
    setGeneratedBarcode("")
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
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
                  <BreadcrumbPage>Barcode Generator</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Form Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Barcode Generator
                </CardTitle>
                <CardDescription>
                  Generate barcode stickers for saree products. Perfect for inventory tracking and retail scanning.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(generateBarcode)} className="space-y-4">
                    {/* Text/Code */}
                    <FormField
                      control={form.control}
                      name="text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text/Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter text or code to generate barcode"
                              {...field}
                              uppercase={true}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Barcode Format */}
                      <FormField
                        control={form.control}
                        name="format"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barcode Format</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select barcode format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="CODE128">CODE128 (Recommended)</SelectItem>
                                <SelectItem value="CODE39">CODE39</SelectItem>
                                <SelectItem value="EAN13">EAN13 (Retail Standard)</SelectItem>
                                <SelectItem value="EAN8">EAN8</SelectItem>
                                <SelectItem value="UPC">UPC</SelectItem>
                                <SelectItem value="ITF14">ITF14</SelectItem>
                                <SelectItem value="MSI">MSI</SelectItem>
                                <SelectItem value="pharmacode">Pharmacode</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Sticker Size Preset */}
                      <FormField
                        control={form.control}
                        name="stickerSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sticker Size Preset</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value)
                                handleStickerSizeChange(value)
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sticker size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="small">Small (25×15mm)</SelectItem>
                                <SelectItem value="standard">Standard (31×20mm) - Recommended</SelectItem>
                                <SelectItem value="large">Large (37×25mm)</SelectItem>
                                <SelectItem value="extraLarge">Extra Large (45×30mm)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Quantity for Bulk Printing */}
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity (for bulk sticker printing)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="Enter number of stickers needed"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Width */}
                      <FormField
                        control={form.control}
                        name="width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Height */}
                      <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="50"
                                max="200"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Font Size */}
                      <FormField
                        control={form.control}
                        name="fontSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Font Size</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="10"
                                max="50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Text Alignment */}
                      <FormField
                        control={form.control}
                        name="textAlign"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text Alignment</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Text Position */}
                    <FormField
                      control={form.control}
                      name="textPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text Position</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="bottom">Bottom</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Background Color */}
                      <FormField
                        control={form.control}
                        name="background"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Background Color</FormLabel>
                            <FormControl>
                              <Input
                                type="color"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Line Color */}
                      <FormField
                        control={form.control}
                        name="lineColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Line Color</FormLabel>
                            <FormControl>
                              <Input
                                type="color"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Display Value Checkbox */}
                    <FormField
                      control={form.control}
                      name="displayValue"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Display Text Below Barcode</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        Generate Barcode
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Preview Section */}
            <Card>
              <CardHeader>
                <CardTitle>Barcode Preview</CardTitle>
                <CardDescription>
                  Generated barcode will appear here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Canvas for barcode generation */}
                  <div className="flex justify-center items-center min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg">
                    <canvas
                      ref={canvasRef}
                      className={generatedBarcode ? "max-w-full" : "hidden"}
                    />
                    {!generatedBarcode && (
                      <div className="text-center text-muted-foreground">
                        <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Enter text and click &quot;Generate Barcode&quot; to see preview</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {generatedBarcode && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button onClick={downloadBarcode} variant="outline" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Single Sticker
                        </Button>
                        <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy to Clipboard
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={downloadBulkStickers} variant="outline" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          A4 Sheet ({form.watch("quantity")} pcs)
                        </Button>
                        <Button onClick={downloadThermalStickers} className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          TSC TE244 (2-Col)
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Barcode Info */}
                  {generatedBarcode && (
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <h4 className="font-medium mb-2">Sticker Information</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Product Code:</strong> {form.getValues("text")}</p>
                        <p><strong>Format:</strong> {form.getValues("format")}</p>
                        <p><strong>Sticker Size:</strong> {form.getValues("stickerSize")} ({form.getValues("width")}x{form.getValues("height")})</p>
                        <p><strong>Quantity:</strong> {form.getValues("quantity")} stickers</p>
                        <p><strong>Print Ready:</strong> A4 sheet & TSC TE244 thermal printer (2-column)</p>
                      </div>
                      <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                        <p><strong>💡 Tip:</strong> Use "TSC TE244 (2-Col)" button for thermal printer with 2-column layout. Standard size (31×20mm) is perfect for saree tags and meets retail scanning requirements.</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
