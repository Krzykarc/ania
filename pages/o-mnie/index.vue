<template>
  <div :class="style.myDescriptionContainer">
    <div :class="style.myDescription">
      <h3 :class="style.h3">O mnie</h3>
      <div>
        <figure>
          <img :src="profilePhoto" :class="style.profilePhoto" />
          <figcaption :class="[style.paragraph, style.center]">mgr Anna Górzyńska</figcaption>
        </figure>
        <article :class="style.paragraph">
          <p :class="style.center ">Ukończyłam Uniwersytet Medyczny im. Karola Marcinkowskiego w Poznaniu. W mojej praktyce z pacjentami priorytetem jest eliminacja bólu i przywracanie pełnej funkcji. Na początku terapii stosuję delikatne techniki przeciwbólowe, a następnie przechodzę do energicznych technik PINOTERAPII, które pozwalają przywrócić zakres ruchu w stawach. Moim celem jest szybkie osiągnięcie indywidualnych wyników poprzez zastosowanie spersonalizowanych ćwiczeń, który pomagają utrwalić efekty terapii.</p>
          <br />
          <h4 :class="style.h4">Kursy</h4>
          <ul :class="style.courseList">
            <li v-for="(course, index) in courses" :key="index" :class="style.courseItem">
              {{ course.date }}
              <template v-for="descriptionLine in course.description">
                <br />
                {{ descriptionLine }}
              </template>
            </li>
          </ul>
          <h4 :class="style.h4">Dokumenty</h4>
          <ul :class="style.documents">
            <li v-for="(singleDocument, index) in documents" :key="index" :class="style.document">
              <br />
              <a :href="`./files/${singleDocument.file}`" download="">📄 {{ singleDocument.label }}</a>
            </li>
          </ul>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import profilePhoto from './fizjoterapeutka-anna-gorzynska.jpg';

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
}

const documents: Document[] = [
  {
    label: 'Dyplom ukończenia studiów',
    file: 'dyplom_ukonczenia_studiow.pdf',
  },
  {
    label: 'Certyfikat z kursu Sztuka i nauka manipulacji kręgosłupa i wybranych stawów',
    file: 'kregoslup.pdf',
  },
  {
    label: 'Pinoterapia',
    file: 'pinoterapia.pdf',
  },
  {
    label: 'Prawo wykonywania zawodu',
    file: 'prawo_wykonywania_zawodu.pdf',
  },
  {
    label: 'Certyfikat z kursu Podstawy terapii manualnej z wprowadzeniem do technik manipulacji',
    file: 'terapia_manualna.pdf',
  },
  {
    label: 'Certyfikat z Masażu tkanek głębokich',
    file: 'tkanki_glebokie.pdf',
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
  aspect-ratio: 3/2;
}

.courseList {
  list-style: none;
}
.courseItem {
  margin: 0;
  padding: 0;
  margin-bottom: 1rem;
}

.documents {
  list-style: none;
}

.center {
  text-align: center;
}
</style>