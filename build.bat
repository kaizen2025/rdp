@echo off
REM ============================================
REM Script de Build Automatisé - RDS Viewer (v2)
REM ============================================

echo.
echo ========================================
echo  BUILD PORTABLE - RDS VIEWER ANECOOP
echo ========================================
echo.

REM Couleurs pour le terminal
color 0A

echo [1/5] Nettoyage des anciens builds...
echo.

REM --- AMÉLIORATION 1 : Tuer le processus de l'application si elle est en cours ---
echo Tentative de fermeture de l'application existante...
taskkill /F /IM "RDS Viewer Anecoop*.exe" /T >nul 2>&1
echo.

if exist "build" (
    echo Suppression du dossier build...
    rmdir /s /q build
)
if exist "dist" (
    echo Suppression du dossier dist...
    rmdir /s /q dist
)
if exist "node_modules\.cache" (
    echo Suppression du cache...
    rmdir /s /q node_modules\.cache
)
echo ✓ Nettoyage termine
echo.

echo [2/5] Verification de la configuration...
echo.
findstr /C:"\"homepage\": \"./\"" package.json >nul
if errorlevel 1 (
    echo ⚠ ATTENTION: Verifiez que package.json contient "homepage": "./"
    pause
)
echo ✓ Configuration OK
echo.

echo [3/5] Build React (optimise, sans source maps)...
echo.
call npm run build:fast
if errorlevel 1 (
    echo ❌ ERREUR lors du build React
    pause
    exit /b 1
)
echo ✓ Build React termine
echo.

echo [4/5] Copie des fichiers Electron...
echo.
call npm run copy-electron
if errorlevel 1 (
    echo ❌ ERREUR lors de la copie des fichiers
    pause
    exit /b 1
)
echo ✓ Fichiers copies
echo.

echo Verification de la structure du build...
if not exist "build\index.html" (
    echo ❌ ERREUR: build\index.html manquant
    pause
    exit /b 1
)
if not exist "build\electron\main.js" (
    echo ❌ ERREUR: build\electron\main.js manquant
    pause
    exit /b 1
)
if not exist "build\preload.js" (
    echo ❌ ERREUR: build\preload.js manquant
    pause
    exit /b 1
)
echo ✓ Structure du build OK
echo.

echo [5/5] Generation de l'executable portable...
echo.
echo Cela peut prendre plusieurs minutes...
echo.

REM --- AMÉLIORATION 2 : Utiliser le script npm pour lancer electron-builder ---
REM Ceci est la correction principale. On appelle le script "package:portable"
REM qui est défini dans votre package.json. npm saura trouver electron-builder.
call npm run package:portable
if errorlevel 1 (
    echo ❌ ERREUR lors de la generation de l'executable
    pause
    exit /b 1
)
echo.

echo ========================================
echo  ✓✓✓ BUILD TERMINE AVEC SUCCES ✓✓✓
echo ========================================
echo.
echo L'executable portable se trouve dans: dist\
echo.

REM Afficher le nom du fichier généré
for %%f in (dist\*.exe) do echo Fichier genere: %%f
echo.

REM Ouvrir le dossier dist
echo Ouverture du dossier dist...
start explorer dist

echo.
echo Appuyez sur une touche pour fermer...
pause >nul