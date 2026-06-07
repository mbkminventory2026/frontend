import axios, { AxiosError } from "axios";

export const apiClient = axios.create({
    // baseURL: 'https://pokeapi.co/api/v2',
    baseURL: 'http://localhost:8080',
    // baseURL: 'https://jsonplaceholder.typicode.com/',    // json placeholder
    // baseURL: 'https://rickandmortyapi.com/api/character',   // format meta
    timeout: 60000,
});

// Request -> menambahkan bearer token pada headers
apiClient.interceptors.request.use(
    (config) => {
        // sesuai dengan authStore.ts -> setItem('accessToken')
        const token = localStorage.getItem('accessToken');
        console.log('[API Request]', config.method?.toUpperCase(), config.url, 'Token exists:', !!token);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('[API Request Headers]', config.headers.Authorization);
        } else {
            console.warn('[API Request Warning] Token is missing from localStorage!');
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

// Response -> memeriksa bearer token pada header
apiClient.interceptors.response.use(
    (response) => {
        if (response.data && response.data.status === 'success') {
            return {
                ...response,
                data: response.data.data
            }
        }
        return response;
    },
    (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;

            if (status === 403) {
                import('vue-sonner').then(({ toast }) => {
                    toast.error('Anda tidak memiliki hak akses untuk melakukan aksi ini.')
                })
            }

            if (status === 401) {
                console.warn('⚠️ Sesi Anda telah habis atau tidak valid.');
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error)
    }
)