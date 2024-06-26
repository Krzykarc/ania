export default defineNuxtConfig({
  app: {
      head: {
          htmlAttrs: {
              lang: 'pl',
          },
          title: 'Fizjoterapeutka Anna Ignaś',
          charset: 'utf-8',
          viewport: 'width=device-width, initial-scale=1',
      },
      rootId: 'fizjoApp'
  },
  devtools: { enabled: true },
})