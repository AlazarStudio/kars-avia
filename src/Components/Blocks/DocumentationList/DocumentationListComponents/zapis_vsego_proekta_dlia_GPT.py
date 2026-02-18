# import os

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# OUTPUT_FILE = "КОД ВЫБРАННЫХ ФАЙЛОВ1.txt"

# def should_include(path, include_dirs):
#     return any(path.startswith(d) for d in include_dirs)

# def dump_files(include_dirs):
#     with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
#         for root, _, files in os.walk(BASE_DIR):
#             rel_root = os.path.relpath(root, BASE_DIR)

#             if not should_include(rel_root, include_dirs):
#                 continue

#             for file in files:
#                 if file.endswith((".js", ".jsx", ".ts", ".tsx", ".css", ".json", ".py")):
#                     full_path = os.path.join(root, file)
#                     rel_path = os.path.relpath(full_path, BASE_DIR)

#                     out.write(f"{rel_path}\n")
#                     try:
#                         with open(full_path, "r", encoding="utf-8") as f:
#                             out.write(f.read())
#                     except Exception as e:
#                         out.write(f"// ERROR READING FILE: {e}")

#                     out.write("\n\n" + "-" * 60 + "\n\n")

# if __name__ == "__main__":
#     print("Введите папки для экспорта (через запятую), например:")
#     print("src,src/components,src/api")
#     raw = input(">>> ")

#     include_dirs = [p.strip() for p in raw.split(",")]
#     dump_files(include_dirs)

#     print(f"\nГотово. Результат записан в {OUTPUT_FILE}")
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = "КОД ВЫБРАННЫХ ФАЙЛОВ1.txt"

def dump_files(include_paths):
    include_paths = [os.path.normpath(p) for p in include_paths if p.strip()]
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        # Сначала соберем ВСЕ подходящие файлы
        all_files = []
        
        for root, dirs, files in os.walk(BASE_DIR):
            # Убираем скрытые папки из списка для обхода
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file in files:
                if file.endswith((".js", ".jsx", ".ts", ".tsx", ".css", ".json", ".py")):
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, BASE_DIR)
                    
                    # Пропускаем файлы в корне
                    if os.path.dirname(rel_path) == "":
                        continue
                    
                    all_files.append(rel_path)
        
        # Теперь фильтруем файлы по указанным путям
        for file_path in all_files:
            include_this_file = False
            
            for include_path in include_paths:
                # Проверяем разные варианты
                if file_path == include_path:  # Точно указан этот файл
                    include_this_file = True
                    break
                
                # Проверяем, находится ли файл в указанной папке или ее подпапках
                # Например: file_path = "src/components/ui/Button.jsx"
                # include_path = "src" → True
                # include_path = "src/components" → True
                # include_path = "src/components/ui" → True
                
                # Нормализуем для сравнения
                norm_file_path = file_path.replace("\\", "/")
                norm_include_path = include_path.replace("\\", "/")
                
                if norm_file_path.startswith(norm_include_path + "/"):
                    include_this_file = True
                    break
            
            if not include_this_file:
                continue
            
            # Записываем файл
            full_path = os.path.join(BASE_DIR, file_path)
            out.write(f"{file_path}\n")
            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    out.write(f.read())
            except Exception as e:
                out.write(f"// ERROR READING FILE: {e}")

            out.write("\n\n" + "-" * 60 + "\n\n")

if __name__ == "__main__":
    print("Введите файлы или папки для экспорта (через запятую), например:")
    print("src/App.jsx,src/components,src/components/ui")
    print("Или просто: src")
    raw = input(">>> ")

    include_paths = [p.strip() for p in raw.split(",") if p.strip()]
    
    dump_files(include_paths)

    print(f"\nГотово. Результат записан в {OUTPUT_FILE}")