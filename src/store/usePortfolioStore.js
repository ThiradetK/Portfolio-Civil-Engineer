import { create } from "zustand";
import {
  profile,
  skills,
  experience,
  lessons,
  projects,
  socials,
} from "../data";

export const usePortfolioStore = create((set) => ({
  profile,
  skills,
  experience,
  lessons,
  projects,
  socials,

  // Optional mutators for future CMS / live editing
  setProfile: (next) => set({ profile: next }),
  setSkills: (next) => set({ skills: next }),
  setExperience: (next) => set({ experience: next }),
  setLessons: (next) => set({ lessons: next }),
  setProjects: (next) => set({ projects: next }),
  setSocials: (next) => set({ socials: next }),
}));
