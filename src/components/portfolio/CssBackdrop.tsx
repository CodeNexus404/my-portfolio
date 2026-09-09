"use client";

/**
 * CssBackdrop — lightweight replacement for the full-screen WebGL GrainGradient
 * background. Same cyan "corners" palette on black, but rendered with CSS radial
 * gradients + a slow drift instead of a per-frame WebGL context. This removes the
 * single biggest scroll-lag source (a full-viewport shader compositing every
 * frame), so the page stays smooth on high-refresh (120Hz) displays.
 */
export default function CssBackdrop() {
  return (
    <div className="css-backdrop absolute inset-0 h-full w-full" aria-hidden>
      <div className="css-backdrop__a" />
      <div className="css-backdrop__b" />
      <div className="css-backdrop__c" />
    </div>
  );
}
