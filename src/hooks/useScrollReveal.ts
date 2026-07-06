import { useEffect, useRef, useState } from "react";

export function useScrollReveal(threshold = 0.1, rootMargin = "0px 0px -60px 0px") {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Fast-path if user prefers reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          // Once revealed, we can stop observing
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      try {
        if (element) {
          observer.unobserve(element);
        }
      } catch (e) {
        // ignore
      }
    };
  }, [threshold, rootMargin]);

  return { ref, isIntersecting };
}
