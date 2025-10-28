#!/bin/bash
# Script de diagnostic pour Guacamole

echo "=========================================="
echo "DIAGNOSTIC GUACAMOLE"
echo "=========================================="
echo ""

echo "1. État des conteneurs Docker:"
docker ps -a | grep -E "(guacamole|guacd|mysql)"
echo ""

echo "2. Vérification du fichier .jar dans le conteneur:"
docker exec rds-viewer-guacamole ls -lh /opt/guacamole/extensions/ 2>/dev/null || echo "Erreur: Impossible d'accéder au conteneur"
echo ""

echo "3. Variables d'environnement du conteneur Guacamole:"
docker exec rds-viewer-guacamole env | grep -E "(JSON|EXTENSION)" 2>/dev/null || echo "Erreur: Impossible de lire les variables"
echo ""

echo "4. Recherche de 'auth-json' dans les logs Guacamole:"
docker logs rds-viewer-guacamole 2>&1 | grep -i "auth-json"
echo ""

echo "5. Recherche d'erreurs dans les logs Guacamole:"
docker logs rds-viewer-guacamole 2>&1 | grep -i "error\|exception\|failed" | tail -20
echo ""

echo "6. Dernières lignes des logs Guacamole:"
docker logs rds-viewer-guacamole 2>&1 | tail -30
echo ""

echo "7. Dernières lignes des logs guacd:"
docker logs rds-viewer-guacd 2>&1 | tail -20
echo ""

echo "8. Test de connexion au port 8080:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8080/guacamole/
echo ""

echo "=========================================="
echo "FIN DU DIAGNOSTIC"
echo "=========================================="
