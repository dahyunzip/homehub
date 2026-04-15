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
    externals: {
      external: ['pg', 'pg-hstore', 'sequelize'],
      traceInclude: [
        './node_modules/pg/**',
        './node_modules/pg-hstore/**',
        './node_modules/sequelize/**',
      ],
    },
  },
  compatibilityDate: '2024-01-01',
})
