import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center justify-center p-2">
          <span className="text-sm text-black font-semi-bold">developed by guruf</span>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
