export function useFormatUI() {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs';
            case 'maintenance': return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs';
            case 'out_of_stock': return 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs';
            default: return 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs';
        }
    }

    return getStatusBadge;
}