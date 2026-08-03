import { useRef, useEffect } from "react";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { gsap } from "../../hooks/useGSAP";
import SectionLabel from "../../components/SectionLabel";
import styles from "./Lessons.module.scss";

export default function Lessons() {
  const lessons = usePortfolioStore((s) => s.lessons);
  const sectionRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      nodesRef.current.forEach((node, i) => {
        if (!node) return;
        gsap.fromTo(
          node,
          { y: 50, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: node,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
            delay: i * 0.06,
          }
        );
      });

      // Animate connecting lines conceptually via opacity
      const connectors = sectionRef.current.querySelectorAll(`.${styles.connector}`);
      gsap.fromTo(
        connectors,
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current.querySelector(`.${styles.flow}`),
            start: "top 70%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.lessons} id="lessons">
      <div className="container">
        <SectionLabel number="04" label="Lessons" />
        <h2 className={styles.heading}>{lessons.title}</h2>
        <p className={styles.sub}>{lessons.subtitle}</p>

        <div className={styles.flow}>
          {lessons.nodes.map((node, i) => (
            <div key={node.id} className={styles.nodeWrap}>
              <div
                ref={(el) => (nodesRef.current[i] = el)}
                className={styles.node}
              >
                <h3>{node.label}</h3>
                <p>{node.description}</p>
              </div>
              {i < lessons.nodes.length - 1 && (
                <div className={styles.connector} aria-hidden>
                  <span />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
