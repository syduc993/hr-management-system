// src/utils/dateUtils.js

export const convertExcelSerialToDate = (serialNumber) => {
    if (!serialNumber || typeof serialNumber !== 'number') return null;
    try {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0));
        const msPerDay = 24 * 60 * 60 * 1000;
        const msOffset = serialNumber * msPerDay;
        return new Date(excelEpoch.getTime() + msOffset);
    } catch (error) {
        console.error('Error converting Excel serial number:', error);
        return null;
    }
};

export const formatDateTimeForCSV = (serialNumber) => {
    const date = convertExcelSerialToDate(serialNumber);
    if (!date) return 'Invalid Date';
    const y = date.getUTCFullYear(), m = String(date.getUTCMonth()+1).padStart(2,'0');
    const d = String(date.getUTCDate()).padStart(2,'0');
    const h = String(date.getUTCHours()).padStart(2,'0');
    const mi = String(date.getUTCMinutes()).padStart(2,'0');
    const s = String(date.getUTCSeconds()).padStart(2,'0');
    return `${y}-${m}-${d} ${h}:${mi}:${s}`;
};

export const formatTimeForCSV = (serialNumber) => {
    const date = convertExcelSerialToDate(serialNumber);
    if (!date) return 'Invalid Time';
    const h = String(date.getUTCHours()).padStart(2,'0');
    const mi = String(date.getUTCMinutes()).padStart(2,'0');
    const s = String(date.getUTCSeconds()).padStart(2,'0');
    return `${h}:${mi}:${s}`;
};
