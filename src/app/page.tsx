'use client';

import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShimmerHeader, 
  ShimmerTable, 
  ShimmerQuickActions, 
  ShimmerGrid 
} from '@/components/ui/shimmer';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle, 
  Truck,
  BarChart3,
  Plus,
  Eye,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  metrics: {
    today: {
      revenue: number;
      orders: number;
      growth: number;
    };
    week: {
      revenue: number;
      orders: number;
      growth: number;
    };
    month: {
      revenue: number;
      orders: number;
    };
    year: {
      revenue: number;
      orders: number;
    };
  };
  inventory: {
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStockItems: Array<{
      id: string;
      name: string;
      category: string;
      quantity: number;
      unitPrice: number;
    }>;
    outOfStockItems: Array<{
      id: string;
      name: string;
      category: string;
      unitPrice: number;
    }>;
  };
  recentActivity: {
    purchases: Array<{
      id: string;
      invoiceNumber: string;
      customerName: string;
      totalAmount: number;
      createdAt: string;
      items: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
    }>;
    transports: Array<{
      id: string;
      invoiceNo: string;
      numberOfBundles: number;
      totalAmount: number;
      createdAt: string;
    }>;
  };
  topSelling: Array<{
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    name: string;
    orders: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
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
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Header Shimmer */}
            <div className="flex justify-between items-center">
              <ShimmerHeader />
              <div className="flex items-center space-x-2">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Metrics Grid Shimmer */}
            <ShimmerGrid columns={4} rows={1} />

            {/* Quick Actions Shimmer */}
            <ShimmerQuickActions />

            {/* Content Grid Shimmer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-lg border p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <ShimmerTable rows={5} />
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="rounded-lg border p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <ShimmerTable rows={5} />
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
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
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!data) return null;

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
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Overview</h1>
              <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your business.</p>
              </div>
            <div className="flex items-center space-x-2">
              <Button onClick={fetchDashboardData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button asChild>
                <Link href="/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
            </div>
          </div>

          {/* Inventory Alerts */}
          {(data.inventory.lowStockCount > 0 || data.inventory.outOfStockCount > 0) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Inventory Alert:</strong> {data.inventory.outOfStockCount} items out of stock, 
                {data.inventory.lowStockCount} items running low.
                <Button asChild variant="link" className="ml-2 p-0 h-auto">
                  <Link href="/warehouse/stock-management">Manage Stock</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.metrics.today.revenue)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {data.metrics.today.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  )}
                  <span className={data.metrics.today.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(data.metrics.today.growth).toFixed(1)}% from yesterday
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.metrics.today.orders} orders today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.metrics.week.revenue)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {data.metrics.week.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  )}
                  <span className={data.metrics.week.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(data.metrics.week.growth).toFixed(1)}% from last week
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.metrics.week.orders} orders this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.metrics.month.revenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {data.metrics.month.orders} orders this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Status</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.inventory.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  {data.inventory.lowStockCount} low stock, {data.inventory.outOfStockCount} out of stock
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild className="h-20 flex-col">
              <Link href="/pos">
                <ShoppingCart className="h-6 w-6 mb-2" />
                <span>New Sale</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/warehouse/add-stock">
                <Plus className="h-6 w-6 mb-2" />
                <span>Add Stock</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/transport/new">
                <Truck className="h-6 w-6 mb-2" />
                <span>Transport Entry</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/analytics">
                <Eye className="h-6 w-6 mb-2" />
                <span>View Analytics</span>
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Latest customer purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentActivity.purchases.slice(0, 5).map((purchase) => (
                    <div key={purchase.id} className="flex justify-between items-start p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">#{purchase.invoiceNumber}</div>
                        <div className="text-sm text-muted-foreground">{purchase.customerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {purchase.items.length} item{purchase.items.length !== 1 ? 's' : ''}
              </div>
            </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(purchase.totalAmount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(purchase.createdAt)}
              </div>
            </div>
          </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/billing/transaction-history">View All Transactions</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Top Selling Items */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
                <CardDescription>Best performing products this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topSelling.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.quantity} sold</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(item.revenue)}
                        </div>
              </div>
            </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/warehouse/stock-management">Manage Inventory</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Alerts */}
          {(data.inventory.lowStockItems.length > 0 || data.inventory.outOfStockItems.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  Inventory Alerts
                </CardTitle>
                <CardDescription>Items that need attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.inventory.outOfStockItems.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Out of Stock</h4>
                      <div className="space-y-2">
                        {data.inventory.outOfStockItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-red-50 border border-red-200 rounded">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">{item.category}</div>
                            </div>
                            <Badge variant="destructive">Out of Stock</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {data.inventory.lowStockItems.length > 0 && (
                    <div>
                      <h4 className="font-medium text-orange-600 mb-2">Low Stock</h4>
                      <div className="space-y-2">
                        {data.inventory.lowStockItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-orange-50 border border-orange-200 rounded">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">{item.category}</div>
                            </div>
                            <Badge variant="outline" className="text-orange-600">
                              {item.quantity} left
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}