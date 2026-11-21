import { lazy, Suspense, useEffect, useRef } from "react";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { gsap } from "../../hooks/useGSAP";
import styles from "./Hero.module.scss";

const BuildingScene = lazy(() => import("../../components/BuildingScene"));

export default function Hero() {
  const profile = usePortfolioStore((s) => s.profile);
  const experience = usePortfolioStore((s) => s.experience.items);
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const specsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current.children,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.16,
        },
      );
      gsap.fromTo(
        specsRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.68 },
      );
      gsap.to(contentRef.current, {
        y: -55,
        opacity: 0.35,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.hero} id="hero">
      <Suspense
        fallback={<div className="building-scene" aria-hidden="true" />}
      >
        <BuildingScene />
      </Suspense>
      <div className={styles.blueprint} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.inner}>
        <div ref={contentRef} className={styles.content}>
          <p className={styles.kicker}>
            <span /> CIVIL ENGINEER · PROJECT CONTROLS
          </p>
          <h1 className={styles.title}>
            <span className={styles.firstName}>Mr.Thiradet</span>
            <span className={styles.lastName}>
              Kawita<span className={styles.period}>.</span>
            </span>
          </h1>
          <p className={styles.role}>{profile.title}</p>
          <p className={styles.intro}>
            {profile.tagline}{" "}
            <span>
              Grounded in site execution. Built around clear, reliable delivery.
            </span>
          </p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#projects">
              Explore selected work <span aria-hidden="true">↗</span>
            </a>
            <a className={styles.secondary} href={`mailto:${profile.email}`}>
              Get in touch
            </a>
          </div>
        </div>

        <div ref={specsRef} className={styles.specs}>
          <div>
            <span>FIELD EXPERIENCE</span>
            <strong>2019 — NOW</strong>
          </div>
          <div>
            <span>PROJECTS IN FOCUS</span>
            <strong>
              {experience[0]?.description.includes("two concurrent")
                ? "02 ACTIVE"
                : "CIVIL WORKS"}
            </strong>
          </div>
          <div>
            <span>DISCIPLINE</span>
            <strong>STRUCTURE / CONTROLS</strong>
          </div>
        </div>
        <a
          className={styles.scroll}
          href="#about"
          aria-label="Scroll to profile"
        >
          <span /> SCROLL TO EXPLORE
        </a>
      </div>
      <div className={styles.sceneLabel} aria-hidden="true">
        <span>STRUCTURAL STUDY</span>
        <b>RC FRAME / 04 LEVELS</b>
      </div>
    </section>
  );
}
