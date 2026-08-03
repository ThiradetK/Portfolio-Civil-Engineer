export const lessons = {
  title: "What experience taught me",
  subtitle: "Every site feeds the next.",
  nodes: [
    {
      id: "site-start",
      label: "Fresh Graduate on Site",
      description: "Box culverts, rebar, formwork — learning by doing under real pressure.",
      children: ["coordination", "technical-clarity"],
    },
    {
      id: "coordination",
      label: "Coordination",
      description: "Aligning crews, consultants, and incomplete information in the field.",
      children: ["documentation"],
    },
    {
      id: "technical-clarity",
      label: "Technical Clarity",
      description: "Turning drawings and conditions into clear instructions that prevent rework.",
      children: ["systems"],
    },
    {
      id: "documentation",
      label: "Documentation & Standards",
      description: "Procedures, method statements, and progress formats that become company standards.",
      children: ["project-controls"],
    },
    {
      id: "systems",
      label: "Systems Thinking",
      description: "Excel tools, 3D models, and dashboards that create a single source of truth.",
      children: ["project-controls"],
    },
    {
      id: "project-controls",
      label: "Project Controls",
      description: "Schedule, cost, and progress ownership across concurrent major projects.",
      children: ["leadership"],
    },
    {
      id: "leadership",
      label: "Project Leadership",
      description: "Still close to the field — now shaping how entire projects see and decide.",
      children: [],
    },
  ],
  connections: [
    { from: "site-start", to: "coordination" },
    { from: "site-start", to: "technical-clarity" },
    { from: "coordination", to: "documentation" },
    { from: "technical-clarity", to: "systems" },
    { from: "documentation", to: "project-controls" },
    { from: "systems", to: "project-controls" },
    { from: "project-controls", to: "leadership" },
  ],
};
