import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, MASTER_ADMIN_UID } from '../services/firebaseConfig';
import { AdminUser, AdminAuthContextType } from '../types';

interface ExtendedAdminAuthContextType extends AdminAuthContextType {
  firebaseUser: User | null;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AdminAuthContext = createContext<ExtendedAdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to map Firebase auth error codes to clear messages
  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid administrator email or password.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This administrator account has been disabled.';
      case 'auth/too-many-requests':
        return 'Access temporarily blocked due to repeated failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network connection issue. Please verify your connection.';
      default:
        return err?.message || 'Authentication failed. Please check credentials.';
    }
  };

  // Firebase Auth State Listener with Session Persistence
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Ensure session persistence in local storage
    try {
      setPersistence(auth, browserLocalPersistence).catch(() => {});
    } catch {}

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        setFirebaseUser(user);

        try {
          if (db) {
            const adminDocRef = doc(db, 'admins', user.uid);
            const adminSnap = await getDoc(adminDocRef);

            if (adminSnap.exists() && adminSnap.data()?.role === 'admin') {
              const data = adminSnap.data();
              const profile: AdminUser = {
                uid: user.uid,
                name: data.name || user.displayName || 'Administrator',
                email: user.email || data.email || '',
                role: 'admin',
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString()
              };
              setAdminUser(profile);
              setIsAdmin(true);
              setError(null);
            } else {
              // Master Admin Bootstrap:
              // If the authenticated user is the designated master admin email or UID,
              // automatically create the initial admin profile in Firestore without saving passwords.
              const isMaster = 
                user.uid === MASTER_ADMIN_UID ||
                user.email?.toLowerCase() === 'daniyalqasmi5327@gmail.com' ||
                user.email?.toLowerCase() === 'admin@emeraldhaya.com';

              if (isMaster) {
                const initialAdmin: AdminUser = {
                  uid: user.uid,
                  name: user.displayName || 'Master Administrator',
                  email: user.email || '',
                  role: 'admin',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };

                await setDoc(adminDocRef, initialAdmin, { merge: true });
                setAdminUser(initialAdmin);
                setIsAdmin(true);
                setError(null);
              } else {
                // User is signed in to Firebase, BUT is NOT an admin in Firestore
                setAdminUser(null);
                setIsAdmin(false);
              }
            }
          } else {
            // DB fallback
            setAdminUser(null);
            setIsAdmin(false);
          }
        } catch (err: any) {
          console.error('Error verifying admin authorization in Firestore:', err);
          setAdminUser(null);
          setIsAdmin(false);
        }
      } else {
        setFirebaseUser(null);
        setAdminUser(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login handler using Firebase Authentication Email/Password
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setLoading(true);

    if (!auth) {
      const errMsg = 'Firebase Authentication is not initialized.';
      setError(errMsg);
      setLoading(false);
      return { success: false, error: errMsg };
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      const errMsg = 'Email and password are required.';
      setError(errMsg);
      setLoading(false);
      return { success: false, error: errMsg };
    }

    try {
      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // 2. Verify Role: "admin" in Firestore
      if (db) {
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminDocRef);

        if (adminSnap.exists() && adminSnap.data()?.role === 'admin') {
          const data = adminSnap.data();
          const profile: AdminUser = {
            uid: user.uid,
            name: data.name || user.displayName || 'Administrator',
            email: user.email || cleanEmail,
            role: 'admin',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setAdminUser(profile);
          setFirebaseUser(user);
          setIsAdmin(true);
          setLoading(false);
          return { success: true };
        }

        // Master bootstrap check
        const isMaster =
          user.uid === MASTER_ADMIN_UID ||
          cleanEmail.toLowerCase() === 'daniyalqasmi5327@gmail.com' ||
          cleanEmail.toLowerCase() === 'admin@emeraldhaya.com';

        if (isMaster) {
          const initialAdmin: AdminUser = {
            uid: user.uid,
            name: user.displayName || 'Master Administrator',
            email: cleanEmail,
            role: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await setDoc(adminDocRef, initialAdmin, { merge: true });
          setAdminUser(initialAdmin);
          setFirebaseUser(user);
          setIsAdmin(true);
          setLoading(false);
          return { success: true };
        }

        // Normal user / customer account: NOT an admin! Block and sign out immediately.
        await signOut(auth);
        const denialMsg = 'Access Denied: This account does not possess administrator privileges.';
        setError(denialMsg);
        setAdminUser(null);
        setFirebaseUser(null);
        setIsAdmin(false);
        setLoading(false);
        return { success: false, error: denialMsg };
      }

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      const friendlyError = formatAuthError(err);
      setError(friendlyError);
      setAdminUser(null);
      setIsAdmin(false);
      setLoading(false);
      return { success: false, error: friendlyError };
    }
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAdminUser(null);
      setFirebaseUser(null);
      setIsAdmin(false);
      setError(null);
      setLoading(false);
    }
  };

  // Password reset helper
  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (!auth) {
      return { success: false, message: 'Firebase Auth is not available' };
    }
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      return { success: false, message: 'Please enter your administrator email.' };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true, message: `Password reset instructions sent to ${cleanEmail}` };
    } catch (err: any) {
      return { success: false, message: formatAuthError(err) };
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        firebaseUser,
        isAdmin,
        loading,
        error,
        login,
        logout,
        resetPassword,
        clearError
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
