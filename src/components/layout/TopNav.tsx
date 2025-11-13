import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

export default function TopNav() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.first_name?.[0] || user.username?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full m-0 border-b border-border/50 bg-surface-1/95 backdrop-blur-md shadow-soft"
    >
      <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-5 md:px-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-xl sm:rounded-2xl flex items-center justify-center"
            >
              <img 
                src="/assets/logo.png" 
                alt="UniPay Logo" 
                className="h-full w-full object-contain"
              />
            </motion.div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              UniPay
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <Link to="/notifications">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl hover:bg-primary-light/30 transition-all duration-200 shadow-soft-xs hover:shadow-soft tap-target"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-primary transition-colors" />
            </motion.button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-1.5 sm:gap-2.5 rounded-xl sm:rounded-2xl hover:bg-primary-light/20 pr-2 sm:pr-3 pl-1 sm:pl-1.5 py-1 sm:py-1.5 transition-all duration-200 shadow-soft-xs hover:shadow-soft tap-target"
              >
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-primary/30 shadow-soft">
                  {user?.profile_photo_url && (
                    <AvatarImage 
                      src={`${user.profile_photo_url}?t=${Date.now()}`}
                      alt={`${user.first_name} ${user.last_name}`}
                    />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs sm:text-sm font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground hidden xs:block" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-surface-1 border-border/50 shadow-soft-lg">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer hover:bg-primary-light/20 transition-colors">
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-danger-hover hover:bg-danger-light/30 focus:bg-danger-light/30 transition-colors">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
