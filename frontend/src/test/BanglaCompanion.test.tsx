import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BanglaPatientCompanion } from '@/components/clinical/BanglaPatientCompanion';
import { DEMO_ANALYSIS_RESULT } from '@/constants';

describe('BanglaPatientCompanion', () => {
  const data = DEMO_ANALYSIS_RESULT.bangla_companion;

  it('renders Bangla title and patient instruction cards in Bangla mode', () => {
    render(<BanglaPatientCompanion data={data} patientName="Md. Rafiqul Islam" lang="bn" />);
    expect(screen.getByText(/সহজ বাংলা রোগী নির্দেশিকা/i)).toBeInTheDocument();
    expect(screen.getByText(/বিজরান ৫\/২০/i)).toBeInTheDocument();
    expect(screen.getByText(/রোলাক ১০/i)).toBeInTheDocument();
  });

  it('displays critical safety alert in Bengali in Bangla mode', () => {
    render(<BanglaPatientCompanion data={data} patientName="Md. Rafiqul Islam" lang="bn" />);
    expect(screen.getByText(/জরুরী স্বাস্থ্য সতর্কতা/i)).toBeInTheDocument();
    expect(
      screen.getByText(/কিডনির ক্রিয়েটিনিন মাত্রা বেশি থাকায় রোলাক/i)
    ).toBeInTheDocument();
  });

  it('renders English title, labels, and instruction cards in English mode', () => {
    render(<BanglaPatientCompanion data={data} patientName="Md. Rafiqul Islam" lang="en" />);
    expect(screen.getByText(/Patient Medication Companion/i)).toBeInTheDocument();
    expect(screen.getByText(/Bizoran 5\/20/i)).toBeInTheDocument();
    expect(screen.getByText(/Rolac 10/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Important Safety Warning/i })).toBeInTheDocument();
    expect(screen.getByText(/Medication Schedule & Instructions/i)).toBeInTheDocument();
  });

  it('triggers speech synthesis when clicking listen button', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline test fallback'));
    const voicesSpy = vi
      .spyOn(window.speechSynthesis, 'getVoices')
      .mockReturnValue([{ lang: 'bn-BD', name: 'Bangla Voice' } as SpeechSynthesisVoice]);
    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak');

    render(<BanglaPatientCompanion data={data} patientName="Md. Rafiqul Islam" lang="bn" />);
    const listenBtn = screen.getByRole('button', { name: /শব্দে শুনুন/i });
    expect(listenBtn).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(listenBtn);
      await Promise.resolve();
    });
    expect(speakSpy).toHaveBeenCalled();
    // Button state toggles to Stop
    expect(screen.getByText(/বন্ধ করুন/i)).toBeInTheDocument();
    fetchSpy.mockRestore();
    voicesSpy.mockRestore();
    speakSpy.mockRestore();
  });

  it('triggers print card when clicking print button', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<BanglaPatientCompanion data={data} patientName="Md. Rafiqul Islam" lang="bn" />);
    const printBtn = screen.getByRole('button', { name: /প্রিন্ট করুন/i });
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('renders visual dose pictograms and toggles daily dose reminder', () => {
    render(<BanglaPatientCompanion data={data} patientName="Md. Rafiqul Islam" lang="bn" />);
    const mornBtns = screen.getAllByRole('button', { name: /সকাল/i });
    expect(mornBtns.length).toBeGreaterThan(0);
    fireEvent.click(mornBtns[0]);
    expect(screen.getByRole('button', { name: /SMS কপি/i })).toBeInTheDocument();
  });
});
