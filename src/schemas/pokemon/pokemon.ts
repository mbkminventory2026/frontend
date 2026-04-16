export interface PokemonListItem {
    name: string;
    url: string;
}

export interface PokemonListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: PokemonListItem[];
}

export const PokemonKeys: (keyof PokemonListItem)[] = ['name', 'url'];

export const PokemonLabels: Partial<Record<keyof PokemonListItem, string>> = {
    name: 'Nama Pokemon',
    url: 'Link Informasi'
}