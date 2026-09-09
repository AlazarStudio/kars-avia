"""graphify --update tail: merge AST + semantic, build_merge with prune, cluster,
transfer labels, export, diagnostics, diff, manifest, cost. Run with cwd = repo root.
Usage: python gf_finish.py [--force] [--tokens IN OUT]
"""
import json, re, sys, glob
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

from graphify.build import build_merge, build_from_json
from graphify.detect import save_manifest
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json
from graphify.diagnostics import diagnose_extraction, format_diagnostic_report
from graphify.cache import save_semantic_cache
from graphify.cli import _stamped_manifest_files

ROOT = "."
OUT = Path("graphify-out")
SPEC = r"C:\Users\mussa\.claude\skills\graphify\references\extraction-spec.md"
FORCE = "--force" in sys.argv
tok_in = tok_out = 0
if "--tokens" in sys.argv:
    i = sys.argv.index("--tokens")
    tok_in, tok_out = int(sys.argv[i + 1]), int(sys.argv[i + 2])

def load(p, default=None):
    p = Path(p)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else default

# ---------- 0. old labels (graph.json community_name, else graph.html) ----------
old_graph = load(OUT / ".graphify_old.json", {"nodes": []})
old_label_by_id = {}
for n in old_graph.get("nodes", []):
    cn = n.get("community_name")
    if cn and not re.match(r"^Community \d+$", cn):
        old_label_by_id[n["id"]] = cn
if not old_label_by_id and (OUT / "graph.html").exists():
    html = (OUT / "graph.html").read_text(encoding="utf-8", errors="ignore")
    for m in re.finditer(r'\{[^{}]*?"id":\s*"([^"]+)"[^{}]*?"community_name":\s*"([^"]*)"[^{}]*?\}', html):
        try:
            name = json.loads('"' + m.group(2) + '"')
        except Exception:
            name = m.group(2)
        if name and not re.match(r"^Community \d+$", name):
            old_label_by_id[m.group(1)] = name
print(f"[labels] old labelled nodes: {len(old_label_by_id)}")

# ---------- 1. semantic: chunks + cache -> .graphify_semantic.json ----------
chunks = sorted(glob.glob(str(OUT / ".graphify_chunk_*.json")))
new_nodes, new_edges, new_hyper = [], [], []
for c in chunks:
    d = load(c, {})
    if not isinstance(d, dict) or "nodes" not in d:
        print(f"[semantic] WARNING chunk invalid: {c}")
        continue
    new_nodes += d.get("nodes", [])
    new_edges += d.get("edges", [])
    new_hyper += d.get("hyperedges", [])
print(f"[semantic] {len(chunks)} chunk(s): {len(new_nodes)} nodes, {len(new_edges)} edges, {len(new_hyper)} hyperedges")
uncached_p = OUT / ".graphify_uncached.txt"
uncached = [l for l in uncached_p.read_text(encoding="utf-8").splitlines() if l] if uncached_p.exists() else []
if chunks and uncached:
    saved = save_semantic_cache(new_nodes, new_edges, new_hyper, root=ROOT, allowed_source_files=uncached, prompt_file=SPEC)
    print(f"[semantic] cached {saved} files")
cached = load(OUT / ".graphify_cached.json", {"nodes": [], "edges": [], "hyperedges": []})
sem_nodes, seen = [], set()
for n in cached["nodes"] + new_nodes:
    if n["id"] not in seen:
        seen.add(n["id"]); sem_nodes.append(n)
sem = {"nodes": sem_nodes, "edges": cached["edges"] + new_edges,
       "hyperedges": cached.get("hyperedges", []) + new_hyper,
       "input_tokens": tok_in, "output_tokens": tok_out}

# ---------- 2. merge AST + semantic -> new extraction ----------
ast = load(OUT / ".graphify_ast.json", {"nodes": [], "edges": []})
seen = {n["id"] for n in ast["nodes"]}
merged_nodes = list(ast["nodes"])
for n in sem["nodes"]:
    if n["id"] not in seen:
        merged_nodes.append(n); seen.add(n["id"])
new_extraction = {"nodes": merged_nodes, "edges": ast["edges"] + sem["edges"],
                  "hyperedges": sem["hyperedges"], "input_tokens": tok_in, "output_tokens": tok_out}
print(f"[extract] new extraction: {len(merged_nodes)} nodes ({len(ast['nodes'])} AST + {len(sem['nodes'])} semantic), {len(new_extraction['edges'])} edges")

# ---------- 3. build_merge into existing graph, prune deleted ----------
incremental = load(OUT / ".graphify_incremental.json")
deleted = list(incremental.get("deleted_files", []))
G = build_merge([new_extraction], graph_path=str(OUT / "graph.json"), prune_sources=deleted or None, root=ROOT, directed=False)
print(f"[merge] merged graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges (pruned {len(deleted)} deleted file(s))")
merged_out = {
    "nodes": [{"id": n, **d} for n, d in G.nodes(data=True)],
    "edges": [{**{k: v for k, v in d.items() if k not in ("_src", "_tgt", "source", "target")},
               "source": d.get("_src", u), "target": d.get("_tgt", v)} for u, v, d in G.edges(data=True)],
    "hyperedges": list(G.graph.get("hyperedges", [])),
    "input_tokens": tok_in, "output_tokens": tok_out,
}
(OUT / ".graphify_extract.json").write_text(json.dumps(merged_out, ensure_ascii=False), encoding="utf-8")

# ---------- 4. build, cluster, analyze ----------
G = build_from_json(merged_out, root=ROOT, directed=False)
if G.number_of_nodes() == 0:
    print("ERROR: Graph is empty"); raise SystemExit(1)
communities = cluster(G)
cohesion = score_all(G, communities)
gods = god_nodes(G)
surprises = surprising_connections(G, communities)

# ---------- 5. labels: majority vote from old labels, else dominant path ----------
def auto_label(members):
    dirs = Counter()
    for m in members:
        sf = (G.nodes[m].get("source_file") or "").replace("\\", "/")
        parts = [p for p in sf.split("/") if p]
        if not parts:
            continue
        key = "/".join(parts[-2:-1]) if len(parts) > 1 else parts[0]
        dirs[key] += 1
    if not dirs:
        return None
    top, cnt = dirs.most_common(1)[0]
    stem = top.rsplit(".", 1)[0]
    stem = re.sub(r"[_\-]+", " ", stem)
    return stem if stem else None

labels, transferred = {}, 0
for cid, members in communities.items():
    votes = Counter(old_label_by_id[m] for m in members if m in old_label_by_id)
    if votes:
        name, cnt = votes.most_common(1)[0]
        if cnt >= max(2, 0.3 * len(members)):
            labels[cid] = name; transferred += 1; continue
    labels[cid] = auto_label(members) or f"Community {cid}"
print(f"[labels] {len(communities)} communities: {transferred} transferred from old, {len(communities) - transferred} auto")

# ---------- 6. export ----------
questions = suggest_questions(G, communities, labels)
wrote = to_json(G, communities, str(OUT / "graph.json"), force=FORCE, community_labels=labels)
if not wrote:
    print("ERROR: to_json refused to shrink graph.json (#479). Old graph kept. Re-run with --force only if the shrink is intentional.")
    raise SystemExit(2)
detection = load(OUT / ".graphify_detect.json", {})
det_report = dict(detection)
if detection.get("all_files"):
    det_report["files"] = detection["all_files"]
    det_report["total_files"] = sum(len(v) for v in detection["all_files"].values())
tokens = {"input": tok_in, "output": tok_out}
report = generate(G, communities, cohesion, labels, gods, surprises, det_report, tokens, ROOT, suggested_questions=questions)
(OUT / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")
(OUT / ".graphify_labels.json").write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False), encoding="utf-8")
print(f"[graph] {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities -> graph.json + GRAPH_REPORT.md written")

# ---------- 7. diagnostics ----------
summary = diagnose_extraction(merged_out, directed=False, root=ROOT)
flags = [f"{summary[k]} {label}" for k, label in (
    ("dangling_endpoint_edges", "dangling-endpoint edges"),
    ("missing_endpoint_edges", "missing-endpoint edges"),
    ("self_loop_edges", "self-loop edges"),
    ("directed_same_endpoint_collapsed_edges", "collapsed (directed) edges"),
    ("undirected_same_endpoint_collapsed_edges", "collapsed (undirected) edges"),
) if summary.get(k, 0)]
print("GRAPH HEALTH WARNING: " + "; ".join(flags) if flags else "Graph health: OK (no dangling/missing/collapsed edges)")

# ---------- 8. diff by id sets ----------
old_ids = {n["id"] for n in old_graph.get("nodes", [])}
new_g = load(OUT / "graph.json")
new_ids = {n["id"] for n in new_g["nodes"]}
old_edges = len(old_graph.get("links", old_graph.get("edges", [])))
new_edges_n = len(new_g.get("links", new_g.get("edges", [])))
added, removed = new_ids - old_ids, old_ids - new_ids
print(f"[diff] nodes {len(old_ids)} -> {len(new_ids)} (+{len(added)} / -{len(removed)}), edges {old_edges} -> {new_edges_n}")
lab = {n["id"]: n.get("label", n["id"]) for n in new_g["nodes"]}
print("[diff] sample new:", ", ".join(lab[i] for i in sorted(added)[:12]))
print("[diff] sample removed:", ", ".join(sorted(removed)[:8]))

# ---------- 9. manifest + cost ----------
_manifest_files = _stamped_manifest_files(incremental["files"], new_extraction, Path(ROOT))
_sem_types = ("document", "paper", "image")
_dispatched = {f for t, fl in incremental.get("new_files", {}).items() if t in _sem_types for f in fl}
_stamped = {f for fl in _manifest_files.values() for f in fl}
_cleared = _dispatched - _stamped
_scan = {f for fl in incremental["files"].values() for f in fl}
save_manifest(_manifest_files, root=ROOT, scan_corpus=_scan, clear_semantic=_cleared or None)
print(f"[manifest] saved; unstamped semantic files (re-queued next time): {len(_cleared)}")
cost_p = OUT / "cost.json"
cost = load(cost_p, {"runs": [], "total_input_tokens": 0, "total_output_tokens": 0})
cost["runs"].append({"date": datetime.now(timezone.utc).isoformat(), "input_tokens": tok_in, "output_tokens": tok_out,
                     "files": incremental.get("new_total", 0)})
cost["total_input_tokens"] += tok_in
cost["total_output_tokens"] += tok_out
cost_p.write_text(json.dumps(cost, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"[cost] this run {tok_in:,} in / {tok_out:,} out; all time {cost['total_input_tokens']:,} / {cost['total_output_tokens']:,} ({len(cost['runs'])} runs)")
print("DONE")
