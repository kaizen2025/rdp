@echo off
title 🧪 DocuCortex IA - Tests Complets

echo.
echo ███████████████████████████████████████████████████████
echo █         DocuCortex IA - Suite de Tests Complète      █
echo █                  Version 2.0.0                       █
echo ███████████████████████████████████████████████████████
echo.

echo 🧪 TESTS AUTOMATIQUES DocuCortex IA
echo.

echo 🏥 1/5 - Test environnement...
python --version >nul 2>&1 && echo ✅ Python détecté || echo ❌ Python manquant
node --version >nul 2>&1 && echo ✅ Node.js détecté || echo ❌ Node.js manquant

echo.
echo 🧠 2/5 - Test serveur IA...
echo 📡 Test 192.168.1.232:11434...
curl -s --connect-timeout 5 http://192.168.1.232:11434/api/tags >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Serveur Ollama accessible
    
    echo 🔍 Vérification modèle llama3.2:3b...
    curl -s http://192.168.1.232:11434/api/tags | findstr /C:"llama3.2:3b" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Modèle llama3.2:3b disponible
    ) else (
        echo ⚠️ Modèle llama3.2:3b non trouvé
        echo 💡 Exécutez: ollama pull llama3.2:3b
    )
) else (
    echo ❌ Serveur Ollama inaccessible
    echo 💡 Vérifiez la connectivité réseau
)

echo.
echo 🖼️ 3/5 - Test EasyOCR...
cd backend
python -c "
import easyocr
import sys
try:
    print('🔍 Initialisation EasyOCR...')
    reader = easyocr.Reader(['fr', 'en'], gpu=False)
    print('✅ EasyOCR initialisé')
    
    # Test simple OCR
    import numpy as np
    test_image = np.ones((100, 200, 3), dtype=np.uint8) * 255
    results = reader.readtext(test_image)
    print('✅ OCR test réussi')
except Exception as e:
    print(f'❌ Erreur EasyOCR: {e}')
    sys.exit(1)
"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Test EasyOCR échoué
    echo 💡 Redémarrez l'installation
) else (
    echo ✅ EasyOCR fonctionnel
)
cd ..

echo.
echo 🗄️ 4/5 - Test backend API...
echo 🔍 Démarrage serveur test...
python backend/main.py &
set BACKEND_PID=%!
timeout /t 3 /nobreak >nul

echo 🧪 Test API endpoints...
curl -s http://localhost:8000/health | findstr "healthy" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ API Backend fonctionnel
) else (
    echo ⚠️ API Backend non accessible
)

echo 🔍 Arrêt serveur test...
taskkill /f /pid %BACKEND_PID% 2>nul
timeout /t 1 /nobreak >nul

echo.
echo ⚙️ 5/5 - Test configuration...
if exist "config\ai-config.json" (
    echo ✅ Configuration IA trouvée
    
    echo 🔍 Vérification serveur config...
    type config\ai-config.json | findstr "192.168.1.232" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Configuration serveur correcte
    ) else (
        echo ⚠️ Configuration serveur à vérifier
    )
) else (
    echo ❌ Configuration IA manquante
)

echo.
echo ███████████████████████████████████████████████████████
echo █                RÉSULTATS DES TESTS                  █
echo ███████████████████████████████████████████████████████
echo.
echo ✅ Tests terminés !
echo.
echo 📊 DIAGNOSTIC :
echo    Si des tests échouent, relancez install.bat
echo    Si le serveur IA est inaccessible, vérifiez 192.168.1.232
echo.
echo 🚀 DocuCortex IA est prêt si tous les tests passent !
echo.
pause