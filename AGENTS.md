# Review before publication

The owner requires review of the local site before any upstream push or deployment. Keep changes local until the owner explicitly approves the specific revision for publication.

Shared design tokens are generated from `../www/css/theme-tokens.css` by `../www/scripts/sync-theme.mjs`. Keep the generated copy in this repository so production builds remain independent. Feature processing logic stays separate from shared navigation and styling.
