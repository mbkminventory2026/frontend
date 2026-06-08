export const formatRupiah = (value: number): string => {
    if (isNaN(value) || value === null) {
        return 'Rp 0';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits:0,
    }).format(value);
}

export const formatDate = (dateString: string | Date) : string => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    const hasTime = typeof dateString === 'string' && (dateString.includes('T') || dateString.includes(':') || dateString.includes(' '));

    const datePart = Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    }).format(date);

    if (hasTime || typeof dateString !== 'string') {
        const timePart = Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
        return `${datePart} ${timePart}`;
    }

    return datePart;
}

export const formatNumber = (nilai: number): string => {
    if (isNaN(nilai) || nilai == null) return '0';
    return new Intl.NumberFormat('id-ID').format(nilai);
};