import json, sys
from pathlib import Path
from graphify.extract import collect_files, extract

detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
code_files = []
for f in detect.get('files', {}).get('code', []):
    p = Path(f)
    code_files.extend(collect_files(p) if p.is_dir() else [p])
print('code files:', len(code_files))
nodes, edges, seen = [], [], set()
zero = []
B = 8
for i in range(0, len(code_files), B):
    chunk = code_files[i:i+B]
    r = extract(chunk, cache_root=Path('.'))
    got = {n.get('source_file') for n in r['nodes']}
    for n in r['nodes']:
        if n['id'] not in seen:
            seen.add(n['id']); nodes.append(n)
    edges.extend(r['edges'])
    print(f'  batch {i//B+1}: {len(r["nodes"])} nodes / {len(r["edges"])} edges', flush=True)
Path('graphify-out/.graphify_ast.json').write_text(json.dumps({'nodes': nodes, 'edges': edges, 'input_tokens': 0, 'output_tokens': 0}, indent=2, ensure_ascii=False), encoding='utf-8')
srcs = {n.get('source_file') for n in nodes}
print(f'AST TOTAL: {len(nodes)} nodes, {len(edges)} edges, source files covered: {len(srcs)}')
