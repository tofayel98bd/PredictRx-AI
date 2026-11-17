import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { saveClinicianReview } from '@/services/prescriptionService';
import { toast } from 'sonner';
import { UserCheck, ShieldCheck, CheckCircle2, AlertOctagon, Edit3 } from 'lucide-react';

interface ClinicianReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
  currentDecision?: 'APPROVED' | 'MODIFIED' | 'REJECTED';
  onReviewSaved: () => void;
}

export const ClinicianReviewModal: React.FC<ClinicianReviewModalProps> = ({
  isOpen,
  onClose,
  analysisId,
  currentDecision,
  onReviewSaved,
}) => {
  const { t } = useTranslation(['reports', 'common']);
  const [reviewerName, setReviewerName] = useState('Dr. M. Ashraful Hoque');
  const [reviewerLicense, setReviewerLicense] = useState('BMDC #A-89412');
  const [decision, setDecision] = useState<'APPROVED' | 'MODIFIED' | 'REJECTED'>(
    currentDecision || 'MODIFIED'
  );
  const [notes, setNotes] = useState(
    'Discontinued Ketorolac due to CKD Stage 3 (eGFR 34.5). Substituted with Napa Extend 665mg PRN. Maintained Bizoran 5/20 with renal panel repeat in 14 days.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      toast.error('Clinician name is required for legal and clinical traceability.');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveClinicianReview(analysisId, {
        reviewer_name: reviewerName,
        reviewer_license: reviewerLicense,
        decision,
        notes,
      });
      toast.success('Clinical decision recorded and locked with BMDC verification timestamp.');
      onReviewSaved();
      onClose();
    } catch {
      toast.error('Failed to submit clinical review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-primary">
            <UserCheck className="h-5 w-5" />
            <DialogTitle>Clinician Decision & Audit Sign-Off</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Review the CDSS AI safety findings and certify the final therapeutic course.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Clinician Credentials */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Clinician Name</label>
              <Input
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="mt-1 text-xs"
                placeholder="Dr. Full Name"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">License / BMDC Reg.</label>
              <Input
                value={reviewerLicense}
                onChange={(e) => setReviewerLicense(e.target.value)}
                className="mt-1 text-xs"
                placeholder="BMDC #..."
              />
            </div>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="text-xs font-semibold text-foreground">Clinical Determination</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setDecision('APPROVED')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition ${
                  decision === 'APPROVED'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-border hover:bg-muted text-muted-foreground'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 mb-1 text-emerald-600" />
                <span>{t('status.approved', { ns: 'common', defaultValue: 'Approved' })}</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('MODIFIED')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition ${
                  decision === 'MODIFIED'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20'
                    : 'border-border hover:bg-muted text-muted-foreground'
                }`}
              >
                <Edit3 className="h-4 w-4 mb-1 text-amber-600" />
                <span>{t('status.modified', { ns: 'common', defaultValue: 'Modified' })}</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition ${
                  decision === 'REJECTED'
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 ring-2 ring-red-500/20'
                    : 'border-border hover:bg-muted text-muted-foreground'
                }`}
              >
                <AlertOctagon className="h-4 w-4 mb-1 text-red-600" />
                <span>{t('status.rejected', { ns: 'common', defaultValue: 'Rejected' })}</span>
              </button>
            </div>
          </div>

          {/* Clinical Rationale & Modification Notes */}
          <div>
            <label className="text-xs font-semibold text-foreground">
              Clinical Rationale / Prescription Adjustments
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 text-xs"
              rows={3}
              placeholder="State rationale for override, substitution, or therapeutic plan..."
            />
          </div>

          {/* Legal Sign-Off Notice */}
          <div className="p-2.5 rounded-lg bg-muted text-[11px] text-muted-foreground flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>Digital stamp will be permanently appended to the clinical audit trail.</span>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t('actions.cancel', { ns: 'common', defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Certify Decision'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
