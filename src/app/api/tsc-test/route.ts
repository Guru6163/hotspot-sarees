import { NextResponse } from 'next/server'
import { serverTSCPrinter } from '@/lib/server-tsc-printer'

export async function GET() {
  try {
    // Test printer connection
    const result = await serverTSCPrinter.testConnection()
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    })
    
  } catch (error) {
    console.error('TSC Test API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}
