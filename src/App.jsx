import { lazy, Suspense, useEffect, useRef } from "react";
import { experience } from "./data/experience";
import { lessons } from "./data/lessons";
import { profile } from "./data/profile";
import { projects } from "./data/projects";
import { skills } from "./data/skills";
import { socials } from "./data/socials";
import PortfolioHero from "./components/PortfolioHero";
import "./styles/global.scss";

const ConstructionScene = lazy(() => import("./components/ConstructionScene"));

function App() {
  const progressRef = useRef(1);
  const viewRef = useRef({ azimuth: 0, targetAzimuth: 0, pitch: 0, targetPitch: 0, velocity: 0, zoom: 1, targetZoom: 1, cutaway: false });

  useEffect(() => {
    let frame = 0;
    let scrollFrame = 0;
    let transitionTimer = 0;
    let transitionReleased = false;
    const clearTransitionDelay = () => {
      if (transitionTimer) window.clearTimeout(transitionTimer);
      transitionTimer = 0;
      transitionReleased = false;
    };
    const updateProgress = () => {
      frame = 0;
      const hero = document.getElementById("top");
      const profileSection = document.getElementById("profile");
      const finalSection = document.getElementById("contact");
      if (!hero || !profileSection || !finalSection) return;

      const heroBounds = hero.getBoundingClientRect();
      const heroStart = heroBounds.top + window.scrollY;
      const sequenceStart = heroStart + heroBounds.height * 0.5;
      const profileBounds = profileSection.getBoundingClientRect();
      const profileStart = profileBounds.top + window.scrollY;
      const transitionReleaseAt = profileStart + profileBounds.height * 0.1;
      const finalSectionEnd = finalSection.getBoundingClientRect().bottom + window.scrollY;
      const sequenceEnd = Math.max(sequenceStart + 1, finalSectionEnd - window.innerHeight);

      if (window.scrollY <= heroStart) {
        clearTransitionDelay();
        progressRef.current = 1;
      } else if (window.scrollY < sequenceStart) {
        clearTransitionDelay();
        const rewind = Math.min(Math.max((window.scrollY - heroStart) / (sequenceStart - heroStart), 0), 1);
        const easedRewind = rewind * rewind * (3 - 2 * rewind);
        progressRef.current = 1 - easedRewind;
      } else {
        if (window.scrollY >= transitionReleaseAt) {
          if (transitionTimer) window.clearTimeout(transitionTimer);
          transitionTimer = 0;
          transitionReleased = true;
        } else if (!transitionReleased) {
          progressRef.current = 0;
          if (!transitionTimer) {
            transitionTimer = window.setTimeout(() => {
              transitionTimer = 0;
              transitionReleased = true;
              scheduleProgress();
            }, 2000);
          }
          return;
        }
        progressRef.current = Math.min(Math.max((window.scrollY - sequenceStart) / (sequenceEnd - sequenceStart), 0), 1);
      }
    };
    const scheduleProgress = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };
    const cancelAnchorScroll = () => {
      if (!scrollFrame) return;
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    };
    const scrollToAnchor = (target) => {
      cancelAnchorScroll();
      const startY = window.scrollY;
      const scrollPadding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      const targetY = Math.min(maxScroll, Math.max(0, startY + target.getBoundingClientRect().top - scrollPadding));
      const distance = targetY - startY;
      if (Math.abs(distance) < 1) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reducedMotion ? 420 : 760;
      const startedAt = performance.now();
      const animate = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        window.scrollTo(0, startY + distance * eased);
        if (progress < 1) scrollFrame = window.requestAnimationFrame(animate);
        else scrollFrame = 0;
      };
      scrollFrame = window.requestAnimationFrame(animate);
    };
    const handleAnchorClick = (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
      if (!anchor) return;
      const target = document.getElementById(decodeURIComponent(anchor.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      window.history.pushState(null, "", anchor.hash);
      scrollToAnchor(target);
    };
    const interruptScroll = () => cancelAnchorScroll();

    const sizeObserver = new ResizeObserver(scheduleProgress);
    sizeObserver.observe(document.documentElement);
    window.addEventListener("scroll", scheduleProgress, { passive: true });
    window.addEventListener("resize", scheduleProgress, { passive: true });
    window.addEventListener("wheel", interruptScroll, { passive: true });
    window.addEventListener("touchstart", interruptScroll, { passive: true });
    window.addEventListener("pointerdown", interruptScroll, { passive: true });
    window.addEventListener("keydown", interruptScroll);
    document.addEventListener("click", handleAnchorClick);
    scheduleProgress();
    return () => {
      window.cancelAnimationFrame(frame);
      if (transitionTimer) window.clearTimeout(transitionTimer);
      cancelAnchorScroll();
      sizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleProgress);
      window.removeEventListener("resize", scheduleProgress);
      window.removeEventListener("wheel", interruptScroll);
      window.removeEventListener("touchstart", interruptScroll);
      window.removeEventListener("pointerdown", interruptScroll);
      window.removeEventListener("keydown", interruptScroll);
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  useEffect(() => {
    const targets = [...document.querySelectorAll("[data-reveal]")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });
    targets.forEach((target) => {
      target.classList.add("reveal-target");
      observer.observe(target);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="site-world" aria-label="Interactive building visualization">
        <Suspense fallback={<div className="scene-loading" aria-label="Loading building visualization"><span>STRUCTURAL MODEL / PREPARING</span><i aria-hidden="true" /></div>}>
          <ConstructionScene progressRef={progressRef} viewRef={viewRef} />
        </Suspense>
      </div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Thiradet Kawita, home">
          <span className="brand__mark">TK<span>.</span></span>
          <span className="brand__name">THIRADET KAWITA<small>CIVIL ENGINEER</small></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#profile">Profile</a>
          <a href="#career">Experience</a>
          <a href="#expertise">Expertise</a>
          <a href="#lessons">Lessons</a>
          <a href="#projects">Projects</a>
        </nav>
        <a className="header-contact" href={`mailto:${profile.email}`}>Get in touch <span aria-hidden="true">↗</span></a>
      </header>

      <main className="site-main">
        <PortfolioHero profile={profile} viewRef={viewRef} />

        <section className="profile-section section-shell" id="profile" aria-labelledby="profile-title">
          <div className="section-heading" data-reveal>
            <div><p className="eyebrow">01 / THE ENGINEER</p><h2 id="profile-title">Good work starts<br />with a clear picture.</h2></div>
            <p className="section-heading__aside">On site, in the model, and in the numbers: make the next decision easier for everyone doing the work.</p>
          </div>
          <div className="profile-grid" data-reveal style={{ "--reveal-delay": "80ms" }}>
            <div className="profile-story">
              <p className="profile-story__lead">{profile.bio.opening}</p>
              <p>{profile.bio.transition}</p>
              <div className="current-role">
                <span className="current-role__status"><i /> CURRENT POSITION</span>
                <strong>{profile.bio.current.role}</strong>
                <span>{profile.bio.current.company}</span>
                <p>{profile.bio.current.focus}</p>
                <small>{profile.bio.current.learning}</small>
              </div>
            </div>
            <div className="profile-facts">
              <div className="profile-fact"><span>EDUCATION</span><strong>{profile.bio.education.degree}</strong><small>{profile.bio.education.university} · {profile.bio.education.period} · {profile.bio.education.focus} · {profile.bio.education.year}</small></div>
              <div className="profile-fact"><span>WORKING ACROSS</span><strong>Site execution <i>·</i> Project controls <i>·</i> Documentation</strong></div>
              <div className="profile-fact"><span>BASED IN</span><strong>{profile.location}</strong></div>
              <div className="profile-principles" aria-label="Working principles">
                {profile.bio.personality.map((item) => <span key={item}>{item}</span>)}
              </div>
              <details className="profile-direction">
                <summary>Career direction and long-term vision</summary>
                <div className="profile-direction__body">
                  <p><strong>Near term</strong>{profile.bio.shortTermGoal}</p>
                  <p><strong>Long term</strong>{profile.bio.longTermVision}</p>
                  <p><strong>Five-year view</strong>{profile.vision.fiveYears}</p>
                </div>
              </details>
            </div>
          </div>
        </section>

        <section className="career-section" id="career" aria-labelledby="career-title">
          <div className="section-shell">
            <div className="section-heading" data-reveal>
              <div><p className="eyebrow">02 / FIELD EXPERIENCE</p><h2 id="career-title">A career built<br />close to the work.</h2></div>
              <p className="section-heading__aside">From field engineering and live industrial sites to the systems that keep complex projects moving.</p>
            </div>
            <div className="career-list">
              {experience.items.map((item, index) => (
                <article className="career-row" key={item.id} data-reveal style={{ "--reveal-delay": `${(index % 4) * 65}ms` }}>
                  <div className="career-row__date"><span>{String(experience.items.length - index).padStart(2, "0")}</span><time>{item.period}</time><small>{item.type} · {item.location}</small></div>
                  <div className="career-row__main">
                    <p className="career-row__company">{item.company}</p>
                    <h3>{item.role}</h3>
                    <p>{item.description}</p>
                  </div>
                  <div className="career-row__outcome"><span>IN PRACTICE</span><p>{item.achievements?.[0] ?? item.responsibilities[0]}</p></div>
                  <details className="career-details">
                    <summary>Responsibilities, outcomes and tools</summary>
                    <div className="career-details__grid">
                      <div><h4>Responsibilities</h4><ul>{item.responsibilities.map((responsibility) => <li key={responsibility}>{responsibility}</li>)}</ul></div>
                      <div><h4>Achievements</h4><ul>{item.achievements.map((achievement) => <li key={achievement}>{achievement}</li>)}</ul></div>
                      <div className="career-details__tools"><h4>Tools and context</h4><p>{item.tech.join(" · ")}</p></div>
                    </div>
                  </details>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="expertise-section section-shell" id="expertise" aria-labelledby="expertise-title">
          <div className="section-heading" data-reveal>
            <div><p className="eyebrow">03 / TECHNICAL RANGE</p><h2 id="expertise-title">Tools are useful.<br />Judgment makes them work.</h2></div>
            <p className="section-heading__aside">A practical mix of site knowledge, engineering software, and project systems.</p>
          </div>
          <div className="expertise-grid">
            {skills.categories.map((category, index) => (
              <article className="expertise-group" key={category.id} data-reveal style={{ "--reveal-delay": `${index * 70}ms` }}>
                <div className="expertise-group__head"><span>0{index + 1}</span><div><h3>{category.title}</h3><p>{category.description}</p></div></div>
                <ul>{category.items.map((item) => <li key={item.name}><div><span>{item.name}</span><p>{item.note}</p></div><small>{item.level}</small></li>)}</ul>
              </article>
            ))}
          </div>
          <div className="engineering-strengths" data-reveal>
            <span className="eyebrow">WHERE I ADD VALUE</span>
            {profile.bio.strengths.map((strength, index) => <p key={strength}><span>0{index + 1}</span>{strength}</p>)}
          </div>
        </section>

        <section className="lessons-section" id="lessons" aria-labelledby="lessons-title">
          <div className="section-shell">
            <div className="section-heading" data-reveal>
              <div><p className="eyebrow">04 / FIELD LESSONS</p><h2 id="lessons-title">{lessons.title}.</h2></div>
              <p className="section-heading__aside">{lessons.subtitle}</p>
            </div>
            <div className="lessons-flow">
              {lessons.nodes.map((node, index) => (
                <article className="lesson-node" key={node.id} data-reveal style={{ "--reveal-delay": `${(index % 4) * 60}ms` }}>
                  <span className="lesson-node__index">{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{node.label}</h3><p>{node.description}</p></div>
                  {node.children.length > 0 && (
                    <p className="lesson-node__next"><span>LEADS TO</span>{node.children.map((id) => lessons.nodes.find((child) => child.id === id)?.label).join(" + ")}</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="projects-section" id="projects" aria-labelledby="projects-title">
          <div className="section-shell">
            <div className="section-heading" data-reveal>
              <div><p className="eyebrow">05 / SELECTED PROJECTS</p><h2 id="projects-title">Work that taught<br />me how to deliver.</h2></div>
              <p className="section-heading__aside">Different constraints, same responsibility: understand the site, bring people into alignment, and get the work built.</p>
            </div>
            <div className="project-list">
              {projects.items.map((project, index) => (
                <article className="project-row" key={project.id} data-reveal style={{ "--reveal-delay": `${index * 70}ms` }}>
                  <div className="project-row__number">{String(index + 1).padStart(2, "0")}</div>
                  <div className="project-row__content">
                    <div className="project-row__meta"><span>{project.year}</span><span>{project.role}</span></div>
                    <h3>{project.title}</h3>
                    <p className="project-row__problem">{project.problem}</p>
                    <div className="project-row__result"><span>OUTCOME</span><p>{project.result}</p></div>
                    <div className="project-tags">{project.tech.map((tool) => <span key={tool}>{tool}</span>)}</div>
                    <details className="project-details">
                      <summary>Project brief, approach and lessons</summary>
                      <div className="project-details__body">
                        <div><h4>Objective</h4><p>{project.goal}</p></div>
                        <div><h4>Project system</h4><p>{project.architecture}</p></div>
                        <div><h4>Constraints</h4><ul>{project.challenges.map((challenge) => <li key={challenge}>{challenge}</li>)}</ul></div>
                        <div><h4>Approach</h4><p>{project.solution}</p></div>
                        <div><h4>Lessons learned</h4><ul>{project.lessons.map((lesson) => <li key={lesson}>{lesson}</li>)}</ul></div>
                      </div>
                    </details>
                  </div>
                  <span className="project-row__arrow" aria-hidden="true">↗</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <footer className="contact-section" id="contact">
          <div className="section-shell contact-inner" data-reveal>
            <div><p className="eyebrow">06 / START A CONVERSATION</p><h2>Build something<br />that holds up.</h2><p>For project engineering, project controls, or civil works opportunities.</p></div>
            <div className="contact-links">
              {socials.map((social) => (
                <a className={social.id === "email" ? "contact-email" : ""} href={social.url} key={social.id} target={social.id === "linkedin" ? "_blank" : undefined} rel={social.id === "linkedin" ? "noreferrer" : undefined}>
                  {social.id === "email" ? profile.email : social.id === "phone" ? profile.phone : social.label}<span aria-hidden="true">↗</span>
                </a>
              ))}
              <span>{profile.location}</span>
            </div>
          </div>
          <div className="section-shell footer-note"><span>THIRADET KAWITA</span><span>CIVIL ENGINEERING · PROJECT DELIVERY</span><a href="#top">BACK TO TOP ↑</a></div>
        </footer>
      </main>
    </>
  );
}

export default App;
