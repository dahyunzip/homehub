// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ["@/assets/css/styles.common.scss"],
  modules: ["@pinia/nuxt", "@nuxtjs/supabase"],
  supabase: {
    redirect: false, // 커스텀 인증 흐름 쓸 거라 false
  },
  compatibilityDate: "2024-01-01",
});
