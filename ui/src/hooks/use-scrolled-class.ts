import { useEffect } from 'react';

// Marks `<html>` with `scrolled` once the page has moved and its big title (`[data-page-title]`) has gone
// up under the top bar, so floating bars can thicken their glass and scroll edges can fade in.
export const useScrolledClass = () => {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const title = document.querySelector('[data-page-title]');
      const titleGone = !title || title.getBoundingClientRect().bottom < 60;
      root.classList.toggle('scrolled', window.scrollY > 4 && titleGone);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      root.classList.remove('scrolled');
    };
  }, []);
};
