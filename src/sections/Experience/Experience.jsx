import { useRef, useEffect } from "react";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { gsap } from "../../hooks/useGSAP";
import SectionLabel from "../../components/SectionLabel";
import styles from "./Experience.module.scss";

export default function Experience() {
  const experience = usePortfolioStore((s) => s.experience);
  const sectionRef = useRef(null);
  const itemsRef = useRef([]);
  const lineRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Growing timeline line
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 80%",
            scrub: true,
          },
        }
      );

      itemsRef.current.forEach((item) => {
        if (!item) return;
        gsap.fromTo(
          item,
          { x: -40, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.experience} id="experience">
      <div className="container">
        <SectionLabel number="03" label="Experience" />
        <h2 className={styles.heading}>
          The path so far.
        </h2>

        <div className={styles.timeline}>
          <div ref={lineRef} className={styles.line} aria-hidden />

          {experience.items.map((exp, i) => (
            <article
              key={exp.id}
              ref={(el) => (itemsRef.current[i] = el)}
              className={`${styles.item} ${exp.isTransition ? styles.transition : ""}`}
            >
              <div className={styles.dot} />
              <div className={styles.content}>
                <div className={styles.meta}>
                  <span className={styles.period}>{exp.period}</span>
                  <span className={styles.type}>{exp.type}</span>
                </div>
                <h3 className={styles.role}>{exp.role}</h3>
                <p className={styles.company}>{exp.company}</p>
                <p className={styles.desc}>{exp.description}</p>

                <div className={styles.details}>
                  <div>
                    <h4>Responsibilities</h4>
                    <ul>
                      {exp.responsibilities.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  {exp.achievements?.length > 0 && (
                    <div>
                      <h4>Impact</h4>
                      <ul>
                        {exp.achievements.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className={styles.tech}>
                  {exp.tech.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
