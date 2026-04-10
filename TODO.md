# TODO

## Dungeon Entry UX Follow-Up

### Context
- Manual dungeon entry is currently blocked while the Shop is open.
- The game now surfaces a visible toast when the player presses the manual entry button in that blocked state.
- We still need to decide the final UX rule for how Shop state and Dungeon entry should interact.

### Open Design Question
- When the player attempts to start a manual dungeon while the Shop is open, should the game:
  - keep the current explicit block and ask the player to close the Shop first, or
  - automatically close the Shop, then continue into dungeon entry?

### Current Recommendation
- Prefer the explicit block plus toast flow.
- Why:
  - auto-closing the Shop is convenient, but it is also stateful and easy to make surprising
  - the player may have intentionally left the Shop open for a reason
  - closing the Shop can have side effects on customer state and expectations
- If we revisit this later, we should first document the exact side effects of auto-closing the Shop during dungeon entry.

### Deferred Review Task
- Re-evaluate manual dungeon entry UX after testing the current toast-based block in real play sessions.
- If auto-closing is reconsidered, define:
  - whether active customers are dismissed, paused, or preserved
  - whether queued customers are cleared or restored
  - whether tutorial/shop-state rules need special exceptions

### Likely Future Targets
- `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/dungeon/hooks/useDungeon.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/state/reducer/manualDungeon.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/state/reducer/shop.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/GAME_DESIGN.md`
- `/Users/cryingdev/GitHub/lockharts-forge/TECH_DESIGN.md`

## Korean Typography Follow-Up

### Context
- Korean body text now uses `NanumMyeongjoEco` via the global font stack in `/Users/cryingdev/GitHub/lockharts-forge/index.html`.
- Language state is synchronized to `document.documentElement.lang` and the `lang-ko` class from `/Users/cryingdev/GitHub/lockharts-forge/components/MainGameLayout.tsx`.
- This improved baseline readability, but some UI patterns were originally authored for uppercase Latin text and still look slightly awkward in Korean.

### Why This Follow-Up Exists
- Korean does not benefit from `uppercase` styling, and tight `tracking` values that work for English labels can look overly spaced or visually noisy in Hangul.
- Dialogue-heavy UI now carries much more Korean text than before, especially after the localization and Tavern / Commission conversation expansions.
- A focused follow-up should improve readability and polish without changing the current English-facing typography.

### Pending Task 1
- Title: Tune `tracking` / `uppercase` usage only when language is Korean
- Why:
  - Many labels were designed for English all-caps UI.
  - In Korean, those same utility classes can reduce readability and make the UI feel less intentional.
- Recommended Scope:
  - Keep English styling unchanged.
  - When `settings.language === 'ko'`, selectively reduce or remove:
    - `uppercase`
    - very wide `tracking-*`
    - overly compressed heading treatment
- Suggested Implementation Direction:
  - Add a small helper or conditional class pattern for Korean typography adjustments.
  - Avoid global blanket overrides first; prefer targeted component tuning.
- High-Value Components To Review:
  - `/Users/cryingdev/GitHub/lockharts-forge/components/DialogueBox.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/modals/SettingsModal.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/MainGameLayout.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/tavern/TavernTab.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/tavern/ui/CommissionBoard.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/tavern/ui/CommissionCard.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/shop/ShopTab.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/forge/ForgeTab.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/dungeon/DungeonTab.tsx`
- Notes For Next AI / Developer:
  - Start by searching for `uppercase`, `tracking-`, and `font-black` usage in components with lots of Korean labels.
  - Review these areas in Korean mode on both desktop and mobile before broadening the change.

### Pending Task 2
- Title: Add localized typography tuning for dialogue-heavy Korean UI
- Why:
  - Dialogue and contract UI now display long Korean sentences more often.
  - Baseline font replacement helps, but line-height, font-size, emphasis weight, and card hierarchy can still be improved.
- Recommended Scope:
  - Focus on surfaces where Korean text blocks are dense:
    - dialogue text
    - contract descriptions
    - help text / subtitles
    - follow-up relationship dialogue
- Suggested Implementation Direction:
  - Add Korean-specific typography tweaks only for text-heavy surfaces.
  - Prefer component-level adjustments instead of changing every global text style.
  - Consider:
    - slightly larger body size for Korean paragraphs
    - more generous line-height in dialogue blocks
    - reducing heavy all-caps label treatment near Korean body text
    - clearer separation between title, description, metadata, and action text
- High-Value Components To Review:
  - `/Users/cryingdev/GitHub/lockharts-forge/components/DialogueBox.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/tavern/ui/TavernInteractionView.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/tavern/ui/CommissionCard.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/tavern/ui/CommissionBoard.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/modals/EventModal.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/modals/JournalModal.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/modals/CraftingResultModal.tsx`
  - `/Users/cryingdev/GitHub/lockharts-forge/components/modals/DungeonResultModal.tsx`
- Notes For Next AI / Developer:
  - Test with:
    - Korean Tavern dialogue
    - named conversation prompts
    - commission card descriptions
    - Settings modal labels
  - Check that English still feels unchanged after the Korean-specific tuning.

### Validation Checklist For Future Work
- Korean UI remains readable on mobile and desktop.
- English UI keeps the current medieval fantasy tone.
- No regression in font loading or layout overflow.
- `npm run lint` passes.
- `npm run build` passes.

## Localized Proper Nouns Review

### Context
- We already split `Lockhart Forge`-style repeated naming into locale-backed helpers and keys.
- The same pattern could later be extended to other repeated proper nouns or semi-fixed world terms if they start appearing in many tutorial, event, or system strings.

### Why This Was Considered
- Repeated names and world terms become hard to rename consistently once they are copied across many dialogue and UI strings.
- Moving them into `names.*` or `terms.*` keys can make future renaming, live-service content changes, or branding updates much safer.
- This was intentionally deferred for now because the current scope would add extra migration work without enough immediate payoff.

### Deferred Review Task
- Re-evaluate whether more repeated proper nouns should move into `names.*` or `terms.*`.
- Only do this if:
  - the same name starts appearing in many unrelated locale strings, or
  - we expect live renaming / server-driven profile naming / broader localization changes.

### Likely Future Targets
- `/Users/cryingdev/GitHub/lockharts-forge/locales/en.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/locales/ko.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/utils/gameText.ts`
- tutorial, tavern, market, and commission text sections that reuse the same world terms repeatedly

## Live Version Refresh Follow-Up

### Context
- `/Users/cryingdev/GitHub/lockharts-forge/utils/cacheManager.ts` now performs a startup-only version check against `/metadata.json` using `cache: 'no-store'`.
- If the running bundle version differs from the freshly fetched metadata version, the app clears browser caches, preserves save/settings keys, and reloads once automatically.
- This intentionally solves the "stale old build on one browser tab" problem only at app startup.

### Why This Follow-Up Exists
- During development and current deployment flow, startup-only refresh is enough and keeps the UX quiet.
- Once longer play sessions or live-service features matter, redeploys that happen while the user is already in-game can still leave that active tab on an old runtime.
- Future online features such as arena battles, server identity, and player-vs-player state will make runtime version drift more important to detect and handle gracefully.

### Deferred Review Task
- Revisit in-game version drift handling after server-backed systems are introduced.
- Evaluate whether the running client should:
  - periodically poll for a newer deployed version,
  - defer refresh until the player reaches a safe point,
  - warn before reloading if the player is in combat / dungeon / unsaved flow,
  - or require a stricter reconnect/update policy for online features.

### Likely Future Targets
- `/Users/cryingdev/GitHub/lockharts-forge/utils/cacheManager.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/index.tsx`
- `/Users/cryingdev/GitHub/lockharts-forge/context/GameContext.tsx`
- `/Users/cryingdev/GitHub/lockharts-forge/state/gameReducer.ts`
- any future online session / matchmaking / server-sync modules

## gameText.ts Review

### Context
- `/Users/cryingdev/GitHub/lockharts-forge/utils/gameText.ts` currently centralizes player-name and forge-name display rules.
- It also still contains legacy name extraction logic that was kept to avoid breaking older name formats while the naming model changed from `forgeName` input to `playerName` input.

### Why This Follow-Up Exists
- Even if legacy save compatibility stops mattering, the file may still be useful as the single place that defines:
  - default player naming,
  - localized forge-name composition,
  - title splitting behavior.
- At the same time, some functions may become unnecessary if legacy fallback and duplicate naming paths are removed later.
- We want a deliberate review rather than letting this helper file grow without re-checking whether all functions still earn their keep.

### Deferred Review Task
- Re-evaluate whether `gameText.ts` is still needed as a dedicated module once the naming model settles.
- Keep it if it remains the cleanest home for:
  - `playerName -> forge display name` rules,
  - locale-aware naming helpers,
  - title formatting helpers.
- Consider trimming it if legacy-only helpers are the main remaining reason it exists.

### Questions To Answer Later
- Do we still need `extractLegacyPlayerName()` once older naming formats are no longer supported?
- Should `playerName` and forge display naming stay coupled, or should they split further when server-backed identity arrives?
- Is `splitTitleName()` still best placed here, or should title-only formatting move closer to the title UI?

### Likely Future Targets
- `/Users/cryingdev/GitHub/lockharts-forge/utils/gameText.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/utils/saveSystem.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/components/TitleScreen.tsx`
- `/Users/cryingdev/GitHub/lockharts-forge/locales/en.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/locales/ko.ts`

## Save Migration Follow-Up

### Context
- Save loading now prefers a migration-first flow instead of hard-blocking at the title screen when save and app versions differ.
- `/Users/cryingdev/GitHub/lockharts-forge/utils/saveSystem.ts` now exposes a migration interface via `runVersionMigration(...)`.
- That migration hook is intentionally a placeholder for now and currently returns `true`.

### Why This Follow-Up Exists
- We want old saves to attempt migration automatically on update.
- Right now the interface exists, but there are no real version-specific migration rules or validation checks behind it yet.
- This means the UX flow is in place, but the actual migration safety still needs to be designed and tested.

### Deferred Review Task
- Revisit save migration before future schema changes stack up.
- Implement real version-to-version migration rules in `runVersionMigration(...)`.
- Add validation coverage for:
  - removed / renamed fields
  - nested state shape changes
  - tutorial / tavern / commission state compatibility
  - future version upgrades that alter reducer expectations
- Confirm behavior for:
  - title-screen continue
  - slot-based load from the title
  - load from in-game settings

### Likely Future Targets
- `/Users/cryingdev/GitHub/lockharts-forge/utils/saveSystem.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/components/TitleScreen.tsx`
- `/Users/cryingdev/GitHub/lockharts-forge/components/modals/SettingsModal.tsx`
- `/Users/cryingdev/GitHub/lockharts-forge/GAME_DESIGN.md`
- `/Users/cryingdev/GitHub/lockharts-forge/TECH_DESIGN.md`

## Manual Dungeon Camping Gear Follow-Up

### Context
- Camp tiles are being framed as rare manual-dungeon recovery points.
- A later expansion should let the player bring their own lightweight camp option instead of depending only on naturally generated camp tiles.

### Deferred Feature
- Add a portable camping item / utility gear that can set up a simple field camp during manual dungeon exploration.
- The item should eventually be purchasable from the Market / Shop flow after the base camp-tile system is stable.

### Design Notes To Revisit
- Decide whether portable camps:
  - create a temporary `CAMP` tile,
  - trigger a one-off recovery action without a tile,
  - or consume a dedicated dungeon utility slot.
- Define whether portable camp recovery is weaker than natural camps.
- Decide whether camp gear is single-use per run, per floor, or inventory-consumable.
- Confirm whether using a portable camp should be blocked in boss rooms or combat-adjacent spaces.

### Likely Future Targets
- `/Users/cryingdev/GitHub/lockharts-forge/state/reducer/manualDungeon.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/dungeon/AssaultNavigator.tsx`
- `/Users/cryingdev/GitHub/lockharts-forge/data/materials.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/data/market/market-catalog.ts`
- `/Users/cryingdev/GitHub/lockharts-forge/GAME_DESIGN.md`

## Commission Board Material / Interaction Follow-Up

### Context
- The Tavern commission board now has a wood-shell and parchment-card visual direction.
- The current look is intentionally a CSS-first stopgap and is good enough for now, but it still relies on gradients and overlays instead of final prop-style art and tactile interaction.

### Deferred Feature 1
- Add a reusable blank parchment background asset for commission cards and parchment-like contract surfaces.
- Prefer a neutral parchment that can support:
  - normal commission cards
  - named/personal request variants
  - future journal / notice / letter reuse if needed

### Design Notes To Revisit
- The parchment should feel like a pinned notice rather than a glowing modal card.
- Keep edge wear, slight discoloration, and paper grain subtle enough for long-form text readability.
- Decide whether the parchment asset should support:
  - baked torn / singed edges,
  - separate overlay layers for stains and folds,
  - or a cleaner single-image background for easier theming.

### Deferred Feature 2
- Replace the plain `Accept Contract` button interaction with a more tactile contract-confirmation action.
- Candidate directions:
  - press a wax seal / stamp onto the parchment
  - sign the contract by dragging or tapping a signature mark
  - stamp an approval insignia with a short SFX + animation

### Interaction Questions To Revisit
- Should acceptance be:
  - a one-tap flourish,
  - a short hold interaction,
  - or a tiny contextual minigame?
- Should the action change visually depending on contract source or issuer?
- Should the board show a post-acceptance mark such as:
  - sealed,
  - signed,
  - or archived?

### Likely Future Targets
- `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/tavern/ui/CommissionBoard.tsx`
- `/Users/cryingdev/GitHub/lockharts-forge/components/tabs/tavern/ui/CommissionCard.tsx`
- `/Users/cryingdev/GitHub/lockharts-forge/components/common/ui/SfxButton.tsx`
- `/Users/cryingdev/GitHub/lockharts-forge/GAME_DESIGN.md`
- `/Users/cryingdev/GitHub/lockharts-forge/TECH_DESIGN.md`
