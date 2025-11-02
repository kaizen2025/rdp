// src/utils/exportUtils.js - Utilitaires d'export de données

/**
 * Convertit des données en format CSV
 * @param {Array} data - Tableau d'objets à exporter
 * @param {Array} columns - Configuration des colonnes {field, header}
 * @returns {string} Données au format CSV
 */
export const convertToCSV = (data, columns) => {
    if (!data || data.length === 0) return '';

    // Headers
    const headers = columns.map(col => `"${col.header}"`).join(',');

    // Rows
    const rows = data.map(item => {
        return columns.map(col => {
            let value = col.field.split('.').reduce((obj, key) => obj?.[key], item) || '';

            // Formatage spécial pour les dates
            if (value instanceof Date) {
                value = value.toLocaleDateString('fr-FR');
            } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                value = new Date(value).toLocaleDateString('fr-FR');
            }

            // Échapper les guillemets et entourer de guillemets
            value = String(value).replace(/"/g, '""');
            return `"${value}"`;
        }).join(',');
    });

    return [headers, ...rows].join('\n');
};

/**
 * Télécharge un fichier CSV
 * @param {string} csvContent - Contenu CSV
 * @param {string} filename - Nom du fichier
 */
export const downloadCSV = (csvContent, filename = 'export.csv') => {
    // Ajouter BOM UTF-8 pour Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Exporte des données en CSV
 * @param {Array} data - Données à exporter
 * @param {Array} columns - Configuration des colonnes
 * @param {string} filename - Nom du fichier
 */
export const exportToCSV = (data, columns, filename) => {
    const csv = convertToCSV(data, columns);
    downloadCSV(csv, filename);
};

/**
 * Crée un tableau HTML pour Excel avec styles
 * @param {Array} data - Données à exporter
 * @param {Array} columns - Configuration des colonnes
 * @param {string} title - Titre du document
 * @returns {string} HTML du tableau
 */
export const createExcelHTML = (data, columns, title) => {
    const headerRow = columns.map(col =>
        `<th style="background-color: #4472C4; color: white; font-weight: bold; padding: 8px; border: 1px solid #ddd;">${col.header}</th>`
    ).join('');

    const dataRows = data.map((item, index) => {
        const bgColor = index % 2 === 0 ? '#F2F2F2' : '#FFFFFF';
        const cells = columns.map(col => {
            let value = col.field.split('.').reduce((obj, key) => obj?.[key], item) || '';

            // Formatage des dates
            if (value instanceof Date) {
                value = value.toLocaleDateString('fr-FR');
            } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                value = new Date(value).toLocaleDateString('fr-FR');
            }

            return `<td style="padding: 6px; border: 1px solid #ddd; background-color: ${bgColor};">${value}</td>`;
        }).join('');

        return `<tr>${cells}</tr>`;
    }).join('');

    return `
        <html xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
            <meta charset="UTF-8">
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>${title}</x:Name>
                            <x:WorksheetOptions>
                                <x:Print>
                                    <x:ValidPrinterInfo/>
                                </x:Print>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
        </head>
        <body>
            <h1 style="font-family: Arial; color: #4472C4;">${title}</h1>
            <p style="font-family: Arial; color: #666; font-size: 12px;">Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <table style="border-collapse: collapse; font-family: Arial; font-size: 12px;">
                <thead>
                    <tr>${headerRow}</tr>
                </thead>
                <tbody>
                    ${dataRows}
                </tbody>
            </table>
        </body>
        </html>
    `;
};

/**
 * Télécharge un fichier Excel (HTML)
 * @param {string} htmlContent - Contenu HTML
 * @param {string} filename - Nom du fichier
 */
export const downloadExcel = (htmlContent, filename = 'export.xls') => {
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Exporte des données en Excel
 * @param {Array} data - Données à exporter
 * @param {Array} columns - Configuration des colonnes
 * @param {string} title - Titre du document
 * @param {string} filename - Nom du fichier
 */
export const exportToExcel = (data, columns, title, filename) => {
    const html = createExcelHTML(data, columns, title);
    downloadExcel(html, filename);
};

/**
 * Configurations de colonnes pré-définies pour différents types de données
 */
export const EXPORT_COLUMNS = {
    loans: [
        { field: 'id', header: 'ID' },
        { field: 'computerName', header: 'Ordinateur' },
        { field: 'userDisplayName', header: 'Utilisateur' },
        { field: 'userName', header: 'Identifiant' },
        { field: 'itStaff', header: 'Responsable IT' },
        { field: 'loanDate', header: 'Date de prêt' },
        { field: 'expectedReturnDate', header: 'Date de retour prévue' },
        { field: 'actualReturnDate', header: 'Date de retour réelle' },
        { field: 'status', header: 'Statut' },
        { field: 'notes', header: 'Notes' }
    ],
    computers: [
        { field: 'id', header: 'ID' },
        { field: 'name', header: 'Nom' },
        { field: 'brand', header: 'Marque' },
        { field: 'model', header: 'Modèle' },
        { field: 'serialNumber', header: 'N° Série' },
        { field: 'type', header: 'Type' },
        { field: 'status', header: 'Statut' },
        { field: 'assignedTo', header: 'Assigné à' },
        { field: 'location', header: 'Localisation' },
        { field: 'purchaseDate', header: 'Date d\'achat' },
        { field: 'warrantyEndDate', header: 'Fin garantie' },
        { field: 'notes', header: 'Notes' }
    ],
    users: [
        { field: 'username', header: 'Identifiant' },
        { field: 'displayName', header: 'Nom complet' },
        { field: 'email', header: 'Email' },
        { field: 'department', header: 'Service' },
        { field: 'server', header: 'Serveur' },
        { field: 'adEnabled', header: 'Statut AD' },
        { field: 'createdAt', header: 'Date de création' },
        { field: 'createdBy', header: 'Créé par' }
    ],
    loanHistory: [
        { field: 'id', header: 'ID' },
        { field: 'computerName', header: 'Ordinateur' },
        { field: 'userDisplayName', header: 'Utilisateur' },
        { field: 'event', header: 'Événement' },
        { field: 'date', header: 'Date' },
        { field: 'by', header: 'Par' },
        { field: 'details', header: 'Détails' }
    ]
};

/**
 * Génère un nom de fichier avec timestamp
 * @param {string} baseName - Nom de base
 * @param {string} extension - Extension (csv ou xls)
 * @returns {string} Nom de fichier avec timestamp
 */
export const generateFilename = (baseName, extension = 'csv') => {
    const date = new Date();
    const timestamp = date.toISOString().slice(0, 19).replace(/[T:]/g, '-');
    return `${baseName}_${timestamp}.${extension}`;
};
