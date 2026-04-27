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
    return Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        // timeZone: 'short'
    }).format(date)
}