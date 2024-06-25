export default defineNuxtConfig({
  app: {
      head: {
          htmlAttrs: {
              lang: 'pl',
          },
          title: 'Fizjoterapeutka Anna Ignaś',
          charset: 'utf-8',
      },
      rootId: 'fizjoApp'
  },
  devtools: { enabled: true },
})