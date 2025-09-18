import { prisma } from './prisma'

/**
 * Test database connection
 * This function can be used to verify that Prisma can connect to NeonDB
 */
export async function testDatabaseConnection() {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful!')
    return { success: true, message: 'Database connected successfully' }
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return { 
      success: false, 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get database info
 */
export async function getDatabaseInfo() {
  try {
    const result = await prisma.$queryRaw`SELECT version()` as Array<{ version: string }>
    return {
      success: true,
      version: result[0]?.version || 'Unknown',
      provider: 'PostgreSQL (NeonDB)'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
