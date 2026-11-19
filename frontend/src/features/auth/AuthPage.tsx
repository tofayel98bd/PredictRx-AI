import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
  ArrowLeft,
  Activity,
} from 'lucide-react';

export function AuthPage() {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const navigate = useNavigate();

  const { login, register, quickDemoLogin, isLoading, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

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
    navigate('/dashboard');
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
    navigate('/dashboard');
  };

  const handleDemoSelect = async (idx: number) => {
    await quickDemoLogin(idx);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md space-y-4">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-1">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-1.5">
            PredictRx <span className="text-primary">BD</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            {isBn
              ? 'ক্লিনিক্যাল ডিসিশন সাপোর্ট ও প্রেসক্রিপশন সুরক্ষা প্ল্যাটফর্ম'
              : 'Clinical Decision Support & Prescription Safety Platform'}
          </p>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-lg font-bold">
              {activeTab === 'login'
                ? isBn ? 'চিকিৎসক লগইন' : 'Clinician Login'
                : isBn ? 'নতুন ডাক্তার / ফার্মাসিস্ট নিবন্ধন' : 'Register New Clinician'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isBn
                ? 'আপনার BMDC রেজিস্ট্রেশন ও প্রাতিষ্ঠানিক ক্রেডেনশিয়াল দিয়ে প্রবেশ করুন।'
                : 'Enter your medical credentials to access CDSS audit tools.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login" className="text-xs font-semibold">
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  {isBn ? 'লগইন' : 'Sign In'}
                </TabsTrigger>
                <TabsTrigger value="register" className="text-xs font-semibold">
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  {isBn ? 'নতুন নিবন্ধন' : 'Register'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground flex items-center space-x-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span>{isBn ? 'অফিসিয়াল ইমেইল' : 'Email Address'}</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="doctor@predictrx.bd"
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
                      <span>{isBn ? 'লগইন হচ্ছে...' : 'Signing in...'}</span>
                    ) : (
                      <span className="flex items-center justify-center space-x-1.5">
                        <LogIn className="h-3.5 w-3.5" />
                        <span>{isBn ? 'লগইন করুন' : 'Sign In'}</span>
                      </span>
                    )}
                  </Button>
                </form>

                {/* 1-Click Demo Logins */}
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center space-x-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span>{isBn ? '১-ক্লিকে ডেমো ডাক্তার লগইন:' : '1-Click Instant Demo Login:'}</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                      {isBn ? 'মূল্যায়ন এক্সেস' : 'Judge Mode'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {PRESET_DEMO_CLINICIANS.map((preset, idx) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleDemoSelect(idx)}
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

              <TabsContent value="register" className="space-y-3">
                <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground flex items-center space-x-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>{isBn ? 'আপনার পুরো নাম' : 'Full Name & Title'}</span>
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
                        <option value="doctor">{isBn ? 'চিকিৎসক (Doctor)' : 'Doctor / Physician'}</option>
                        <option value="clinical_pharmacist">{isBn ? 'ফার্মাসিস্ট (Pharmacist)' : 'Clinical Pharmacist'}</option>
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
                      placeholder={isBn ? 'যেমন: ইন্টারনাল মেডিসিন' : 'e.g. Internal Medicine'}
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
                        <span>{isBn ? 'চিকিৎসক হিসেবে নিবন্ধন সম্পন্ন করুন' : 'Complete Registration'}</span>
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            <Link to="/dashboard">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              {isBn ? 'গেস্ট হিসেবে ড্যাশবোর্ডে ফিরে যান' : 'Continue as Guest to Dashboard'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
