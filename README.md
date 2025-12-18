
# Lockhart's Forge

> **Version**: 0.1.28
> **Status**: Alpha / Active Development

**Lockhart's Forge** is a casual blacksmithing simulation game where players manage a ruined forge, craft weapons and armor, and trade with wandering mercenaries. The project combines a React-based UI management system with Phaser 3 minigames for immersive crafting mechanics.

## 🛠 Tech Stack

*   **Core Framework**: React 19 (TypeScript)
*   **Game Engine**: Phaser 3.80+ (Used for the Smithing Minigame and Forge Visualization)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **State Management**: React Context API (`GameContext`)

## 🔄 Recent Updates (v0.1.28)

*   **Equipment UI Overhaul (Mercenary Detail)**:
    *   **Drag & Drop Removal**: Removed complex DnD interactions in favor of a more stable click-based system.
    *   **Inventory List View**: Replaced the item grid with a responsive list view (1 column on narrow, 2 columns on wide screens).
    *   **Stat Preview System**: Selecting an item now shows a real-time "Diff" comparison on the mercenary's stats, highlighting increases (green) and decreases (red).
    *   **Click-to-Equip**: Implemented a "Select then Equip" flow for better precision and intentionality.
    *   **Smart Slot Logic**: Preview correctly handles 2-handed weapons, showing the removal of off-hand items in the stat calculation.

## 🌟 Key Features

### 1. The Forge (Crafting System)
*   **Smithing Minigame**: A rhythm and timing-based minigame built in Phaser.
    *   **Mechanics**: Manage heat temperature, maintain fuel (Charcoal), and strike the anvil when the target ring aligns.
*   **Mastery System**: Tracks crafting counts. Higher mastery grants stat bonuses and reduces energy costs.

### 2. Economy & Management
*   **Inventory System**: View resources, tools, and crafted equipment. Includes "Quick Sell" functionality.
*   **The Shop (Sales)**: NPC Queue system where mercenaries visit and request specific gear.

### 3. NPC & Tavern System
*   **Procedural Mercenaries**: NPCs with unique jobs, stats, and relationship levels.
*   **Affinity System**: Successful trades and gifts increase affinity, unlocking hiring and better dialogues.

## 📂 Project Structure

(See PROJECT_MAP.md for detailed internal documentation)

## 📜 License

Private / Proprietary (Lockhart's Forge Team)
