# Product Requirements and Build Brief

## Product summary

Build an app that teaches players about Last War gameplay, season mechanics, events, hero strategy, and progression tips. The experience should be organized, searchable, mobile-friendly, visually appealing, and useful to both new and experienced players.

## Source material

The canonical local content source is:

- `mirror/www.lastwartutorial.com`

This local mirror should be used for:

- page content
- images and other display assets
- guide structure and topic discovery

The live site is not the primary build input. The local mirror is.

## Build alignment

This PRD is intentionally part of the build instructions for the repository.

- Refresh mirrored content with `bash scripts/sync-website.sh`
- Build the app with `npm run build`
- `npm run build` generates mirror-backed guide data and then runs the app build
- `npm run build:mirror` remains available to package the raw mirrored site if needed

Any future work on the app should keep the build pipeline aligned with the local mirror and this PRD.

## Core user needs

Players should be able to:

1. learn season mechanics quickly
2. browse events, guides, heroes, and tips in a structured way
3. search for exact information without digging through long pages
4. read common answers in a concise FAQ area
5. benefit from community tips and, if implemented, submit their own

## Required features

### Content organization

The app should present content in clear sections such as:

- Season mechanics
- Events
- Heroes
- Gameplay tips
- Progression and optimization
- FAQ
- Community tips

Success target: important topics should be easy to reach with minimal navigation depth.

### Search

Search should help users find specific topics, heroes, events, and advice quickly across the available mirrored content.

### FAQ

The app should include a dedicated FAQ section with concise, expandable answers to common player questions.

### Community tips

The product should leave room for a user tip submission flow so players can contribute useful strategies and advice.

### Dark mode

Dark mode is required and should preserve readability and visual polish.

### Mobile optimization

The experience must be designed for mobile use first, with comfortable navigation, readable content, and touch-friendly interactions.

### Mirrored media usage

When images are used in the app, prefer mirrored images and assets from `mirror/www.lastwartutorial.com`.

## Experience qualities

1. **Informative** - dense with useful game knowledge without feeling chaotic
2. **Discoverable** - users can reach the right content quickly through search and navigation
3. **Trustworthy** - content reflects the mirrored source material consistently
4. **Accessible** - works well across desktop and mobile, including dark mode
5. **Community-friendly** - supports future community contribution patterns

## Design direction

The visual direction should feel tactical and polished, matching the Last War theme without sacrificing readability. The UI should feel modern, organized, and easy to scan, with strong contrast and clear hierarchy in both light and dark themes.

## Implementation guidance

- Prefer content structures that map well to the mirrored site
- Reuse mirrored assets instead of introducing disconnected visual sources
- Keep navigation simple for players of all skill levels
- Preserve mobile usability when introducing new sections or interactions
- Treat the local mirror and this PRD as the default reference for future development work
