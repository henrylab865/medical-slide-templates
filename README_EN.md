# Medical Slide Templates — English Edition

An English-language catalog of 63 reusable slide patterns for research presentations, journal clubs, case conferences, clinical trials, and teaching sessions.

The visual system follows a restrained medical-journal aesthetic: white backgrounds, neutral grays, one clinical blue accent, high information clarity, and minimal decoration. The original Japanese catalog remains unchanged.

## Preview

Open the English catalog directly in a browser:

```bash
open decks/medical-template-catalog-en/index.html
```

Use the left and right arrow keys to move through the deck. Press `F` for full screen.

## What is included

- Common presentation slides: title, conflict-of-interest disclosure, ethics, and section breaks
- Research presentation visuals: Table 1, CONSORT, PRISMA, forest plot, Kaplan–Meier, ROC, eligibility, study design, statistical methods, subgroup analysis, outcomes, and acknowledgments
- Journal club slides: bibliography, PICO, RoB 2, GRADE, strengths and limitations, structured abstract, clinical bottom line, CASP, and evidence summary
- Case conference slides: patient profile, HPI timeline, history, examination, vital signs, laboratory results, imaging, differential diagnosis, clinical course, problem list, medications, diagnostic performance, and ventilator settings
- Teaching slides: learning objectives, definitions, quiz, diagnostic and treatment algorithms, and guideline comparison
- Clinical trial plots: waterfall, swimmer, and funnel plots
- General-purpose layouts: process flow, timeline, Gantt chart, before/after, key statistics, references, and closing slide

## Rebuild the English catalog

The English file is generated from the original Japanese catalog so the layouts, styles, and chart behavior stay synchronized:

```bash
python3 scripts/build_english_catalog.py
```

The build stops if untranslated Japanese text remains in the generated file.

## Design and attribution

The English edition preserves the source repository's HTML, CSS, JavaScript, chart behavior, design system, and MIT license. Only user-facing sample content and chart labels are localized. See the original [README](README.md) for the complete design rationale and implementation notes.
