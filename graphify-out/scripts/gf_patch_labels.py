"""Patch community labels IN PLACE for the current partition — no re-cluster,
no re-extraction (works after cleanup, needs only graph.json).

Usage: python gf_patch_labels.py labels_by_cid.json   (cwd = repo root)
JSON: {"<cid>": "New name", ...}. Rewrites community_name on the nodes of those
communities in graph.json, updates .graphify_labels.json, and replaces the old
label text in GRAPH_REPORT.md when the old label is a unique string of 12+ chars
(bare tokens like "utils" are left alone in the report). Then run
`graphify export html` to refresh graph.html.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

OUT = Path("graphify-out")
patch = {int(k): v for k, v in json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")).items()}
gp = OUT / "graph.json"
g = json.loads(gp.read_text(encoding="utf-8"))
labels_p = OUT / ".graphify_labels.json"
labels = {int(k): v for k, v in json.loads(labels_p.read_text(encoding="utf-8")).items()} if labels_p.exists() else {}

old_by_cid = {}
for n in g["nodes"]:
    old_by_cid.setdefault(int(n["community"]), n.get("community_name"))
missing = [c for c in patch if c not in old_by_cid]
if missing:
    raise SystemExit(f"cids not in partition: {missing}")

changed = Counter()
for n in g["nodes"]:
    c = int(n["community"])
    if c in patch and n.get("community_name") != patch[c]:
        n["community_name"] = patch[c]
        changed[c] += 1
gp.write_text(json.dumps(g, ensure_ascii=False), encoding="utf-8")
labels.update(patch)
labels_p.write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False), encoding="utf-8")

rp = OUT / "GRAPH_REPORT.md"
replaced = []
if rp.exists():
    report = rp.read_text(encoding="utf-8")
    all_old = Counter(old_by_cid.values())
    for c, new in patch.items():
        old = old_by_cid[c]
        if old and len(old) >= 12 and all_old[old] == 1 and old in report:
            report = report.replace(old, new)
            replaced.append(c)
    rp.write_text(report, encoding="utf-8")

for c, new in patch.items():
    print(f"  {c:>4}: '{old_by_cid[c]}' -> '{new}' ({changed[c]} nodes){' +report' if c in replaced else ''}")
print(f"patched {len(patch)} communities; graph.json + .graphify_labels.json written; report labels replaced: {len(replaced)}")
