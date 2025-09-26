// Backend Print Logger
// Comprehensive logging and error handling for backend barcode printing

export interface PrintLogEntry {
  id: string
  timestamp: string
  type: 'print_request' | 'print_success' | 'print_error' | 'connection_test' | 'printer_status'
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  details?: Record<string, unknown>
  userId?: string
  sessionId?: string
}

export interface PrintMetrics {
  totalRequests: number
  successfulPrints: number
  failedPrints: number
  averageResponseTime: number
  lastPrintTime?: string
  printerStatus: 'connected' | 'disconnected' | 'unknown'
}

export class BackendPrintLogger {
  private logs: PrintLogEntry[] = []
  private maxLogs = 1000 // Keep last 1000 log entries
  private metrics: PrintMetrics = {
    totalRequests: 0,
    successfulPrints: 0,
    failedPrints: 0,
    averageResponseTime: 0,
    printerStatus: 'unknown'
  }

  /**
   * Log a print request
   */
  logPrintRequest(
    type: string, 
    quantity: number, 
    details?: Record<string, unknown>, 
    userId?: string, 
    sessionId?: string
  ): string {
    const logId = this.generateLogId()
    const logEntry: PrintLogEntry = {
      id: logId,
      timestamp: new Date().toISOString(),
      type: 'print_request',
      level: 'info',
      message: `Print request: ${type} x${quantity}`,
      details: {
        type,
        quantity,
        ...details
      },
      userId,
      sessionId
    }

    this.addLog(logEntry)
    this.metrics.totalRequests++
    
    console.log(`[Backend Print Logger] ${logEntry.message}`, logEntry.details)
    return logId
  }

  /**
   * Log a successful print
   */
  logPrintSuccess(
    logId: string, 
    responseTime: number, 
    details?: Record<string, unknown>
  ): void {
    const logEntry: PrintLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      type: 'print_success',
      level: 'info',
      message: `Print successful: ${details?.printedQuantity || 'unknown'} stickers`,
      details: {
        originalLogId: logId,
        responseTime,
        ...details
      }
    }

    this.addLog(logEntry)
    this.metrics.successfulPrints++
    this.metrics.lastPrintTime = logEntry.timestamp
    this.updateAverageResponseTime(responseTime)
    
    console.log(`[Backend Print Logger] ${logEntry.message}`, logEntry.details)
  }

  /**
   * Log a print error
   */
  logPrintError(
    logId: string, 
    error: Error | string, 
    details?: Record<string, unknown>
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const logEntry: PrintLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      type: 'print_error',
      level: 'error',
      message: `Print failed: ${errorMessage}`,
      details: {
        originalLogId: logId,
        error: error instanceof Error ? error.stack : error,
        ...details
      }
    }

    this.addLog(logEntry)
    this.metrics.failedPrints++
    
    console.error(`[Backend Print Logger] ${logEntry.message}`, logEntry.details)
  }

  /**
   * Log printer connection test
   */
  logConnectionTest(
    success: boolean, 
    message: string, 
    details?: Record<string, unknown>
  ): void {
    const logEntry: PrintLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      type: 'connection_test',
      level: success ? 'info' : 'warn',
      message: `Printer connection test: ${success ? 'success' : 'failed'}`,
      details: {
        success,
        message,
        ...details
      }
    }

    this.addLog(logEntry)
    this.metrics.printerStatus = success ? 'connected' : 'disconnected'
    
    if (success) {
      console.log(`[Backend Print Logger] ${logEntry.message}`, logEntry.details)
    } else {
      console.warn(`[Backend Print Logger] ${logEntry.message}`, logEntry.details)
    }
  }

  /**
   * Log printer status
   */
  logPrinterStatus(
    status: Record<string, unknown>, 
    details?: Record<string, unknown>
  ): void {
    const logEntry: PrintLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      type: 'printer_status',
      level: 'info',
      message: `Printer status: ${status.initialized ? 'initialized' : 'not initialized'}`,
      details: {
        status,
        ...details
      }
    }

    this.addLog(logEntry)
    
    console.log(`[Backend Print Logger] ${logEntry.message}`, logEntry.details)
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 50): PrintLogEntry[] {
    return this.logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Get logs by type
   */
  getLogsByType(type: PrintLogEntry['type'], limit: number = 50): PrintLogEntry[] {
    return this.logs
      .filter(log => log.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Get error logs
   */
  getErrorLogs(limit: number = 50): PrintLogEntry[] {
    return this.logs
      .filter(log => log.level === 'error')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Get current metrics
   */
  getMetrics(): PrintMetrics {
    return { ...this.metrics }
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 0
    return (this.metrics.successfulPrints / this.metrics.totalRequests) * 100
  }

  /**
   * Clear old logs
   */
  clearOldLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, this.maxLogs)
    }
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      metrics: this.metrics,
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  /**
   * Private methods
   */
  private addLog(logEntry: PrintLogEntry): void {
    this.logs.push(logEntry)
    this.clearOldLogs()
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalTime = this.metrics.averageResponseTime * (this.metrics.successfulPrints - 1) + responseTime
    this.metrics.averageResponseTime = totalTime / this.metrics.successfulPrints
  }
}

// Export singleton instance
export const backendPrintLogger = new BackendPrintLogger()
