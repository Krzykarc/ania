<template>
  <header :class="style.header">
    <nav>
      <ul :class="style.linkList">
        <li :class="[style.linkItem, isScrollOnTop && style.fbLogo]">
          <NuxtLink
            to="https://www.facebook.com/a.m.gorzynska"
            aria-label="Open Facebook page"
          >
            <img :src="fbLogo" alt="" :class="style.linkLogo" />
          </NuxtLink>
        </li>
        <li v-for="link in links" :key="link.label" :class="style.linkItem">
          <NuxtLink :to="link.to" :class="style.link">
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import { useScrollOnTop } from "@/features/dom/useScrollOnTop";

const { isScrollOnTop } = useScrollOnTop();

import fbLogo from "./facebook.png";

interface Link {
  label: string;
  to: RouteLocationRaw;
}

const links: Link[] = [
  {
    label: "Start",
    to: "#start",
  },
  {
    label: "Usługi",
    to: "#uslugi",
  },
  {
    label: "O mnie",
    to: "#o-mnie",
  },
];
</script>

<style module="style">
.header {
  /* border-bottom: 2px solid var(--color-primary-dark); */
  position: fixed;
  width: 100%;
  /* background-color: var(--color-tertiary-light); */
  background-color: transparent;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* TODO get breakpoint from variable */
@media screen and (max-width: 768px) {
  .header {
    height: 400px;
  }
}

.fbLogo {
  filter: brightness(0) invert(1);
}

.linkList {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  list-style: none;
  justify-content: center;
  gap: 4rem;
  font-size: 2rem;
  text-transform: uppercase;
  font-weight: 700;
}

/* TODO get breakpoint from variable */
@media screen and (max-width: 768px) {
  .linkList {
    gap: 2rem;
    flex-direction: column
  }
}

.linkItem:hover {
  transform: translate(0, -1px);
}
.linkItem:active {
  transform: translate(0, 2px);
}

.link:any-link {
  text-decoration: none;
  color: var(--font-secondary-color);
}
.link:any-link:hover {
  color: var(--color-secondary);
}

.linkLogo {
  width: 4rem;
  height: 4rem;
}
</style>
