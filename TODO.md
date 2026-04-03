# TODO

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
