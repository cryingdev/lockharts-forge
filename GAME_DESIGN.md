# Lockhart's Forge - Game Design Document (GDD)

## 1. Project Overview
**Lockhart's Forge** is a management simulation RPG where the player takes on the role of the last descendant of the legendary Lockhart blacksmith family. The game blends deep crafting mechanics, economic management, and tactical dungeon exploration.

### 1.1 The Vision
The player must restore the family's honor and the forge's fire, which was extinguished during the "Dragon's Fire" incident. The game emphasizes the relationship between the craftsman and the heroes who use their tools, creating a living world where every blade has a story.

---

## 2. Core Gameplay Loop
The game operates on a daily cycle, though time progresses based on player actions rather than a real-time clock.
1.  **Preparation**: Check inventory, purchase raw materials from Garrick's Market, and manage mercenary contracts.
2.  **Production**: Craft equipment at the Forge or Workbench. Manage temperature and precision to ensure high quality.
3.  **Commerce**: Open the Shop. Sell items to visiting mercenaries, building relationships and gathering gold.
4.  **Exploration**: Send mercenaries to Dungeons to gather rare materials and experience.
5.  **Rest & Rebuild**: End the day to pay wages, recover energy, and plan for the next tier of restoration.

---

## 3. Key Systems

### 3.1 Forge & Workbench (Crafting)
Crafting is the heart of the game. Items are split between the **Forge** (metal-based) and the **Workbench** (leather/wood-based).

#### 3.1.1 The Smithing Mini-game
When forging, players engage in a precision-based mini-game:
-   **Rings**: Colored rings (Emerald, Amber, Rose) move towards a target.
-   **Difficulty Levels**:
    -   **EASY**: Slow speed (70%), high success probability.
    -   **NORMAL**: Standard speed, balanced probability.
    -   **HARD**: High speed (160%), low probability, high risk.
-   **Judgment**: Hits are judged as **PERFECT** (within 35% of target) or **GOOD** (within 95%).
-   **Combo System**: Consecutive hits increase the difficulty bias towards HARD rings, challenging the player to maintain precision under pressure.

#### 3.1.2 Quality & Mastery
-   **Quality**: Determined by the performance in the mini-game. High quality (100%+) significantly increases item value and mercenary affinity.
-   **Mastery**: Every successful craft increases the player's mastery of that specific recipe.
    -   Higher mastery reduces energy costs.
    -   Provides permanent quality bonuses.
    -   Unlocks "Special Variants" of basic items.

---

### 3.2 Shop & Commerce
The Shop is where the player interacts with the world's inhabitants.

#### 3.2.1 Customer Behavior
-   **Arrival**: Mercenaries arrive randomly (every 5-25 seconds) while the shop is open.
-   **Requests**: Customers seek specific items based on their class and level.
-   **Patience**: Customers will wait for approximately 45 seconds before leaving in disappointment.
-   **Pricing**: Items are sold at a markup (typically 125% of base value). High-quality items can be sold for even more.

#### 3.2.2 Affinity System
-   **Gaining Affinity**: Selling high-quality items and fulfilling requests builds a mercenary's trust.
-   **Benefits**: High affinity unlocks special dialogues, reduced recruitment costs, and better performance in dungeons.
-   **Refusal**: Players can refuse a request, but doing so may lower affinity unless handled politely.

---

### 3.3 Mercenaries & Tavern
Mercenaries are the player's primary agents in the world.

#### 3.3.1 Recruitment
-   **Named Heroes**: Unique characters like *Pip the Green* or *Adeline Ashford* with fixed backgrounds and potential.
-   **Random Recruits**: Procedurally generated mercenaries to fill the ranks.
-   **Job Classes**:
    -   **Novice**: Versatile but weak.
    -   **Fighter**: High VIT and STR, the frontline.
    -   **Mage**: High INT, powerful but fragile.
    -   **Rogue**: High DEX and LUK, finds more loot.
    -   **Cleric**: High INT and VIT, essential for survival.

#### 3.3.2 Progression
-   **Stats**: STR (Attack), VIT (HP/Defense), DEX (Accuracy/Speed), INT (Magic), LUK (Criticals/Loot).
-   **Leveling**: Mercenaries gain XP from dungeons. Upon leveling, players can manually allocate bonus stat points.
-   **Vitals**: Managing HP and MP is critical. Injured mercenaries require days of rest to recover.

---

### 3.4 Dungeon Exploration
Dungeons provide the rare materials needed for higher-tier equipment.

#### 3.4.1 Expedition Modes
-   **Automated Expeditions**: Send a squad for a fixed duration. Safe but limited rewards.
-   **Manual Assault**: A grid-based exploration mode where players move a party floor by floor.
    -   **Grid Movement**: Consumes "Expedition Energy".
    -   **Encounters**: Monsters, treasure chests, and trapped NPCs.
    -   **Bosses**: Powerful foes that guard the transition to deeper floors.

#### 3.4.2 Risk & Reward
-   **Loot**: Monster drops are the only way to get items like *Wolf Fangs* or *Acidic Slime Cores*.
-   **Energy**: Mercenaries have a limited "Expedition Energy" (max 100) that recovers slowly over days.

---

## 4. Economy & Progression

### 4.1 Gold Management
Gold is the primary friction point.
-   **Income**: Shop sales, dungeon loot, and occasional repair work.
-   **Expenses**:
    -   **Wages**: Hired mercenaries require daily pay.
    -   **Materials**: Buying ores and logs from Garrick.
    -   **Upgrades**: Installing new furnaces or workbenches.

### 4.2 Tier Progression
The game is divided into Tiers (currently 1 through 4).
-   **Tier 0**: The ruins. Only basic repairs and scavenging.
-   **Tier 1**: Copper and Bronze age. Basic leather and wood.
-   **Tier 2+**: Iron, Steel, and magical alloys. Requires advanced facilities.

---

## 5. Narrative & World-Building
-   **The Lockhart Legacy**: Once the greatest smiths in the realm, now reduced to one survivor in a ruined shop.
-   **The Dragon's Fire**: A catastrophic event that destroyed the village and the forge. Its mystery unfolds through mercenary dialogues.
-   **Key NPCs**:
    -   **Garrick**: The cynical but reliable market trader.
    -   **Pip the Green**: An aspiring hero who serves as the player's first customer and friend.
