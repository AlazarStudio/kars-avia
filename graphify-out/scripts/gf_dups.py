"""Community-name duplicate / sanity report for the current partition (cwd = repo root).

Usage: python gf_dups.py [min_size=13] [--top N]
Prints (1) groups of identical community_name where >=2 communities have >= min_size nodes
(each with top files and top-degree nodes), (2) the N largest communities with their name,
top files and top-degree labels, to eyeball names carried over by the vote onto a split-off
shard that now means something else.
"""
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

args = [a for a in sys.argv[1:] if not a.startswith("--")]
MIN = int(args[0]) if args else 13
TOP = int(sys.argv[sys.argv.index("--top") + 1]) if "--top" in sys.argv else 25

g = json.loads(Path("graphify-out/graph.json").read_text(encoding="utf-8"))
links = g.get("links", g.get("edges", []))
deg = Counter()
for e in links:
    deg[e["source"]] += 1
    deg[e["target"]] += 1

members, name = defaultdict(list), {}
for n in g["nodes"]:
    c = int(n["community"])
    members[c].append(n)
    name[c] = n.get("community_name")


def files_of(ns, k=3):
    return Counter((n.get("source_file") or "").replace("\\", "/").split("/")[-1] for n in ns).most_common(k)


def tops(ns, k=4):
    return [n.get("label") for n in sorted(ns, key=lambda n: -deg[n["id"]])[:k]]


by_name = defaultdict(list)
for c, nm in name.items():
    by_name[nm].append(c)
print(f"== duplicate names (>=2 communities with >= {MIN} nodes) ==")
found = 0
for nm, cids in sorted(by_name.items(), key=lambda kv: str(kv[0])):
    big = [c for c in cids if len(members[c]) >= MIN]
    if len(big) >= 2:
        found += 1
        print(f"[{nm}]")
        for c in sorted(cids, key=lambda c: -len(members[c])):
            print(f"   cid {c:>4} size {len(members[c]):>4} files {files_of(members[c])} top {tops(members[c])}")
print(f"duplicate groups: {found}")

print(f"== top {TOP} communities ==")
for c in sorted(members, key=lambda c: -len(members[c]))[:TOP]:
    print(f"cid {c:>4} size {len(members[c]):>4} [{name[c]}] files {files_of(members[c], 4)} top {tops(members[c])}")
