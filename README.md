
# Lockhart's Forge

> **Version**: 0.1.26
> **Status**: Alpha / Active Development

**Lockhart's Forge** is a casual blacksmithing simulation game where players manage a ruined forge, craft weapons and armor, and trade with wandering mercenaries. The project combines a React-based UI management system with Phaser 3 minigames for immersive crafting mechanics.

## 🛠 Tech Stack

*   **Core Framework**: React 19 (TypeScript)
*   **Game Engine**: Phaser 3.80+ (Used for the Smithing Minigame and Forge Visualization)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **State Management**: React Context API (`GameContext`)

## 🔄 Recent Updates (v0.1.26)

*   **UI / UX Improvements**:
    *   **Tavern Interface**: Improved readability by stacking HP/MP bars and grouping wage information closer to stats.
    *   **Confirmation Modals**: Replaced native browser alerts with custom `ConfirmationModal` for dangerous actions (e.g., firing a mercenary).
    *   **Header Redesign**: Unified the Journal button and Log Ticker into a single interactive element. The ticker now expands to fill available space.
*   **System Menu**:
    *   Added a **Settings/System Menu** (accessible via the Gear icon in the header).
    *   Moved the "Return to Title" (Quit) function to the Settings menu to declutter the main tab bar.
    *   Added placeholders for future Save/Load and Audio settings.

## 🌟 Key Features

### 1. The Forge (Crafting System)
*   **Smithing Minigame**: A rhythm and timing-based minigame built in Phaser.
    *   **Mechanics**: Manage heat temperature, maintain fuel (Charcoal), and strike the anvil when the target ring aligns.
    *   **Visuals**: Dynamic particle effects (sparks), heating glow, and hammer animations.
    *   **Mastery System**: Tracks crafting counts per item. Higher mastery grants stat bonuses (Fine/Masterwork) and reduces energy costs.
*   **Recipe System**: 
    *   Organized by Categories (Weapons, Armor) and Subcategories (Swords, Axes, Helmets, etc.).
    *   **Tier 1**: Copper/Bronze equipment.
    *   **Tier 2**: Iron/Silver equipment.
    *   **Tier 3**: Gold/Ironwood (Magical) equipment.
    *   **Tier 4**: Mithril (Legendary) equipment.

### 2. Economy & Management
*   **Inventory System**: View resources, tools, and crafted equipment. Includes "Quick Sell" functionality.
*   **Marketplace**: 
    *   Purchase raw materials (Ores, Wood, Leather).
    *   Buy upgrade scrolls to unlock higher equipment Tiers.
    *   **Cart System**: Bulk purchasing logic.
*   **The Shop (Sales)**:
    *   Open/Close shop toggle.
    *   **NPC Queue**: Mercenaries physically enter the shop (visualized) and form a queue.
    *   **Haggling**: Sell items to specific customer requests or dismiss them.

### 3. NPC & Tavern System
*   **Procedural Mercenaries**: NPCs are generated with:
    *   **Jobs**: Novice, Fighter, Mage, Rogue, Cleric.
    *   **Stats**: Strength, Vitality, Dexterity, Intelligence, Luck.
    *   **Vitals**: HP/MP calculation based on stats.
*   **Affinity System**: Successful trades increase affinity with specific NPCs.
*   **Tavern**: View known mercenaries and scout for new customers.

### 4. Game Loop
*   **Energy System**: Actions (Crafting, Repairs, Opening Shop) cost Energy.
*   **Day/Night Cycle**: Player must "Rest" to restore energy and advance the day.
*   **Events**: Dynamic event modal system for random encounters.

## 📂 Project Structure

```text
/
├── components/         # React UI Components
│   ├── SmithingMinigame.tsx  # Phaser integration for crafting
│   ├── ForgeTab.tsx          # Recipe selection UI
│   ├── ShopTab.tsx           # Sales interface
│   └── ...
├── context/            # Global State (GameContext)
├── data/               # Static Game Data
│   ├── equipment.ts    # Weapon/Armor definitions
│   ├── materials.ts    # Resource definitions
│   ├── mercenaries.ts  # Named NPC presets
│   └── ...
├── game/               # Phaser Scene Logic
│   └── SmithingScene.ts # Logic for the minigame
├── models/             # TypeScript Interfaces & Models
│   ├── Equipment.ts
│   ├── Mercenary.ts
│   └── ...
├── types/              # Type Definitions
├── utils/              # Helper functions (Assets, Generators)
├── App.tsx             # Main Layout & Tab Navigation
└── index.tsx           # Entry Point
```

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+ recommended)
*   npm or yarn

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Development Server

```bash
npm run dev
```
Access the game at `http://localhost:5173` (default Vite port).

### Building for Production

```bash
npm run build
```

## 📜 License

Private / Proprietary (Lockhart's Forge Team)
