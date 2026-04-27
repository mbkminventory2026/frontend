import axios, { AxiosError } from "axios";

export const apiClient = axios.create({
    // baseURL: 'https://pokeapi.co/api/v2',
    baseURL: 'http://localhost:8080',
    // baseURL: 'https://jsonplaceholder.typicode.com/',    // json placeholder
    // baseURL: 'https://rickandmortyapi.com/api/character',   // format meta
    timeout: 10000,
});

// Request -> menambahkan bearer token pada headers
apiClient.interceptors.request.use(
    (config) => {
        // sesuai dengan authStore.ts -> setItem('accessToken')
        const token = localStorage.getItem('accessToken');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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

            if (status === 401) {
                console.warn('⚠️ Sesi Anda telah habis atau tidak valid.');
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error)
    }
)