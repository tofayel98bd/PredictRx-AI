import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  UserCheck,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Phone,
  Droplet,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getPatients } from '@/services/patientService';
import { Patient } from '@/types';
import { formatDate, formatNumber } from '@/lib/utils';

export const PatientListPage: React.FC = () => {
  const { t, i18n } = useTranslation(['patients', 'common']);
  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const formatRiskLevel = (level: string) => {
    if (!isBn) return level;
    switch (level.toUpperCase()) {
      case 'CRITICAL': return 'মারাত্মক ঝুঁকি';
      case 'HIGH': return 'উচ্চ ঝুঁকি';
      case 'MODERATE': return 'মাঝারি ঝুঁকি';
      case 'LOW': return 'স্বাভাবিক';
      default: return level;
    }
  };

  const formatAgeGender = (age: number, gender: string) => {
    if (!isBn) return `${age}y / ${gender.charAt(0)}`;
    const gText = gender.toLowerCase().startsWith('f') ? 'মহিলা' : 'পুরুষ';
    return `${formatNumber(age)} বছর / ${gText}`;
  };

  const formatCondition = (cond: string) => {
    if (!isBn) return cond;
    const condMap: Record<string, string> = {
      'Hypertension': 'উচ্চ রক্তচাপ (HTN)',
      'Essential Hypertension': 'উচ্চ রক্তচাপ (HTN)',
      'Type 2 Diabetes': 'টাইপ ২ ডায়াবেটিস',
      'Type 2 Diabetes Mellitus': 'টাইপ ২ ডায়াবেটিস',
      'Chronic Kidney Disease (CKD Stage 3)': 'ক্রনিক কিডনি রোগ (CKD 3)',
      'CKD Stage 3': 'কিডনি রোগ (CKD 3)',
      'CKD Stage 4': 'কিডনি রোগ (CKD 4)',
      'Dyslipidemia': 'ডিসলিপিডেমিয়া (রক্তে চর্বি)',
      'Dyslipidaemia': 'ডিসলিপিডেমিয়া (রক্তে চর্বি)',
      'Peptic Ulcer Disease': 'পেপটিক আলসার',
    };
    return condMap[cond] || cond;
  };

  const formatAllergy = (allergy: string) => {
    if (!isBn) return allergy;
    const allergyMap: Record<string, string> = {
      'Penicillin': 'পেনিসিলিন (Penicillin)',
      'Sulfonamides': 'সালফোনামাইডস (Sulfonamides)',
      'Aspirin': 'অ্যাসপিরিন (Aspirin)',
    };
    return allergyMap[allergy] || allergy;
  };
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatients(searchTerm)
      .then((data) => setPatients(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {t('title', 'Patient Directory & Safety Profiles')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'subtitle',
              'Continuously monitored renal and cardiovascular safety profiles for high-risk clinical cohorts.'
            )}
          </p>
        </div>

        <Button asChild size="sm">
          <Link to="/analyze">
            <FileText className="mr-1.5 h-4 w-4" />
            {t('btnRegisterPatient', 'Analyze Rx For Patient')}
          </Link>
        </Button>
      </div>

      {/* Search Input */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t(
                'searchPlaceholder',
                'Search by patient ID, name, or medical condition (e.g. CKD, Diabetes)...'
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((p) => {
          const isCritical = p.risk_level === 'CRITICAL';
          const isHigh = p.risk_level === 'HIGH';
          return (
            <Card
              key={p.id}
              className="border-border hover:border-primary/40 transition-shadow shadow-sm flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-primary font-bold text-sm">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {p.name}
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground font-mono">{p.id}</p>
                    </div>
                  </div>

                  <Badge variant={isCritical ? 'critical' : isHigh ? 'warning' : 'success'}>
                    {formatRiskLevel(p.risk_level)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/30 border border-border text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      {t('detail.age', 'Age')} / {t('detail.gender', 'Gender')}
                    </span>
                    <span className="font-semibold text-foreground">{formatAgeGender(p.age, p.gender)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">eGFR</span>
                    <span className={`font-semibold ${p.egfr < 60 ? 'text-red-600' : 'text-foreground'}`}>
                      {p.egfr}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">HbA1c</span>
                    <span className={`font-semibold ${p.hba1c > 8.0 ? 'text-amber-600' : 'text-foreground'}`}>
                      {p.hba1c}%
                    </span>
                  </div>
                </div>

                {/* Conditions Tags */}
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {t('detail.conditions', 'Conditions')}:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.conditions.map((c, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground"
                      >
                        {formatCondition(c)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Allergies if any */}
                {p.allergies.length > 0 && (
                  <div className="text-[11px] text-red-600 dark:text-red-400">
                    <strong>{t('detail.allergies', 'Allergies')}: </strong>{p.allergies.map(formatAllergy).join(', ')}
                  </div>
                )}

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {t('detail.lastEvaluated', 'Last evaluated')}: {p.last_analyzed ? formatDate(p.last_analyzed) : (isBn ? 'সম্প্রতি' : 'Recently')}
                  </span>
                  <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary">
                    <Link to={`/patients/${p.id}`}>
                      {t('actions.viewDetails', { ns: 'common', defaultValue: 'View Profile' })}{' '}
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
