# Product Requirements and Build Brief

## Product summary

Build an app that teaches players about Last War gameplay, season mechanics, events, hero strategy, and progression tips. The experience should be organized, searchable, mobile-friendly, visually appealing, and useful to both new and experienced players.

## Product title

- Main web title : Commander Nexus


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

### Main menu entries

- Seasons : the seasons (all of them since inception)
- Heroes : All heroes depicted with details
- Events : All events from the mirror sorted by timeline (most recent come first)- Events
- Gameplay tips
- Progression and optimization
- FAQ

Success target: important topics should be easy to reach with minimal navigation depth.


### Heroes

- Heroes 1st source: mirror/www.lastwartutorial.com/heroes/index.html
- Heroes 2nd source: mirror/fandom/heroes
- Include all heroes included in the mirrors
- Explain the heroes types section
- Each hero should have the following specs: alias, ability, type (hero troop type), rarity, skills, gear
- Each hero should contain the skills table like: Auto, Passive, tactics, Expertise, Ultimate weapon (with image), hero upgrades (if any)
- Hero images are a must. The 2nd source saves the hero associated images in mirror/fandom/heroes/images (2nd source has #1 priority). Images for heroes and their ultimate weapons are linked in mirror/www.lastwartutorial.com/heroes/index.html (images from there have #2 priority - only if not found in 2nd source)
- Try to extract Hero upgrade and ultimate weapon information from the 1st source
- Clicking on a hero should open all the hero details in a modal dialog, and not on the bottom of the hero gallery. It has to be in the most easy to digest way
- Create the **Hero guide** as a modal with the details inside

### Seasons

  1. Season mechanics
  2. Season tabs : like Season 1, Season 2 ... etc
  3. When clicking a season, a modal opens with :
     - season title
     - season details
     - what's new (buildings, ressources, etc... )
     - per week (week1, week2, etc... ) - manual, pictures
  4. Season per week articles. If there is data to mention a per week article, then open its details as a modal.

### Events

- Each **Event** card (with info) should open a modal containing the rest of the details

### Gameplay tips

- Each **Gameplay tips** card (with info) should open a modal containing the rest of the details

### Progression

- Each **Progression** card (with info) should open a modal containing the rest of the details

### Search

Search should help users find specific topics, heroes, events, and advice quickly across the available mirrored content.

### FAQ

- The app should include a dedicated FAQ section with concise, expandable answers to common player questions.
- If the faq contains guide details like the "open related guide" and that guide does have a modal, launch that modal

### Dark mode

Dark mode is required and should preserve readability and visual polish. Use a day/night toggle

### Mobile optimization

The experience must be designed for mobile use first, with comfortable navigation, readable content, and touch-friendly interactions.

### Mirrored media usage

- When images are used in the app, prefer mirrored images and assets from `mirror/www.lastwartutorial.com` (except for heroes, where the fandom source has priority)
- Images, in the modal, should not be vertically truncated. Rather use horizontal padding to keep the aspect ratio, but the image content should be displayed in full (and not cut off hero heads ... or game ressources screengrabs cutoff in the most important corner)

## Experience qualities

1. **Informative** - dense with useful game knowledge without feeling chaotic
2. **Discoverable** - users can reach the right content quickly through search and navigation
3. **Trustworthy** - content reflects the mirrored source material consistently
4. **Accessible** - works well across desktop and mobile, including dark mode
5. **Community-friendly** - supports future community contribution patterns

## Design direction

The visual direction should feel tactical and polished, matching the Last War theme without sacrificing readability. The UI should feel modern, organized, and easy to scan, with strong contrast and clear hierarchy in both light and dark themes.

## Copyright

In the footer of the site, mention in clear: "The content of this site was adapted from https://www.lastwartutorial.com/ and https://last-war-survival.fandom.com/ (as links)

## Implementation guidance

- Prefer content structures that map well to the mirrored site
- Reuse mirrored assets instead of introducing disconnected visual sources
- Keep navigation simple for players of all skill levels
- Preserve mobile usability when introducing new sections or interactions
- Treat the local mirror and this PRD as the default reference for future development work
- Modal dialogs / Modal info should be wide by default (since they contain a lot of data), wide as in 75% viewport width

## Exclusions from the mirror

- Exclude the Community stuff
- Exclude 'Contact Us'
- Exclude Legal
- Exclude x min (information taken from various sources, we don't need to know how long ago the info was updated, or how long it takes to read)
- Exclude/avoid texts like 'click here' that does not do anything (i.e. avoid mentioning a link that does not exist)
  