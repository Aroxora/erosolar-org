# Migration Considerations from Current Angular 20 (June 2026)

This document is specific to **erosolar-org** — a professional portfolio site with:
- Canvas/visual hero effects
- Real-time Firestore data (jobs, PhDs, updates, applications)
- Google Auth (admin-only features)
- Admin chatbot (calling Cloud Functions)
- Complex but not enormous component tree
- Long-term personal maintenance (solo or very small team)

## Estimated Migration Effort

**Rough order of magnitude (experienced developer)**:
- To **React** (with Vite or Next.js): 3–6 weeks of focused work (not including learning time if you're rusty).
- To **Vue** (with Vite or Nuxt): 2.5–5 weeks (slightly faster DX for many people, but still full rewrite of components, state, routing, etc.).

These are not small "weekend projects." They are real migrations.

## What Would Need to Be Rewritten / Re-architected

### High Effort
- **All components** — templates, logic, styling approach.
- **State management** — Current Angular services + Signals would become React Context / Zustand / Jotai / signals libs (or Pinia if Vue).
- **Routing** — Angular Router → React Router / Next.js app router / Vue Router / Nuxt.
- **Forms** (if any complex ones) — Angular Forms → React Hook Form + Zod / Vue equivalents.
- **Auth integration** — Firebase Auth flows need re-implementation (usually not too bad).
- **Real-time Firestore listeners** — Rebuild with proper cleanup in the new framework's lifecycle.
- **Chatbot component** + integration with callable functions.

### Medium Effort
- Canvas hero / visual effects (can mostly be kept as-is or ported).
- Styling (SCSS variables, etc. — the design system can transfer).
- Firebase service abstractions (you already have some separation).

### Low Effort (but still work)
- Content / copy (the résumé data, project descriptions).
- Some utility functions.

## What You Would Gain (Framework-Specific)

**If moving to React**:
- Access to the largest ecosystem of components, hooks, and examples.
- React Compiler benefits (less manual optimization).
- Much easier to find help or future collaborators.
- React Native path if you ever want a companion mobile app.
- Next.js would give you excellent static generation + dynamic routes for the jobs/blog content with almost zero work.

**If moving to Vue**:
- Generally higher day-to-day happiness for many developers.
- Potentially the best performance story in 2026–2027 via Vapor Mode (especially valuable for a site with visual flair that you want to feel instant).
- Very clean Composition API + excellent reactivity.
- Fastest to become productive again after the initial migration pain.

**What you would lose**:
- Angular's built-in DI and strong module boundaries.
- The current structure and mental model you're already familiar with.
- Time that could be spent adding features instead of migrating.
- Some enterprise-grade "it just works the same in 3 years" feeling (React and Vue are great, but require more ongoing architectural discipline).

## Migration Strategy Options (If You Decide to Move)

1. **Big Bang** — Rewrite everything in a branch/feature, then cut over. Highest risk, fastest "done."
2. **Strangler Fig / Incremental** — Very hard with Angular → React/Vue because the component models are fundamentally different. Not recommended.
3. **Parallel New Version** — Build the new version alongside the old one (e.g. at `/new` or a separate subdomain) and redirect when ready. Good for reducing risk.

## Recommendation for This Specific Project

Given that:
- The current Angular 20 implementation is already modern (standalone, can adopt Zoneless + Signals).
- The project is a long-term personal brand asset rather than a high-traffic consumer app.
- Migration cost is real and would delay other improvements (better job application flows, more agentic features, visual polish, etc.).

**My current technical recommendation (June 2026)** is to **stay on Angular** for now and ride the Zoneless + Signals improvements that are already landing.

Re-evaluate in 12–18 months if:
- You find yourself frequently frustrated with Angular's verbosity or ecosystem gaps.
- You have a strong personal desire to deepen React or Vue skills.
- A specific new requirement appears that is dramatically better served by one of the other frameworks (e.g., heavy React Native needs, or you want to go all-in on the absolute best possible perf via Vapor).

Staying also means you can immediately benefit from Angular 21/22 improvements (Zoneless default, better Signals forms, etc.) with relatively low effort.

## Practical Next Steps If You Want to Experiment Anyway

1. Create a small prototype of the **Jobs page** or the **chatbot** in both React and Vue (outside this repo) to feel the DX difference on this specific data model.
2. Measure real bundle size and perceived performance on a deployed version of the prototype.
3. Honestly assess how much you would enjoy maintaining the new stack vs. the current one for the next 3–5 years.

Would you like me to scaffold small prototype versions of one or two key pages in React and/or Vue so you can do a hands-on comparison?