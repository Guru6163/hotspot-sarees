import { NextRequest, NextResponse } from 'next/server'
import { backendTSCPrinter } from '@/lib/backend-tsc-printer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'logs'
    
    switch (action) {
      case 'logs':
        // Get print logs and metrics
        const logs = backendTSCPrinter.getPrintLogs()
        return NextResponse.json({
          success: true,
          data: logs,
          message: 'Print logs retrieved successfully'
        })
        
      case 'export':
        // Export logs for debugging
        const exportedLogs = backendTSCPrinter.exportPrintLogs()
        return NextResponse.json({
          success: true,
          data: exportedLogs,
          message: 'Print logs exported successfully'
        })
        
      case 'metrics':
        // Get only metrics
        const metrics = backendTSCPrinter.getPrintLogs()
        return NextResponse.json({
          success: true,
          data: {
            metrics: metrics.metrics,
            successRate: metrics.successRate
          },
          message: 'Print metrics retrieved successfully'
        })
        
      default:
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid action. Use "logs", "export", or "metrics"' 
          },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Print Logs API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}
