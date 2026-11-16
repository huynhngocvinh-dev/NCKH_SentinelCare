import { useEffect } from "react";

export function useBidirectionalMotion() {
  useEffect(() => {
    // 1. Observer 2 chiều: bật is-visible khi vào khung nhìn, gỡ khi rời khung nhìn để cuộn lên/xuống đều có hiệu ứng
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            // Chỉ reset khi phần tử thực sự trôi ra khỏi viewport
            entry.target.classList.remove("is-visible");
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    // 2. Parallax & Pointer glow theo GPU requestAnimationFrame
    let ticking = false;
    const updateScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty(
          "--scroll-y",
          `${window.scrollY}px`
        );
        ticking = false;
      });
    };

    const updatePointer = (e) => {
      document.documentElement.style.setProperty(
        "--pointer-x",
        `${e.clientX}px`
      );
      document.documentElement.style.setProperty(
        "--pointer-y",
        `${e.clientY}px`
      );
    };

    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    updateScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("pointermove", updatePointer);
    };
  }, []);
}
