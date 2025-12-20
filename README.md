
# Lockhart's Forge

> **Version**: 0.1.29
> **Status**: Alpha / Active Development

**Lockhart's Forge** is a casual blacksmithing simulation game where players manage a ruined forge, craft weapons and armor, and trade with wandering mercenaries. The project combines a React-based UI management system with Phaser 3 minigames for immersive crafting mechanics.

## 🛠 Tech Stack

*   **Core Framework**: React 19 (TypeScript)
*   **Game Engine**: Phaser 3.80+ (Used for Smithing/Workbench Minigames)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **State Management**: React Context API (`GameContext`)

## 🔄 Recent Updates (v0.1.29)

*   **Workbench Minigame Refinement (Stitching System)**:
    *   **Persistent Stitch Marks**: Nodes no longer disappear; they leave colored "stitches" (Gold for Perfect, Green for Good, Red for Miss) to show the crafting path.
    *   **Auto-Miss Logic**: The needle passing a node without a hit now automatically triggers a "MISS" state.
    *   **Skill Bonus System**: Maintaining a **Perfect Combo of 8 or more** grants +1 to the item's primary stat for every subsequent Perfect hit.
*   **Combat Simulation Debugging Tools**:
    *   **Tactical Archetype Analysis**: The simulator now auto-detects unit roles (Berserker, Guardian, Scholar, etc.) based on stat distribution, including bonuses from minigames.
    *   **Advanced Bulk Simulation**: Run 10,000 rounds instantly to test stat equilibrium.

## 🌟 Key Features

### 1. The Forge (Crafting System)
*   **Smithing & Workbench**: Distinct minigames for different equipment types.
*   **Mastery System**: Tracks crafting counts to unlock stat multipliers and energy discounts.

### 2. Economy & Management
*   **Inventory System**: Detailed instance data for equipment with rarity and quality.
*   **The Shop (Sales)**: Dynamic NPC queue with dialogue and affinity system.

### 3. Tactical Simulation
*   **Arena**: Test mercenaries against each other or custom builds using the exact combat logic used in expeditions.

## 📂 Project Structure

(See PROJECT_MAP.md for detailed internal documentation)

## 📜 License

Private / Proprietary (Lockhart's Forge Team)
