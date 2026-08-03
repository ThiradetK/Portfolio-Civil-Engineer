import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero from "./sections/Hero/Hero";
import About from "./sections/About/About";
import Skills from "./sections/Skills/Skills";
import Experience from "./sections/Experience/Experience";
import Lessons from "./sections/Lessons/Lessons";
import Projects from "./sections/Projects/Projects";
import Contact from "./sections/Contact/Contact";
import "./styles/global.scss";

gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 300);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <main>
      <Hero />
      <About />
      <Skills />
      <Experience />
      <Lessons />
      <Projects />
      <Contact />
    </main>
  );
}

export default App;
