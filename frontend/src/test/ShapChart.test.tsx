import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShapWaterfallChart } from '@/components/clinical/ShapWaterfallChart';
import { DEMO_ANALYSIS_RESULT } from '@/constants';

describe('ShapWaterfallChart', () => {
  const features = DEMO_ANALYSIS_RESULT.clinical_risk.shap_features;

  it('renders SHAP XAI title and XAI badge', () => {
    render(<ShapWaterfallChart features={features} isDemo={true} />);
    expect(
      screen.getByText(/Explainable AI \(XAI\): SHAP Risk Factor Contributions/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/XAI Layer/i)).toBeInTheDocument();
  });

  it('renders factor contribution cards with clinical explanations', () => {
    render(<ShapWaterfallChart features={features} isDemo={true} />);
    expect(screen.getByText(/Baseline eGFR \(34.5 mL\/min\/1.73m²\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Ketorolac Duration \(14 days vs 5 day limit\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Controlled Statin Therapy/i)).toBeInTheDocument();
  });

  it('renders educational guide explaining SHAP in clinical practice', () => {
    render(<ShapWaterfallChart features={features} isDemo={true} />);
    expect(screen.getByText(/Understanding SHAP Values in Clinical Practice/i)).toBeInTheDocument();
  });
});
