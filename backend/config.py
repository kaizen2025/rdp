import os
from pathlib import Path

# Configuration base
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
TEMP_DIR = BASE_DIR / "temp"
LOGS_DIR = BASE_DIR / "logs"

# Créer les dossiers si nécessaire
for dir_path in [DATA_DIR, TEMP_DIR, LOGS_DIR]:
    dir_path.mkdir(exist_ok=True)

# Configuration IA
AI_CONFIG = {
    "base_url": "http://192.168.1.232:11434",
    "model": "llama3.2:3b",
    "timeout": 30
}

# Configuration OCR
OCR_CONFIG = {
    "languages": ["fr", "en", "es", "de", "it", "pt", "ru", "ja", "ko", "zh-cn", "zh-tw"],
    "confidence_threshold": 0.6
}

# Configuration base de données
DATABASE_CONFIG = {
    "path": DATA_DIR / "docucortex.db"
}

print(f"📁 Configuration DocuCortex IA v2.0.0")
print(f"📂 Data: {DATA_DIR}")
print(f"🧠 IA Server: {AI_CONFIG['base_url']}")
print(f"🖼️ OCR: {len(OCR_CONFIG['languages'])} langues")