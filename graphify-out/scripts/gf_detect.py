import json
from pathlib import Path
from graphify.detect import detect_incremental

ROOT = Path(".")
result = detect_incremental(ROOT)
Path("graphify-out/.graphify_incremental.json").write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")

new_total = result.get("new_total", 0)
deleted = list(result.get("deleted_files", []))
new_files = result.get("new_files", {})

print("new_total:", new_total)
print("deleted:", len(deleted))
print("total_words:", result.get("total_words", 0))
print("skipped_sensitive:", result.get("skipped_sensitive", []))
for cat, files in new_files.items():
    if files:
        print(f"  {cat}: {len(files)}")
        for f in files[:60]:
            print("    ", f)
        if len(files) > 60:
            print("     ...", len(files) - 60, "more")
for f in deleted[:40]:
    print("  deleted:", f)

Path("graphify-out/.graphify_detect.json").write_text(json.dumps({
    "files": new_files,
    "all_files": result.get("files", {}),
    "total_files": new_total,
    "total_words": result.get("total_words", 0),
    "skipped_sensitive": result.get("skipped_sensitive", []),
    "needs_graph": True,
}, ensure_ascii=False), encoding="utf-8")

code_exts = {'.py','.ts','.js','.go','.rs','.java','.cpp','.c','.rb','.swift','.kt','.cs','.scala','.php','.cc','.cxx','.hpp','.h','.kts','.lua','.toc','.f','.F','.f90','.F90','.f95','.F95','.f03','.F03','.f08','.F08','.jsx','.tsx','.mjs','.cjs'}
all_changed = [f for files in new_files.values() for f in files]
code_only = all(Path(f).suffix.lower() in code_exts for f in all_changed)
print("code_only:", code_only)
print("non_code_changed:", [f for f in all_changed if Path(f).suffix.lower() not in code_exts][:40])
