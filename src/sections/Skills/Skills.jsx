import { useRef, useEffect } from "react";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { gsap } from "../../hooks/useGSAP";
import SectionLabel from "../../components/SectionLabel";
import styles from "./Skills.module.scss";

export default function Skills() {
  const skills = usePortfolioStore((s) => s.skills);
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
            delay: i * 0.05,
          }
        );

        // Stagger skill items
        const items = card.querySelectorAll(`.${styles.skillItem}`);
        gsap.fromTo(
          items,
          { x: -12, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.04,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.skills} id="skills">
      <div className="container">
        <SectionLabel number="02" label="My skills" />
        <h2 className={styles.heading}>
          Tools I use
          <br />
          to solve problems.
        </h2>
        <p className={styles.sub}>
          Software, controls, documentation, and site execution — tools that keep projects on track.
        </p>

        <div className={styles.grid}>
          {skills.categories.map((cat, i) => (
            <div
              key={cat.id}
              ref={(el) => (cardsRef.current[i] = el)}
              className={`${styles.card} ${i === 0 ? styles.featured : ""}`}
            >
              <div className={styles.cardHeader}>
                <h3>{cat.title}</h3>
                <span>{cat.description}</span>
              </div>
              <ul className={styles.list}>
                {cat.items.map((item) => (
                  <li key={item.name} className={styles.skillItem}>
                    <span className={styles.name}>{item.name}</span>
                    <span className={styles.note}>{item.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
