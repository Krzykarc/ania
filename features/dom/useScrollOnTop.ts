export const useScrollOnTop = () => {
  const isScrollOnTop: Ref<boolean> = ref(true);

  const setScroll = () => {
    isScrollOnTop.value = window.scrollY === 0;
  };

  if (process.client) {
    document.addEventListener("scroll", setScroll, { passive: true });
  }

  onBeforeUnmount(() => {
    if (process.client) {
      document.removeEventListener("scroll", setScroll);
    }
  });

  return {
    isScrollOnTop,
  };
};
