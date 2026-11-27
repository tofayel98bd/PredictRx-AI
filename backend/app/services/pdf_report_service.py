"""Bilingual Clinical Decision Support System (CDSS) PDF Report Generator."""

import html as html_lib
import os
import subprocess
import tempfile
from typing import Any, Dict, Optional

from app.core.logging import get_logger
from app.i18n.translator import t

logger = get_logger("app.services.pdf_report")


def _esc(val: Any) -> str:
    return html_lib.escape("" if val is None else str(val))


def find_browser_executable() -> Optional[str]:
    """Locate headless Chromium or Microsoft Edge binary on Windows / Linux."""
    candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        "/usr/bin/chromium-browser",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


class PdfReportService:
    """Generates print-ready, high-fidelity clinical audit PDF reports in English or Bangla."""

    def generate_html(self, report_data: Dict[str, Any], lang: str = "en") -> str:
        """Render complete HTML template with embedded styles and Bangla/English typography."""
        rx_data = report_data.get("prescription_data", {})
        patient = rx_data.get("patient_context", {})
        clinical_risk = rx_data.get("clinical_risk", {})
        interactions = rx_data.get("drug_interactions", [])
        meds = rx_data.get("extracted_prescription", [])
        safer_alts = rx_data.get("safer_alternatives", [])
        shap_factors = clinical_risk.get("shap_features", [])

        is_bn = (lang == "bn")

        # Localized strings
        title = "ক্লিনিক্যাল অডিট ও প্রেসক্রিপশন সিদ্ধান্ত রিপোর্ট" if is_bn else "CDSS Clinical Audit & Decision Report"
        hospital_name = "জাতীয় স্বাস্থ্যবিজ্ঞান ও গবেষণা কেন্দ্র, ঢাকা" if is_bn else "National Health Sciences Center, Dhaka"
        confidential = "গোপনীয় ও বিশেষাধিকারপ্রাপ্ত মেডিকেল রেকর্ড" if is_bn else "Confidential Clinical Healthcare Record"
        rx_ref_label = "প্রেসক্রিপশন রেফারেন্স" if is_bn else "Prescription Ref"
        analysis_ref_label = "বিশ্লেষণ আইডি" if is_bn else "Analysis ID"
        date_label = "তারিখ" if is_bn else "Date"
        patient_info_title = "রোগীর বিবরণ ও ল্যাবরেটরি পরামিতি" if is_bn else "Patient Profile & Laboratory Parameters"
        name_label = "রোগীর নাম" if is_bn else "Patient Name"
        age_gender_label = "বয়স / লিঙ্গ" if is_bn else "Age / Gender"
        egfr_label = "কিডনির কার্যক্ষমতা (eGFR)" if is_bn else "eGFR (Kidney Function)"
        cr_label = "সিরাম ক্রিয়েটিনিন" if is_bn else "Serum Creatinine"
        bp_label = "রক্তচাপ (BP)" if is_bn else "Blood Pressure"
        conditions_label = "পূর্ববর্তী রোগসমূহ" if is_bn else "Diagnosed Conditions"
        
        meds_title = "প্রেসক্রিপশনে নির্দেশিত ওষুধসমূহ (DGDA যাচাইকৃত)" if is_bn else "Prescribed Medications (DGDA Normalization)"
        col_brand = "ব্র্যান্ডের নাম" if is_bn else "Brand Name"
        col_generic = "জেনেরিক নাম" if is_bn else "Generic Name"
        col_strength = "মাত্রা ও রূপ" if is_bn else "Form / Strength"
        col_dosage = "ডোজের নিয়ম" if is_bn else "Dosage Syntax"
        col_duration = "মেয়াদকাল" if is_bn else "Duration"
        col_timing = "নির্দেশনা" if is_bn else "Timing"

        risk_title = "এআই জটিলতা ঝুঁকি ও প্রগনোসিস" if is_bn else "AI Complication Risk Assessment"
        risk_score_label = "সামগ্রিক ঝুঁকি স্কোর" if is_bn else "Overall Risk Score"
        aki_label = "তীব্র কিডনি বিকল ঝুঁকি (AKI)" if is_bn else "Acute Kidney Injury (AKI) Risk"
        gi_label = "পাকস্থলী রক্তক্ষরণ ঝুঁকি (GI Bleed)" if is_bn else "GI Bleed Risk"
        cv_label = "কার্ডিওভাসকুলার চাপ" if is_bn else "Cardiovascular Strain"

        collisions_title = "চিহ্নিত ড্রাগ-ড্রাগ কলিশন ও নিরাপত্তা সতর্কতা" if is_bn else "Detected Drug-Drug Collisions & Safety Alerts"
        col_drugs = "ওষুধসমূহ" if is_bn else "Interacting Pair"
        col_severity = "তীব্রতা" if is_bn else "Severity"
        col_mechanism = "ক্লিনিক্যাল কারণ ও প্রটোকল" if is_bn else "Mechanism & Clinical Protocol"

        shap_title = "SHAP এক্সপ্লেনেবল ফ্যাক্টরস (AI সিদ্ধান্ত যৌক্তিকতা)" if is_bn else "Explainable SHAP Feature Drivers (XAI)"
        disclaimer_title = "চিকিৎসাগত নিরাপত্তা নোটিশ" if is_bn else "Medical Safety Notice"
        disclaimer_text = t("reports.safety_disclaimer", lang=lang)
        sign_label = "দায়িত্বপ্রাপ্ত চিকিৎসকের স্বাক্ষর ও বিএমডিসি নম্বর" if is_bn else "Verified Clinician Signature & BMDC Seal"

        # Risk level color
        score = clinical_risk.get("risk_score", 0)
        risk_class = clinical_risk.get("risk_classification", "LOW")
        risk_color = "#dc2626" if score >= 70 else ("#f97316" if score >= 45 else ("#f59e0b" if score >= 25 else "#10b981"))

        # Build table rows for medications
        med_rows = ""
        for m in meds:
            b_name = m.get("brand_name", "N/A")
            g_name = m.get("generic_name", "N/A")
            f_str = f"{m.get('form', '')} {m.get('strength', '')}".strip()
            d_syn = m.get("dosage_syntax", "1+0+1")
            dur = f"{m.get('duration_days')} days" if m.get("duration_days") else (m.get("duration") or "N/A")
            tim = m.get("timing", "After Meal")
            med_rows += f"""
            <tr>
              <td><strong>{b_name}</strong></td>
              <td class="font-mono">{g_name}</td>
              <td>{f_str}</td>
              <td class="badge-cell">{d_syn}</td>
              <td>{dur}</td>
              <td>{tim}</td>
            </tr>
            """

        # Build table rows for interactions
        inter_rows = ""
        if not interactions:
            inter_rows = f"<tr><td colspan='3' class='empty-cell'>{'কোনো বিপজ্জনক ড্রাগ কলিশন পাওয়া যায়নি।' if is_bn else 'No critical drug collisions detected.'}</td></tr>"
        else:
            for item in interactions:
                sev = str(item.get("severity", "MODERATE")).upper()
                sev_color = "#dc2626" if sev == "CRITICAL" else ("#ea580c" if sev == "HIGH" else "#d97706")
                d_pair = f"{_esc(item.get('drug_a', ''))} + {_esc(item.get('drug_b', ''))}"
                desc = _esc(
                    item.get("clinical_significance")
                    or item.get("clinical_implication")
                    or item.get("mechanism")
                    or item.get("description", "")
                )
                proto = _esc(item.get("recommended_action") or item.get("management_protocol") or "")
                inter_rows += f"""
                <tr>
                  <td><strong>{d_pair}</strong></td>
                  <td><span class="sev-tag" style="background-color: {sev_color}20; color: {sev_color}; border: 1px solid {sev_color}40;">{_esc(sev)}</span></td>
                  <td>
                    <div>{desc}</div>
                    <div class="proto-line"><strong>{'প্রস্তাবিত পদক্ষেপ:' if is_bn else 'Action / Protocol:'}</strong> {proto}</div>
                  </td>
                </tr>
                """

        # Safer Alternatives HTML
        alts_title = "সুপারিশকৃত নিরাপদ বিকল্প (Safer Alternatives)" if is_bn else "Recommended Safer Therapeutic Alternatives"
        alts_html = ""
        for alt in safer_alts[:5]:
            orig = _esc(f"{alt.get('original_brand', '')} ({alt.get('original_generic', '')})")
            repl = _esc(f"{alt.get('alternative_brand', '')} ({alt.get('alternative_generic', '')})")
            rat = _esc(alt.get("clinical_rationale", ""))
            alts_html += f"""
            <div class="shap-box" style="border-left: 3px solid #10b981;">
              <div class="shap-header">
                <span class="shap-name" style="color:#065f46;">{orig} &rarr; {repl}</span>
              </div>
              <p class="shap-desc">{rat}</p>
            </div>
            """

        # Clinician Review Sign-Off HTML
        review = rx_data.get("clinician_review") or {}
        review_html = ""
        if review.get("reviewed"):
            rev_dec = _esc(review.get("decision") or "APPROVED")
            rev_name = _esc(review.get("reviewer_name") or "Verified Clinician")
            rev_lic = _esc(review.get("reviewer_license") or "")
            rev_notes = _esc(review.get("notes") or "")
            rev_ts = _esc(review.get("review_timestamp") or "")
            review_title = "চিকিৎসকের চূড়ান্ত অডিট ও অনুমোদন" if is_bn else "Human-in-the-Loop Clinician Sign-Off"
            review_html = f"""
            <div class="section-title"><span>{review_title}</span></div>
            <div class="shap-box" style="border-left: 3px solid #0284c7; background: #f0f9ff; margin-bottom: 14px;">
              <div class="shap-header">
                <span class="shap-name" style="color:#0c4a6e;">{rev_name} ({rev_lic})</span>
                <span class="shap-score" style="color:#0369a1;">{rev_dec}</span>
              </div>
              <p class="shap-desc">{rev_notes}</p>
              <p class="shap-desc" style="margin-top:4px; font-size:7.5pt; color:#64748b;">Signed: {rev_ts}</p>
            </div>
            """

        # SHAP factor cards
        shap_html = ""
        for s in shap_factors[:4]:
            feat = _esc(s.get("feature", ""))
            score_imp = s.get("impact_score", 0)
            expl = _esc(s.get("clinical_explanation", ""))
            shap_html += f"""
            <div class="shap-box">
              <div class="shap-header">
                <span class="shap-name">{feat}</span>
                <span class="shap-score">{'+' if score_imp >= 0 else ''}{round(score_imp * 100, 1)}%</span>
              </div>
              <p class="shap-desc">{expl}</p>
            </div>
            """

        html = f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<title>{title} — PredictRx-AI</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @page {{
    size: A4 portrait;
    margin: 12mm 14mm 12mm 14mm;
    @bottom-right {{
      content: "Page " counter(page) " of " counter(pages);
      font-size: 8pt;
      color: #64748b;
    }}
  }}
  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}
  body {{
    font-family: 'Hind Siliguri', 'Nirmala UI', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    background: #ffffff;
    line-height: 1.45;
    font-size: 9pt;
    margin: 0;
    padding: 0;
  }}
  .header-card {{
    background: linear-gradient(135deg, #042f2e 0%, #0f766e 55%, #0d9488 100%);
    color: #ffffff;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 12px;
  }}
  .header-top {{
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #99f6e4;
    margin-bottom: 4px;
  }}
  .header-title {{
    font-size: 16pt;
    font-weight: 800;
    margin: 0 0 2px 0;
    color: #ffffff;
  }}
  .header-sub {{
    font-size: 9pt;
    color: #ccfbf1;
    margin: 0 0 10px 0;
  }}
  .meta-grid {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 8pt;
  }}
  .meta-item strong {{
    display: block;
    color: #5eead4;
    font-size: 7pt;
    text-transform: uppercase;
  }}
  .section-title {{
    font-size: 10pt;
    font-weight: 700;
    color: #0f766e;
    border-bottom: 1.5px solid #0f766e30;
    padding-bottom: 4px;
    margin: 12px 0 6px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .patient-table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 8.5pt;
  }}
  .patient-table td {{
    padding: 4px 8px;
    border: 1px solid #e2e8f0;
  }}
  .patient-table td.label {{
    background-color: #f8fafc;
    font-weight: 600;
    width: 25%;
    color: #475569;
  }}
  .data-table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    font-size: 8pt;
  }}
  .data-table th {{
    background-color: #f1f5f9;
    color: #334155;
    font-weight: 700;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    font-size: 7.5pt;
    text-transform: uppercase;
  }}
  .data-table td {{
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }}
  .badge-cell {{
    font-family: monospace;
    font-weight: 700;
    color: #0f766e;
  }}
  .sev-tag {{
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
  }}
  .proto-line {{
    margin-top: 3px;
    font-size: 7.5pt;
    color: #475569;
  }}
  .risk-overview-card {{
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 5px solid {risk_color};
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 10px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }}
  .risk-stat-item strong {{
    display: block;
    font-size: 7.5pt;
    color: #64748b;
    text-transform: uppercase;
  }}
  .risk-stat-val {{
    font-size: 13pt;
    font-weight: 800;
    color: {risk_color};
  }}
  .shap-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }}
  .shap-box {{
    background: #fafafa;
    border: 1px solid #e5e7eb;
    border-radius: 5px;
    padding: 6px 10px;
  }}
  .shap-header {{
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    font-size: 8pt;
    color: #b91c1c;
  }}
  .shap-desc {{
    font-size: 7.5pt;
    color: #4b5563;
    margin: 3px 0 0 0;
    line-height: 1.3;
  }}
  .disclaimer-box {{
    background-color: #fffbeb;
    border: 1px solid #fde68a;
    border-left: 4px solid #f59e0b;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 7.5pt;
    color: #92400e;
    margin-top: 10px;
    line-height: 1.4;
  }}
  .sign-section {{
    margin-top: 14px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 10px;
  }}
  .sign-box {{
    width: 250px;
    border-top: 1px dashed #94a3b8;
    text-align: center;
    padding-top: 4px;
    font-size: 8pt;
    color: #475569;
  }}
</style>
</head>
<body>

<div class="header-card">
  <div class="header-top">
    <span>PredictRx-AI CDSS • {hospital_name}</span>
    <span>{confidential}</span>
  </div>
  <h1 class="header-title">{title}</h1>
  <div class="header-sub">{disclaimer_text[:90]}...</div>
  <div class="meta-grid">
    <div class="meta-item">
      <strong>{rx_ref_label}</strong>
      {rx_data.get('prescription_id', 'RX-2026-001')}
    </div>
    <div class="meta-item">
      <strong>{analysis_ref_label}</strong>
      {rx_data.get('analysis_id', 'AN-2026-0941')}
    </div>
    <div class="meta-item">
      <strong>{date_label}</strong>
      {rx_data.get('timestamp', '2026-11-17')[:10]}
    </div>
    <div class="meta-item">
      <strong>{'ভাষা' if is_bn else 'Locale'}</strong>
      {'বাংলা (bn-BD)' if is_bn else 'English (en-US)'}
    </div>
  </div>
</div>

<div class="section-title">
  <span>{patient_info_title}</span>
</div>
<table class="patient-table">
  <tr>
    <td class="label">{name_label}</td>
    <td><strong>{patient.get('name', 'Mohammad Abdul Karim')}</strong></td>
    <td class="label">{age_gender_label}</td>
    <td>{patient.get('age', 68)} Yrs / {patient.get('gender', 'Male')}</td>
  </tr>
  <tr>
    <td class="label">{egfr_label}</td>
    <td class="badge-cell" style="color: {'#dc2626' if (patient.get('egfr') or 90) < 60 else '#10b981'};">
      {patient.get('egfr', 28.5)} mL/min/1.73m²
    </td>
    <td class="label">{cr_label}</td>
    <td class="badge-cell">{patient.get('creatinine', 2.4)} mg/dL</td>
  </tr>
  <tr>
    <td class="label">{bp_label}</td>
    <td>{patient.get('systolic_bp', 145)}/{patient.get('diastolic_bp', 90)} mmHg</td>
    <td class="label">{conditions_label}</td>
    <td>{', '.join(patient.get('conditions', [])) or 'None reported'}</td>
  </tr>
</table>

<div class="section-title">
  <span>{risk_title}</span>
  <span style="color: {risk_color}; font-weight: 800;">{risk_class} RISK</span>
</div>
<div class="risk-overview-card">
  <div class="risk-stat-item">
    <strong>{risk_score_label}</strong>
    <span class="risk-stat-val">{score}%</span>
  </div>
  <div class="risk-stat-item">
    <strong>{aki_label}</strong>
    <span class="risk-stat-val" style="color: #dc2626;">{clinical_risk.get('aki_risk_percentage', score)}%</span>
  </div>
  <div class="risk-stat-item">
    <strong>{gi_label}</strong>
    <span class="risk-stat-val" style="color: #f97316;">{clinical_risk.get('gi_bleed_risk_percentage', 65)}%</span>
  </div>
  <div class="risk-stat-item">
    <strong>{cv_label}</strong>
    <span class="risk-stat-val" style="color: #0284c7;">{clinical_risk.get('cardiovascular_risk_percentage', 25)}%</span>
  </div>
</div>

<div class="section-title">
  <span>{collisions_title}</span>
</div>
<table class="data-table">
  <thead>
    <tr>
      <th style="width: 25%;">{col_drugs}</th>
      <th style="width: 15%;">{col_severity}</th>
      <th style="width: 60%;">{col_mechanism}</th>
    </tr>
  </thead>
  <tbody>
    {inter_rows}
  </tbody>
</table>

<div class="section-title">
  <span>{meds_title}</span>
</div>
<table class="data-table">
  <thead>
    <tr>
      <th>{col_brand}</th>
      <th>{col_generic}</th>
      <th>{col_strength}</th>
      <th>{col_dosage}</th>
      <th>{col_duration}</th>
      <th>{col_timing}</th>
    </tr>
  </thead>
  <tbody>
    {med_rows}
  </tbody>
</table>

{f'''
<div class="section-title">
  <span>{alts_title}</span>
</div>
<div class="shap-grid">
  {alts_html}
</div>
''' if alts_html else ''}

{f'''
<div class="section-title">
  <span>{shap_title}</span>
</div>
<div class="shap-grid">
  {shap_html}
</div>
''' if shap_html else ''}

{review_html}

<div class="disclaimer-box">
  <strong>{disclaimer_title}:</strong> {disclaimer_text}
</div>

<div class="sign-section">
  <div style="font-size: 7.5pt; color: #64748b;">
    Report ID: REP-{_esc(rx_data.get('prescription_id', '001'))} • Generated by PredictRx-AI v1.4.0
  </div>
  <div class="sign-box">
    {sign_label}
  </div>
</div>

</body>
</html>"""
        return html

    def _write_minimal_pdf(self, lines: list[str], output_path: str) -> str:
        """Zero-dependency valid %PDF-1.4 writer when neither Chromium nor reportlab is installed."""
        safe_lines = [ln.encode("latin-1", errors="replace").decode("latin-1") for ln in lines[:45]]
        escaped = [ln.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") for ln in safe_lines]
        stream_ops = ["BT", "/F1 10 Tf", "40 790 Td", "14 TL"]
        for idx, text in enumerate(escaped):
            stream_ops.append(f"({text}) Tj" if idx == 0 else f"T* ({text}) Tj")
        stream_ops.append("ET")
        stream_bytes = "\n".join(stream_ops).encode("latin-1")

        objs = [
            b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
            b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
            b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
            b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
            f"5 0 obj << /Length {len(stream_bytes)} >>\nstream\n".encode("ascii") + stream_bytes + b"\nendstream endobj\n",
        ]
        pdf = bytearray(b"%PDF-1.4\n")
        offsets = [0]
        for obj in objs:
            offsets.append(len(pdf))
            pdf.extend(obj)
        xref_pos = len(pdf)
        pdf.extend(f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode("ascii"))
        for off in offsets[1:]:
            pdf.extend(f"{off:010d} 00000 n \n".encode("ascii"))
        pdf.extend(f"trailer << /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("ascii"))
        with open(output_path, "wb") as f:
            f.write(pdf)
        return output_path

    def _generate_reportlab_pdf(self, report_data: Dict[str, Any], output_path: str, lang: str = "en") -> str:
        """Pure-Python ReportLab PDF generator for Linux/Docker environments without headless Chromium."""
        rx_data = report_data.get("prescription_data", {})
        patient = rx_data.get("patient_context", {})
        clinical_risk = rx_data.get("clinical_risk", {})
        interactions = rx_data.get("drug_interactions", [])
        meds = rx_data.get("extracted_prescription", [])
        safer_alts = rx_data.get("safer_alternatives", [])
        shap_factors = clinical_risk.get("shap_features", [])
        review = rx_data.get("clinician_review") or {}

        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
        except ImportError:
            logger.warning("reportlab not installed; generating minimal stdlib %PDF-1.4 fallback.")
            lines = [
                f"PredictRx-AI Clinical Audit Report ({lang.upper()})",
                f"Prescription ID: {rx_data.get('prescription_id', 'N/A')}",
                f"Patient: {patient.get('name') or 'Unnamed'} | Age: {patient.get('age')} | eGFR: {patient.get('egfr') or 'N/A'}",
                f"Risk: {clinical_risk.get('risk_classification', 'LOW')} ({clinical_risk.get('risk_score', 0)}%)",
                "--- Prescribed Medications ---",
                *[f"- {m.get('brand_name')} ({m.get('generic_name')}) | {m.get('dosage_syntax')} | {m.get('timing')}" for m in meds],
                "--- Interactions ---",
                *[f"- [{i.get('severity')}] {i.get('drug_a')} + {i.get('drug_b')}: {i.get('clinical_significance') or ''}" for i in interactions],
                "--- Safer Alternatives ---",
                *[f"- {a.get('original_brand')} -> {a.get('alternative_brand')} ({a.get('alternative_generic')})" for a in safer_alts],
            ]
            if review.get("reviewed"):
                lines.append(f"Clinician Sign-Off ({review.get('decision')}): {review.get('reviewer_name')} ({review.get('reviewer_license')})")
            return self._write_minimal_pdf(lines, output_path)

        doc = SimpleDocTemplate(output_path, pagesize=A4, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph("<b>PredictRx-AI (PredictRx BD) — CDSS Clinical Audit Report</b>", styles["Title"]))
        story.append(
            Paragraph(
                f"Prescription Ref: {_esc(rx_data.get('prescription_id', 'N/A'))} | "
                f"Language: {lang.upper()} | Patient: {_esc(patient.get('name') or 'Unnamed')} "
                f"(Age: {_esc(patient.get('age'))}, Gender: {_esc(patient.get('gender'))}, eGFR: {_esc(patient.get('egfr') or 'N/A')})",
                styles["Normal"],
            )
        )
        story.append(Spacer(1, 10))
        story.append(
            Paragraph(
                f"<b>Risk Classification:</b> {_esc(clinical_risk.get('risk_classification', 'LOW'))} "
                f"({round(float(clinical_risk.get('risk_score', 0)), 1)}%) — "
                f"{_esc(clinical_risk.get('calibrated_probability_note', ''))}",
                styles["Normal"],
            )
        )
        story.append(Spacer(1, 12))

        if meds:
            story.append(Paragraph("<b>Prescribed Medications (DGDA Normalization)</b>", styles["Heading3"]))
            med_table = [["Brand", "Generic", "Dosage", "Timing", "Duration"]]
            for m in meds:
                dur = f"{m.get('duration_days')} days" if m.get("duration_days") else (m.get("duration") or "N/A")
                med_table.append([
                    str(m.get("brand_name", "")),
                    str(m.get("generic_name") or "N/A"),
                    str(m.get("dosage_syntax") or "N/A"),
                    str(m.get("timing") or "N/A"),
                    str(dur),
                ])
            t_med = Table(med_table, repeatRows=1)
            t_med.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("PADDING", (0, 0), (-1, -1), 5),
            ]))
            story.append(t_med)
            story.append(Spacer(1, 10))

        if interactions:
            story.append(Paragraph("<b>Detected Drug Interactions & Guardrails</b>", styles["Heading3"]))
            for inter in interactions:
                sig = inter.get("clinical_significance") or inter.get("mechanism") or ""
                act = inter.get("recommended_action") or ""
                story.append(
                    Paragraph(
                        f"<b>[{_esc(inter.get('severity'))}] {_esc(inter.get('drug_a'))} + {_esc(inter.get('drug_b'))}:</b> "
                        f"{_esc(sig)} <i>Action: {_esc(act)}</i>",
                        styles["Normal"],
                    )
                )
            story.append(Spacer(1, 8))

        if safer_alts:
            story.append(Paragraph("<b>Safer Therapeutic Alternatives</b>", styles["Heading3"]))
            for alt in safer_alts:
                story.append(
                    Paragraph(
                        f"Replace <b>{_esc(alt.get('original_brand'))}</b> with "
                        f"<b>{_esc(alt.get('alternative_brand'))} ({_esc(alt.get('alternative_generic'))})</b>: "
                        f"{_esc(alt.get('clinical_rationale'))}",
                        styles["Normal"],
                    )
                )
            story.append(Spacer(1, 8))

        if shap_factors:
            story.append(Paragraph("<b>Explainable AI (SHAP Feature Drivers)</b>", styles["Heading3"]))
            for s in shap_factors[:5]:
                pct = round(float(s.get("impact_score", 0)) * 100, 1)
                story.append(
                    Paragraph(
                        f"• <b>{_esc(s.get('feature'))}</b> ({'+' if pct >= 0 else ''}{pct}%): "
                        f"{_esc(s.get('clinical_explanation'))}",
                        styles["Normal"],
                    )
                )
            story.append(Spacer(1, 8))

        if review.get("reviewed"):
            story.append(
                Paragraph(
                    f"<b>Clinician Sign-Off ({_esc(review.get('decision'))}):</b> "
                    f"{_esc(review.get('reviewer_name'))} ({_esc(review.get('reviewer_license'))}) — {_esc(review.get('notes'))}",
                    styles["Normal"],
                )
            )
            story.append(Spacer(1, 8))

        story.append(Paragraph(f"<i>{_esc(t('reports.safety_disclaimer', lang='en'))}</i>", styles["Normal"]))
        doc.build(story)
        return output_path

    def generate_pdf(
        self,
        report_data: Dict[str, Any],
        output_path: Optional[str] = None,
        lang: str = "en",
    ) -> str:
        """
        Compile bilingual HTML report and render to PDF via headless Chromium,
        falling back cleanly to ReportLab pure-Python PDF generation when no browser binary exists.
        """
        html_content = self.generate_html(report_data, lang=lang)
        temp_dir = tempfile.gettempdir()
        temp_html = os.path.join(temp_dir, f"report_{lang}_{os.getpid()}.html")
        temp_pdf = os.path.join(temp_dir, f"report_{lang}_{os.getpid()}.pdf")
        final_path = output_path or os.path.join(temp_dir, f"PredictRx_Report_{lang}_{os.getpid()}.pdf")

        browser_path = find_browser_executable()
        if browser_path:
            try:
                with open(temp_html, "w", encoding="utf-8") as f:
                    f.write(html_content)
                cmd = [
                    browser_path,
                    "--headless",
                    "--no-sandbox",
                    "--disable-gpu",
                    f"--print-to-pdf={temp_pdf}",
                    f"file:///{temp_html.replace(os.sep, '/')}",
                ]
                logger.info(f"Rendering {lang} PDF via {browser_path}...")
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                if res.returncode == 0 and os.path.exists(temp_pdf):
                    with open(temp_pdf, "rb") as src, open(final_path, "wb") as dst:
                        dst.write(src.read())
                    logger.info(f"Successfully generated bilingual PDF at {final_path} ({os.path.getsize(final_path)} bytes)")
                    return final_path
            except Exception as exc:
                logger.warning(f"Headless browser PDF failed ({exc}); falling back to ReportLab.")
            finally:
                for tmp in (temp_html, temp_pdf):
                    if os.path.exists(tmp) and tmp != final_path:
                        try:
                            os.remove(tmp)
                        except OSError:
                            pass

        logger.info("Using ReportLab pure-Python PDF generator fallback.")
        return self._generate_reportlab_pdf(report_data, final_path, lang=lang)


# Singleton instance
pdf_report_service = PdfReportService()
