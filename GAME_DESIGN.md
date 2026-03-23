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
-   **Daily Limit**: The maximum number of visitors per day is capped at `ceil(knownMercenaries.length * 1.1)`.
-   **Arrival Chance**: When the arrival timer fires, there is an 80% chance a customer actually appears.
-   **Selection Logic**: If a customer appears, there is a 10% chance it is a newly generated mercenary and a 90% chance it is an existing known mercenary (who hasn't visited today).
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
-   **Tavern Presence**: Unhired `VISITOR` mercenaries are transient. At the end of each day, they have a 70% chance to leave the Tavern if not hired.
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

#### 3.3.3 Tavern Reputation
-   `Tavern Reputation` is a location-level relationship value that measures how trusted and well-known the forge is among adventurers.
-   It is distinct from per-mercenary `Affinity`.
-   Tavern Reputation should influence who appears when the player uses Tavern recruitment interactions such as `Invite`.
-   Tavern Reputation should affect:
    -   The level range of random Tavern recruits.
    -   The class pool weighting for uncommon roles such as Mage and Cleric.
    -   Access to stronger or rarer Tavern recruitment candidates.
    -   Eligibility gates for some Tavern-based named encounters.
-   Tavern Reputation should not affect:
    -   Starting affinity with a recruit.
    -   Automatic discounts on hiring.
    -   Immediate loyalty, guaranteed acceptance, or reduced relationship difficulty.
-   Design intent: the Tavern offers better opportunities as reputation rises, but building trust with an individual mercenary must still require effort.

##### 3.3.3.1 Suggested Tavern Reputation Bands
| Tavern Reputation | Recruit Level Band | Recruit Pool Bias | Encounter Support |
| :--- | :--- | :--- | :--- |
| `0-19` | Low-level local recruits | Mostly common martial classes | Early Tavern encounters only |
| `20-39` | Slightly stronger recruits | Rogue and support classes appear more often | Mid-early Tavern encounters may unlock |
| `40-59` | Veteran-grade candidates | Mage and Cleric appearance weight increases | Most Tavern named encounters can enter the pool |
| `60+` | High-end adventurer pool | Rare classes and stronger trait rolls become more common | Late Tavern named encounters become possible |

#### 3.3.4 Commission & Recruitment Contracts
The commission system adds medium-term goals to the daily economy loop and acts as the primary unlock path for named mercenaries.

-   **General Commissions**: Random townsfolk, travelers, and unnamed mercenaries can request crafted items.
    -   Generated from the general commission pool.
    -   Intended as repeatable economy content.
    -   Rewards are primarily Gold, Affinity, and occasional bonus materials.
-   **Special Contracts**: Named characters appear through controlled encounter windows and offer unique requests.
    -   Intended as narrative progression content.
    -   Completing the contract unlocks the named character as **Recruitable**, but does not auto-hire them.
    -   The player must still pay the recruitment cost or satisfy the contract's join condition.

##### 3.3.4.1 General Commission Rules
-   **Availability**: 2-4 general commissions may be active at once.
-   **Source**: Generated at day start and occasionally refreshed when the Shop opens.
-   **Scope**:
    -   Deliver 1-2 specific crafted items.
    -   Meet a minimum quality threshold such as `GOOD`, `FINE`, or `PRISTINE`.
    -   Optional class preference bonus if the requested item matches the requester job.
    -   Turn in dungeon drops, gathered materials, or monster trophies.
    -   Complete simple hunt or exploration objectives tied to dungeon progress.
-   **Deadline**: Usually 1-3 in-game days.
-   **Rewards**:
    -   Gold payout above normal resale value.
    -   Small affinity gain with the requester archetype or district.
    -   Low chance of a bonus material crate or market voucher.
-   **Failure**:
    -   No permanent lockout.
    -   Small reputation loss or missed bonus.
    -   Failed general commissions return to the pool after cooldown.
    -   Penalties should come from trust loss, delayed future offers, and missed follow-up opportunities rather than a player-paid deposit.

##### 3.3.4.1.1 General Commission Type Matrix
| Type | Core Objective | Typical Source | Example Requirement | Completion Method | Typical Reward Shape | Failure Cost |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CRAFT` | Produce and deliver forged equipment | `SHOP`, `BOARD`, `TAVERN` | Bronze sword `GOOD`+, shield set, light armor piece | Submit crafted item directly from inventory | Gold-heavy, small reputation or affinity bonus | Missed payout, small trust loss, request cooldown |
| `TURN_IN` | Deliver dungeon materials, monster parts, or gathered resources | `BOARD`, `MARKET`, `SHOP` | `fire_essence`, wolf fangs, healing herbs, ore bundles | Submit stackable material items | Gold plus materials, vouchers, recipe hints | Missed payout, reduced chance of similar requests soon |
| `HUNT` | Defeat specific enemy types a target number of times | `BOARD`, `TAVERN` | Slay cave bats x5, ash spiders x3, bandit scouts x4 | Completion tracked from combat results or kill log | Gold, district reputation, occasional combat supply crate | Trust loss with issuer, hunt board cooldown |
| `EXPLORE` | Reach a location, recover an object, or clear a floor milestone | `BOARD`, `TAVERN`, `EVENT` | Reach floor 2, recover survey notes, reveal a ruin node | Completion tracked from dungeon exploration state | Gold, map intel, rare material, future encounter unlock | Missed opportunity, delayed follow-up contract chain |

##### 3.3.4.1.2 General Commission Type Rules
-   `CRAFT` commissions are the most common and should anchor the early economy loop.
-   `TURN_IN` commissions reinforce the value of dungeon materials and gathering outputs.
-   `HUNT` commissions should use lightweight combat tracking and should not require manual trophy bookkeeping unless the item itself matters.
-   `EXPLORE` commissions should be less frequent, more flavorful, and often act as bridges to future contracts or district events.
-   Mixed commissions are allowed in later tiers, but early game should favor single-type clarity.

##### 3.3.4.2 Commission Board Role
-   The `Commission Board` is a public notice board for open town contracts.
-   It should support:
    -   Accepting posted work.
    -   Abandoning accepted work.
    -   Tracking progress and deadlines.
    -   Submitting completed work.
-   Board commissions are best suited for:
    -   Public crafting requests.
    -   Dungeon material turn-ins.
    -   Monster culling contracts.
    -   Survey and exploration tasks.
-   The Board should coexist with direct commissions from Shop visitors and Tavern interactions instead of replacing them.

##### 3.3.4.2.1 Commission Board Player Flow
1.  Player opens the Board from the Tavern.
2.  The Board defaults to the `Available` list, showing public contracts that have not yet been accepted.
3.  Player selects a contract card to inspect its objective, deadline, reward, and failure risk.
4.  Player may `Accept` the contract if an active slot is available.
5.  Accepted contracts move to the `Accepted` list and begin tracking deadline and progress immediately.
6.  As the player crafts, fights, or explores, Board contracts update their status:
    -   `In Progress`
    -   `Ready to Submit`
    -   `Expired`
7.  If a contract is ready, the player can open it from the Board and `Submit` or `Claim` the reward.
8.  If the player no longer wants the job, they may `Abandon` it and accept the reputation or opportunity penalty.

##### 3.3.4.2.2 Board View Groups
-   `Available`
    -   Public contracts not yet accepted by the player.
    -   Primary action: `Accept`
-   `Accepted`
    -   Active contracts being tracked.
    -   Primary actions: `Open`, `Abandon`
-   `Ready to Submit`
    -   Contracts with all requirements or objectives complete.
    -   Primary action: `Submit` or `Claim`
-   `Expired`
    -   Recently failed or lapsed contracts shown for short-term feedback before leaving the Board.
    -   Primary action: none, informational only

##### 3.3.4.2.3 Contract Card Information Hierarchy
-   Every Board card should clearly display:
    -   Contract title
    -   Issuer or district
    -   Contract type (`CRAFT`, `TURN_IN`, `HUNT`, `EXPLORE`)
    -   Time remaining
    -   Reward summary
    -   Current progress summary
-   Cards in `Ready to Submit` should visually stand apart from ordinary in-progress work.
-   `HUNT` and `EXPLORE` contracts should show progress counters rather than inventory icons as their primary status signal.
-   `CRAFT` and `TURN_IN` contracts should show item and quality expectations as the dominant information.

##### 3.3.4.3 Special Contract Rules
-   **Eligibility**: Each named character has a hidden unlock condition based on progress such as:
    -   Current day.
    -   Tier level.
    -   Number of items crafted in a category.
    -   Dungeon clears.
    -   Specific material acquisition.
-   **Encounter Window**:
    -   Once eligible, the character enters a 3-day encounter window.
    -   During the window, entering the appropriate location checks for appearance.
    -   Base appearance rate is 40% per valid visit.
    -   If not seen within 3 days, the next valid visit guarantees the event.
-   **Locations**:
    -   Tavern: Fighters, rogues, mercenary veterans.
    -   Shop: Travelers, clerics, repeat customers, local defenders.
    -   Market: Mages, specialists, traders, artisans.
-   **Persistence**:
    -   Once discovered, the special contract becomes a tracked objective.
    -   The contract remains until completed, failed, or deliberately abandoned if the design later supports that option.

##### 3.3.4.4 Named Recruitment Flow
1.  Player satisfies hidden progression conditions.
2.  Named character becomes encounter-eligible.
3.  Character appears in a location-appropriate event.
4.  Character offers a special contract.
5.  Player completes the delivery or exploration objective.
6.  Character state changes from `LOCKED` to `RECRUITABLE`.
7.  Player may hire the character through the Tavern or relevant event follow-up.

##### 3.3.4.5 Recommended Named Contract Order
-   **Pip the Green**
    -   Unlock Condition: Tutorial complete and Day 3 or later.
    -   Encounter Location: Shop.
    -   Contract: Deliver 1 `Bronze Shortsword` with `GOOD` quality or better.
    -   Reward: Pip becomes recruitable. Small Gold bonus and positive shop dialogue.
-   **Adeline Ashford**
    -   Unlock Condition: Tier 1 unlocked, shield recipe crafted once, 5 successful sales.
    -   Encounter Location: Tavern.
    -   Contract: Deliver 1 one-handed weapon and 1 shield, both `GOOD` or better.
    -   Reward: Adeline becomes recruitable. Fighter trust event unlocked.
-   **Elara of the Flame**
    -   Unlock Condition: Obtain `Fire Essence` and craft at least 1 magic-oriented item.
    -   Encounter Location: Market.
    -   Contract: Deliver a catalyst item plus a magic weapon or focus.
    -   Reward: Elara becomes recruitable. Fire-aligned crafting dialogue unlocked.
-   **Sister Aria**
    -   Unlock Condition: Experience an injured mercenary state and recover or treat it.
    -   Encounter Location: Shop or event visit.
    -   Contract: Deliver healing supplies or cleric-oriented gear.
    -   Reward: Sister Aria becomes recruitable. Recovery-focused utility unlock.

##### 3.3.4.6 Named Unlock Matrix
This table is the canonical design reference for named mercenary encounter order and recruit unlock requirements.

| Mercenary ID | Display Name | Unlock Trigger | Encounter Location | Encounter Window | Special Contract Requirement | Completion Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `pip_green` | Pip the Green | Tutorial complete and Day >= 3 | `SHOP` | 3 days, 40% per valid visit, guaranteed on next valid visit after miss window | Deliver `bronze_shortsword` x1 with minimum `GOOD` quality | `RECRUITABLE`, small Gold reward, positive shop dialogue |
| `adeline_shield` | Adeline Ashford | Tier >= 1, crafted shield recipe at least once, 5 successful shop sales | `TAVERN` | 3 days, 40% per valid visit, guaranteed on next valid visit after miss window | Deliver one one-handed weapon and one shield, both minimum `GOOD` quality | `RECRUITABLE`, fighter trust event unlocked |
| `elara_flame` | Elara of the Flame | Obtained `fire_essence` and crafted at least one magic-oriented item | `MARKET` | 3 days, 40% per valid visit, guaranteed on next valid visit after miss window | Deliver one catalyst component and one magic weapon or focus | `RECRUITABLE`, fire-aligned crafting dialogue unlocked |
| `sister_aria` | Sister Aria | At least one mercenary entered `INJURED` state and recovery flow has been experienced | `SHOP` or recovery event | 3 days, 40% per valid visit, guaranteed on next valid visit after miss window | Deliver healing supplies or cleric-oriented gear | `RECRUITABLE`, recovery utility unlock |

##### 3.3.4.7 Balance Role of Commissions
-   General commissions must not fully replace standard shop sales.
-   Special contracts must not flood the player all at once; only 1 active named contract should exist at a time.
-   Commission payouts should usually beat simple resale value by 10-25%, but not exceed dungeon loot spikes.
-   Special contracts should reward access, story, and utility more than raw Gold.

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
