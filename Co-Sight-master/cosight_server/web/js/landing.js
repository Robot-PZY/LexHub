document.addEventListener("DOMContentLoaded", () => {
  if (window.AOS) {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 40
    });
  }

  if (window.Lenis) {
    const lenis = new window.Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.9
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const href = anchor.getAttribute("href");
        if (!href || href === "#") {
          return;
        }
        const target = document.querySelector(href);
        if (!target) {
          return;
        }
        event.preventDefault();
        lenis.scrollTo(target, { offset: -90 });
      });
    });
  }

  if (window.countUp && window.countUp.CountUp) {
    const CountUp = window.countUp.CountUp;
    document.querySelectorAll(".landing-count").forEach((node) => {
      const endVal = Number(node.dataset.count || node.textContent || 0);
      const counter = new CountUp(node, endVal, {
        duration: 1.8,
        useGrouping: false,
        suffix: node.dataset.suffix || ""
      });

      if (!counter.error) {
        counter.start();
      }
    });
  }
});
