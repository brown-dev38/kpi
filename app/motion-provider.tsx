"use client";

import { useEffect, useRef } from "react";
import { MotionConfig, animate, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

const ITEM_SELECTOR = [
  '[data-slot="card"]',
  '[data-slot="table-row"]',
  '[data-slot="sidebar-menu-item"]',
  '[data-slot="dialog-content"]',
  '[data-slot="dropdown-menu-item"]',
  '[data-motion-item]',
].join(",");

function MotionEnhancer() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const animated = useRef(new WeakSet<Element>());

  useEffect(() => {
    if (reduceMotion) return;

    const page = document.querySelector(
      '[data-slot="sidebar-inset"], main',
    );
    if (page) {
      animate(
        page,
        { opacity: [0.72, 1], y: [6, 0] },
        { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      );
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        visible.forEach((entry, index) => {
          observer.unobserve(entry.target);
          animate(
            entry.target,
            { opacity: [0, 1], y: [10, 0] },
            {
              duration: 0.34,
              delay: Math.min(index * 0.025, 0.18),
              ease: [0.22, 1, 0.36, 1],
            },
          );
        });
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );

    const register = (root: ParentNode) => {
      root.querySelectorAll(ITEM_SELECTOR).forEach((element) => {
        if (animated.current.has(element)) return;
        animated.current.add(element);
        observer.observe(element);
      });
    };

    register(document);
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            if (node.matches(ITEM_SELECTOR) && !animated.current.has(node)) {
              animated.current.add(node);
              observer.observe(node);
            }
            register(node);
          }
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname, reduceMotion]);

  return null;
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.3 }}>
      <MotionEnhancer />
      {children}
    </MotionConfig>
  );
}
