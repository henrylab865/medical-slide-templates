# Hemoptysis + Lung Mass M&M Deck

Two fully editable 16:9 PowerPoint decks for a clinical M&M presentation:

- `Hemoptysis_Lung_Mass_MM_NEJM_EN.pptx` — English
- `Hemoptysis_Lung_Mass_MM_NEJM_ZH-TW.pptx` — Traditional Chinese

## Design

- Case-oriented narrative structure adapted from this repository's medical presentation patterns
- NEJM-inspired color palette derived from the canonical `ggsci` NEJM palette
- Native PowerPoint text, shapes, tables, timelines, arrows, and charts; core slide content remains editable
- 20 slides covering severity, localization, hemostasis, etiology, BAE, rebleeding, diagnostic failure analysis, and prevention
- Auditorium-readable edition: shortened copy with approximately 22–29 pt primary body text and enlarged table/chart labels

The source review did not contain patient-specific chart values. Slides 3 and 4 therefore contain visible placeholders that must be replaced with the actual case data.

## Regenerate

The included `build_bilingual_decks.mjs` uses `@oai/artifact-tool`.

```bash
OUTPUT_DIR=./output QA_ROOT=./qa node build_bilingual_decks.mjs
```

The script exports both `.pptx` files, a PNG for every slide, layout inspection JSON, and a montage for visual QA.

## Clinical-use note

This deck is an educational synthesis. Verify all patient-specific decisions against the current clinical context, institutional practice, and multidisciplinary review.
