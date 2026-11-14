import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PrescriptionAnalysisPage } from '@/features/prescription-analysis/PrescriptionAnalysisPage';
import { ThemeProvider } from '@/app/providers/ThemeProvider';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </ThemeProvider>
  );
}

describe('PrescriptionAnalysisPage', () => {
  it('renders prescription OCR upload header and patient clinical context form', () => {
    renderWithProviders(<PrescriptionAnalysisPage />);
    expect(
      screen.getByText(/Prescription OCR & Clinical Safety Analysis/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/1. Upload Prescription Document/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Patient Baseline Clinical Profile/i)).toBeInTheDocument();
  });

  it(
    'loads the hackathon synthetic demonstration scenario and executes evaluation',
    async () => {
      renderWithProviders(<PrescriptionAnalysisPage />);
      const loadDemoBtn = screen.getByRole('button', {
        name: /Load Hackathon Demo Scenario/i,
      });
      fireEvent.click(loadDemoBtn);

      // Verify inputs populated
      expect(screen.getByDisplayValue(/PRX-BD-2026-081/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Md. Rafiqul Islam \(Demo\)/i)).toBeInTheDocument();

      const submitBtn = screen.getByRole('button', {
        name: /Run Full CDSS Safety Evaluation/i,
      });
      expect(submitBtn).not.toBeDisabled();

      // Submit form
      fireEvent.click(submitBtn);

      // Analysis results appear after pipeline completion
      await waitFor(
        () => {
          expect(
            screen.getByText(/Critical Safety Alert: High-Risk Prescription Detected/i)
          ).toBeInTheDocument();
          expect(screen.getAllByText(/Bizoran 5\/20/i).length).toBeGreaterThan(0);
          expect(screen.getAllByText(/Rolac 10/i).length).toBeGreaterThan(0);
        },
        { timeout: 10000 }
      );
    },
    15000
  );
});
