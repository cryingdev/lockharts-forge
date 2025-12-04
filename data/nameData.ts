import { JobClass } from "../models/JobClass";

type NameList = string[];

export const FIRST_NAMES: Record<'Male' | 'Female', Record<JobClass, NameList>> = {
  Male: {
    [JobClass.NOVICE]: [
      "Alden", "Bram", "Cade", "Dunn", "Ewan", "Finch", "Gage", "Holt", "Ian", "Jace",
      "Kip", "Lyle", "Milo", "Nash", "Odin", "Pike", "Quinn", "Reed", "Saul", "Tate",
      "Vane", "Wade", "Xan", "Yale", "Zane", "Arthur", "Ben", "Carl", "Dan", "Eddy",
      "Fred", "Gil", "Hank", "Ivan", "Jack", "Karl", "Leo", "Mark", "Ned", "Otto",
      "Paul", "Rob", "Sam", "Ted", "Ulf", "Vic", "Will", "Yuri", "Zack", "Arlo",
      "Barney", "Cliff", "Dale", "Earl", "Finn", "Gene", "Hugh", "Ira", "Joel", "Kyle",
      "Liam", "Mick", "Noah", "Owen", "Pete", "Rory", "Sean", "Toby", "Vince", "Walt",
      "Amos", "Beau", "Coy", "Drew", "Eli", "Flynn", "Glen", "Heath", "Jeb", "Kurt",
      "Lane", "Moss", "Nile", "Otis", "Penn", "Reid", "Seth", "Troy", "Vern", "Ward"
    ],
    [JobClass.FIGHTER]: [
      "Aric", "Bjorn", "Crixus", "Drakon", "Etor", "Fendrel", "Gorm", "Hagan", "Iron", "Jarek",
      "Korg", "Logan", "Magnus", "Nor", "Orik", "Ragnar", "Sten", "Tor", "Ulric", "Varg",
      "Wulf", "Xander", "Ymir", "Zor", "Baron", "Conan", "Darius", "Erex", "Falco", "Garrick",
      "Hector", "Ivar", "Jax", "Kain", "Leon", "Maximus", "Nero", "Olaf", "Patroclus", "Rex",
      "Silas", "Titus", "Ursa", "Victor", "Warric", "Xerxes", "Yorick", "Zeus", "Ajax", "Bront",
      "Cesar", "Drago", "Enzo", "Falkor", "Gunther", "Hulk", "Igor", "Juggernaut", "Kratos", "Lothor",
      "Mars", "Nox", "Ogre", "Pierce", "Rage", "Slash", "Tank", "Ugo", "Valk", "Wolf",
      "Axel", "Blade", "Crush", "Dirk", "Edge", "Flint", "Grit", "Hawk", "Jett", "Knox",
      "Lance", "Mace", "Nash", "Ox", "Pike", "Rocco", "Spike", "Thorn", "Vance", "Zane"
    ],
    [JobClass.MAGE]: [
      "Alaric", "Balthazar", "Cyrus", "Dante", "Elric", "Felix", "Gideon", "Hadrian", "Ignis", "Julian",
      "Kael", "Lucius", "Malakai", "Norius", "Orion", "Percival", "Quintus", "Remus", "Salazar", "Thaddeus",
      "Urien", "Valerius", "Wick", "Xavier", "Yusuf", "Zale", "Arion", "Basileus", "Cosmo", "Dorian",
      "Emrys", "Fabian", "Galen", "Horus", "Icarus", "Jasper", "Kaspar", "Lysander", "Merlin", "Nimbus",
      "Oberon", "Phineas", "Quill", "Raphael", "Sebastian", "Theon", "Umberto", "Virgil", "Wren", "Xenon",
      "Yarrow", "Zephyr", "Azriel", "Blaise", "Corvin", "Devin", "Elias", "Fynn", "Gabriel", "Hollis",
      "Indie", "Jonah", "Kieran", "Lucian", "Mathias", "Nolan", "Oliver", "Preston", "Quentin", "Rowan",
      "Simon", "Tristan", "Ulrich", "Vaughn", "Wesley", "Xander", "Yves", "Zion", "Aesop", "Beryl"
    ],
    [JobClass.ROGUE]: [
      "Ace", "Bane", "Cole", "Dax", "Ezra", "Fox", "Grey", "Hunt", "Inigo", "Jax",
      "Kade", "Loki", "Mick", "Nico", "Onyx", "Pax", "Quip", "Rian", "Sly", "Ty",
      "Vex", "Wes", "Xo", "Yen", "Zed", "Ash", "Blaze", "Cash", "Dash", "Echo",
      "Fade", "Ghost", "Haze", "Ink", "Jinx", "Knave", "Link", "Mist", "Null", "Odd",
      "Puck", "Rook", "Shade", "Trick", "Umbra", "Void", "Wisp", "Xis", "Zero", "Zest",
      "Alton", "Byron", "Clyde", "Dale", "Elmo", "Fritz", "Guy", "Harvey", "Ike", "Jimmy",
      "Kel", "Lenny", "Moe", "Ned", "Ollie", "Pip", "Quincy", "Ralph", "Sid", "Tim",
      "Uri", "Van", "Will", "Xav", "Yuri", "Zac", "Art", "Bill", "Chet", "Don"
    ],
    [JobClass.CLERIC]: [
      "Abel", "Benedict", "Caleb", "David", "Enoch", "Francis", "Gabriel", "Hosea", "Isaac", "Jacob",
      "Levi", "Matthew", "Nathan", "Oshea", "Peter", "Quon", "Reuben", "Samuel", "Thomas", "Uriel",
      "Victor", "Walter", "Ximon", "Yael", "Zeke", "Aaron", "Bartholomew", "Clement", "Dominic", "Elijah",
      "Felix", "Goderic", "Hiram", "Isaiah", "Jeremiah", "Kenneth", "Lucas", "Micah", "Noah", "Obadiah",
      "Paul", "Quentin", "Raphael", "Seth", "Timothy", "Uriah", "Valentine", "William", "Xavier", "Zachary",
      "Abraham", "Barnabas", "Cornelius", "Daniel", "Ezra", "Gideon", "Hezekiah", "Ishmael", "Josiah", "Lazarus",
      "Malachi", "Nehemiah", "Othniel", "Philemon", "Reuel", "Solomon", "Thaddeus", "Uzziah", "Vitus", "Zion",
      "Ambrose", "Basil", "Cyril", "Dion", "Ephraim", "Fabian", "Gregory", "Hilary", "Ignatius", "Jerome"
    ]
  },
  Female: {
    [JobClass.NOVICE]: [
      "Ada", "Bea", "Cara", "Dee", "Elle", "Fay", "Gia", "Hope", "Ivy", "Jen",
      "Kay", "Liz", "Mia", "Nan", "Ola", "Pam", "Quin", "Rae", "Sue", "Tess",
      "Una", "Val", "Wyn", "Xia", "Yara", "Zoe", "Alice", "Beth", "Cora", "Dora",
      "Eve", "Fern", "Gail", "Holly", "Iris", "Jane", "Kate", "Lily", "May", "Nora",
      "Olive", "Pearl", "Quinn", "Rose", "Sara", "Tina", "Uma", "Vera", "Willa", "Xena",
      "Yana", "Zara", "Amy", "Belle", "Chloe", "Dana", "Emma", "Flora", "Gwen", "Hazel",
      "Isla", "Joy", "Kira", "Lola", "Mina", "Nina", "Oona", "Pippa", "Ruby", "Skye",
      "Tara", "Ursa", "Vada", "Wren", "Xola", "Yoko", "Zola", "Anna", "Bree", "Cleo"
    ],
    [JobClass.FIGHTER]: [
      "Andrea", "Brenda", "Cassandra", "Diana", "Erika", "Freya", "Gertrude", "Hilda", "Ingrid", "Joan",
      "Kara", "Lara", "Matilda", "Nora", "Olga", "Petra", "Queen", "Rhonda", "Sonja", "Truda",
      "Ursula", "Valerie", "Wanda", "Xena", "Ygritte", "Zelda", "Athena", "Bellona", "Camilla", "Doris",
      "Enyo", "Fianna", "Griselda", "Hippolyta", "Imelda", "Juno", "Kelly", "Lupe", "Morgan", "Nike",
      "Olympia", "Pallas", "Quorra", "Roxanne", "Scathach", "Thora", "Uta", "Victoria", "Wilma", "Xylia",
      "Yolanda", "Zoe", "Astrid", "Brunhilde", "Clara", "Drusilla", "Elvira", "Frida", "Greta", "Helga",
      "Ilsa", "Jana", "Katya", "Lena", "Magda", "Nadia", "Oksana", "Polina", "Raisa", "Svetlana",
      "Tatiana", "Ulva", "Vesper", "Winona", "Xandra", "Yvonne", "Zora", "Aja", "Brit", "Casey"
    ],
    [JobClass.MAGE]: [
      "Althea", "Beatrix", "Celeste", "Daphne", "Elara", "Fiona", "Genevieve", "Helena", "Isolde", "Juliet",
      "Katerina", "Luna", "Morgana", "Nyx", "Ophelia", "Penelope", "Quintessa", "Rowena", "Seraphina", "Titania",
      "Ursula", "Vivian", "Willow", "Xanthe", "Yseult", "Zephyra", "Aurora", "Bella", "Crystal", "Delilah",
      "Esmeralda", "Faye", "Giselle", "Harmony", "Iris", "Jasmine", "Kiara", "Lilith", "Melody", "Nova",
      "Octavia", "Phoebe", "Raven", "Sabrina", "Thalia", "Una", "Violet", "Wanda", "Xiomara", "Yasmine",
      "Zarina", "Ariel", "Bianca", "Coral", "Destiny", "Eden", "Faith", "Grace", "Hope", "Ivory",
      "Jade", "Karma", "Lacy", "Misty", "Opal", "Pearl", "Ruby", "Sapphire", "Topaz", "Velvet",
      "Winter", "Xenia", "Yara", "Zinnia", "Amber", "Blossom", "Clover", "Daisy", "Fern", "Ginger"
    ],
    [JobClass.ROGUE]: [
      "Amber", "Brix", "Cat", "Dina", "Eve", "Fay", "Gem", "Hex", "Ivy", "Jinx",
      "Kat", "Lux", "Moxie", "Nyx", "Onyx", "Pix", "Quin", "Roxie", "Sky", "Trix",
      "Vix", "Wren", "Xylo", "Yaz", "Zel", "Ash", "Beck", "Cleo", "Dot", "Em",
      "Flo", "Gwen", "Hap", "Ina", "Jo", "Kit", "Liv", "Meg", "Nan", "Oz",
      "Peg", "Rae", "Sal", "Tay", "Val", "Wyn", "Xia", "Yen", "Zia", "Ana",
      "Brit", "Cher", "Dawn", "Elle", "Fran", "Gail", "Hope", "Ira", "Jan", "Kay",
      "Lee", "May", "Nat", "Ora", "Pat", "Ria", "Sue", "Tea", "Uma", "Vi",
      "Win", "Xea", "Yue", "Zoe", "Ada", "Bea", "Cia", "Dee", "Ema", "Fia"
    ],
    [JobClass.CLERIC]: [
      "Abigail", "Bernadette", "Catherine", "Deborah", "Elizabeth", "Faith", "Gabrielle", "Hannah", "Isabel", "Judith",
      "Keziah", "Leah", "Mary", "Naomi", "Orpah", "Priscilla", "Queen", "Rachel", "Sarah", "Tabitha",
      "Ursula", "Veronica", "Winifred", "Ximena", "Yael", "Zipporah", "Agatha", "Barbara", "Cecilia", "Dorothy",
      "Eulalia", "Felicity", "Genevieve", "Helen", "Irene", "Joan", "Katerina", "Lucia", "Martha", "Nina",
      "Odilia", "Paula", "Quiteria", "Rita", "Sophia", "Teresa", "Ursula", "Valeria", "Walburga", "Xenia",
      "Yolanda", "Zita", "Alma", "Beatrice", "Clara", "Dina", "Esther", "Frances", "Gloria", "Hester",
      "Imogen", "Joyce", "Karma", "Lydia", "Mercy", "Nadine", "Odelia", "Patience", "Ruth", "Serenity",
      "Temperance", "Unity", "Verity", "Wendy", "Xylia", "Yasmin", "Zara", "Angela", "Bithiah", "Charity"
    ]
  }
};

export const LAST_NAMES: Record<JobClass, NameList> = {
  [JobClass.NOVICE]: [
    "Smith", "Miller", "Baker", "Cook", "Fisher", "Hunter", "Carter", "Cooper", "Mason", "Potter",
    "Sawyer", "Slater", "Tailor", "Turner", "Weaver", "Wright", "Green", "Brown", "White", "Black",
    "Hill", "Wood", "Stone", "Field", "Brook", "Ford", "Hall", "Lake", "Lane", "Page",
    "Rose", "Sage", "Snow", "Star", "West", "Bird", "Lamb", "Wolf", "Bear", "Fish",
    "Root", "Seed", "Leaf", "Bush", "Tree", "Rock", "Sand", "Clay", "Dust", "Mudd",
    "Peck", "Parr", "Pitt", "Pool", "Post", "Rich", "Rigg", "Roth", "Rush", "Rust",
    "Shaw", "Sims", "Swan", "Tait", "Todd", "Vale", "Vane", "Voss", "Wade", "Ward",
    "Watt", "Webb", "Wild", "Witt", "Wood", "Yost", "Young", "Zink", "Bell", "Bond",
    "Carr", "Cole", "Dale", "Dean", "Dunn", "Dyer", "East", "Eyer", "Fay", "Fry"
  ],
  [JobClass.FIGHTER]: [
    "Strong", "Bold", "Brave", "Grand", "Great", "Hard", "High", "Keen", "Long", "Low",
    "Proud", "Rich", "Sharp", "Short", "Small", "Smart", "Stout", "Swift", "Tall", "Wise",
    "Armour", "Axe", "Blade", "Bow", "Club", "Dagger", "Dart", "Flail", "Lance", "Mace",
    "Pike", "Shield", "Spear", "Staff", "Sword", "Wand", "Helm", "Mail", "Plate", "Ring",
    "Blood", "Bone", "Doom", "Dread", "Fate", "Fear", "Fire", "Gore", "Grim", "Hate",
    "Hell", "Iron", "Kill", "Pain", "Rage", "Ruin", "Scar", "Skull", "Soul", "Steel",
    "Storm", "War", "Wrath", "Bane", "Fang", "Claw", "Tooth", "Nail", "Horn", "Hide",
    "Scale", "Skin", "Flesh", "Guts", "Heart", "Lung", "Mind", "Will", "Fist", "Kick",
    "Blow", "Chop", "Cut", "Hack", "Hit", "Jab", "Punch", "Rip", "Slash", "Stab"
  ],
  [JobClass.MAGE]: [
    "Arcane", "Astral", "Aura", "Blight", "Bloom", "Bolt", "Burn", "Chill", "Cinder", "Cloud",
    "Comet", "Cosmos", "Craft", "Curse", "Dark", "Dawn", "Dusk", "Dust", "Ember", "Ether",
    "Fate", "Flame", "Flash", "Flux", "Frost", "Gaze", "Glow", "Haze", "Hex", "Ice",
    "Light", "Lore", "Lunar", "Lust", "Mana", "Mist", "Moon", "Mote", "Myth", "Night",
    "Nova", "Null", "Orb", "Pact", "Phase", "Plane", "Power", "Prism", "Pulse", "Pyre",
    "Ray", "Rift", "Rune", "Sage", "Scry", "Shade", "Shard", "Shine", "Sigil", "Sky",
    "Solar", "Soul", "Spark", "Spell", "Star", "Storm", "Sun", "Surge", "Tide", "Time",
    "Void", "Wand", "Ward", "Warp", "Wave", "Web", "Wind", "Wish", "Wisp", "Word",
    "Wraith", "Wyrm", "Zone", "Ash", "Beam", "Blast", "Blaze", "Brew", "Cast", "Charm"
  ],
  [JobClass.ROGUE]: [
    "Black", "Bleak", "Blind", "Blue", "Blur", "Brisk", "Cold", "Cool", "Damp", "Dark",
    "Dead", "Deep", "Dim", "Dire", "Dull", "Dumb", "Evil", "Fast", "Fat", "Fine",
    "Flat", "Foul", "Full", "Glad", "Good", "Gray", "Grim", "Half", "Hard", "High",
    "Hot", "Huge", "Ill", "Kind", "Lame", "Late", "Lean", "Left", "Less", "Light",
    "Like", "Live", "Lone", "Long", "Loud", "Low", "Mad", "Mean", "Mild", "More",
    "Near", "Neat", "New", "Nice", "Numb", "Old", "Pale", "Past", "Poor", "Pure",
    "Quick", "Rare", "Rash", "Real", "Rich", "Right", "Ripe", "Rough", "Round", "Sad",
    "Safe", "Same", "Sick", "Slow", "Small", "Soft", "Sour", "Still", "Sure", "Sweet",
    "Swift", "Tall", "Tame", "Thin", "Tiny", "True", "Vain", "Vile", "Warm", "Weak"
  ],
  [JobClass.CLERIC]: [
    "Abbot", "Angel", "Bishop", "Bless", "Bliss", "Canon", "Chapel", "Choir", "Church", "Clerk",
    "Cross", "Dean", "Deacon", "Faith", "Friar", "Grace", "Guide", "Heal", "Holy", "Hope",
    "Hymn", "Judge", "Just", "Kind", "King", "Law", "Life", "Lord", "Love", "Mass",
    "Mercy", "Monk", "Nun", "Order", "Peace", "Pope", "Pray", "Priest", "Prior", "Pure",
    "Right", "Rite", "Saint", "Save", "See", "Soul", "Spirit", "Temple", "True", "Trust",
    "Truth", "Vicar", "Virtue", "Vow", "Ward", "White", "Wise", "Word", "Work", "Zeal",
    "Altar", "Bell", "Book", "Candle", "Chant", "Cloak", "Crown", "Cup", "Dome", "Door",
    "Dove", "Font", "Gate", "Gift", "Halo", "Hand", "Head", "Heart", "Host", "Icon"
  ]
};