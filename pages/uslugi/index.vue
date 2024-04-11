<template>
  <div :class="style.servicesContainer">
    <div :class="style.services">
      <article>
        <br />
        <h3 :class="style.h3">Usługi</h3>
        <ul :class="style.servicesList">
          <li v-for="(service, index) in services" :key="index" :class="[style.serviceItem, style[`serviceItem${index}`]]">
            <figure :class="style.singleService">
              <img :src="service.icon" :class="style.icon" />
              <figcaption>{{ service.label }}</figcaption>
            </figure>
          </li>
        </ul>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import visitIcon from './icons/building.png';
import classicalMassageIcon from './icons/body-massage.png';
import deepMassageIcon from './icons/massage.png';
import kobidoIcon from './icons/facial-massage.png';
import preventIcon from './icons/prevention.png';

interface Service {
  label: string,
  icon: string
}

const services: Service[] = [
  {
    label: 'wizyta fizjoterapeutyczna',
    icon: visitIcon,
  },
  {
    label: 'masaż klasyczny',
    icon: classicalMassageIcon
  },
  {
    label: 'masaż  tkanek głębokich',
    icon: deepMassageIcon
  },
  {
    label: 'Kobido',
    icon: kobidoIcon
  },
  {
    label: 'fizjoprofilaktyka',
    icon: preventIcon
  },
]
</script>

<style module="style">
@import url("@/features/design/typography/heading.css");

.servicesContainer {
  display: flex;
  justify-content: center;
  background-color: var(--color-tertiary-light);
}

.services {
  width: clamp(360px, 100%, 960px);
}

.servicesList {
  display: grid;
  grid-template-areas: 'a a b b c c' '. d d e e .';
  align-content: center;
  row-gap: 80px;
  font-family: 'FontAwesome', sans-serif;
  font-weight: 700;
  margin-top: 20px;
  margin-bottom: 20px;
}
.serviceItem {
  margin: 0;
  padding: 0;
  list-style: none;
}
.serviceItem0 {
  grid-area: a;
}
.serviceItem1 {
  grid-area: b;
}
.serviceItem2 {
  grid-area: c;
}
.serviceItem3 {
  grid-area: d;
}
.serviceItem4 {
  grid-area: e;
}
.singleService {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.icon {
  width: 100px;
}
</style>