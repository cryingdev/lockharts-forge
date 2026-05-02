# Lockhart's Forge - Design Guide

This document defines the shared visual language, interaction patterns, and common component rules for UI work across the project.

## 1. Purpose

Use this guide when adjusting:
- Visual hierarchy
- Typography and readable sizing
- Overlay and modal treatment
- Shared controls and handles
- Core tab workspace layout
- Common component appearance and intent

`ARCHITECTURE_POLICIES.md` should stay focused on structure, rules, balance, and migration. Visual and interaction standards should live here.

---

## 2. Common UI Principles

### Readability First
- Scenic backgrounds are part of the game identity, but foreground UI must still read clearly.
- When UI sits directly on top of artwork, increase text size, contrast, and shadow before adding more opaque backing layers.
- Actionable text should beat atmospheric flavor text when the two compete.

### Scene Anchoring
- Popups and overlays should still feel connected to the underlying game scene.
- Prefer dimming and soft separation over fully burying the background unless the moment is intentionally dramatic.

### Action Clarity
- Primary actions should be obviously heavier than secondary actions.
- If the player has one likely next step, provide more than one discoverable entry point when appropriate.
- Decorative icons should become actionable when they occupy central attention and clearly imply the next step.

### Mobile Rhythm
- Avoid hugging the bottom safe area too tightly.
- Floating action controls should feel reachable, but not visually collapsed into screen edges.
- Dense HUD areas should compress spacing before shrinking the core icon or label beyond readability.

---

## 3. Common Components

### `SfxButton`
Purpose:
- Default interactive surface for tap actions across tabs, overlays, drawers, and workspace controls.

Guidelines:
- Treat `SfxButton` as the project default button shell unless there is a strong reason not to.
- Keep touch targets comfortably large on mobile.
- Favor `active` feedback over sticky `hover` color changes for mobile-only interactions.
- Decorative controls that become actionable should still use the same interaction language as other buttons.

### Floating Back Buttons
Used in:
- `Market`
- `Forge`
- `Shop`
- `Dungeon`
- `Tavern`

Spec:
- Minimum height: `52px` mobile, `58px` desktop
- Padding: `px-5 py-3`
- Radius: `rounded-2xl`
- Surface: dark translucent stone
- Border: stone outline
- Text: uppercase, bold
- Tracking: about `0.18em`

Exception:
- Dense header close buttons may omit text, but should preserve the same touch target.

### Modal Containers
Purpose:
- Centered focus layers that still preserve awareness of the underlying scene.

Guidelines:
- Modal containers should own most readability work.
- Increase panel contrast before darkening the whole scene further.
- Board-style popups may use more material-like shells when the fantasy framing matters.

### Modal Confirm Buttons
Purpose:
- Keep the primary confirmation action immediately legible and comfortably tappable on mobile.

Guidelines:
- Primary confirm buttons inside modals should be visibly larger than secondary or dismissive actions.
- Default mobile target:
  - minimum height: `72px`
  - radius: `rounded-xl`
  - font size: around `14px-16px`
  - font weight: heavy / black
  - tracking: slightly expanded, but less aggressive than tiny utility labels
- Confirmation buttons should favor generous vertical space before increasing width or adding extra ornament.
- Leading icons are allowed when they reinforce the action, but the label must remain the dominant visual element.

### Compact HUD Cards
Purpose:
- Compress status into a lightweight always-visible strip without overwhelming the scene.

Guidelines:
- Remove dead spacing before shrinking the icon below readability.
- Use one outer shell when multiple compact cards belong to one HUD band.
- Use thin dividers rather than repeating full card borders.
- Show the minimum useful numeric state only.

### Floating Tooltip
Purpose:
- Reuse one lightweight tooltip pattern across HUD hints, item help affordances, and catalog detail popups.

Guidelines:
- Use the shared `FloatingTooltip` container together with `useTimedTooltip` instead of building one-off tooltip shells per screen.
- Tooltips should feel ephemeral and assistive, not modal.
- Default behavior should support:
  - one visible tooltip at a time
  - tap again to close
  - tap tooltip body to close
  - short auto-dismiss timing when the tooltip is informational only
- Use fixed-position rendering so tooltips are not clipped by drawers, cards, or scroll containers.
- Clamp tooltip position to the viewport instead of shrinking the content to fit.
- Favor short explanatory content and a narrow width before creating larger floating panels.
- HUD and card-level tooltips should usually appear above the anchor unless the screen edge or surrounding layout makes a below placement easier to read.

### `AutoFitText`
Purpose:
- Keep short HUD and card labels on one line when localization length is unstable but truncation alone would damage clarity.

Guidelines:
- Use `AutoFitText` for compact labels such as standing, lodging, trust, or other HUD metadata where the container width is fixed and the text must stay inline.
- Prefer `AutoFitText` only for short labels. It is not a substitute for good copy shortening on large paragraphs or button text.
- Set a clear `maxFontSize` that matches the intended design, then allow the component to reduce toward a conservative `minFontSize`.
- Combine it with `whitespace-nowrap` and `truncate` so the fallback behavior is still controlled if the label remains too long even at the minimum size.
- Use it sparingly. If a label repeatedly needs aggressive fitting, shorten the copy instead of relying only on auto-fit.
- Good candidates:
  - compact tavern and forge HUD labels
  - trust / standing / lodging style captions
  - short card metadata headers

---

## 4. Modal Overlay Standard

Shared popup overlays should dim the game scene without fully burying it. The default intent is to keep the active scene readable through the veil so modal interactions still feel anchored to the game world.

### Overlay Spec
- Shared class source: `UI_MODAL_LAYOUT.OVERLAY`
- Backdrop tone: `stone-950` at roughly `40-45%` opacity
- Blur: very light (`~2px`) so the scene softens but remains recognizable
- Layout: full-screen center alignment with safe viewport padding
- Use shared overlay styling by default instead of per-modal one-off backgrounds

### Exceptions
- Highly dramatic or end-of-day moments such as `SleepModal` may intentionally use a darker overlay than the shared default.
- If a modal needs stronger isolation for readability, prefer increasing the modal container contrast first before darkening the global overlay.

---

## 5. Side Transfer Handle Standard

Side transfer buttons used to move between paired workspaces such as `Shop <-> Forge` should read as persistent scene handles rather than generic chevron tabs.

### Side Handle Spec
- Placement: vertically centered on the outer screen edge
- Shape: narrow vertical handle with a rounded inside edge (`rounded-l-2xl` / `rounded-r-2xl`)
- Width: approximately `48px`
- Height: approximately `112px`
- Surface: dark translucent stone base with a light glossy band across the top third
- Border: amber-tinted edge line, thicker than default utility buttons (`2px` on the exposed edges)
- Icon: single centered destination icon only (`Hammer` for Forge, `Store` for Shop)
- Icon size: approximately `24px`
- Interaction feedback: keep `active` feedback; avoid sticky hover-driven amber state on mobile
- Intent: opening the paired scene should feel like pulling a tool drawer or side handle, not paging a carousel

### Notes
- Avoid combining a chevron and a destination icon once the icon alone is readable enough.
- Prefer icon placement toward the visual center or slightly low, rather than above the directional affordance area.

---

## 6. Forge Workspace Standard

The `Forge` workspace should prioritize readability and direct action. Empty states, selected-item presentation, and recipe access should all reinforce the same core loop: choose a pattern, inspect the item, and start work.

### Empty State Spec
- The central forge icon should be an actionable entry point, not decorative only.
- Tapping the empty-state icon should open the same recipe selection flow as the dedicated `도안 / Recipes` button.
- Empty-state copy should guide the player toward the next action rather than use purely atmospheric flavor text.
- Preferred message style: short imperative guidance such as `도안을 선택하고 제작을 시작하세요.`

### Selected Item Panel Spec
- Selected item name, description, and stat panel should use larger text than standard list cards because they sit directly on top of a scenic background.
- The selected item presentation should remain centered and visually dominant over the forge backdrop.
- Recipe change should be available from a small secondary control at the top-right of the selected item display.
- The change-item affordance should reopen the same recipe modal used by the bottom `도안 / Recipes` button.
- Forge item names may intentionally remain in English if that direction is chosen for crafted equipment naming. If used, keep the rule consistent between workspace and recipe-selection views.

### Primary Action Controls
- Bottom `소지품 / Storage` and `도안 / Recipes` buttons should remain large circular controls with strong icon readability.
- These controls should sit comfortably above the bottom screen edge rather than hugging the safe area too tightly.
- The primary work action (`작업 시작 / Start Work`) should stay visually larger and more prominent than quick or utility actions.

### Compact Status HUD
- `기력 / 제련 / 작업대` compact status should favor one continuous container over separate floating cards.
- In compact form, remove unnecessary spacing before shrinking icons.
- Tier display should be overlaid directly on the icon area as `T1`, `T2`, and so on.
- Tier coloring may be used to help parse progression at a glance.
- Energy compact mode should show current energy and the gauge only unless more context is truly needed.

---

## 7. Material Language

### Wood Shells
- Board-style interfaces such as `CommissionBoard` should read as physical wood-backed surfaces rather than floating translucent glass.
- Wood shells should feel grounded and slightly worn, not glossy or plastic.

### Parchment Cards
- Contracts and notices inside wood boards should read like pinned or slotted parchment rather than floating glowing cards.
- Reduce harsh shadows before increasing brightness.
- Favor inset shading, restrained borders, and warm paper tones over bright cream slabs.

### Scene Overlays
- If time progression is shown on top of a scene, prefer filters and localized lighting changes over full-screen AI background swaps unless the images are perfectly composition-matched.

---

## 8. Typography Notes

- Large scenic workspaces need larger-than-list text sizing.
- Use uppercase and heavy tracking for labels, but keep numeric readouts tighter.
- Long localized labels should be shortened when they repeatedly break layout.
- If a crafted item naming direction is undecided, prefer consistency over partial localization.

---

## 9. Survey Prompt Pattern

Some named-conversation moments behave more like interview or survey prompts than standard dialogue choices. These should not always share the same layout as ordinary `DialogueBox` options.

### Survey Prompt Spec
- Keep the prompt text itself in the main `DialogueBox`.
- Render the answer choices in a separate floating panel when the prompt is acting like a survey, interview, or stance check.
- Prefer placing this answer panel near the animated mercenary, usually around the right-center zone, as long as it does not collide with the affinity card, bottom action buttons, or the main dialogue area.
- Treat the answer panel as an extension of the dialogue state, not as a general-purpose action tray.

### Intent
- The player should read the prompt as a question and the floating panel as the response sheet.
- This separation is preferred when standard bottom-stacked dialogue options would crowd out the prompt text or make the scene harder to read.

---

## 10. Arena Screen Wire Standard

The Arena should launch as a self-contained combat ladder workspace. Its first release should feel complete with local dummy rivals and milestone progression even before online play exists.

### 10.1 Screen Flow
Recommended first-release Arena flow:
1. Arena lobby
2. party edit sheet

### 10.2 Battle Overlay
- The Arena battle overlay should prioritize readability on mobile before dramatic symmetry.
- Keep the header and battle-log footer visually stable while the team panels consume the scrollable center area.
- On narrow screens, stack player team and enemy team vertically instead of forcing a three-column battlefield.
- On wide screens, restore the centered `VS` column for stronger presentation.
- Team cards should compress spacing before shrinking names or HP readability.
- Default Arena autoplay speed should begin at `2x`, not `5x`, so the player can still parse target swaps, HP loss, and battle flow on a real device.
- Result handoff should pause briefly after combat ends so the win/loss state reads before the result modal replaces the overlay.
3. opponent shortlist
4. pre-battle confirmation
5. battle result
6. milestone reward claim when applicable

The Arena should avoid deeply nested modal stacks. The player should usually feel one clear next step at a time.

### 10.2 Arena Lobby Wire
Purpose:
- establish the mode identity
- show current progression
- expose the current playable opponents immediately

Recommended vertical structure:
- top floating back button
- hero header band
- compact ladder summary
- milestone reward strip
- opponent shortlist
- bottom primary action area

Recommended content blocks:
- `ArenaHeader`
  - title
  - short flavor subtitle or rank statement
- `ArenaRatingCard`
  - current Arena Points
  - peak Arena Points
  - current rank label
  - next milestone progress
- `ArenaMilestoneTrack`
  - horizontal reward thresholds
  - claimed / available / locked states
- `ArenaOpponentList`
  - 3 to 5 opponent cards
  - one-tap open for details and battle entry

### 10.3 Party Edit Sheet
Purpose:
- let the player choose up to 4 mercenaries without leaving the Arena context

Recommended presentation:
- bottom sheet or centered modal, depending on density
- keep the current Arena lobby visible behind it

Required zones:
- selected party row
  - 4 fixed slots
  - empty slot placeholders remain visible
- roster list
  - scrollable mercenary cards
  - current HP/MP are not the primary focus if Arena uses isolated battle state
- confirm action
  - `아레나 파티 확정 / Confirm Arena Party`

Rules:
- the selected party row should stay pinned while the roster scrolls
- use clear remove / swap affordances
- do not overload the first MVP with formation grids or position micromanagement unless combat already requires it

### 10.4 Opponent Card Wire
Purpose:
- make opponent difficulty and reward potential readable at a glance

Card contents:
- rival leader name
- rank label or point band
- 4-slot party preview
- difficulty tag
- expected point swing preview
  - win `+`
  - loss `-`

Interaction:
- tapping a card opens `ArenaOpponentDetailModal`
- the list should support one selected card state, but avoid sticky amber treatment after the tap state ends
- current selection should use a structural emphasis such as border weight, glow restraint, or scale change rather than a permanent pressed color

### 10.5 Opponent Detail Modal
Purpose:
- provide the final review screen before starting battle

Required content:
- opponent name and rank
- full enemy party preview
- player party preview
- projected point outcome
- notable reward notice if a milestone can be reached from this battle

Primary actions:
- `도전한다 / Challenge`
- `파티 변경 / Edit Party`
- `취소 / Cancel`

Guidelines:
- this modal should use the shared modal shell language, not a one-off battle panel
- the confirm action should clearly dominate

### 10.6 Arena Result Modal
Purpose:
- make point movement, milestone unlocks, and ladder motion emotionally clear

Required content:
- win / loss headline
- points gained or lost
- updated current rating
- peak rating update if applicable
- newly unlocked milestone reward summary if applicable

Optional content:
- battle MVP
- rival defeated notice
- small battle log summary

Guidelines:
- point delta should be the visual center of gravity
- if a milestone reward unlocks, the reward block should appear in the same result moment rather than being hidden in a separate menu

### 10.7 Milestone Reward Treatment
Purpose:
- make progression feel tangible before the player reaches top rank

Presentation rules:
- claimable milestones should be visible directly from the lobby
- one reward at a time should be claimable from the main strip
- use a compact reward card or chip rather than a large inventory-style slab

If a reward is newly unlocked:
- show it in the result modal
- allow immediate claim there or from the lobby strip

### 10.8 Visual Tone
- The Arena should feel formal and prestigious, closer to a sanctioned proving ground than a dungeon crawl.
- Favor dark stone, bronze, muted crimson, and restrained gold.
- Use stronger contrast than Tavern or Market because the screen is information-heavy.
- Opponent cards should feel like heraldic match notices rather than storefront merchandise.

### 10.9 First MVP Layout Recommendation
For the first implementation, prefer this exact scope:
- one Arena tab entry from the main map or a dedicated building
- one Arena lobby screen
- one party edit modal
- one opponent detail modal
- one result modal

Do not add yet:
- scrolling global leaderboard pages
- season history screens
- defense log inboxes
- revenge battle lists
- asynchronous replay browser

---

## 11. Usage Rule

When a UI decision is primarily about:
- spacing
- layering
- button prominence
- type size
- shell materials
- modal feel
- icon treatment

it belongs in `DESIGN_GUIDE.md`.

When a decision is primarily about:
- state rules
- progression formulas
- migration behavior
- transition legality
- reducer or save policy

it belongs in `ARCHITECTURE_POLICIES.md`.
