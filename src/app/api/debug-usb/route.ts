import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('=== USB Debug API Called ===')
    
    // Check if node-hid is available (primary method)
    let hidAvailable = false
    let hidError = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('node-hid')
      hidAvailable = true
      console.log('node-hid module loaded successfully (primary)')
    } catch (error) {
      hidError = error
      console.error('node-hid module failed to load:', error)
    }

    // Check if USB module is available (fallback)
    let usbAvailable = false
    let usbError = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('usb')
      usbAvailable = true
      console.log('USB module loaded successfully (fallback)')
    } catch (error) {
      usbError = error
      console.error('USB module failed to load:', error)
    }

    // Try to get devices if HID is available (primary method)
    let hidDevices = []
    let hidDeviceCount = 0
    if (hidAvailable) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const hid = require('node-hid')
        const devices = hid.devices()
        hidDeviceCount = devices.length
        hidDevices = devices.map((device: { vendorId: number; productId: number; manufacturer?: string; product?: string; path?: string }, index: number) => ({
          index,
          vendorId: device.vendorId,
          productId: device.productId,
          vendorIdHex: '0x' + device.vendorId.toString(16).padStart(4, '0'),
          productIdHex: '0x' + device.productId.toString(16).padStart(4, '0'),
          manufacturer: device.manufacturer,
          product: device.product,
          path: device.path
        }))
        console.log(`Found ${hidDeviceCount} HID devices`)
      } catch (error) {
        console.error('Error getting HID devices:', error)
      }
    }

    // Try to get devices if USB is available (fallback)
    let usbDevices = []
    let usbDeviceCount = 0
    if (usbAvailable) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const usb = require('usb')
        const devices = usb.getDeviceList()
        usbDeviceCount = devices.length
        usbDevices = devices.map((device: { deviceDescriptor: { idVendor: number; idProduct: number; iManufacturer: number; iProduct: number } }, index: number) => ({
          index,
          vendorId: device.deviceDescriptor.idVendor,
          productId: device.deviceDescriptor.idProduct,
          vendorIdHex: '0x' + device.deviceDescriptor.idVendor.toString(16).padStart(4, '0'),
          productIdHex: '0x' + device.deviceDescriptor.idProduct.toString(16).padStart(4, '0'),
          manufacturer: device.deviceDescriptor.iManufacturer,
          product: device.deviceDescriptor.iProduct
        }))
        console.log(`Found ${usbDeviceCount} USB devices`)
      } catch (error) {
        console.error('Error getting USB devices:', error)
      }
    }

    return NextResponse.json({
      success: true,
      platform: process.platform,
      nodeVersion: process.version,
      modules: {
        hid: {
          available: hidAvailable,
          error: hidError instanceof Error ? hidError.message : null,
          deviceCount: hidDeviceCount,
          devices: hidDevices,
          priority: 'primary'
        },
        usb: {
          available: usbAvailable,
          error: usbError instanceof Error ? usbError.message : null,
          deviceCount: usbDeviceCount,
          devices: usbDevices,
          priority: 'fallback'
        }
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Debug USB API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `Debug error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}
