const MOBILE_BREAKPOINT_PX: Readonly<number> = 768;

export const useRwd = () => {
  const screenWidth: Ref<number> = ref(0);

  onMounted(() => {
    if (process.client) {
      screenWidth.value = window.innerWidth;
    }
  })

  const setWidth = () => {
    screenWidth.value = window.innerWidth;
  };

  if (process.client) {
    window.addEventListener("resize", setWidth, { passive: true });
  }

  onBeforeUnmount(() => {
    if (process.client) {
      window.removeEventListener("resize", setWidth);
    }
  });

  const isMobile: ComputedRef<boolean | null> = computed(() => {
    if(screenWidth.value === 0) {
      return null;
    }
    return screenWidth.value <= MOBILE_BREAKPOINT_PX;
  })

  return {
    isMobile,
  };
};
  