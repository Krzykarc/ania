<template>
    <div :class="style.appSlider">
        <button :class="style.appSliderArrowContainer" @click="showPreviousSlide">
            <img
              :src="leftArrowIcon"
              alt="Poprzedni slajd"
              :class="style.icon"
              >
        </button>
        <div :class="style.content">
            <slot :slide="slides[currentSlideIndex]" />
        </div>
        <button :class="style.appSliderArrowContainer" @click="showNextSlide">
            <img
              :src="rightArrowIcon"
              alt="Następny slajd"
              :class="style.icon"
              >
        </button>
    </div>
</template>

<script setup lang="ts">
import leftArrowIcon from './icons/arrow_left.png';
import rightArrowIcon from './icons/arrow_right.png';

interface AppSliderProps {
  slides: unknown[];
}

const props = defineProps<AppSliderProps>();

const currentSlideIndex: Ref<number> = ref(0);

const showPreviousSlide = () => {
    if(currentSlideIndex.value === 0) {
        currentSlideIndex.value = props.slides.length - 1;
        return;
    }
    currentSlideIndex.value = currentSlideIndex.value - 1;
}

const showNextSlide = () => {
    if(currentSlideIndex.value === props.slides.length - 1) {
        currentSlideIndex.value = 0;
        return;
    }
    currentSlideIndex.value = currentSlideIndex.value + 1;
}
</script>

<style module="style">
.appSlider {
    display: flex;
    flex: 0 0 100%;
    min-height: 200px;
}

.appSliderArrowContainer {
    align-self: center;
    border: none;   
    background-color: transparent;
    border-radius: 50%;
}

.appSliderArrowContainer:hover {
    transform: scale(1.3);
    transition: 0.5s;
}

.icon {
  width: 100px;
}

.content {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}
</style>