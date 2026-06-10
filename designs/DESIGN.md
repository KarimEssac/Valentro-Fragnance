---
name: Valentro Premium Identity
colors:
  surface: '#131410'
  surface-dim: '#131410'
  surface-bright: '#3a3935'
  surface-container-lowest: '#0e0e0b'
  surface-container-low: '#1c1c18'
  surface-container: '#20201c'
  surface-container-high: '#2a2a26'
  surface-container-highest: '#353531'
  on-surface: '#e5e2dc'
  on-surface-variant: '#cfc4c5'
  inverse-surface: '#e5e2dc'
  inverse-on-surface: '#31312d'
  outline: '#988e90'
  outline-variant: '#4c4546'
  surface-tint: '#c6c6c6'
  primary: '#c6c6c6'
  on-primary: '#303030'
  primary-container: '#000000'
  on-primary-container: '#757575'
  inverse-primary: '#5e5e5e'
  secondary: '#e4c283'
  on-secondary: '#412d00'
  secondary-container: '#5a4310'
  on-secondary-container: '#d2b174'
  tertiary: '#e5c092'
  on-tertiary: '#422c0a'
  tertiary-container: '#000000'
  on-tertiary-container: '#8e7048'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e4c283'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5a4310'
  tertiary-fixed: '#ffddb4'
  tertiary-fixed-dim: '#e5c092'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#5b421e'
  background: '#131410'
  on-background: '#e5e2dc'
  surface-variant: '#353531'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 84px
    fontWeight: '400'
    lineHeight: 92px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '300'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style

This design system is engineered for the high-end fragrance market, embodying a brand personality that is **mysterious, opulent, and meticulously refined**. It targets a discerning audience that values heritage mixed with modern minimalism. 

The aesthetic is a fusion of **Modern Minimalism and Cinematic Luxury**. By using vast amounts of negative space (predominantly in deep blacks) and a focused use of gold accents, the UI evokes a "boutique" emotional response—quiet, confident, and expensive. Taking inspiration from the provided reference, we elevate the layout by stripping away vibrant hues in favor of a monochromatic depth that lets the product photography act as the primary visual driver. The interface should feel like a digital flagship store: curated, spacious, and authoritative.

## Colors

The palette is anchored in a **Dark-First** philosophy to create an immersive, evening-like atmosphere.

*   **Primary (Night):** Pure Black (#000000) is the foundation for all backgrounds, creating a void that makes product imagery pop.
*   **Secondary (Champagne Gold):** Used sparingly for high-value actions, interactive states, and brand signatures. It provides a warm, luminous contrast to the darkness.
*   **Tertiary (Deep Umber):** Applied to secondary containers, hover states, or subtle gradients to provide depth and prevent the black from feeling "flat."
*   **Neutral (Parchment):** A very light off-white (#F9F6F0) is used for body text to ensure maximum legibility while feeling more organic and premium than pure white.

## Typography

The typography strategy relies on the tension between the **Classic Serif** and the **Contemporary Sans**.

*   **Headlines:** We utilize *Libre Caslon Text* to evoke editorial authority. Large display sizes should use tighter letter-spacing to feel like a bespoke masthead.
*   **Body:** *Hanken Grotesk* provides a clean, sharp contrast. The "Light" (300) weight is preferred for long-form descriptions to maintain a delicate, airy feel.
*   **Labels:** Small-caps are used for navigation items, scent notes, and categories to add a structured, catalog-like precision to the interface.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. Content is contained within a 1440px max-width to preserve the "curated" feel on ultra-wide monitors, but allows for full-bleed imagery for hero sections.

*   **Grid:** A 12-column grid is used for desktop. However, asymmetrical layouts are encouraged—for example, placing a product description in a 4-column span offset by 2 columns of whitespace.
*   **Rhythm:** Spacing is generous. Avoid overcrowding elements; use "White Space" (or in this case, Black Space) to signify luxury.
*   **Mobile:** On smaller screens, margins are reduced, and the grid collapses to 2 columns for product feeds to maintain image scale.

## Elevation & Depth

In a dark, minimal design system, depth is achieved through **Tonal Layering** and **Subtle Light Plays** rather than traditional shadows.

*   **Base Layer:** Pure Black (#000000).
*   **Mid Layer:** Deep Brown (#402A08) used for cards or secondary navigation bars to pull them slightly forward.
*   **Luminous Accents:** Hover states for interactive elements should use a soft "Gold Glow"—an outer glow effect with 0% spread and a high blur radius using the Champagne Gold (#DEBC7E) at 20% opacity.
*   **Borders:** Use ultra-thin (1px) borders in Deep Brown to define sections without breaking the visual flow.

## Shapes

The shape language is **Strictly Geometric and Sharp**.

*   **Corner Radius:** We utilize a 0px (Sharp) radius across all primary components: buttons, cards, and input fields. This reinforces the architectural and "high-fashion" feel.
*   **Exceptions:** Roundness is only permitted for iconography or specialized decorative elements (like a circular "Seal of Authenticity") to contrast against the rigid UI structure.

## Components

*   **Buttons:** Rectangular with 0px radius. Primary buttons are Gold (#DEBC7E) with Black text. Secondary buttons are Ghost-style: Black background with a 1px Gold border and Gold text.
*   **Input Fields:** Bottom-border only. No full box enclosures. Labels sit above in `label-caps`. Focus state shifts the bottom border from Deep Brown to Gold.
*   **Cards:** Product cards should have no background or borders. The image is the hero, followed by centered typography. On hover, the image should subtly scale (1.05x).
*   **Chips/Tags:** Used for scent notes (e.g., "Oud", "Bergamot"). These are small, bordered boxes in Deep Brown with `label-caps` text.
*   **Navigation:** A "floating" top bar that is transparent at the top of the page and becomes a solid Deep Brown blur on scroll. Icons should be thin-stroke (1px).
*   **Fragrance Profile:** A custom component using a vertical line scale to represent "Sillage" and "Longevity," utilizing the Gold accent color.