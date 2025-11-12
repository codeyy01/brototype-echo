import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

export const TopNav = () => {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 md:hidden sticky top-0 z-40">
      <SidebarTrigger>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SidebarTrigger>
      <h1 className="text-lg font-semibold ml-3">BroBox</h1>
    </header>
  );
};