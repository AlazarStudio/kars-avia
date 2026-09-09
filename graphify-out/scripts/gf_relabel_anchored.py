"""Hand labels by ANCHOR (a node label, e.g. a file basename) instead of community id:
ids are renumbered on every cluster(), so gf_relabel.py's HAND dict rots after one run.

A name is applied to the community that contains the anchor node only when that
community's current label is "bad": generic `Community N`, a bare path token
(no space and no Cyrillic, or a file name), or a duplicate of another community's
label. Good labels transferred by gf_finish.py are kept.

Usage: python gf_relabel_anchored.py hand_labels_<repo>.json   (cwd = repo root,
after gf_finish.py). Rewrites graph.json (labels only, partition kept),
GRAPH_REPORT.md and .graphify_labels.json; prints what was applied / skipped and
which of the 40 largest communities are still badly labelled.
"""
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

from graphify.analyze import god_nodes, suggest_questions, surprising_connections
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.export import to_json
from graphify.report import generate

OUT = Path("graphify-out")
hand = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
g = json.loads((OUT / "graph.json").read_text(encoding="utf-8"))
merged = json.loads((OUT / ".graphify_extract.json").read_text(encoding="utf-8"))
detection = json.loads((OUT / ".graphify_detect.json").read_text(encoding="utf-8"))
labels = {int(k): v for k, v in json.loads((OUT / ".graphify_labels.json").read_text(encoding="utf-8")).items()}

communities, cur, by_label = defaultdict(list), {}, defaultdict(list)
for n in g["nodes"]:
    cid = int(n["community"])
    communities[cid].append(n["id"])
    cur[cid] = n.get("community_name")
    by_label[n.get("label", "")].append(cid)
dup = {name for name, c in Counter(cur.values()).items() if c > 1}


def bad(name):
    if not name or re.match(r"^Community \d+$", name):
        return True
    if name in dup:
        return True
    if re.search(r"\.(jsx?|mjs|ts|md|json)$", name):
        return True
    if " " not in name and not re.search(r"[А-Яа-яЁё]", name):
        return True
    return False


applied, skipped, missing = [], [], []
for anchor, name in hand.items():
    cids = by_label.get(anchor)
    if not cids:
        missing.append(anchor)
        continue
    cid = Counter(cids).most_common(1)[0][0]
    if bad(cur.get(cid)) and name not in set(labels.values()):
        labels[cid] = name
        cur[cid] = name
        applied.append((cid, anchor, name))
    else:
        skipped.append((cid, anchor, cur.get(cid)))

G = build_from_json(merged, root=".", directed=False)
comm = dict(communities)
cohesion = score_all(G, comm)
gods = god_nodes(G)
surprises = surprising_connections(G, comm)
questions = suggest_questions(G, comm, labels)
if not to_json(G, comm, str(OUT / "graph.json"), community_labels=labels):
    raise SystemExit("to_json refused (shrink guard) — unexpected on relabel")
det = dict(detection)
if detection.get("all_files"):
    det["files"] = detection["all_files"]
    det["total_files"] = sum(len(v) for v in detection["all_files"].values())
tokens = {"input": merged.get("input_tokens", 0), "output": merged.get("output_tokens", 0)}
report = generate(G, comm, cohesion, labels, gods, surprises, det, tokens, ".", suggested_questions=questions)
(OUT / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")
(OUT / ".graphify_labels.json").write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False), encoding="utf-8")

print(f"applied {len(applied)}: " + "; ".join(f"{c}:{a} -> {n}" for c, a, n in applied))
print(f"skipped {len(skipped)}: " + "; ".join(f"{c}:{a} keeps '{n}'" for c, a, n in skipped))
print("missing anchors:", missing)
top = sorted(comm.items(), key=lambda kv: -len(kv[1]))[:40]
dup = {name for name, c in Counter(labels[c] for c, _ in comm.items()).items() if c > 1}
print("top-40 still badly labelled:", [(c, len(m), labels.get(c)) for c, m in top if bad(labels.get(c))])
