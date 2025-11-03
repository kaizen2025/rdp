@echo off
echo ================================================
echo    DOCUCORTEX IA - CORRECTION PACKAGE.JSON
echo ================================================
echo.
echo Suppression de l'ancien package.json...
del package.json

echo.
echo Creation du nouveau package.json minimal...
echo { > package.json
echo   "name": "docucortex-ia", >> package.json
echo   "version": "3.0.26", >> package.json  
echo   "description": "DocuCortex IA - Gestionnaire avec Intelligence Artificielle", >> package.json
echo   "main": "electron/main.js", >> package.json
echo   "homepage": "./", >> package.json
echo   "scripts": { >> package.json
echo     "start": "react-scripts start", >> package.json
echo     "build": "react-scripts build", >> package.json
echo     "server:start": "node server/server.js", >> package.json
echo     "electron:dev": "electron .", >> package.json
echo     "dev": "concurrently \"npm run server:start\" \"npm run start\"", >> package.json
echo     "build:exe": "npm run build && electron-builder --win portable" >> package.json
echo   }, >> package.json
echo   "dependencies": { >> package.json
echo     "react": "^18.2.0", >> package.json
echo     "react-dom": "^18.2.0", >> package.json
echo     "react-router-dom": "^6.23.1", >> package.json
echo     "@mui/material": "^5.15.15", >> package.json
echo     "@mui/icons-material": "^5.15.15", >> package.json
echo     "axios": "^1.7.2", >> package.json
echo     "express": "^4.19.2", >> package.json
echo     "cors": "^2.8.5", >> package.json
echo     "better-sqlite3": "^12.4.1", >> package.json
echo     "ws": "^8.18.3", >> package.json
echo     "electron-is-dev": "2.0.0", >> package.json
echo     "electron-log": "^5.2.4", >> package.json
echo     "electron-updater": "^6.3.9", >> package.json
echo     "tesseract.js": "^5.1.1" >> package.json
echo   }, >> package.json
echo   "devDependencies": { >> package.json
echo     "react-scripts": "5.0.1", >> package.json
echo     "electron": "^31.0.0", >> package.json
echo     "electron-builder": "^25.1.8", >> package.json
echo     "concurrently": "^8.2.2", >> package.json
echo     "rimraf": "^6.0.1" >> package.json
echo   }, >> package.json
echo   "build": { >> package.json
echo     "appId": "com.docucortex.ia", >> package.json
echo     "productName": "DocuCortex IA", >> package.json
echo     "win": { >> package.json
echo       "target": "portable" >> package.json
echo     }, >> package.json
echo     "portable": { >> package.json
echo       "artifactName": "DocuCortex-IA-^${version}-portable.exe" >> package.json
echo     } >> package.json
echo   } >> package.json
echo } >> package.json

echo.
echo ✅ Package.json créé avec succès !
echo.
echo Suppression de node_modules et package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo ================================================
echo      PREPARATION TERMINEE
echo ================================================
echo.
echo Maintenant exécutez :
echo npm install
echo.
pause