import React from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLogin } from '../../pages/admin/AdminLogin';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { isAdmin, adminUser, loading, firebaseUser } = useAdminAuth();

  // 1. Loading State Handling
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#111111] flex flex-col items-center justify-center p-6 text-white">
        <div className="flex flex-col items-center gap-4 p-8 bg-neutral-900 border border-[#D4AF37]/30 rounded shadow-2xl max-w-sm text-center">
          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          <div>
            <h3 className="font-serif text-lg text-[#FDFBF7] tracking-wide">
              Verifying Atelier Credentials
            </h3>
            <p className="text-xs text-neutral-400 mt-1 font-mono">
              Securing session with Firebase Authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Logged in to Firebase but NOT an admin (e.g., normal customer account)
  if (firebaseUser && (!isAdmin || !adminUser || adminUser.role !== 'admin')) {
    return (
      <div className="w-full min-h-screen bg-[#111111] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900 border border-rose-800/80 rounded p-8 text-center text-white shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-950 border border-rose-700 mx-auto flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
          <h2 className="text-base font-bold text-rose-200 uppercase tracking-wider mb-2">
            Access Denied
          </h2>
          <p className="text-xs text-neutral-300 leading-relaxed mb-6">
            The account <span className="text-rose-300 font-mono font-semibold">{firebaseUser.email}</span> does not have administrator privileges. Only users with role <span className="font-mono text-[#D4AF37] font-bold">"admin"</span> can enter the restricted atelier console.
          </p>
          <AdminLogin defaultError="Access Denied: This account lacks administrator rights." />
        </div>
      </div>
    );
  }

  // 3. Not Authenticated: Render dedicated Admin Login Page
  if (!isAdmin || !adminUser) {
    return <AdminLogin />;
  }

  // 4. Authenticated & Verified Admin: Render protected admin dashboard
  return <>{children}</>;
};
