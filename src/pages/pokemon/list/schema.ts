import { createTableParamsSchema } from '@/schemas/table-params';

export const pokemonColumns: [string, ...string[]] = ['albumId', 'id', 'title', 'url', 'thumbnailUrl'];

export const pokemonSearchSchema = createTableParamsSchema(pokemonColumns)
