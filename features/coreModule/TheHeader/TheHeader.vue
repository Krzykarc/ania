<template>
  <header :class="[style.header, style.headerDesktop, !isScrollOnTop && style.headerHidden]" v-if="!isMobile">
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
  <header :class="[style.header, style.headerMobile]" v-else>
    <button
      :class="style.headerMobileOpenButton"
      aria-label="Otwórz menu"
      @click="openMenu"
      v-if="!isMobileMenuOpen"
    >
      <div :class="style.hamburgerStripe" />
      <div :class="style.hamburgerStripe" />
      <div :class="style.hamburgerStripe" />
    </button>
    <button
      :class="style.headerMobileCloseButton"
      aria-label="Zamknij menu"
      @click="isMobileMenuOpen=false"
      v-else
    >
      <div :class="style.hamburgerClose" />
    </button>
    <nav v-if="isMobileMenuOpen" :class="style.mobileNavigation">
      <ul :class="style.mobileLinkList">
        <li :class="[style.linkItem, style.fbLogo]">
          <NuxtLink
            to="https://www.facebook.com/a.m.gorzynska"
            aria-label="Open Facebook page"
          >
            <img :src="fbLogo" alt="" :class="style.linkLogo" />
          </NuxtLink>
        </li>
        <li v-for="link in links" :key="link.label" :class="style.linkItem">
          <a :href="link.to" :class="style.link" @click="hideMenu">
            {{ link.label }}
          </a>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import { useScrollOnTop } from "@/features/dom/useScrollOnTop";
import { useRwd } from "@/features/dom/useRwd";

const { isScrollOnTop } = useScrollOnTop();
const { isMobile } = useRwd();

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

const isMobileMenuOpen: Ref<boolean> = ref(false);

const openMenu = (): void => {
  window.scrollTo(0, 0);
  isMobileMenuOpen.value = true;
}

const hideMenu = (): void => {
  isMobileMenuOpen.value = false;
}
</script>

<style module="style">
@import url("@/features/design/index.css");

.header {
  transition: all 1s;
  position: relative;
}

.headerDesktop {
  position: fixed;
  width: 100%;
  background-color: transparent;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.headerMobile {
  position: fixed;
  width: 100%;
}

.headerMobileOpenButton, .headerMobileCloseButton {
  position: absolute;
  margin-left: 25px;
  margin-top: 25px;
  background-color: transparent;
  border: none;
}

.headerMobileOpenButton:hover, .headerMobileCloseButton:hover {
  cursor: pointer;
  transform: scale(1.1);
  transition: 0.5s;
}

.mobileNavigation {
  background-color: #000e;
  height: 100dvh;
}

.hamburgerStripe {
  width: 60px;
  height: 10px;
  background-color: black;
  margin: 10px 0;
}

.hamburgerClose {
    width: 60px;
    height: 60px;
    position: relative;
}
.hamburgerClose:after {
    content: '';
    height: 60px;
    border-left: 5px solid #fff;
    position: absolute;
    transform: rotate(45deg);
    left: 28px;
}

.hamburgerClose:before {
    content: '';
    height: 60px;
    border-left: 5px solid #fff;
    position: absolute;
    transform: rotate(-45deg);
    left: 28px;
}

.headerHidden {
  background-color: var(--color-tertiary-light);
  border-bottom: 1px solid currentColor;
}

.headerHidden a:any-link {
  color: var(--font-primary-color);
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

.mobileLinkList {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  list-style: none;
  padding-top: 100px;
  gap: 2rem;
  flex-direction: column;
  font-size: 2rem;
  text-transform: uppercase;
  font-weight: 700;
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
