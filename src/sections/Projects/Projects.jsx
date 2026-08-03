import { useRef, useEffect } from "react";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { gsap } from "../../hooks/useGSAP";
import SectionLabel from "../../components/SectionLabel";
import styles from "./Projects.module.scss";

export default function Projects() {
  const projects = usePortfolioStore((s) => s.projects);
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { y: 100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.projects} id="projects">
      <div className="container">
        <SectionLabel number="05" label="Projects" />
        <h2 className={styles.heading}>
          Selected work.
        </h2>
        <p className={styles.sub}>
          Selected projects — from box culverts to petrochemical project controls.
        </p>

        <div className={styles.list}>
          {projects.items.map((proj, i) => (
            <article
              key={proj.id}
              ref={(el) => (cardsRef.current[i] = el)}
              className={`${styles.card} ${i === 0 ? styles.featured : ""}`}
            >
              <div className={styles.cardTop}>
                <span className={styles.year}>{proj.year}</span>
                <span className={styles.role}>{proj.role}</span>
              </div>
              <h3 className={styles.title}>{proj.title}</h3>

              <div className={styles.body}>
                <div className={styles.col}>
                  <h4>Problem</h4>
                  <p>{proj.problem}</p>
                </div>
                <div className={styles.col}>
                  <h4>Goal</h4>
                  <p>{proj.goal}</p>
                </div>
              </div>

              <div className={styles.body}>
                <div className={styles.col}>
                  <h4>Architecture</h4>
                  <p>{proj.architecture}</p>
                </div>
                <div className={styles.col}>
                  <h4>Result</h4>
                  <p>{proj.result}</p>
                </div>
              </div>

              <div className={styles.challenges}>
                <h4>Challenges → Solution</h4>
                <ul>
                  {proj.challenges.map((c, idx) => (
                    <li key={idx}>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <p className={styles.solution}>{proj.solution}</p>
              </div>

              <div className={styles.lessons}>
                <h4>Lessons</h4>
                <ul>
                  {proj.lessons.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.footer}>
                <div className={styles.tech}>
                  {proj.tech.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <div className={styles.links}>
                  {proj.links.live && (
                    <a href={proj.links.live} target="_blank" rel="noopener noreferrer">
                      Live Demo →
                    </a>
                  )}
                  {proj.links.github && (
                    <a href={proj.links.github} target="_blank" rel="noopener noreferrer">
                      GitHub →
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
