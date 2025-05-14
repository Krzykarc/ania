<template>
  <TheHeader />
  <main :class="style.main">
    <div :class="style.pagesContainer">
      <div id="start" :class="style.page">
      <StartPage />
      </div>
      <div id="uslugi" :class="style.page">
        <ServicesPage />
      </div>
      <div id="o-mnie" :class="style.page">
        <AboutMePage  />
      </div>
    </div>
  </main>
  <TheFooter :class="style.footer" />
</template>

<script setup lang="ts">
import { useHead } from '#imports'

import { TheFooter, TheHeader } from "@/features/coreModule";

import StartPage from "@/pages/start/index.vue";
import ServicesPage from "@/pages/uslugi/index.vue";
import AboutMePage from "@/pages/o-mnie/index.vue";

useHead({
  title: 'Kołobrzeg – Rehabilitacja, Fizjoterapia, Terapia Manualna – Anna Ignaś',
  meta: [
    { name: 'description', content: 'Rehabilitacja i fizjoterapia w Kołobrzegu. Masaże klasyczne, terapia manualna, terapia czaszkowo-krzyżowa. Umów się na wizytę!' },
    { name: 'keywords', content: 'rehabilitacja Kołobrzeg, fizjoterapia Kołobrzeg, terapia manualna Kołobrzeg, terapia przeciwobrzękowa, terapia czaszkowo-krzyżowa' }
  ]
})
</script>

<style module="style">
@import url("@/features/design/index.css");

html {
  font-family: var(--font-primary-name);
  font-size: var(--font-primary-size);
  color: var(--font-primary-color);
}

html,
body {
  height: 100%;
  scroll-behavior: smooth;
}

#fizjoApp {
  min-height: 100%;
  display: grid;
  grid-template-rows: max-content 1fr max-content;

  background-color: var(--color-tertiary);
}

.footer {
  border-top: 1px solid currentColor;
}

*,
::before,
::after {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

.main {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pagesContainer {
  width: 100%;
}

.page {
  scroll-margin-top: 100px;
}

@media screen and (max-width: 768px) {
  .page {
    scroll-margin-top: unset;
  }
}
</style>
