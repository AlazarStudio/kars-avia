"""Apply hand labels to the largest communities, keeping the partition already
exported in graph.json (cluster() would renumber). Rewrites graph.json (labels),
GRAPH_REPORT.md and .graphify_labels.json. cwd = repo root."""
import json
from pathlib import Path
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json

OUT = Path("graphify-out")
HAND = {
    0: "GraphQL: ядро запросов и формы заявок",
    1: "Роли, шапка и реестры договоров",
    2: "UI-примитивы: Button, MUILoader, Toast, Sidebar",
    3: "ФАП: страницы услуг и константы",
    4: "ФАП: книга отчёта Excel (buildReportSheets)",
    5: "Категории номеров и цены авиакомпании",
    6: "TravelLine: поиск, бронирование, синхронизация",
    7: "Сессия и контексты: getCookie, useToast, useDialog, JWT",
    8: "README: история версий",
    9: "ФАП: багаж и поездки",
    10: "SettingsSidebar: права отдела и уведомления",
    11: "ФАП: деталка заявки, проживание, доступ к отчёту",
    12: "Системные уведомления и патч-ноуты",
    13: "Резерв и размещение представителя",
    14: "Документация: редактор Tiptap и расширения",
    15: "ФАП: страницы-роуты и гейты доступа",
    16: "Меню, роли и эффективные права",
    17: "Договоры: формы создания и правки",
    18: "ФАП: реестр и группы пассажиров",
    19: "Авторизация: App, AuthContext, authService",
    20: "Карточки «О компании» и медиа (getMediaUrl)",
    21: "Документация: медиа-блоки редактора",
    22: "Номерной фонд и заявки представителя",
    23: "AddressField и геосаджест",
    24: "HotelPMS (мок-данные)",
    25: "ФАП: отчёт по гостинице (FapHotelPage)",
    26: "Документация: тулбар и экспорт в Office",
    27: "access.js: предикаты ролей и гостиницы",
}

merged = json.loads((OUT / ".graphify_extract.json").read_text(encoding="utf-8"))
detection = json.loads((OUT / ".graphify_detect.json").read_text(encoding="utf-8"))
labels = {int(k): v for k, v in json.loads((OUT / ".graphify_labels.json").read_text(encoding="utf-8")).items()}
g = json.loads((OUT / "graph.json").read_text(encoding="utf-8"))

communities = {}
for n in g["nodes"]:
    communities.setdefault(int(n["community"]), []).append(n["id"])
missing = [cid for cid in HAND if cid not in communities]
if missing:
    raise SystemExit(f"hand-label ids not in partition: {missing}")
labels.update(HAND)

G = build_from_json(merged, root=".", directed=False)
cohesion = score_all(G, communities)
gods = god_nodes(G)
surprises = surprising_connections(G, communities)
questions = suggest_questions(G, communities, labels)
wrote = to_json(G, communities, str(OUT / "graph.json"), community_labels=labels)
if not wrote:
    raise SystemExit("to_json refused (shrink guard) — unexpected on relabel")
det_report = dict(detection)
if detection.get("all_files"):
    det_report["files"] = detection["all_files"]
    det_report["total_files"] = sum(len(v) for v in detection["all_files"].values())
tokens = {"input": merged.get("input_tokens", 0), "output": merged.get("output_tokens", 0)}
report = generate(G, communities, cohesion, labels, gods, surprises, det_report, tokens, ".", suggested_questions=questions)
(OUT / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")
(OUT / ".graphify_labels.json").write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False), encoding="utf-8")
hand = sum(1 for cid in communities if cid in HAND)
print(f"relabelled: {hand} by hand, {len(communities) - hand} auto; graph.json + GRAPH_REPORT.md rewritten ({G.number_of_nodes()} nodes, {len(communities)} communities)")
