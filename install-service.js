const Service = require('node-windows').Service;
const path = require('path');

// Créer un nouvel objet Service
const svc = new Service({
    name: 'RDSViewerBackend',
    description: 'Serveur backend pour l\'application RDS Viewer Web.',
    // Chemin vers le script principal de votre serveur Node.js
    script: path.join(__dirname, 'server', 'server.js'),
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096'
    ]
});

// Écouter l'événement 'install' pour savoir quand le service est ajouté.
svc.on('install', function(){
    console.log('Installation du service terminée.');
    console.log('Démarrage du service...');
    svc.start();
    console.log('Le service a démarré.');
});

// Écouter l'événement 'alreadyinstalled'
svc.on('alreadyinstalled', function(){
    console.log('Ce service est déjà installé.');
});

// Écouter l'événement 'uninstall'
svc.on('uninstall', function(){
    console.log('Désinstallation terminée.');
    console.log('Le service n\'existe plus.');
});

// Installer le service.
svc.install();