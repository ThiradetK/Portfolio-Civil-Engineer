import { useRef, useEffect } from "react";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { gsap } from "../../hooks/useGSAP";
import styles from "./Contact.module.scss";

export default function Contact() {
  const profile = usePortfolioStore((s) => s.profile);
  const socials = usePortfolioStore((s) => s.socials);
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current.querySelectorAll(".line"),
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.1,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        ctaRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 55%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.contact} id="contact">
      <div className="container">
        <div className={styles.inner}>
          <h2 ref={titleRef} className={styles.title}>
            <span className="line">Thanks for scrolling.</span>
            <span className="line">Let's deliver the</span>
            <span className="line">
              <span className={styles.highlight}>next project together.</span>
            </span>
          </h2>

          <div ref={ctaRef} className={styles.cta}>
            <a href={`mailto:${profile.email}`} className={styles.email}>
              {profile.email}
            </a>

            <div className={styles.links}>
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target={s.id === "email" || s.id === "phone" ? undefined : "_blank"}
                  rel={s.id === "email" || s.id === "phone" ? undefined : "noopener noreferrer"}
                >
                  {s.label}
                </a>
              ))}
              {profile.resumeUrl && (
                <a href={profile.resumeUrl} download>
                  Resume ↓
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>Designed & built with care</span>
      </footer>
    </section>
  );
}
