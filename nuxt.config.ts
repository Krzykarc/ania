export default defineNuxtConfig({
  app: {
      head: {
          htmlAttrs: {
              lang: 'pl',
          },
          title: 'SiemAnko! Boli kolAnko? Zapraszam na masowAnko!',
          charset: 'utf-8',
      },
      rootId: 'fizjoApp'
  },
  devtools: { enabled: true },
})