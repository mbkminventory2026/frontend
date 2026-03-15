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
    if (!dateString) return 'T___T';

    const date = new Date(dateString);
    return Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date)
}