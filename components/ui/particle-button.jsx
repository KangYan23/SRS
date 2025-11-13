// This file used to contain the particle-enabled Button implementation.
// The authoritative implementation now lives in `button.jsx`.
// Re-export the named exports so older imports keep working while we
// consolidate the single source of truth into `button.jsx`.

export { Button, buttonVariants, ParticleButton } from "./button";