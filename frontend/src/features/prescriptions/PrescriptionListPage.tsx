import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  FileText,
  User,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getPrescriptionHistory } from '@/services/prescriptionService';
import { PrescriptionAnalysisResult } from '@/types';
import { formatDate } from '@/lib/utils';

export const PrescriptionListPage: React.FC = () => {
  const { t, i18n } = useTranslation(['prescriptions', 'common']);
  const isBn = Boolean(i18n.language && i18n.language.startsWith('bn'));
  const [prescriptions, setPrescriptions] = useState<PrescriptionAnalysisResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'risk'>('date');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrescriptionHistory()
      .then((data) => setPrescriptions(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = prescriptions.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.prescription_id.toLowerCase().includes(q) ||
      (p.patient_context.name && p.patient_context.name.toLowerCase().includes(q)) ||
      p.extracted_prescription.some(
        (m) =>
          m.brand_name.toLowerCase().includes(q) ||
          (m.generic_name && m.generic_name.toLowerCase().includes(q))
      );

    const matchesSeverity =
      severityFilter === 'ALL' ||
      p.clinical_risk.risk_classification === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'risk') {
      return b.clinical_risk.risk_score - a.clinical_risk.risk_score;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {t('title', 'Prescription Records & Analysis History')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('subtitle', 'Audit log of all scanned prescriptions, OCR parsed medications, and CDSS risk ratings.')}
          </p>
        </div>

        <Button asChild size="sm" className="self-start">
          <Link to="/analyze">
            <FileText className="mr-1.5 h-4 w-4" />
            {t('btnAnalyzeNew', 'Upload New Prescription')}
          </Link>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t(
                  'searchPlaceholder',
                  'Search prescription ID, patient name, or medicine (e.g. Bizoran, Rolac)...'
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="ALL">{t('filterRisk', 'All Risk Levels')}</option>
                <option value="CRITICAL">{t('status.critical', { ns: 'common', defaultValue: 'Critical Risk' })}</option>
                <option value="HIGH">{t('status.high', { ns: 'common', defaultValue: 'High Risk' })}</option>
                <option value="MODERATE">{t('status.moderate', { ns: 'common', defaultValue: 'Moderate Risk' })}</option>
                <option value="LOW">{t('status.low', { ns: 'common', defaultValue: 'Low Risk' })}</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="date">{isBn ? 'সর্বশেষ তারিখ অনুযায়ী' : 'Sort by Most Recent'}</option>
                <option value="risk">{isBn ? 'সর্বোচ্চ ঝুঁকি স্কোর অনুযায়ী' : 'Sort by Highest Risk Score'}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescription Records List */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <Card className="border-dashed p-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground">
              {t('emptyState', 'No prescription records matched your query.')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSeverityFilter('ALL');
              }}
              className="mt-3 text-xs"
            >
              {t('actions.reset', { ns: 'common', defaultValue: 'Reset Filters' })}
            </Button>
          </Card>
        ) : (
          sorted.map((item) => {
            const isCritical = item.clinical_risk.risk_classification === 'CRITICAL';
            const riskClassLabel = isBn
              ? (item.clinical_risk.risk_classification === 'CRITICAL' ? 'মারাত্মক ঝুঁকি' : 'স্বাভাবিক')
              : item.clinical_risk.risk_classification;
            return (
              <Card
                key={item.analysis_id}
                className="border-border hover:border-primary/40 transition-colors shadow-sm"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: ID & Patient info */}
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          isCritical
                            ? 'bg-red-50 dark:bg-red-950/60 text-red-600'
                            : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600'
                        }`}
                      >
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sm text-foreground">
                            {item.prescription_id}
                          </span>
                          <span className="text-muted-foreground text-xs">•</span>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {formatDate(item.timestamp)}
                          </span>
                          {item.clinical_risk.is_synthetic_demo && (
                            <Badge variant="demo" className="text-[9px]">{isBn ? 'ডেমো' : 'DEMO'}</Badge>
                          )}
                        </div>

                        <div className="text-xs text-foreground font-medium flex items-center space-x-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{item.patient_context.name || (isBn ? 'নামহীন রোগী' : 'Anonymous Patient')}</span>
                          <span className="text-muted-foreground">
                            ({isBn ? `বয়স ${item.patient_context.age}` : `Age ${item.patient_context.age}`}, eGFR {item.patient_context.egfr ?? 'N/A'})
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          <strong>{isBn ? 'ওষুধসমূহ: ' : 'Meds: '}</strong>
                          {item.extracted_prescription.map((m) => m.brand_name).join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Right: Risk Badge & CTA */}
                    <div className="flex items-center justify-between md:justify-end space-x-3 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                      <div className="text-right">
                        <Badge
                          variant={isCritical ? 'critical' : 'success'}
                          className="text-xs"
                        >
                          {riskClassLabel} ({item.clinical_risk.risk_score}/100)
                        </Badge>
                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                          {item.drug_interactions.length} {isBn ? 'টি প্রতিক্রিয়া পরিলক্ষিত' : 'Interactions Flagged'}
                        </span>
                      </div>

                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link to={`/reports/${item.analysis_id}`}>
                          {t('btnViewReport', isBn ? 'অডিট রিপোর্ট' : 'Audit Report')} <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
