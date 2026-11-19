import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/app/providers/AuthProvider';
import { PRESET_DEMO_CLINICIANS } from '@/services/authService';
import {
  UserCheck,
  UserPlus,
  LogIn,
  Stethoscope,
  Pill,
  Lock,
  Mail,
  User,
  Building,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export function AuthModal() {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register,
    quickDemoLogin,
    isLoading,
  } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regBmdc, setRegBmdc] = useState('');
  const [regRole, setRegRole] = useState<'doctor' | 'clinical_pharmacist'>('doctor');
  const [regDept, setRegDept] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;
    await login({ email: loginEmail, password: loginPassword || 'Doctor123!' });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) return;
    await register({
      full_name: regName,
      bmdc_number: regBmdc.trim() || undefined,
      role: regRole,
      department: regDept.trim() || (regRole === 'doctor' ? 'Clinical Medicine' : 'Pharmacovigilance'),
      email: regEmail,
      password: regPassword || 'Doctor123!',
      preferred_language: isBn ? 'bn' : 'en',
    });
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
      <DialogContent className="sm:max-w-[480px] p-6 overflow-hidden">
        <DialogHeader className="space-y-1">
          <div className="flex items-center space-x-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <ShieldCheck className="h-4 w-4" />
            <span>{isBn ? 'নিরাপদ ক্লিনিক্যাল লগইন পোর্টাল' : 'Secure Clinician Portal'}</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {isBn ? 'চিকিৎসক ও ফার্মাসিস্ট প্রমাণীকরণ' : 'Clinician Authentication & Access'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isBn
              ? 'প্রেসক্রিপশন সুরক্ষা যাচাই, ক্লিনিক্যাল পর্যালোচনা ও রোগীর নির্দেশিকা দেখতে লগইন করুন।'
              : 'Sign in or register to verify clinical prescriptions, approve safety audits, and issue guidance.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={authModalMode}
          onValueChange={(val) => setAuthModalMode(val as 'login' | 'register')}
          className="mt-2 w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="flex items-center space-x-1.5 text-xs font-semibold">
              <LogIn className="h-3.5 w-3.5" />
              <span>{isBn ? 'লগইন করুন' : 'Sign In'}</span>
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center space-x-1.5 text-xs font-semibold">
              <UserPlus className="h-3.5 w-3.5" />
              <span>{isBn ? 'নতুন নিবন্ধন' : 'Register'}</span>
            </TabsTrigger>
          </TabsList>

          {/* LOGIN TAB */}
          <TabsContent value="login" className="space-y-4 pt-3">
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground flex items-center space-x-1">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span>{isBn ? 'ইমেইল অ্যাড্রেস' : 'Official Email Address'}</span>
                </label>
                <Input
                  type="email"
                  placeholder={isBn ? 'যেমন: doctor@predictrx.bd' : 'e.g. doctor@predictrx.bd'}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground flex items-center space-x-1">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <span>{isBn ? 'পাসওয়ার্ড' : 'Password'}</span>
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs mt-2"
              >
                {isLoading ? (
                  <span>{isBn ? 'প্রবেশ করা হচ্ছে...' : 'Signing in...'}</span>
                ) : (
                  <span className="flex items-center justify-center space-x-1.5">
                    <LogIn className="h-3.5 w-3.5" />
                    <span>{isBn ? 'লগইন করুন' : 'Sign In to Portal'}</span>
                  </span>
                )}
              </Button>
            </form>

            {/* Quick 1-Click Demo Login Section */}
            <div className="pt-2 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center space-x-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>{isBn ? '১-ক্লিকে ডেমো ডাক্তার লগইন:' : '1-Click Instant Demo Login:'}</span>
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                  {isBn ? 'মূল্যায়নকারী এক্সেস' : 'Judge Mode'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {PRESET_DEMO_CLINICIANS.map((preset, idx) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => quickDemoLogin(idx)}
                    disabled={isLoading}
                    className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/40 hover:bg-primary/5 hover:border-primary/40 text-left transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                        {preset.role === 'doctor' ? (
                          <Stethoscope className="h-3.5 w-3.5" />
                        ) : (
                          <Pill className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground leading-tight">
                          {preset.full_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {preset.department} • {preset.bmdc_number ? `বিএমডিসি #${preset.bmdc_number}` : preset.role}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-primary hover:underline">
                      {isBn ? 'সিলেক্ট →' : 'Use →'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* REGISTER TAB */}
          <TabsContent value="register" className="space-y-3 pt-3">
            <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground flex items-center space-x-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span>{isBn ? 'আপনার পুরো নাম' : 'Full Name & Clinical Credentials'}</span>
                </label>
                <Input
                  type="text"
                  placeholder={isBn ? 'যেমন: ডা. তোফায়েল আহমেদ' : 'e.g. Dr. Tofayel Ahmed, MBBS'}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center space-x-1">
                    <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                    <span>{isBn ? 'বিএমডিসি নম্বর' : 'BMDC Reg. Number'}</span>
                  </label>
                  <Input
                    type="text"
                    placeholder={isBn ? 'যেমন: এ-৭৮৯০১' : 'e.g. A-78901'}
                    value={regBmdc}
                    onChange={(e) => setRegBmdc(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center space-x-1">
                    <UserCheck className="h-3 w-3 text-muted-foreground" />
                    <span>{isBn ? 'ক্লিনিক্যাল ভূমিকা' : 'Clinical Role'}</span>
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as 'doctor' | 'clinical_pharmacist')}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="doctor">{isBn ? 'নিবন্ধিত চিকিৎসক (Doctor)' : 'Doctor / Physician'}</option>
                    <option value="clinical_pharmacist">{isBn ? 'ফার্মাসিস্ট (Clinical Pharmacist)' : 'Clinical Pharmacist'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground flex items-center space-x-1">
                  <Building className="h-3 w-3 text-muted-foreground" />
                  <span>{isBn ? 'বিভাগ / হাসপাতাল' : 'Department / Hospital'}</span>
                </label>
                <Input
                  type="text"
                  placeholder={isBn ? 'যেমন: মেডিসিন ও কার্ডিওলজি' : 'e.g. Medicine & Cardiology'}
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center space-x-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span>{isBn ? 'ইমেইল' : 'Email'}</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="doctor@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center space-x-1">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <span>{isBn ? 'পাসওয়ার্ড' : 'Password'}</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs mt-3"
              >
                {isLoading ? (
                  <span>{isBn ? 'নিবন্ধন করা হচ্ছে...' : 'Registering...'}</span>
                ) : (
                  <span className="flex items-center justify-center space-x-1.5">
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>{isBn ? 'নতুন চিকিৎসক হিসেবে নিবন্ধন সম্পন্ন করুন' : 'Complete Registration'}</span>
                  </span>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
