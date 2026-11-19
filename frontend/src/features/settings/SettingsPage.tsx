import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Globe,
  Server,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/app/providers/ThemeProvider';
import { checkBackendHealth, apiClient } from '@/services/apiClient';
import { setLanguage, getCurrentLanguage, SupportedLanguage } from '@/i18n';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation(['settings', 'common']);
  const currentLang = (i18n.language && i18n.language.startsWith('bn')) ? 'bn' : 'en';

  const [clinicianName, setClinicianName] = useState('Dr. M. Ashraful Hoque');
  const [bmdcNumber, setBmdcNumber] = useState('BMDC #A-89412');
  const [hospitalAffiliation, setHospitalAffiliation] = useState('Dhaka Medical College & Hospital');
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');
  const [mockFallback, setMockFallback] = useState(true);
  const [backendHealth, setBackendHealth] = useState<{ online: boolean; message: string }>({
    online: false,
    message: 'Testing connection...',
  });
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    runHealthTest();
  }, []);

  const runHealthTest = async () => {
    setIsTesting(true);
    const res = await checkBackendHealth();
    setBackendHealth(res);
    setIsTesting(false);
  };

  const handleLanguageChange = async (targetLang: SupportedLanguage) => {
    if (targetLang === currentLang) return;
    await setLanguage(targetLang);
    try {
      // Sync with backend if user session is active
      await apiClient.patch('/api/v1/auth/me/preferences', { preferred_language: targetLang });
    } catch {
      // Graceful offline fallback
    }
    toast.success(
      targetLang === 'bn'
        ? 'ইন্টারফেস ভাষা বাংলায় সফলভাবে পরিবর্তন করা হয়েছে।'
        : 'Interface language updated to English.'
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t('clinician.savedToast', 'Clinician profile and licensing details updated.'));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center space-x-2">
          <SettingsIcon className="h-5 w-5 text-primary" />
          <span>{t('title', 'System Settings & Operational Preferences')}</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('subtitle', 'Configure clinical display preferences, local API bridge status, and verified practitioner credentials.')}
        </p>
      </div>

      {/* 1. Internationalization & Language Selection Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center space-x-2">
            <Globe className="h-4 w-4 text-primary" />
            <span>{t('language.title', 'Internationalization & Interface Language')}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t('language.description', 'Select your preferred application language. Affects all clinical modules, reports, and error messages.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* English Selector */}
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`p-4 rounded-xl border flex items-center justify-between transition text-left ${
                currentLang === 'en'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                  : 'border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center font-bold text-xs border border-border">
                  EN
                </div>
                <div>
                  <span className="font-bold text-sm block text-foreground">
                    {t('language.english', 'English (Default)')}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Standard Medical English</span>
                </div>
              </div>
              {currentLang === 'en' && <Check className="h-4 w-4 text-primary shrink-0" />}
            </button>

            {/* Bangla Selector */}
            <button
              type="button"
              onClick={() => handleLanguageChange('bn')}
              className={`p-4 rounded-xl border flex items-center justify-between transition text-left ${
                currentLang === 'bn'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                  : 'border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center font-bold text-xs border border-border font-bangla">
                  বাং
                </div>
                <div>
                  <span className="font-bold text-sm block text-foreground font-bangla">
                    {t('language.bangla', 'বাংলা (Bengali)')}
                  </span>
                  <span className="text-[11px] text-muted-foreground">ক্লিনিক্যাল বাংলা ও রোগীর নির্দেশিকা</span>
                </div>
              </div>
              {currentLang === 'bn' && <Check className="h-4 w-4 text-primary shrink-0" />}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Visual Appearance Mode */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center space-x-2">
            <Sliders className="h-4 w-4 text-primary" />
            <span>{t('appearance.title', 'Visual Appearance & Display Mode')}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t('appearance.description', 'Toggle between clinical daylight mode and high-contrast dark environment.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 text-xs font-medium transition ${
                theme === 'light'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                  : 'border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              <Sun className="h-5 w-5" />
              <span>{t('appearance.light', 'Light Clinical')}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 text-xs font-medium transition ${
                theme === 'dark'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                  : 'border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              <Moon className="h-5 w-5" />
              <span>{t('appearance.dark', 'Dark Environment')}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 text-xs font-medium transition ${
                theme === 'system'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                  : 'border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              <Sliders className="h-5 w-5" />
              <span>{t('appearance.system', 'Match System')}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Clinician Profile and Digital Stamp */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center space-x-2">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>{t('clinician.title', 'Clinician Verification & BMDC Registry Details')}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t('clinician.description', 'Credentials embedded onto finalized patient reports and pharmacological sign-offs.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground">
                  {t('clinician.name', 'Practitioner Full Name')}
                </label>
                <Input
                  value={clinicianName}
                  onChange={(e) => setClinicianName(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {t('clinician.bmdc', 'BMDC Registration Number')}
                </label>
                <Input
                  value={bmdcNumber}
                  onChange={(e) => setBmdcNumber(e.target.value)}
                  className="mt-1 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground">
                {t('clinician.hospital', 'Hospital / Clinic Affiliation')}
              </label>
              <Input
                value={hospitalAffiliation}
                onChange={(e) => setHospitalAffiliation(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="sm" className="text-xs">
                {t('clinician.btnSave', 'Save Clinician Profile')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 4. API Connection Status & Backend Configuration */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">
                {t('api.title', 'FastAPI Backend Integration')}
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runHealthTest}
              disabled={isTesting}
              className="text-xs h-7"
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? t('api.testing', 'Testing Connection...') : t('api.btnTest', 'Test Connection')}
            </Button>
          </div>
          <CardDescription className="text-xs">
            {t('api.description', 'Configurable Python FastAPI endpoint for OCR parsing and deterministic rules execution.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-foreground">{t('api.url', 'Configured API Base URL')}</label>
            <Input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="mt-1 text-xs font-mono"
              placeholder="http://localhost:8000"
            />
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {backendHealth.online ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
              )}
              <div>
                <span className="font-semibold text-foreground block">
                  Status: {backendHealth.online ? 'Online & Active' : 'Safe Mock Adapter Active'}
                </span>
                <span className="text-[11px] text-muted-foreground">{backendHealth.message}</span>
              </div>
            </div>

            <Badge variant={backendHealth.online ? 'success' : 'info'}>
              {backendHealth.online ? 'LIVE' : 'DEMO MODE'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div>
              <span className="font-semibold text-foreground block">
                Automatic Safe Demo Fallback
              </span>
              <span className="text-[11px] text-muted-foreground">
                Prevents interface lockouts when backend is disconnected.
              </span>
            </div>
            <Switch checked={mockFallback} onCheckedChange={setMockFallback} />
          </div>
        </CardContent>
      </Card>

      {/* 5. Platform Specification & Version Metadata */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Platform Specification & Version Metadata</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-muted-foreground">
          <div className="flex justify-between py-1 border-b border-border">
            <span>Application Version:</span>
            <span className="font-mono text-foreground">PredictRx-AI v1.4.0 (Enterprise CDSS Edition)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border">
            <span>Bangladesh Drug Catalog:</span>
            <span className="text-foreground">DGDA Aligned Formulary & BNF 86</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border">
            <span>Vision OCR Pipeline:</span>
            <span className="text-foreground">Multi-Pass Vision LLM with Deterministic Python Validation</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border">
            <span>XAI Engine:</span>
            <span className="text-foreground">Shapley Additive Explanations (SHAP) Protocol</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
