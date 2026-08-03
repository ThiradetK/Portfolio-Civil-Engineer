import { useRef, useEffect } from "react";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { gsap } from "../../hooks/useGSAP";
import styles from "./Hero.module.scss";

export default function Hero() {
  const profile = usePortfolioStore((s) => s.profile);
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const scrollHintRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        titleRef.current.querySelectorAll(".line"),
        { y: 120, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.15 }
      )
        .fromTo(
          subtitleRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9 },
          "-=0.6"
        )
        .fromTo(
          scrollHintRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.8 },
          "-=0.3"
        );

      // Parallax + fade on scroll
      gsap.to(titleRef.current, {
        y: -80,
        opacity: 0.3,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(scrollHintRef.current, {
        opacity: 0,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "30% top",
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.hero} id="hero">
      <div className={styles.inner}>
        <h1 ref={titleRef} className={styles.title}>
          <span className={`${styles.kicker} line`}>Hello, I'm</span>
          <span className="line">
            <span className={styles.name}>{profile.name}</span>
          </span>
        </h1>
        <div ref={subtitleRef} className={styles.intro}>
          <p className={styles.role}>{profile.title}</p>
          <p className={styles.subtitle}>
            {profile.tagline} <span>{profile.bio.opening}</span>
          </p>
        </div>
        <div ref={scrollHintRef} className={styles.scrollHint}>
          <span>Scroll to begin</span>
          <div className={styles.line} />
        </div>
      </div>
      <div className={styles.gradient} aria-hidden />
    </section>
  );
}
