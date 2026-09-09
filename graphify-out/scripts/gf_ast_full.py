"""Full-corpus AST extraction in ONE extract() call, single process.

Why: cross-file symbol resolution (`imports` / `calls` edges to function nodes of
OTHER files) only works inside one extract() call — batches of 8 (gf_ast_batched.py)
silently drop every edge whose target file is outside the batch (07.09.2026: −523
edges on 100 re-extracted files). The process pool crashes on long lists (05.08 /
02.09), so this runs with parallel=False. Writes graphify-out/.graphify_ast.json.
Run with cwd = repo root, after gf_detect.py.
"""
import json
import time
from pathlib import Path

from graphify.extract import collect_files, extract

OUT = Path("graphify-out")
detect = json.loads((OUT / ".graphify_detect.json").read_text(encoding="utf-8"))
all_code = detect.get("all_files", {}).get("code") or detect.get("files", {}).get("code") or []
files = []
for f in all_code:
    p = Path(f)
    files.extend(collect_files(p) if p.is_dir() else [p])
if not files:
    raise SystemExit("no code files in .graphify_detect.json — run gf_detect.py first")
print("code files:", len(files), flush=True)
t0 = time.time()
r = extract(files, cache_root=Path("."), parallel=False)
nodes, edges = r["nodes"], r["edges"]
def _key(p):
    # node.source_file is relative to cwd; detect paths are absolute — compare resolved
    return str(Path(p).resolve()).replace("\\", "/").lower()


srcs = {_key(n.get("source_file")) for n in nodes if n.get("source_file")}
zero = [str(p) for p in files if _key(p) not in srcs]
(OUT / ".graphify_ast.json").write_text(
    json.dumps({"nodes": nodes, "edges": edges, "input_tokens": 0, "output_tokens": 0}, ensure_ascii=False),
    encoding="utf-8",
)
print(f"AST TOTAL: {len(nodes)} nodes, {len(edges)} edges, files covered {len(srcs)} of {len(files)}, "
      f"zero-node files {len(zero)}, {time.time() - t0:.0f}s")
for z in zero[:15]:
    print("  zero:", z)
