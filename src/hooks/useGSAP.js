import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Runs a GSAP context setup/teardown safely with React.
 * @param {Function} callback - Receives (ctx) and should return cleanup if needed
 * @param {Array} deps - dependency array
 */
export function useGSAP(callback, deps = []) {
  const scope = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      callback(ctx);
    }, scope);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}

export { gsap, ScrollTrigger };
