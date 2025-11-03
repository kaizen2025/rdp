@echo off
:: Script de demarrage robuste RDS Viewer
:: Version: 1.0 - 2025-11-03

echo ============================================
echo  DEMARRAGE RDS VIEWER - MODE ROBUSTE
echo ============================================
echo.

:: Etape 1: Nettoyer les processus existants
echo [1/5] Nettoyage des processus existants...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM electron.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo       OK - Processus nettoyes
echo.

:: Etape 2: Verifier que npm est installe
echo [2/5] Verification npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo       ERREUR: npm n'est pas installe ou pas dans PATH
    pause
    exit /b 1
)
echo       OK - npm detecte
echo.

:: Etape 3: Verifier les dependances
echo [3/5] Verification node_modules...
if not exist "node_modules\" (
    echo       ATTENTION: node_modules manquant
    echo       Installation des dependances...
    call npm install
    if errorlevel 1 (
        echo       ERREUR lors de l'installation
        pause
        exit /b 1
    )
)
echo       OK - Dependances presentes
echo.

:: Etape 4: Demarrer le backend en arriere-plan
echo [4/5] Demarrage du backend...
start "RDS Backend" cmd /k "title RDS Backend && npm run server:start"
echo       Attente du demarrage du backend (20 secondes)...
timeout /t 20 /nobreak >nul
echo       OK - Backend demarre
echo.

:: Etape 5: Demarrer React et Electron
echo [5/5] Demarrage React + Electron...
echo       Cela peut prendre 30-60 secondes...
echo.
start "RDS React+Electron" cmd /k "title RDS React+Electron && concurrently -k \"npm run start:auto\" \"wait-on http://localhost:3000 && npm run electron:dev\""

echo.
echo ============================================
echo  DEMARRAGE EN COURS
echo ============================================
echo.
echo Deux fenetres de terminal se sont ouvertes:
echo   1. "RDS Backend" - Serveur Node.js
echo   2. "RDS React+Electron" - Interface React + Electron
echo.
echo Attendez que la fenetre Electron s'ouvre (30-60s)
echo.
echo Pour arreter l'application:
echo   - Fermez la fenetre Electron
echo   - Fermez les deux fenetres de terminal
echo.
echo ============================================
pause
