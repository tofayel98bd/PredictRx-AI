import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ThemeProvider } from '@/app/providers/ThemeProvider';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </ThemeProvider>
  );
}

describe('DashboardPage', () => {
  it('renders clinical dashboard header and advisory badges', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/PredictRx Clinical Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Bangladesh CDSS Intelligence Hub/i)).toBeInTheDocument();
  });

  it('renders key performance metrics cards', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Total Prescriptions/i)).toBeInTheDocument();
    expect(screen.getByText(/Critical Adverse Risks/i)).toBeInTheDocument();
    expect(screen.getByText(/Drug Interactions Flagged/i)).toBeInTheDocument();
    expect(screen.getByText(/Patients Monitored/i)).toBeInTheDocument();
  });

  it('renders quick action buttons for analysis and interactions', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole('link', { name: /Analyze Prescription/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Drug Interaction Center/i })).toBeInTheDocument();
  });
});
