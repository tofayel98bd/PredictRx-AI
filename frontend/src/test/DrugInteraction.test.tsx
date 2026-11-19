import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DrugInteractionPage } from '@/features/drug-interactions/DrugInteractionPage';

describe('DrugInteractionPage', () => {
  it('renders drug interaction center header', async () => {
    render(<DrugInteractionPage />);
    expect(screen.getByText(/Drug Interaction Monitoring Center/i)).toBeInTheDocument();
  });

  it('renders quick pair interaction screener and screens drugs', async () => {
    render(<DrugInteractionPage />);
    const drugAInput = screen.getByPlaceholderText(/Drug A/i);
    const drugBInput = screen.getByPlaceholderText(/Drug B/i);
    const screenBtn = screen.getByRole('button', { name: /Screen Drug Pair/i });

    fireEvent.change(drugAInput, { target: { value: 'Ketorolac' } });
    fireEvent.change(drugBInput, { target: { value: 'Olmesartan' } });
    fireEvent.click(screenBtn);

    await waitFor(() => {
      expect(screen.getByText(/Screening Finding:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/CRITICAL/i).length).toBeGreaterThan(0);
    });
  });

  it('screens Enalapril + Potassium Supplements as CRITICAL interaction', async () => {
    render(<DrugInteractionPage />);
    const drugAInput = screen.getByPlaceholderText(/Drug A/i);
    const drugBInput = screen.getByPlaceholderText(/Drug B/i);
    const screenBtn = screen.getByRole('button', { name: /Screen Drug Pair/i });

    fireEvent.change(drugAInput, { target: { value: 'Enalapril' } });
    fireEvent.change(drugBInput, { target: { value: 'Potassium Supplements' } });
    fireEvent.click(screenBtn);

    await waitFor(() => {
      expect(screen.getByText(/Screening Finding:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Hyperkalemia/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/CRITICAL/i).length).toBeGreaterThan(0);
    });
  });

  it('filters interactions by search query', async () => {
    render(<DrugInteractionPage />);
    const searchInput = screen.getByPlaceholderText(/Search by drug name/i);
    fireEvent.change(searchInput, { target: { value: 'Theophylline' } });

    await waitFor(() => {
      expect(screen.getByText(/Ciprofloxacin \(Ciprocin\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Theophylline/i).length).toBeGreaterThan(0);
    });
  });
});
