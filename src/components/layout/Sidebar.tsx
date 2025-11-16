import { Link, useLocation } from 'react-router-dom';
import { Home, CreditCard, PiggyBank, Store, Users, User, ArrowLeftRight, Plus, Receipt, ShieldCheck, Percent, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebarStore';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/topup', icon: Plus, label: 'Top Up' },
  { path: '/transfers', icon: ArrowLeftRight, label: 'Transfers' },
  { path: '/budget-cards', icon: CreditCard, label: 'Budget Cards' },
  { path: '/transactions', icon: Receipt, label: 'Activity' },
  { path: '/savings', icon: PiggyBank, label: 'Savings & Goals' },
  { path: '/darkdays-pocket', icon: ShieldCheck, label: 'DarkDays Pocket' },
  { path: '/isic', icon: Percent, label: 'ISIC Discounts' },
  { path: '/marketplace', icon: Store, label: 'Marketplace' },
  { path: '/loans', icon: Users, label: 'Loans' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebarStore();

  // Responsive sidebar widths: smaller on mobile, standard on desktop
  const sidebarVariants = {
    expanded: { 
      width: 'clamp(12rem, 60vw, 16rem)' // Mobile: min 12rem, max 60vw; Desktop: 16rem
    },
    collapsed: { 
      width: 'clamp(3.5rem, 15vw, 5rem)' // Mobile: min 3.5rem, max 15vw; Desktop: 5rem
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col m-0 p-0 border-r border-border/50 bg-surface-1/80 backdrop-blur-sm relative shadow-soft z-40"
    >
        <div className="flex items-center justify-center border-b border-border/50 p-2.5 xs:p-3 sm:p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-11 w-11 rounded-xl hover:bg-primary-light/30 transition-all duration-200 flex-shrink-0"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-primary" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-primary" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 xs:space-y-1.5 p-2 xs:p-3 sm:p-4 overflow-y-auto overflow-x-hidden">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              
              const navItemContent = (
                <Link key={item.path} to={item.path} className="block">
                  <motion.div
                    whileHover={{ x: isCollapsed ? 0 : 4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'flex items-center min-h-[44px] gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg sm:rounded-xl transition-all duration-200',
                      isCollapsed ? 'justify-center' : '',
                      isActive
                        ? 'bg-gradient-to-r from-primary-light/40 to-secondary-light/40 text-primary shadow-soft backdrop-blur-sm font-semibold'
                        : 'text-muted-foreground hover:bg-surface-2/60 hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
                    {!isCollapsed && (
                      <span className="whitespace-nowrap overflow-hidden text-sm">
                        {item.label}
                      </span>
                    )}
                  </motion.div>
                </Link>
              );

              return isCollapsed ? (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    {navItemContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium bg-surface-1 border-border/50 shadow-soft">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : navItemContent;
            })}
          </TooltipProvider>
        </nav>
      </motion.aside>
  );
}
