import { NavLink } from '@/components/NavLink';
import { FileText, Plus, Users, User, LayoutDashboard, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { state } = useSidebar();
  const { role } = useAuth();

  const studentItems = [
    { title: 'My Complaints', url: '/my-complaints', icon: FileText },
    { title: 'New Complaint', url: '/new-complaint', icon: Plus },
    { title: 'Community', url: '/community', icon: Users },
    { title: 'Profile', url: '/profile', icon: User },
  ];

  const adminItems = [
    { title: 'Dashboard', url: '/admin-dashboard', icon: LayoutDashboard },
    { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
    { title: 'Profile', url: '/profile', icon: User },
  ];

  const items = role === 'admin' ? adminItems : studentItems;
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {role === 'admin' ? 'Admin' : 'Student Portal'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}