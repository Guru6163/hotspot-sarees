import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Sales Analytics
    const salesData = await prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            stock: true,
          },
        },
        payments: true,
      },
    });

    // Stock Analytics
    const stockData = await prisma.stock.findMany({
      include: {
        purchaseItems: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    // Transport Analytics
    const transportData = await prisma.transport.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate metrics
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalOrders = salesData.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Payment method breakdown
    const paymentMethods = salesData.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Category performance
    const categoryPerformance = salesData.reduce((acc, sale) => {
      sale.items.forEach(item => {
        const category = item.stock.category;
        if (!acc[category]) {
          acc[category] = { revenue: 0, quantity: 0, orders: 0 };
        }
        acc[category].revenue += item.totalPrice;
        acc[category].quantity += item.quantity;
        acc[category].orders += 1;
      });
      return acc;
    }, {} as Record<string, { revenue: number; quantity: number; orders: number }>);

    // Top selling items
    const topSellingItems = salesData.reduce((acc, sale) => {
      sale.items.forEach(item => {
        const key = `${item.stock.itemName} (${item.stock.color || 'N/A'})`;
        if (!acc[key]) {
          acc[key] = { revenue: 0, quantity: 0, stock: item.stock };
        }
        acc[key].revenue += item.totalPrice;
        acc[key].quantity += item.quantity;
      });
      return acc;
    }, {} as Record<string, { revenue: number; quantity: number; stock: { id: string; itemName: string; category: string; supplier: string; color?: string | null } }>);

    // Daily sales trend
    const dailySales = salesData.reduce((acc, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { revenue: 0, orders: 0 };
      }
      acc[date].revenue += sale.totalAmount;
      acc[date].orders += 1;
      return acc;
    }, {} as Record<string, { revenue: number; orders: number }>);

    // Inventory insights
    const lowStockItems = stockData.filter(stock => stock.quantity < 10);
    const outOfStockItems = stockData.filter(stock => stock.quantity === 0);
    const totalInventoryValue = stockData.reduce((sum, stock) => sum + (stock.quantity * stock.unitPrice), 0);

    // Profit analysis
    const profitAnalysis = stockData.reduce((acc, stock) => {
      const totalSold = stock.purchaseItems.reduce((sum, item) => sum + item.quantity, 0);
      const revenue = stock.purchaseItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const cost = totalSold * stock.unitPrice;
      const profit = revenue - cost;
      
      acc.totalProfit += profit;
      acc.totalRevenue += revenue;
      acc.totalCost += cost;
      
      return acc;
    }, { totalProfit: 0, totalRevenue: 0, totalCost: 0 });

    const profitMargin = profitAnalysis.totalRevenue > 0 
      ? (profitAnalysis.totalProfit / profitAnalysis.totalRevenue) * 100 
      : 0;

    // Customer analytics
    const customerData = salesData.reduce((acc, sale) => {
      const customer = sale.customerName;
      if (!acc[customer]) {
        acc[customer] = { orders: 0, totalSpent: 0, lastOrder: sale.createdAt };
      }
      acc[customer].orders += 1;
      acc[customer].totalSpent += sale.totalAmount;
      if (sale.createdAt > acc[customer].lastOrder) {
        acc[customer].lastOrder = sale.createdAt;
      }
      return acc;
    }, {} as Record<string, { orders: number; totalSpent: number; lastOrder: Date }>);

    const topCustomers = Object.entries(customerData)
      .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Transport costs
    const totalTransportCost = transportData.reduce((sum, transport) => sum + transport.totalAmount, 0);
    const averageTransportCost = transportData.length > 0 ? totalTransportCost / transportData.length : 0;

    return NextResponse.json({
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: parseInt(period),
      },
      sales: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        paymentMethods,
        dailySales: Object.entries(dailySales).map(([date, data]) => ({
          date,
          revenue: data.revenue,
          orders: data.orders,
        })),
      },
      inventory: {
        totalItems: stockData.length,
        totalValue: totalInventoryValue,
        lowStockItems: lowStockItems.length,
        outOfStockItems: outOfStockItems.length,
        lowStockList: lowStockItems.map(item => ({
          id: item.id,
          itemName: item.itemName,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        outOfStockList: outOfStockItems.map(item => ({
          id: item.id,
          itemName: item.itemName,
          category: item.category,
          unitPrice: item.unitPrice,
        })),
      },
      performance: {
        categoryPerformance: Object.entries(categoryPerformance).map(([category, data]) => ({
          category,
          revenue: data.revenue,
          quantity: data.quantity,
          orders: data.orders,
        })),
        topSellingItems: Object.entries(topSellingItems)
          .sort(([,a], [,b]) => b.revenue - a.revenue)
          .slice(0, 10)
          .map(([name, data]) => ({
            name,
            revenue: data.revenue,
            quantity: data.quantity,
            stock: data.stock,
          })),
      },
      profit: {
        totalProfit: profitAnalysis.totalProfit,
        totalRevenue: profitAnalysis.totalRevenue,
        totalCost: profitAnalysis.totalCost,
        profitMargin,
      },
      customers: {
        totalCustomers: Object.keys(customerData).length,
        topCustomers: topCustomers.map(([name, data]) => ({
          name,
          orders: data.orders,
          totalSpent: data.totalSpent,
          lastOrder: data.lastOrder,
        })),
      },
      transport: {
        totalCost: totalTransportCost,
        averageCost: averageTransportCost,
        totalBundles: transportData.reduce((sum, transport) => sum + transport.numberOfBundles, 0),
        totalInvoices: transportData.length,
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
