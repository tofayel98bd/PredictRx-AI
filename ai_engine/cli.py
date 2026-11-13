"""python cli.py rx.jpg --age 62 --gender Male --weight 68 --votes 3"""
import argparse, json, pathlib
from dotenv import load_dotenv
load_dotenv()
from app.pipeline import analyze_prescription_image

p = argparse.ArgumentParser()
p.add_argument("image"); p.add_argument("--age", type=float); p.add_argument("--gender")
p.add_argument("--weight", type=float); p.add_argument("--votes", type=int, default=1)
a = p.parse_args()
ctx = {k: v for k, v in {"age": a.age, "gender": a.gender, "weight_kg": a.weight}.items() if v is not None}
out = analyze_prescription_image(pathlib.Path(a.image).read_bytes(), ctx, votes=a.votes)
print(json.dumps(out, ensure_ascii=False, indent=2))
