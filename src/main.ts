import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import './style.css'
import App from './App.vue'

// Global patch to resolve [Violation] Added non-passive event listener to a scroll-blocking 'touchstart' event
// This makes touch and wheel event listeners passive by default for better performance
(function () {
  if (typeof window === 'undefined') return;
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function (type: string, listener: any, options?: any) {
    let addOptions = options;
    if (type === 'touchstart' || type === 'touchmove' || type === 'wheel' || type === 'mousewheel') {
      if (typeof options === 'undefined') {
        addOptions = { passive: true };
      } else if (typeof options === 'boolean') {
        addOptions = { capture: options, passive: true };
      } else if (typeof options === 'object' && typeof options.passive === 'undefined') {
        addOptions = { ...options, passive: true };
      }
    }
    return originalAddEventListener.call(this, type, listener, addOptions);
  };
})();

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
})
app.mount('#app')
