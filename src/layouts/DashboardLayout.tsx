import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import TopNav from '@/components/layout/TopNav';
import Sidebar from '@/components/layout/Sidebar';
import { motion } from 'framer-motion';

export default function DashboardLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen m-0 p-0 bg-gradient-to-br from-background via-surface-1 to-surface-2 overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden m-0 p-0">
        <TopNav />
        
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-4 sm:p-6 md:p-8 lg:p-10"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
