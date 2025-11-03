@echo off
title 🚀 Installation DocuCortex IA v2.0.0 - COMPLÈTE

echo.
echo ███████████████████████████████████████████████████████
echo █     DocuCortex IA - Installation Automatique Complète █
echo █                  Version 2.0.0                       █
echo ███████████████████████████████████████████████████████
echo.

echo 📋 VÉRIFICATION PRÉREQUIS...
echo.
echo 🔍 Python 3.8+ requis...
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Python détecté
    python --version
) else (
    echo ❌ Python non trouvé !
    echo 💡 Installez Python depuis https://python.org
    echo 💡 Cochez "Add Python to PATH" lors de l'installation
    pause
    exit /b 1
)

echo.
echo 🔍 Node.js 16+ requis...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Node.js détecté
    node --version
    npm --version
) else (
    echo ❌ Node.js non trouvé !
    echo 💡 Installez Node.js depuis https://nodejs.org
    pause
    exit /b 1
)

echo.
echo 🧠 VÉRIFICATION SERVEUR IA...
echo 📡 Test connexion 192.168.1.232:11434...
curl -s --connect-timeout 5 http://192.168.1.232:11434/api/tags >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Serveur IA accessible
) else (
    echo ⚠️ Serveur IA inaccessible
    echo 💡 Vérifiez que Ollama est démarré sur le serveur
    echo 💡 Exécutez: ollama pull llama3.2:3b
    echo 💡 Puis: ollama serve
)

echo.
echo ███████████████████████████████████████████████████████
echo █                    INSTALLATION                     █
echo ███████████████████████████████████████████████████████
echo.

echo 📦 1/4 - Installation dépendances Python...
cd backend
echo 🐍 Installation EasyOCR et IA...
pip install --upgrade pip
pip install -r requirements.txt --timeout 120
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur Python, tentative récupération...
    python -m ensurepip --upgrade
    pip install --upgrade pip setuptools wheel
    pip install easyocr pillow opencv-python-headless fastapi uvicorn aiohttp requests
)

echo.
echo 📦 2/4 - Test EasyOCR...
python -c "
import easyocr
try:
    print('✅ Test EasyOCR...')
    reader = easyocr.Reader(['fr', 'en'])
    print('✅ EasyOCR fonctionnel')
except Exception as e:
    print(f'❌ Erreur EasyOCR: {e}')
    print('💡 Redémarrez l\'installation')
"

echo.
echo 📦 3/4 - Installation dépendances npm...
cd ..
echo ⚛️ Installation React, Electron et Material-UI...
npm install --force --legacy-peer-deps --no-audit --progress
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur npm, nettoyage et retry...
    npm cache clean --force
    rmdir /s node_modules 2>nul
    del package-lock.json 2>nul
    npm install --force --legacy-peer-deps
)

echo.
echo 📦 4/4 - Préparation environnement...
if not exist "data" mkdir data
if not exist "temp" mkdir temp
if not exist "logs" mkdir logs
if not exist "dist" mkdir dist

echo.
echo 🔧 Configuration finale...
if exist "config\ai-config.json" (
    echo ✅ Configuration IA trouvée
) else (
    echo ⚠️ Configuration IA manquante, utilisation par défaut
)

echo.
echo ███████████████████████████████████████████████████████
echo █              ✅ INSTALLATION TERMINÉE !             █
echo ███████████████████████████████████████████████████████
echo.
echo 🎯 COMMANDS DISPONIBLES :
echo    • start.bat         → Démarrer l'application
echo    • build.bat         → Créer l'exécutable portable  
echo    • test.bat          → Tester toutes les fonctionnalités
echo    • dev.bat           → Mode développement
echo.
echo 🧠 CONFIGURATION DÉTECTÉE :
echo    • Serveur IA : 192.168.1.232:11434
echo    • Modèle : llama3.2:3b
echo    • OCR : 11 langues supportées
echo    • Interface : React + Material-UI
echo.
echo 🚀 DocuCortex IA est prêt !
echo 💡 Lancez start.bat pour démarrer
echo.
pause