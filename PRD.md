# Planning Guide

A comprehensive knowledge hub for Last War players to learn game mechanics, seasonal content, events, and optimization strategies with community-contributed tips.

**Experience Qualities**: 
1. **Informative** - Dense with useful game knowledge organized into digestible sections that players can easily consume and reference
2. **Discoverable** - Powerful search and navigation ensure players find exactly what they need within seconds
3. **Community-driven** - Players feel empowered to contribute their own strategies and tips, creating a living knowledge base

**Complexity Level**: Light Application (multiple features with basic state)
This is a content-focused app with search, navigation, user submissions, and theme toggling - more than a simple showcase but not requiring complex state management or multiple interconnected views.

## Essential Features

### Content Organization
- **Functionality**: Display Last War game information organized into categories (Season Mechanics, Events, Gameplay Tips, Character Guides, Resource Management)
- **Purpose**: Provides structured access to comprehensive game knowledge
- **Trigger**: User clicks on a category or navigation item
- **Progression**: User lands on homepage → Selects category from navigation → Views category content → Can drill down into specific guides
- **Success criteria**: All major game topics are covered and accessible within 2 clicks

### Hero & Character Guides
- **Functionality**: Detailed hero profiles with stat breakdowns, ability descriptions, upgrade paths, and tactical recommendations
- **Purpose**: Helps players understand hero capabilities and make informed decisions about hero development
- **Trigger**: User navigates to Heroes tab or searches for a specific hero
- **Progression**: User opens heroes section → Browses hero cards → Clicks hero card → Views detailed stats and abilities → Reads tactical recommendations
- **Success criteria**: Each hero displays complete stats (Attack, Defense, HP, Speed), all abilities with descriptions, rarity tier, role classification, and strategic usage tips

### Search Functionality
- **Functionality**: Real-time search that filters through all content (guides, FAQs, tips) as user types
- **Purpose**: Enables quick access to specific information without browsing
- **Trigger**: User types into search input
- **Progression**: User opens search → Types query → Results filter in real-time → Clicks result → Navigates to content
- **Success criteria**: Search returns relevant results within 300ms and highlights matching content

### FAQ Section
- **Functionality**: Accordion-style frequently asked questions with expandable answers
- **Purpose**: Addresses common player questions in a scannable format
- **Trigger**: User navigates to FAQ section
- **Progression**: User opens FAQ → Scans questions → Clicks to expand answer → Reads solution → Closes or opens another
- **Success criteria**: Top 15-20 player questions are answered with clear, actionable responses

### User Tips Submission
- **Functionality**: Form for players to submit their own gameplay tips and strategies
- **Purpose**: Crowdsources community knowledge and keeps content fresh
- **Trigger**: User clicks "Submit a Tip" button
- **Progression**: User clicks submit button → Dialog opens with form → Enters tip details (category, title, content) → Submits → Confirmation shown → Tip stored for review
- **Success criteria**: Submissions are saved persistently and display in a dedicated community tips section

### Dark/Light Mode Toggle
- **Functionality**: Theme switcher that toggles between dark and light color schemes
- **Purpose**: Reduces eye strain and provides personalization based on player preference
- **Trigger**: User clicks theme toggle button
- **Progression**: User clicks toggle → Theme transitions smoothly → Preference saved → Persists across sessions
- **Success criteria**: Theme preference persists and all content remains readable in both modes

## Edge Case Handling
- **Empty Search Results**: Display helpful message with suggestions to broaden search terms
- **No Tips Submitted Yet**: Show encouraging empty state with call-to-action to be the first contributor
- **Form Validation**: Prevent submission of empty tips with inline validation feedback
- **Long Content**: Implement scroll areas and proper text truncation for lengthy guides
- **Mobile Navigation**: Collapsible hamburger menu for small screens to preserve screen real estate

## Design Direction
The design should evoke a tactical, strategic military aesthetic that matches Last War's theme while maintaining clarity and readability. It should feel authoritative and comprehensive like a field manual, but modern and digital rather than dated. The interface should inspire confidence that players are accessing quality, battle-tested information.

## Color Selection
A commanding military-inspired palette with strong contrast for readability in both themes.

**Light Theme:**
- **Primary Color**: Deep Military Slate `oklch(0.28 0.02 250)` - Authoritative navy blue-grey that conveys tactical seriousness
- **Secondary Colors**: 
  - Soft Command Grey `oklch(0.94 0.005 250)` for secondary actions and backgrounds
  - Muted Tactical Beige `oklch(0.88 0.015 80)` for subtle accents
- **Accent Color**: Tactical Orange `oklch(0.65 0.18 45)` - Alert highlight for CTAs and important strategic information
- **Foreground/Background Pairings**:
  - Primary (Deep Military Slate #3a4150): White text (#FFFFFF) - Ratio 9.2:1 ✓
  - Accent (Tactical Orange #c97234): White text (#FFFFFF) - Ratio 4.6:1 ✓
  - Background (White #FFFFFF): Foreground Dark (#1a1d25) - Ratio 16.8:1 ✓

**Dark Theme:**
- **Primary Color**: Tactical Steel `oklch(0.75 0.015 250)` - Lighter blue-grey for dark backgrounds
- **Secondary Colors**:
  - Command Dark `oklch(0.22 0.01 250)` for secondary actions
  - Deep Bunker `oklch(0.16 0.01 250)` for cards and elevated surfaces
- **Accent Color**: Bright Tactical Orange `oklch(0.72 0.18 45)` - More vibrant for dark mode visibility
- **Foreground/Background Pairings**:
  - Background (Deep Bunker #1f2228): Foreground Light (#e8eaed) - Ratio 13.5:1 ✓
  - Primary (Tactical Steel #b0b9c8): Dark background (#1a1d25) - Ratio 8.1:1 ✓
  - Accent (Bright Tactical Orange #d88a4e): Dark background (#1a1d25) - Ratio 6.2:1 ✓

## Font Selection
Typography should balance military precision with modern digital readability, using geometric fonts that feel structured and authoritative.

- **Primary Font**: Space Grotesk - A geometric sans-serif with technical precision that feels modern yet tactical
- **Secondary Font**: Inter - For body text and smaller UI elements, ensuring maximum readability

**Typographic Hierarchy**:
- H1 (Page Titles): Space Grotesk Bold / 36px / -0.02em letter spacing / 1.1 line height
- H2 (Section Titles): Space Grotesk SemiBold / 28px / -0.01em letter spacing / 1.2 line height
- H3 (Subsections): Space Grotesk Medium / 20px / normal letter spacing / 1.3 line height
- Body (Content): Inter Regular / 16px / normal letter spacing / 1.6 line height
- Small (Captions): Inter Regular / 14px / normal letter spacing / 1.5 line height
- Button Text: Space Grotesk Medium / 15px / 0.01em letter spacing

## Animations
Animations should feel precise and purposeful like tactical operations - quick, efficient, and confidence-inspiring rather than playful.

- **Navigation Transitions**: 250ms ease-out for smooth section switching without delay
- **Search Results**: Staggered fade-in (50ms delay between items) for result appearance
- **Theme Toggle**: 200ms smooth color transition across all elements
- **Accordion Expand**: 300ms ease with slight bounce for FAQ expansions
- **Form Submission**: Success checkmark animation with 400ms scale and opacity
- **Hover States**: 150ms color/scale transitions for interactive elements
- **Mobile Menu**: 300ms slide-in from left with backdrop fade

## Component Selection

**Components**:
- **Navigation**: Sidebar component for desktop navigation with collapsible mobile drawer
- **Search**: Command component (⌘K style) for powerful keyboard-accessible search
- **Content Display**: Card components for guide previews with hover effects
- **FAQ**: Accordion component with smooth expansions
- **Tip Submission**: Dialog component with Form components (Input, Textarea, Select)
- **Theme Toggle**: Custom button with sun/moon icons from Phosphor
- **Category Tags**: Badge components for content categorization
- **Content Sections**: Tabs component for organizing content within categories
- **Loading States**: Skeleton components for content loading
- **Notifications**: Sonner toasts for submission confirmations

**Customizations**:
- Custom search result highlighting with matched text emphasis
- Category icon system using Phosphor icons (Strategy, Crosshair, Sword, Trophy, etc.)
- Gradient overlays on hero sections for tactical atmosphere
- Custom scrollbars with themed colors

**States**:
- Buttons: Distinct hover (scale 1.02, brightness shift), active (scale 0.98), focus (ring with accent color)
- Inputs: Subtle border glow on focus, error state with red accent, success with green checkmark
- Cards: Elevation increase on hover with shadow transition, selected state with accent border
- Search: Active state with pulsing indicator, empty state with helpful prompt

**Icon Selection**:
- Navigation/Menu: List, X
- Search: MagnifyingGlass
- Submit Tip: PencilSimple, PaperPlaneRight
- Theme Toggle: Sun, Moon
- Categories: Sword (Combat), Shield (Defense), ChartLine (Strategy), Trophy (Achievements), CalendarDots (Events), Users (Community)
- FAQ: CaretDown, CaretUp
- Success: CheckCircle
- Error: Warning

**Spacing**:
- Container padding: px-6 md:px-8 lg:px-12
- Section spacing: mb-8 md:mb-12
- Card padding: p-6
- Grid gaps: gap-4 md:gap-6
- Input spacing: space-y-4
- Button padding: px-6 py-3

**Mobile**:
- Sidebar collapses to hamburger menu with drawer
- Search command available via fixed button on mobile
- Grid layouts collapse from 3 columns → 2 columns → 1 column
- Touch-friendly tap targets (min 44px)
- Bottom-aligned submit button on mobile forms
- Sticky header with navigation and theme toggle
- Reduced font sizes (90% scale) for better mobile fit
