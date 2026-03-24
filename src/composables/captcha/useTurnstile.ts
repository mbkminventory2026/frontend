import { ref, onMounted, onUnmounted, type Ref } from "vue";

export function useTurnstile(containerRef: Ref<HTMLElement | null>, siteKey: string) {
    // state
    const token = ref<string | null>(null);
    const error = ref<boolean>(false);
    let widgetId: string | undefined;

    const renderWidget = () => {
        const turnstile = window.turnstile;

        if (containerRef.value && turnstile) {
            widgetId = turnstile.render(containerRef.value, {
                sitekey: siteKey,
                callback: (responseToken: string) => {
                    token.value = responseToken;
                    error.value = false;
                },
                'error-callback': () => {
                    error.value = true;
                    token.value = null;
                }
            });
        }
    };

    // menambahkan elemen html ketika diload (memanggil src)
    onMounted(() => {
        if (!window.turnstile) {
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            script.onload = renderWidget;
            document.head.appendChild(script);
        } else {
            renderWidget();
        }
    });

    // menghapus komponen turnstile
    onUnmounted(() => {
        const turnstile = window.turnstile;

        if (turnstile && widgetId !== undefined) {
            turnstile.remove(widgetId);
        }
    });

    return {
        token,
        error
    };
}