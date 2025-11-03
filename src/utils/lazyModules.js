// src/utils/lazyModules.js - LAZY LOADING DES MODULES LOURDS

/**
 * Lazy loading pour jsPDF (économise ~350KB au chargement initial)
 */
export const loadJsPDF = async () => {
    const { jsPDF } = await import('jspdf');
    return jsPDF;
};

/**
 * Lazy loading pour xlsx (économise ~70KB au chargement initial)
 */
export const loadXLSX = async () => {
    const XLSX = await import('xlsx');
    return XLSX;
};

/**
 * Lazy loading pour html2canvas (économise ~150KB)
 */
export const loadHtml2Canvas = async () => {
    const html2canvas = await import('html2canvas');
    return html2canvas.default;
};

/**
 * Lazy loading pour QRCode generator
 */
export const loadQRCode = async () => {
    const QRCode = await import('qrcode.react');
    return QRCode.QRCodeSVG;
};
