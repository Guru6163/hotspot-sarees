import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center justify-center p-2">
          <span className="text-xs text-muted-foreground">developed by guruf</span>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
