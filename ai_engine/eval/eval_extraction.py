"""
Measure prescription extraction accuracy against validated benchmark dataset.
  python eval/eval_extraction.py eval/ground_truth.json --votes 3
ground_truth.json = [{"image": "samples/rx01.jpg", "age": 62, "gender": "Male",
   "medicines": [{"brand_name": "Rolac 10", "dosage_syntax": "1+1+1", "duration_days": 14, "timing": "After Meal"}]}]
"""
import argparse, difflib, json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv
load_dotenv()
from app.pipeline import analyze_prescription_image


def sim(a, b): return difflib.SequenceMatcher(None, "".join(c for c in a.lower() if c.isalnum()),
                                              "".join(c for c in b.lower() if c.isalnum())).ratio()


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("gt"); ap.add_argument("--votes", type=int, default=1)
    a = ap.parse_args()
    cases = json.loads(pathlib.Path(a.gt).read_text())
    tot = dict(gt=0, found=0, pred=0, name=0, dose=0, dur=0, timing=0)
    json_ok = 0
    for c in cases:
        ctx = {k: c[k] for k in ("age", "gender", "weight_kg") if k in c}
        try:
            out = analyze_prescription_image(pathlib.Path(c["image"]).read_bytes(), ctx, votes=a.votes)
            json_ok += 1
        except Exception as e:
            print(f"[FAIL] {c['image']}: {e}"); tot["gt"] += len(c["medicines"]); continue
        pred = out["extracted_prescription"]; tot["pred"] += len(pred)
        for g in c["medicines"]:
            tot["gt"] += 1
            best = max(pred, key=lambda p: sim(g["brand_name"], p["brand_name"]), default=None)
            if not best or sim(g["brand_name"], best["brand_name"]) < 0.75:
                print(f"  missed: {c['image']} -> {g['brand_name']}"); continue
            tot["found"] += 1; tot["name"] += 1
            tot["dose"] += best["dosage_syntax"] == g.get("dosage_syntax")
            tot["dur"] += best["duration_days"] == g.get("duration_days")
            tot["timing"] += best["timing"] == g.get("timing")
            for f, k in (("dosage_syntax", "dose"), ("duration_days", "dur")):
                if best[f] != g.get(f): print(f"  {c['image']} {g['brand_name']} {f}: got {best[f]} expected {g.get(f)}")
    n = max(tot["gt"], 1)
    print("\n=== RESULTS ===")
    print(f"Valid JSON rate        : {json_ok}/{len(cases)} = {json_ok/len(cases):.1%}")
    print(f"Medicine recall        : {tot['found']/n:.1%}")
    print(f"Medicine precision     : {tot['found']/max(tot['pred'],1):.1%}")
    print(f"Dosage syntax accuracy : {tot['dose']/n:.1%}")
    print(f"Duration accuracy      : {tot['dur']/n:.1%}")
    print(f"Timing accuracy        : {tot['timing']/n:.1%}")

main()
