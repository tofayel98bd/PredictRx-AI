import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  authService,
  ClinicianUser,
  LoginCredentials,
  RegisterCredentials,
  PRESET_DEMO_CLINICIANS,
} from '@/services/authService';
import { toast } from 'sonner';

interface AuthContextType {
  user: ClinicianUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<ClinicianUser>;
  register: (data: RegisterCredentials) => Promise<ClinicianUser>;
  quickDemoLogin: (presetIndex?: number) => Promise<ClinicianUser>;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  openLogin: () => void;
  openRegister: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClinicianUser | null>(() => authService.getCurrentUser());
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Sync active session if available
    const existingUser = authService.getCurrentUser();
    const existingToken = authService.getToken();
    if (existingUser && existingToken) {
      setUser(existingUser);
      setToken(existingToken);
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<ClinicianUser> => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.login(credentials);
      setUser(loggedUser);
      setToken(authService.getToken());
      setIsAuthModalOpen(false);
      toast.success(`স্বাগতম, ${loggedUser.full_name}!`, {
        description: `সফলভাবে লগইন করা হয়েছে (${loggedUser.role === 'doctor' ? 'চিকিৎসক' : 'ফার্মাসিস্ট'})`,
      });
      return loggedUser;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।';
      toast.error('লগইন ব্যর্থ', { description: msg });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterCredentials): Promise<ClinicianUser> => {
    setIsLoading(true);
    try {
      const registeredUser = await authService.register(data);
      setUser(registeredUser);
      setToken(authService.getToken());
      setIsAuthModalOpen(false);
      toast.success(`অভিনন্দন, ${registeredUser.full_name}!`, {
        description: 'আপনার চিকিৎসক প্রোফাইল সফলভাবে নিবন্ধিত হয়েছে।',
      });
      return registeredUser;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'নিবন্ধন সম্পন্ন করা যায়নি।';
      toast.error('নিবন্ধন ব্যর্থ', { description: msg });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const quickDemoLogin = async (presetIndex = 0): Promise<ClinicianUser> => {
    const preset = PRESET_DEMO_CLINICIANS[presetIndex] || PRESET_DEMO_CLINICIANS[0];
    return await login({ email: preset.email, password: preset.passwordHint });
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    toast.info('লগআউট সম্পন্ন হয়েছে', {
      description: 'চিকিৎসক সেশন সফলভাবে সমাপ্ত হয়েছে।',
    });
  };

  const openLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        quickDemoLogin,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openLogin,
        openRegister,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return safe default fallback for isolated test environments
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => ({} as ClinicianUser),
      register: async () => ({} as ClinicianUser),
      quickDemoLogin: async () => ({} as ClinicianUser),
      logout: () => {},
      isAuthModalOpen: false,
      setIsAuthModalOpen: () => {},
      authModalMode: 'login' as const,
      setAuthModalMode: () => {},
      openLogin: () => {},
      openRegister: () => {},
    };
  }
  return context;
}
