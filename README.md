# Last War Game Guide

This project is a Last War companion app focused on season mechanics, events, guides, FAQs, search, and community tips. The app should present Last War knowledge in an organized, mobile-friendly, visually appealing way, with dark mode support and images sourced from the local mirror.

## Source of truth

The content source of truth is the local mirror at `mirror/www.lastwartutorial.com`.
Secondary source of truth (for heroes) is the local mirror at `mirror/fandom/heroes`.

- Use mirrored content and mirrored images/assets from `mirror/www.lastwartutorial.com`
- Do not treat the live website as the runtime source
- Use the PRD and instructions documents below when updating features, content structure, or build behavior

## Project documents

- `INSTRUCTIONS.md` - implementation and build instructions derived from the project creation prompt
- `PRD.md` - product requirements and build brief for the app

## Mirror and build workflow

1. Refresh the local mirror with `bash scripts/sync-website.sh`
2. Build the app from the local mirror with `npm run build`

`npm run build` now generates structured guide data from `mirror/www.lastwartutorial.com` and then runs the React/Vite build.

Additional commands:

- `npm run dev` - regenerate mirror-backed content data and start the app locally
- `npm run build:mirror` - package the raw mirrored site into `dist/` if that output is still needed
