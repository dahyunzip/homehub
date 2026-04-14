// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  css: ['@/assets/css/styles.common.scss'],
  modules: ['@pinia/nuxt', '@nuxtjs/supabase'],
  supabase: {
    redirect: false,
  },
  nitro: {
    preset: 'vercel',
  },
  compatibilityDate: '2024-01-01',
})
