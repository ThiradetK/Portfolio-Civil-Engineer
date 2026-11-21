import { useState } from "react";

export default function PortfolioHero({ profile, viewRef }) {
  const [cutaway, setCutaway] = useState(false);

  const adjustZoom = (amount) => {
    const view = viewRef.current;
    view.targetZoom = Math.max(0.82, Math.min(1.3, view.targetZoom + amount));
  };

  const resetView = () => {
    const view = viewRef.current;
    const fullTurn = Math.PI * 2;
    view.targetAzimuth = Math.round(view.azimuth / fullTurn) * fullTurn;
    view.targetPitch = 0;
    view.velocity = 0;
    view.targetZoom = 1;
  };

  const toggleCutaway = () => {
    const next = !viewRef.current.cutaway;
    viewRef.current.cutaway = next;
    setCutaway(next);
  };

  return (
    <section className="site-hero" id="top" aria-labelledby="hero-title">
      <div className="site-hero__frame">
        <div className="site-hero__controls" role="group" aria-label="Building model controls">
          <button className="scene-control" type="button" onClick={resetView} aria-label="Reset 3D view" title="Reset view">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 7.3A6.2 6.2 0 1 1 3.8 11M4 3.7v3.8h3.8" /></svg>
          </button>
          <button className="scene-control" type="button" onClick={() => adjustZoom(-0.12)} aria-label="Zoom out" title="Zoom out">
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.2" /><path d="m12.5 12.5 4 4M6 8.5h5" /></svg>
          </button>
          <button className="scene-control" type="button" onClick={() => adjustZoom(0.12)} aria-label="Zoom in" title="Zoom in">
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.2" /><path d="m12.5 12.5 4 4M6 8.5h5M8.5 6v5" /></svg>
          </button>
          <button className={`scene-control${cutaway ? " is-active" : ""}`} type="button" onClick={toggleCutaway} aria-label="Toggle structural cutaway" aria-pressed={cutaway} title={cutaway ? "Close cutaway" : "Open cutaway"}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m3 6 7-3 7 3-7 3-7-3Zm0 4 7 3 7-3M3 14l7 3 7-3" /></svg>
          </button>
        </div>
        <span className="sr-only" id="building-keyboard-help">Focus the building model to rotate it with the arrow keys, zoom with plus and minus, and reset with Home. Drag horizontally and vertically with a mouse to explore the model. Scrolling the page smoothly restores the default view.</span>
        <div className="site-hero__intro">
          <p className="eyebrow">PROJECT ENGINEER <span>·</span> THAILAND</p>
          <h1 id="hero-title">{profile.name}</h1>
          <p className="hero-role">{profile.title.replaceAll(" | ", " / ")}</p>
          <p className="hero-tagline">{profile.tagline}</p>
          <a className="hero-resume" href={profile.resumeUrl} target="_blank" rel="noreferrer">View résumé <span aria-hidden="true">↗</span></a>
          <span className="scroll-prompt"><i aria-hidden="true" /> SCROLL TO EXPLORE</span>
        </div>
        <p className="site-hero__model-note">REPRESENTATIVE VISUALIZATION · NOT TO SCALE</p>
      </div>
    </section>
  );
}
