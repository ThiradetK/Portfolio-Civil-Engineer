import { useRef, useEffect } from "react";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { gsap } from "../../hooks/useGSAP";
import SectionLabel from "../../components/SectionLabel";
import styles from "./About.module.scss";

export default function About() {
  const profile = usePortfolioStore((s) => s.profile);
  const sectionRef = useRef(null);
  const scenesRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const scenes = scenesRef.current.filter(Boolean);

      scenes.forEach((scene) => {
        gsap.fromTo(
          scene.querySelectorAll("[data-reveal]"),
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: scene,
              start: "top 75%",
              end: "top 30%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Transition arrow animation
      const arrow = sectionRef.current.querySelector(`.${styles.arrow}`);
      if (arrow) {
        gsap.fromTo(
          arrow,
          { scaleY: 0, opacity: 0 },
          {
            scaleY: 1,
            opacity: 1,
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: arrow,
              start: "top 80%",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const setSceneRef = (el, i) => {
    scenesRef.current[i] = el;
  };

  return (
    <section ref={sectionRef} className={styles.about} id="about">
      <div className="container">
        {/* Scene: Education */}
        <div ref={(el) => setSceneRef(el, 0)} className={styles.scene}>
          <SectionLabel number="01" label="Who I am" />
          <h2 className={styles.heading} data-reveal>
            From the ground up —
            <br />
            structures, systems, delivery.
          </h2>
          <div className={styles.education} data-reveal>
            <div className={styles.eduCard}>
              <span className={styles.eduLabel}>Education</span>
              <h3>{profile.bio.education.degree}</h3>
              <p>{profile.bio.education.university}</p>
              <span className={styles.eduMeta}>
                {profile.bio.education.period || profile.bio.education.year} · Graduated {profile.bio.education.year}
              </span>
            </div>
          </div>
        </div>

        {/* Transition */}
        <div className={styles.transition}>
          <div className={styles.arrow} aria-hidden>
            <div className={styles.arrowLine} />
            <div className={styles.arrowHead} />
          </div>
          <p className={styles.transitionText} data-reveal>
            {profile.bio.transition}
          </p>
        </div>

        {/* Current status */}
        <div ref={(el) => setSceneRef(el, 1)} className={styles.scene}>
          <div className={styles.current}>
            <div className={styles.role} data-reveal>
              <span className={styles.roleLabel}>Currently</span>
              <h3>{profile.bio.current.role}</h3>
              <p className={styles.company}>{profile.bio.current.company}</p>
              <p>{profile.bio.current.focus}</p>
            </div>
            <div className={styles.traits} data-reveal>
              {profile.bio.personality.map((trait) => (
                <span key={trait} className={styles.trait}>
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Strengths + Goals */}
        <div ref={(el) => setSceneRef(el, 2)} className={styles.scene}>
          <div className={styles.grid}>
            <div className={styles.block} data-reveal>
              <h4>Strengths</h4>
              <ul>
                {profile.bio.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div className={styles.block} data-reveal>
              <h4>Short-term</h4>
              <p>{profile.bio.shortTermGoal}</p>
            </div>
            <div className={`${styles.block} ${styles.vision}`} data-reveal>
              <h4>5-year vision</h4>
              <p>{profile.vision.fiveYears}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
