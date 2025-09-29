'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SimpleChart } from '@/components/ui/simple-chart';
import { 
  ShimmerHeader, 
  ShimmerTabs,
  ShimmerGrid,
  ShimmerAlert 
} from '@/components/ui/shimmer';
import { TrendingUp, DollarSign, ShoppingCart, AlertTriangle, Users } from 'lucide-react';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';

interface AnalyticsData {
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  sales: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    paymentMethods: Record<string, number>;
    dailySales: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
  };
  inventory: {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    lowStockList: Array<{
      id: string;
      itemName: string;
      category: string;
      quantity: number;
      unitPrice: number;
    }>;
    outOfStockList: Array<{
      id: string;
      itemName: string;
      category: string;
      unitPrice: number;
    }>;
  };
  performance: {
    categoryPerformance: Array<{
      category: string;
      revenue: number;
      quantity: number;
      orders: number;
    }>;
    topSellingItems: Array<{
      name: string;
      revenue: number;
      quantity: number;
      stock: {
        id: string;
        itemName: string;
        category: string;
        supplier: string;
        color?: string | null;
      };
    }>;
  };
  profit: {
    totalProfit: number;
    totalRevenue: number;
    totalCost: number;
    profitMargin: number;
  };
  customers: {
    totalCustomers: number;
    topCustomers: Array<{
      name: string;
      orders: number;
      totalSpent: number;
      lastOrder: string;
    }>;
  };
  transport: {
    totalCost: number;
    averageCost: number;
    totalBundles: number;
    totalInvoices: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = async (selectedPeriod: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const analyticsData = await response.json();
      setData(analyticsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
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
                    <BreadcrumbPage>Analytics</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Header Shimmer */}
            <div className="flex justify-between items-center">
              <ShimmerHeader />
              <div className="flex items-center space-x-4">
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Metrics Grid Shimmer */}
            <ShimmerGrid columns={4} rows={1} />

            {/* Alert Shimmer */}
            <ShimmerAlert />

            {/* Tabs Shimmer */}
            <ShimmerTabs />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
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
                  <BreadcrumbPage>Analytics</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Insights for {data.period.days} days ({formatDate(data.period.startDate)} - {formatDate(data.period.endDate)})
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => fetchAnalytics(period)} variant="outline">
                Refresh
              </Button>
            </div>
          </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.sales.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {data.sales.totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.sales.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.profit.profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(data.profit.totalProfit)} profit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.customers.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Active customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Alerts */}
      {(data.inventory.lowStockItems > 0 || data.inventory.outOfStockItems > 0) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Inventory Alert:</strong> {data.inventory.outOfStockItems} items out of stock, 
            {data.inventory.lowStockItems} items running low.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Performance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="profit">Profit Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleChart
              title="Payment Methods"
              description="Revenue breakdown by payment method"
              data={Object.entries(data.sales.paymentMethods).map(([method, amount]) => ({
                label: method.charAt(0).toUpperCase() + method.slice(1),
                value: amount,
              }))}
              type="pie"
            />

            <SimpleChart
              title="Category Performance"
              description="Top performing categories by revenue"
              data={data.performance.categoryPerformance
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((category) => ({
                  label: category.category,
                  value: category.revenue,
                }))}
              type="bar"
            />
          </div>

          <SimpleChart
            title="Daily Sales Trend"
            description="Revenue over the last 7 days"
            data={data.sales.dailySales.slice(-7).map((day) => ({
              label: new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' }),
              value: day.revenue,
            }))}
            type="line"
          />
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
              <CardDescription>Best performing products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.performance.topSellingItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.stock.category} • {item.stock.supplier}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.revenue)}</div>
                      <div className="text-sm text-muted-foreground">{item.quantity} units sold</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Summary</CardTitle>
                <CardDescription>Current stock status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Items</span>
                    <Badge variant="outline">{data.inventory.totalItems}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value</span>
                    <Badge variant="outline">{formatCurrency(data.inventory.totalValue)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Stock Items</span>
                    <Badge variant="destructive">{data.inventory.lowStockItems}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Out of Stock</span>
                    <Badge variant="destructive">{data.inventory.outOfStockItems}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription>Items that need restocking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.inventory.lowStockList.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-sm text-muted-foreground">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">{item.quantity} left</Badge>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(item.unitPrice)} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {data.inventory.outOfStockList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Out of Stock Items</CardTitle>
                <CardDescription>Items that need immediate restocking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.inventory.outOfStockList.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 border rounded bg-red-50">
                      <div>
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-sm text-muted-foreground">{item.category}</div>
                      </div>
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Your most valuable customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.customers.topCustomers.map((customer, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Last order: {formatDate(customer.lastOrder)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(customer.totalSpent)}</div>
                      <div className="text-sm text-muted-foreground">{customer.orders} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Profit</CardTitle>
                <CardDescription>Net profit earned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(data.profit.totalProfit)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
                <CardDescription>Gross revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(data.profit.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Cost</CardTitle>
                <CardDescription>Cost of goods sold</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(data.profit.totalCost)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transport Costs</CardTitle>
              <CardDescription>Logistics and freight expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(data.transport.totalCost)}</div>
                  <div className="text-sm text-muted-foreground">Total Transport Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(data.transport.averageCost)}</div>
                  <div className="text-sm text-muted-foreground">Average Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.transport.totalBundles}</div>
                  <div className="text-sm text-muted-foreground">Total Bundles</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
