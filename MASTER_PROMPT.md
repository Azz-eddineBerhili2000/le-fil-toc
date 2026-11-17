# MASTER PROMPT — « Suivre la boucle »

Présentation web, 15 slides, Étude de marché — application de suivi des TOC.
Séminaire Lancement de produit · ISTEC · MBA 1 · Professeur Kaabachi.
Aya Rochdi · Nesrine Saoud · Flora Nepidimbaye Namia · Mohamed Hatim · Azz-eddine Berhili · Oualid Dachraoui.

## 1. The one idea
A TOC is a loop: obsession → anxiety → ritual → relief → again.
The whole site is ONE physical object: a real 3D cable (WebGL, lit, glossy) that never leaves the screen.
On the cover it is knotted and turning in space. Every slide pulls it into the shape of the data
(an ellipse around the key figure, the SAM bars, the funnel, the break-even threshold, a voice waveform,
the SWOT cross). On the last slide it is a straight line with three small knots: the three next steps.
The cable *is* the transition. No other decorative element is allowed to compete with it.

## 2. Art direction
- Ground: warm black #0B0B0A. Faint 12-column hairlines (4 % white) — a blueprint, never paper.
- Ink: bone #ECE8E0. Secondary text: bone at 62 %. Labels: bone at 45 %.
- Accent: ISTEC green #86C41A (sampled from the school logo, lifted for a dark ground). One green thing per slide: the key figure
  and the matching part of the cable. Never green paragraphs, never green backgrounds.
- Type: ONE family, Archivo variable (width 62–125, weight 100–900) + IBM Plex Mono for data labels.
  The system is contrast of WIDTH: titles = COMPRESSED HEAVY UPPERCASE; sub-titles = expanded light
  sentence case; numbers = compressed 800 with tabular figures; body = normal width 380.
- Huge scale contrast: hero numbers 260–340 px next to 20 px body.
- 1920×1080 stage, 120 px margins, everything on the 12-col grid. Asymmetric compositions.

## 3. Motion
- Slide change: cable morph (1.6 s, staggered along its length) + titles rise letter by letter while
  their width opens from 62 to their final width (kinetic variable font) + body lines fade up.
- Numbers count up with tabular figures. Bars/tracks grow. Threshold lines draw.
- Cursor: custom ring, difference blend; the cable bends away from the cursor (you can pluck it).
- Idle: the cable breathes; the knot rotates in real 3D. Respect prefers-reduced-motion.
- Short intro loader (counter 000→100), max 1.8 s.

## 4. Banned (AI-slop list)
Rounded cards with shadows · icon grids · emojis · gradient text · glassmorphism · purple/blue gradients ·
glowing blobs · centered hero + subtitle + button · walls of bullets in boxes · stock photos ·
paper/cream textures · generic serif-on-cream · fake testimonials · invented numbers.
Tables become typographic rows on hairlines. Lists become numbered rows aligned on the grid.

## 5. Content fidelity
Every figure, source and caveat comes from the updated deck (v3). Nothing invented.
"À compléter" items stay visible as open slots. Sources sit in the footer of each slide.

## 6. Presenter features
← → / space / swipe · N = speaking script + timer · F = fullscreen · hash per slide · works offline
(all fonts and libraries vendored) · readable on a projector (min body 20 px on the 1920 stage).
