import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getProfilPerusahaan } from "@/api/profil-perusahaan/profil-perusahaan";
import type { ProfilPerusahaanResponseItem } from "@/schemas/profil-perusahaan/response";

export const useBrandingStore = defineStore("branding", () => {
  const profile = ref<ProfilPerusahaanResponseItem | null>(null);
  const isLoading = ref(false);

  const nama = computed(() => profile.value?.nama || "Permatatex");
  const logo = computed(() => profile.value?.logo || "");
  const backgroundLogin = computed(() => profile.value?.background_login || "");
  const textFooter = computed(() => profile.value?.text_footer || "");
  const alamat = computed(() => profile.value?.alamat || "");
  const email = computed(() => profile.value?.email || "");
  const noTelp = computed(() => profile.value?.no_telp || "");
  const linkWebsite = computed(() => profile.value?.link_website || "");
  
  const medsos = computed(() => {
    try {
      return profile.value?.medsos ? JSON.parse(profile.value.medsos) : {};
    } catch {
      return {};
    }
  });

  async function fetchBranding() {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
      const response = await getProfilPerusahaan({ limit: 1, offset: 0 });
      if (response && response.results && response.results.length > 0) {
        const item = response.results[0];
        if (item) {
          profile.value = item;
        }
      }
    } catch (error) {
      console.error("Failed to fetch company branding:", error);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    profile,
    isLoading,
    nama,
    logo,
    backgroundLogin,
    textFooter,
    alamat,
    email,
    noTelp,
    linkWebsite,
    medsos,
    fetchBranding,
  };
});
