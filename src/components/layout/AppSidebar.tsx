import { NavLink } from '@/components/NavLink';
import { FileText, Plus, Users, User, LayoutDashboard, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

  const studentNavItems = [
    { title: 'My Complaints', url: '/my-complaints', icon: FileText },
    { title: 'Community', url: '/community', icon: Users },
    { title: 'Profile', url: '/profile', icon: User },
  ];

  const adminNavItems = [
    { title: 'Dashboard', url: '/admin-dashboard', icon: LayoutDashboard },
    { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
    { title: 'Profile', url: '/profile', icon: User },
  ];

  const navItems = role === 'admin' ? adminNavItems : studentNavItems;
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Primary CTA for Students */}
        {role === 'student' && !isCollapsed && (
          <div className="px-4 pt-4 pb-2">
            <Button asChild className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all">
              <Link to="/new-complaint" className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                <span>New Complaint</span>
              </Link>
            </Button>
          </div>
        )}

        <SidebarGroup className={role === 'student' && !isCollapsed ? 'mt-6' : ''}>
          <SidebarGroupLabel>
            {role === 'admin' ? 'Admin' : 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 rounded-lg transition-colors hover:bg-slate-50 hover:text-slate-900"
                      activeClassName="bg-sky-50 text-sky-700 font-semibold"
                    >
                      <item.icon className="w-5 h-5" />
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