"use client"

import * as React from "react"
import {
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  Globe,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  Warehouse,
  Truck,
  QrCode,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Sample data for Hotspot Sarees
const data = {
  teams: [
    {
      name: "Hotspot Sarees",
      logo: Globe,
      plan: "Premium",
    },
    {
      name: "Retail Store",
      logo: ShoppingBag,
      plan: "Standard",
    },
    {
      name: "Online Store",
      logo: Package,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: BarChart3,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "#",
        },
        {
          title: "Quick Stats",
          url: "#",
        },
        {
          title: "Recent Activity",
          url: "#",
        },
      ],
    },
    {
      title: "Billing",
      url: "#",
      icon: CreditCard,
      items: [
        {
          title: "Invoices",
          url: "#",
        },
        {
          title: "Payment History",
          url: "#",
        },
        {
          title: "Outstanding Bills",
          url: "#",
        },
        {
          title: "Create Invoice",
          url: "#",
        },
        {
          title: "Payment Methods",
          url: "#",
        },
      ],
    },
    {
      title: "Warehouse Management",
      url: "/warehouse/stock-management",
      icon: Warehouse,
      items: [
        {
          title: "Add Stock",
          url: "/warehouse/add-stock",
        },
        {
          title: "Stock Management",
          url: "/warehouse/stock-management",
        },
      ],
    },

    {
      title: "Transport Management",
      url: "/transport/new",
      icon: Truck,
      items: [
        {
          title: "Add New Entry",
          url: "/transport/new",
        },
        {
          title: "Transport History",
          url: "/transport/history",
        },
      ],
    },
    {
      title: "Barcode",
      url: "/barcode/generate",
      icon: QrCode,
      items: [
        {
          title: "Generate Barcode",
          url: "/barcode/generate",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
