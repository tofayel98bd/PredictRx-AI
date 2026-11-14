import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { MEDICAL_SAFETY_DISCLAIMER } from '@/constants';

describe('Medical Safety Disclaimer', () => {
  it('displays mandatory clinician decision support disclaimer in footer layout', () => {
    render(
      <ThemeProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </ThemeProvider>
    );

    expect(screen.getByText(MEDICAL_SAFETY_DISCLAIMER)).toBeInTheDocument();
  });
});
