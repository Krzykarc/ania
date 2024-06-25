const MOBILE_BREAKPOINT_PX: Readonly<number> = 768;

export const useRwd = () => {
  const screenWidth: Ref<number> = ref(window.innerWidth);

  const setWidth = () => {
    screenWidth.value = window?.innerWidth ?? 0;
  };

  if (process.client) {
    window.addEventListener("resize", setWidth, { passive: true });
  }

  onBeforeUnmount(() => {
    if (process.client) {
      window.removeEventListener("resize", setWidth);
    }
  });

  const isMobile: ComputedRef<boolean> = computed(() => {
    return screenWidth.value <= MOBILE_BREAKPOINT_PX;
  })

  return {
    isMobile,
  };
};
  