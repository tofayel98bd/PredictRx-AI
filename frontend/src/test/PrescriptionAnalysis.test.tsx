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
    'loads the clinical reference demonstration scenario and executes evaluation',
    async () => {
      renderWithProviders(<PrescriptionAnalysisPage />);
      const loadDemoBtn = screen.getByRole('button', {
        name: /Load Reference Case/i,
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

  it('starts with a clean empty form by default without pre-filled data', () => {
    renderWithProviders(<PrescriptionAnalysisPage />);
    const patientNameInput = screen.getByPlaceholderText(/Mohammad Abdul Karim/i);
    expect(patientNameInput).toHaveValue('');
    const patientIdInput = screen.getByPlaceholderText(/PRX-BD/i);
    expect(patientIdInput).toHaveValue('');
  });

  it('renders Reference Scenarios Switcher when toggled and allows switching cases', async () => {
    renderWithProviders(<PrescriptionAnalysisPage />);

    // Open sample cases
    const toggleBtn = screen.getByRole('button', { name: /Sample Clinical Cases/i });
    fireEvent.click(toggleBtn);

    // Verify 3 scenario cards exist
    expect(screen.getByText(/Clinical Reference Case Scenarios/i)).toBeInTheDocument();
    expect(screen.getByText(/Case 1: Abdul Karim/i)).toBeInTheDocument();
    expect(screen.getByText(/Case 2: Begum Rokeya/i)).toBeInTheDocument();
    expect(screen.getByText(/Case 3: Master Ayan/i)).toBeInTheDocument();

    // Click Autofill on Case 2 (Begum Rokeya)
    const rokeyaBtn = screen.getByRole('button', { name: /Autofill Case 2: Begum Rokeya/i });
    fireEvent.click(rokeyaBtn);
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Begum Rokeya Sultana/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/PRX-BD-2026-042/i)).toBeInTheDocument();
    });

    // Click Autofill on Case 3 (Master Ayan)
    const ayanBtn = screen.getByRole('button', { name: /Autofill Case 3: Master Ayan/i });
    fireEvent.click(ayanBtn);
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Master Ayan/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/PRX-PED-2026-015/i)).toBeInTheDocument();
    });
  });

  it('executes 1-Click Instant Run for Golden Scenario 2 (Triple Whammy)', async () => {
    renderWithProviders(<PrescriptionAnalysisPage />);

    // Open sample cases
    const toggleBtn = screen.getByRole('button', { name: /Sample Clinical Cases/i });
    fireEvent.click(toggleBtn);

    const instantRunRokeya = screen.getByRole('button', { name: /Instant Run Case 2: Begum Rokeya/i });
    fireEvent.click(instantRunRokeya);

    await waitFor(() => {
      expect(screen.getAllByText(/Ramiril 5mg/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Lasix 40mg/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Voltalin 50mg/i).length).toBeGreaterThan(0);
    });
  });
});
