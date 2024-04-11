<template>
  <div :class="style.headings">
    <h1 :class="[style.h1, style.leftToCenter, style.lightFont]">
      Fizjoterapeutka Anna Górzyńska
    </h1>
    <h2 :class="[style.h2, style.rightToCenter, style.lightFont]">Terapeutka manualna</h2>
  </div>
</template>

<script setup lang="ts">
</script>

<style module="style">
@import url("@/features/design/animations/appear.css");
@import url("@/features/design/typography/heading.css");

.headings {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100dvh;
  overflow:hidden;  

  background-image: linear-gradient(to right, #0004, #0004), url('./start-background-2.jpeg');
  width: 100%;
  background-size: cover;
}

.lightFont {
  color: var(--font-secondary-color);
}
</style>
