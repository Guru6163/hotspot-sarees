import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Today's metrics
    const todaySales = await prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
      include: {
        items: {
          include: {
            stock: true,
          },
        },
      },
    });

    // This week's metrics
    const weekSales = await prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: startOfWeek,
        },
      },
    });

    // This month's metrics
    const monthSales = await prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // This year's metrics
    const yearSales = await prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
        },
      },
    });

    // Recent purchases (last 10)
    const recentPurchases = await prisma.purchase.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: {
          include: {
            stock: true,
          },
        },
      },
    });

    // Stock alerts
    const lowStockItems = await prisma.stock.findMany({
      where: {
        quantity: {
          lte: 10,
        },
      },
      orderBy: {
        quantity: 'asc',
      },
      take: 5,
    });

    const outOfStockItems = await prisma.stock.findMany({
      where: {
        quantity: 0,
      },
      take: 5,
    });

    // Top selling items (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const topSellingItems = await prisma.purchaseItem.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        stock: true,
      },
    });

    // Calculate top selling items
    const itemSales = topSellingItems.reduce((acc, item) => {
      const key = item.stock.itemName;
      if (!acc[key]) {
        acc[key] = {
          name: item.stock.itemName,
          category: item.stock.category,
          quantity: 0,
          revenue: 0,
          stock: item.stock,
        };
      }
      acc[key].quantity += item.quantity;
      acc[key].revenue += item.totalPrice;
      return acc;
    }, {} as Record<string, { name: string; category: string; quantity: number; revenue: number; stock: { id: string; itemName: string; category: string; supplier: string; color?: string | null } }>);

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Calculate metrics
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const todayOrders = todaySales.length;
    const weekRevenue = weekSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const weekOrders = weekSales.length;
    const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const monthOrders = monthSales.length;
    const yearRevenue = yearSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const yearOrders = yearSales.length;

    // Calculate growth rates
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdaySales = await prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
          lt: startOfToday,
        },
      },
    });
    const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const revenueGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    // Last week for comparison
    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(startOfWeek.getDate() - 7);
    const lastWeekEnd = new Date(startOfWeek);
    const lastWeekSales = await prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: lastWeekStart,
          lt: lastWeekEnd,
        },
      },
    });
    const lastWeekRevenue = lastWeekSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const weekGrowth = lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

    // Inventory summary
    const totalStockItems = await prisma.stock.count();

    // Recent transport entries
    const recentTransports = await prisma.transport.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Customer insights
    const uniqueCustomers = await prisma.purchase.groupBy({
      by: ['customerName'],
      _count: {
        customerName: true,
      },
      orderBy: {
        _count: {
          customerName: 'desc',
        },
      },
      take: 5,
    });

    return NextResponse.json({
      metrics: {
        today: {
          revenue: todayRevenue,
          orders: todayOrders,
          growth: revenueGrowth,
        },
        week: {
          revenue: weekRevenue,
          orders: weekOrders,
          growth: weekGrowth,
        },
        month: {
          revenue: monthRevenue,
          orders: monthOrders,
        },
        year: {
          revenue: yearRevenue,
          orders: yearOrders,
        },
      },
      inventory: {
        totalItems: totalStockItems,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        lowStockItems: lowStockItems.map(item => ({
          id: item.id,
          name: item.itemName,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        outOfStockItems: outOfStockItems.map(item => ({
          id: item.id,
          name: item.itemName,
          category: item.category,
          unitPrice: item.unitPrice,
        })),
      },
      recentActivity: {
        purchases: recentPurchases.map(purchase => ({
          id: purchase.id,
          invoiceNumber: purchase.invoiceNumber,
          customerName: purchase.customerName,
          totalAmount: purchase.totalAmount,
          createdAt: purchase.createdAt,
          items: purchase.items.map(item => ({
            name: item.stock.itemName,
            quantity: item.quantity,
            price: item.unitPrice,
          })),
        })),
        transports: recentTransports.map(transport => ({
          id: transport.id,
          invoiceNo: transport.invoiceNo,
          numberOfBundles: transport.numberOfBundles,
          totalAmount: transport.totalAmount,
          createdAt: transport.createdAt,
        })),
      },
      topSelling: topItems,
      topCustomers: uniqueCustomers.map(customer => ({
        name: customer.customerName,
        orders: customer._count.customerName,
      })),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
