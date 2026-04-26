# Project Instructions

This document captures the project creation prompt and the operational rules that should guide future work on the app.

## Product goal

Create an app that teaches users about Last War gameplay, season mechanics, events, and practical ways to improve. The app should organize information from the local Last War mirror into a user-friendly experience for players of all levels.

## Required app capabilities

- Organized browsing for Last War topics such as season mechanics, events, tips, heroes, and progression
- Search functionality to quickly find specific information
- FAQ section for common questions
- Optional or planned user-submitted tips/community contribution flow
- Dark mode
- Strong mobile usability
- Visually appealing navigation and content presentation
- Use of mirrored images and assets where relevant

## Source-of-truth rule

`mirror/www.lastwartutorial.com` is the source of truth for content and assets.

- Use the local mirror instead of the live website
- Pull images from the mirrored asset paths
- Keep content organization aligned with the mirrored information architecture when practical

## Build instructions

The build workflow is mirror-first.

1. Refresh the local content source with `bash scripts/sync-website.sh`
2. Build the distributable app output with `npm run build`

Build implementation details:

- `scripts/sync-website.sh` refreshes and normalizes the HTTrack mirror
- `scripts/generate-mirror-content.mjs` extracts structured guide data from the local mirror for the app
- `npm run build` generates mirror-backed content data and then runs the React/Vite app build
- `npm run build:mirror` remains available if the raw mirrored site needs to be packaged into `dist/`

## PRD usage

`PRD.md` is part of the build and implementation instructions for this repository. Treat it as the product brief that defines the intended experience, content structure, and feature set for the app built from the local mirror.
