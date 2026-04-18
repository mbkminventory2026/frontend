// interface origin {
//     name: string;
//     url: string;
// }

export interface CobaListItem {
    // POST
    // userId: number;
    // id: number;
    // title: string;
    // body: string;

    // ALBUM
    albumId: number;
    id: number;
    title: string;
    url: string;
    thumbnailUrl: string;

    // RICK AND MORTY
    // id: number;
    // name: string;
    // status: string;
    // species: string;
    // type: string;
    // gender: string;
    // origin: origin;
    // location: {
    //     name: string;
    //     url: string;
    // };
    // images: string;
    // episodes: string[];
    // url: string;
    // created: string
}

// JSON PLACEHOLDER
// export type CobaListResponse = CobaListItem[];

// OBJECT
export interface CobaListResponse {
    info: {
        total_count: number;
        limit: number;
        offset: number
    };
    results: CobaListItem[];
}

// PHOTOS
// export const CobaKeys: (keyof CobaListItem)[] = ['id', 'userId', 'title', 'body'];

export const CobaLabels: Partial<Record<keyof CobaListItem, string>> = {
    // POSTS
    // id: 'id',
    // userId: 'userId',
    // title: 'title',
    // body: 'body'

    // PHOTOS
    albumId: 'albumId',
    id: 'id',
    title: 'title',
    url: 'url',
    thumbnailUrl: 'thumbnailUrl'
}