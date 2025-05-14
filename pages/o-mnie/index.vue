<template>
  <div :class="style.myDescriptionContainer">
    <div :class="style.myDescription">
      <h3 :class="style.h3">O mnie</h3>
      <div>
        <figure>
          <img :src="profilePhoto" :class="style.profilePhoto" />
          <figcaption :class="[style.paragraph, style.center]">mgr Anna Ignaś</figcaption>
        </figure>
        <article :class="style.paragraph">
          <p :class="style.center">
            Ukończyłam Uniwersytet Medyczny im. Karola Marcinkowskiego w Poznaniu.
            Jako doświadczona fizjoterapeutka oferuję terapię manualną, terapię czaszkowo-krzyżową oraz rehabilitację.
            Moim priorytetem jest eliminacja bólu i przywracanie pełnej sprawności.
            Stosuję delikatne techniki przeciwbólowe oraz skuteczną pinoterapię, która poprawia zakres ruchu w stawach.
            Każdą terapię uzupełniam indywidualnie dobranymi ćwiczeniami, aby utrwalić efekty masażu i rehabilitacji.
            Jeśli interesuje Cię profesjonalna fizjoterapia, terapia manualna, terapia czaszkowo-krzyżowa lub terapia przeciwobrzękowa w Kołobrzegu, zapraszam do kontaktu.</p>
          <br />
          <h4 :class="style.h4">Kursy</h4>
          <AppSlider :slides="courses" :class="style.courseList">
            <template #default="{ slide: course }">
              <div :class="style.courseItem">
              {{ course.date }}
              <template v-for="descriptionLine in course.description">
                <br />
                {{ descriptionLine }}
              </template>
            </div>
            </template>
          </AppSlider>
          <h4 :class="style.h4">Dokumenty</h4>
          <ul :class="style.documents">
            <li v-for="(singleDocument, index) in documents" :key="index" :class="style.documentItem">
              <a :href="`./files/${singleDocument.file}`" :aria-label="singleDocument.label" target="_blank">
                <img :src="singleDocument.img" :class="style.documentImage" />
              </a>
            </li>
          </ul>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSlider from '@/features/design/components/slider/AppSlider.vue';

import deepDocument from './assets/anna-ignas-masaz-gleboki.jpg';
import backboneDocument from './assets/anna-ignas-kregoslup.jpg';
import manualDocument from './assets/anna-ignas-terapia-manualna.jpg';
import pinoDocument from './assets/anna-ignas-pinoterapia.jpg';
import studiesDocument from './assets/anna-ignas-studia.jpg';
import jobDocument from './assets/anna-ignas-prawo-wykonywania-zawodu.jpg';
import craniosacralDocument from './assets/anna-ignas-terapia-czaszkowo-krzyzowa.jpg';
import antiEdematousDocument from './assets/anna-ignas-terapia-przeciwobrzekowa.jpg';
import profilePhoto from './assets/anna-ignas-profilowe.jpg';

interface Course {
  date: string
  description: string[]
}

const courses: Course[] = [
  {
    date: '06-08.10.2023',
    description: [
      'Sztuka i nauka manipulacji kręgosłupa i wybranych stawów obwodowych',
      'Rafał Krasicki'
    ]
  },
  {
    date: '29.05.2023-12.06.2023r.',
    description: [ 'Kobido - Japoński Lifting Twarzy' ]
  },
  {
    date: '16-17.06/09-10.09.2023',
    description: [ 'Podstawy terapii manualnej z wprowadzeniem do technik manipulacji' ]
  },
  {
    date: '04.2022',
    description: [
      'Pinoterapia',
      'Organizator: FRSc by dr Składowski'
    ]
  },
  {
    date: '01.2022',
    description: [
      'Masaż tkanek głębokich i rozluźnianie mięśniowo-powięziowe z anatomią',
      'Organizator: MASAZTKANEKGLEBOKICH.PL Łukasz Czubaszewski'
    ]
  },
  {
    date: '03.2020',
    description: [
      'Kurs PJM A2/B1',
      'Organizator: Towarzystwo Tłumaczy i Wykładowców Języka Migowego „GEST”, Ubocze 300, Gryfów Śląski'
    ]
  },
]

interface Document {
  label: string,
  file: string,
  img: string,
}

const documents: Document[] = [
  {
    label: 'Dyplom ukończenia studiów',
    file: 'dyplom_ukonczenia_studiow.pdf',
    img: studiesDocument,
  },
  {
    label: 'Certyfikat z kursu Sztuka i nauka manipulacji kręgosłupa i wybranych stawów',
    file: 'kregoslup.pdf',
    img: backboneDocument,
  },
  {
    label: 'Pinoterapia',
    file: 'pinoterapia.pdf',
    img: pinoDocument,
  },
  {
    label: 'Prawo wykonywania zawodu',
    file: 'prawo_wykonywania_zawodu.pdf',
    img: jobDocument,
  },
  {
    label: 'Certyfikat z kursu Podstawy terapii manualnej z wprowadzeniem do technik manipulacji',
    file: 'terapia_manualna.pdf',
    img: manualDocument,
  },
  {
    label: 'Certyfikat z Masażu tkanek głębokich',
    file: 'tkanki_glebokie.pdf',
    img: deepDocument,
  },
  {
    label: 'Certyfikat z kursu Terapia czaszkowo-krzyżowa',
    file: 'terapia_czaszkowo_krzyzowa.pdf',
    img: craniosacralDocument,
  },
  {
    label: 'Certyfikat z kursu Masażu tkanek głębokich',
    file: 'terapia_przeciwobrzekowa.pdf',
    img: antiEdematousDocument,
  },
]
</script>

<style module="style">
@import url("@/features/design/typography/heading.css");
@import url("@/features/design/typography/paragraph.css");

.myDescriptionContainer {
  background-color: var(--color-tertiary-light);
  display: flex;
  justify-content: center;
}

.myDescription {
  padding: 20px;
  max-width: 960px;
}

.profilePhoto {
  max-width: 100%;
}

.courseList {
  text-align: center;
}
.courseItem {
  margin: 0;
  padding: 0;
  margin-bottom: 1rem;
}

@media screen and (max-width: 768px) {
  .courseItem {
    font-size: 1.5rem;
  }
}

@media screen and (max-width: 480px) {
  .courseItem {
    font-size: 1.2rem;
  }
}

.documents {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.documentItem {
  display: flex;
  justify-content: center;
  width: 30%;
}

@media screen and (max-width: 768px) {
  .documentItem {
    width: 48%;
  }
}

@media screen and (max-width: 480px) {
  .documentItem  {
    width: 100%;
  }
}

.documentImage {
  border: solid 1px var(--color-primary-dark);
  transition: 0.8s;
}

.documentImage:hover {
  transform: scale(1.2);
}

.documents:hover .documentImage:not(:hover) {
  transform: scale(0.8);
}

.center {
  text-align: center;
}
</style>