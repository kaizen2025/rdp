# Script d'installation automatique de Guacamole avec MySQL pour WINDOWS
# Utilisation : Clic-droit > "Exécuter avec PowerShell"
# Ou : powershell -ExecutionPolicy Bypass -File install-guacamole.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Installation Guacamole + MySQL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker est installé
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "❌ Docker n'est pas installé !" -ForegroundColor Red
    Write-Host "   Installez Docker Desktop : https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Docker est installé" -ForegroundColor Green

# Vérifier que Docker est démarré
try {
    docker ps | Out-Null
    Write-Host "✅ Docker est démarré" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas démarré !" -ForegroundColor Red
    Write-Host "   Démarrez Docker Desktop et relancez ce script" -ForegroundColor Yellow
    pause
    exit 1
}

# Arrêter les anciens containers
Write-Host ""
Write-Host "🛑 Arrêt des anciens containers..." -ForegroundColor Yellow
docker-compose down -v 2>$null
if ($?) {
    Write-Host "✅ Anciens containers arrêtés" -ForegroundColor Green
}

# Créer le dossier d'initialisation
Write-Host ""
Write-Host "📁 Création du dossier guacamole-init..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "guacamole-init" | Out-Null
Write-Host "✅ Dossier créé" -ForegroundColor Green

# Télécharger les scripts SQL pour MySQL
Write-Host ""
Write-Host "📥 Téléchargement des scripts SQL MySQL..." -ForegroundColor Yellow

try {
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/apache/guacamole-client/master/extensions/guacamole-auth-jdbc/modules/guacamole-auth-jdbc-mysql/schema/001-create-schema.sql" -OutFile "guacamole-init\001-create-schema.sql"
    
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/apache/guacamole-client/master/extensions/guacamole-auth-jdbc/modules/guacamole-auth-jdbc-mysql/schema/002-create-admin-user.sql" -OutFile "guacamole-init\002-create-admin-user.sql"
    
    Write-Host "✅ Scripts téléchargés" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du téléchargement des scripts" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    pause
    exit 1
}

# Créer le docker-compose.yml
Write-Host ""
Write-Host "📝 Création du docker-compose.yml..." -ForegroundColor Yellow

$dockerComposeContent = @'
version: '3.8'

services:
  guacd:
    image: guacamole/guacd
    container_name: rds-viewer-guacd
    restart: unless-stopped
    volumes:
      - ./guacamole-drive:/drive:rw
      - ./guacamole-record:/record:rw
    networks:
      - guacamole-network

  mysql:
    image: mysql:8.0
    container_name: rds-viewer-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: guacamole_root_pass
      MYSQL_DATABASE: guacamole_db
      MYSQL_USER: guacamole_user
      MYSQL_PASSWORD: guacamole_pass
    volumes:
      - mysql-data:/var/lib/mysql
      - ./guacamole-init:/docker-entrypoint-initdb.d:ro
    networks:
      - guacamole-network

  guacamole:
    image: guacamole/guacamole
    container_name: rds-viewer-guacamole
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      GUACD_HOSTNAME: guacd
      GUACD_PORT: 4822
      MYSQL_DATABASE: guacamole_db
      MYSQL_HOSTNAME: mysql
      MYSQL_PORT: 3306
      MYSQL_USER: guacamole_user
      MYSQL_PASSWORD: guacamole_pass
    depends_on:
      - guacd
      - mysql
    networks:
      - guacamole-network

networks:
  guacamole-network:
    driver: bridge

volumes:
  mysql-data:
'@

$dockerComposeContent | Out-File -FilePath "docker-compose.yml" -Encoding UTF8
Write-Host "✅ docker-compose.yml créé" -ForegroundColor Green

# Démarrer les containers
Write-Host ""
Write-Host "🚀 Démarrage des containers Docker..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Containers démarrés" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors du démarrage" -ForegroundColor Red
    pause
    exit 1
}

# Attendre que MySQL soit prêt
Write-Host ""
Write-Host "⏳ Attente de l'initialisation de MySQL (30 secondes)..." -ForegroundColor Yellow
for ($i = 30; $i -gt 0; $i--) {
    Write-Host -NoNewline "`r   $i secondes restantes..."
    Start-Sleep -Seconds 1
}
Write-Host ""

# Vérifier le statut
Write-Host ""
Write-Host "📊 Statut des containers :" -ForegroundColor Cyan
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"

# Vérifier les logs
Write-Host ""
Write-Host "📋 Derniers logs Guacamole :" -ForegroundColor Cyan
docker logs rds-viewer-guacamole --tail 5

# Test de connexion
Write-Host ""
Write-Host "🧪 Test de connexion à l'API..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/guacamole/api/tokens" -Method POST -Body "username=guacadmin&password=guacadmin" -ContentType "application/x-www-form-urlencoded" -UseBasicParsing
    
    if ($response.Content -match "authToken") {
        Write-Host "✅ API Guacamole fonctionne !" -ForegroundColor Green
        Write-Host "   Token reçu : $($response.Content.Substring(0, [Math]::Min(50, $response.Content.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Réponse inattendue de l'API" -ForegroundColor Yellow
        Write-Host "   Réponse : $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  API pas encore prête (normal si c'est le premier démarrage)" -ForegroundColor Yellow
    Write-Host "   Attendez 1 minute et testez manuellement :" -ForegroundColor Yellow
    Write-Host "   http://localhost:8080/guacamole" -ForegroundColor Cyan
}

# Résumé
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Installation terminée ! 🎉" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 Informations de connexion :" -ForegroundColor Cyan
Write-Host "   URL       : http://localhost:8080/guacamole" -ForegroundColor White
Write-Host "   Username  : guacadmin" -ForegroundColor White
Write-Host "   Password  : guacadmin" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Commandes utiles :" -ForegroundColor Cyan
Write-Host "   docker-compose ps        # Voir les containers" -ForegroundColor Gray
Write-Host "   docker-compose logs -f   # Voir les logs en temps réel" -ForegroundColor Gray
Write-Host "   docker-compose restart   # Redémarrer" -ForegroundColor Gray
Write-Host "   docker-compose down      # Arrêter" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Configuration à ajouter dans config/config.json :" -ForegroundColor Cyan
Write-Host '   "guacamole": {' -ForegroundColor Gray
Write-Host '     "url": "http://localhost:8080/guacamole",' -ForegroundColor Gray
Write-Host '     "username": "guacadmin",' -ForegroundColor Gray
Write-Host '     "password": "guacadmin"' -ForegroundColor Gray
Write-Host '   }' -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Guacamole est prêt à être utilisé !" -ForegroundColor Green
Write-Host ""

pause