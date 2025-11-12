import { NavLink } from '@/components/NavLink';
import { FileText, Plus, Users, User } from 'lucide-react';

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        <NavLink
          to="/my-complaints"
          end
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary font-semibold"
        >
          <FileText className="h-5 w-5 mb-1" />
          <span className="text-xs">My Complaints</span>
        </NavLink>
        
        <NavLink
          to="/new-complaint"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary font-semibold"
        >
          <Plus className="h-5 w-5 mb-1" />
          <span className="text-xs">New</span>
        </NavLink>
        
        <NavLink
          to="/community"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary font-semibold"
        >
          <Users className="h-5 w-5 mb-1" />
          <span className="text-xs">Community</span>
        </NavLink>
        
        <NavLink
          to="/profile"
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-primary transition-colors"
          activeClassName="text-primary font-semibold"
        >
          <User className="h-5 w-5 mb-1" />
          <span className="text-xs">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};