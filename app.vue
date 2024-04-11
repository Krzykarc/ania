<template>
  <TheHeader :class="[style.header, !isScrollOnTop && style.headerHidden]" />
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
import { TheFooter, TheHeader } from "@/features/coreModule";

import StartPage from "@/pages/start/index.vue";
import ServicesPage from "@/pages/uslugi/index.vue";
import AboutMePage from "@/pages/o-mnie/index.vue";

import { useScrollOnTop } from "@/features/dom/useScrollOnTop";

const { isScrollOnTop } = useScrollOnTop();
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

.header {
  transition: all 1s;
}

.headerHidden {
  background-color: var(--color-tertiary-light);
  border-bottom: 1px solid currentColor;
}

.headerHidden a:any-link {
  color: var(--font-primary-color);
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

/* TODO header height to vars */
.main {
  /* padding-top: 100px; */
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media screen and (max-width: 768px) {
  .main {
    /* padding-top: 400px; */
  }
}

.pagesContainer {
  width: 100%;
}

/* TODO header height to vars */
.page {
  scroll-margin-top: 100px;
}

@media screen and (max-width: 768px) {
  .page {
    scroll-margin-top: 400px;
  }
}
</style>
