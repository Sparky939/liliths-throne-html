type ItemTag = string;
type ItemFlag = string;

interface ItemEntry {
  id: string;
  name: string;
  description: string;
  kind: string;
  value: number;
  sellers: string[];
  femValue: number;
  mascValue: number;
  tags: ItemTag[];
  flags: ItemFlag[];
  transformation: TransformationEntry | null;
}

interface ItemInstance extends ItemEntry {
  uid: string;
  dirty: boolean;
}

class ItemTemplate implements ItemEntry {
  id: string;
  name: string;
  description: string;
  kind: string;
  value: number;
  sellers: string[];
  femValue: number;
  mascValue: number;
  tags: ItemTag[];
  flags: ItemFlag[];
  transformation: TransformationEntry | null;

  constructor(
    id: string,
    name: string,
    description: string,
    kind: string,
    value: number,
    sellers: string[],
    femValue: number,
    mascValue: number,
    tags: ItemTag[],
    flags: ItemFlag[],
    transformation?: TransformationEntry,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.kind = kind;
    this.value = value;
    this.sellers = sellers;
    this.femValue = femValue;
    this.mascValue = mascValue;
    this.tags = tags;
    this.flags = flags;
    this.transformation = transformation || null;
  }
}

class Item extends ItemTemplate implements ItemInstance {
  uid: string;
  dirty: boolean;

  constructor(dirty: boolean, itemTemplate: ItemTemplate) {
    super(
      itemTemplate.id,
      itemTemplate.name,
      itemTemplate.description,
      itemTemplate.kind,
      itemTemplate.value,
      itemTemplate.sellers,
      itemTemplate.femValue,
      itemTemplate.mascValue,
      itemTemplate.tags,
      itemTemplate.flags,
    );
    this.uid = window.game.getUniqueId("ITEM");
    this.dirty = dirty;
  }
  setDirty(dirty: boolean): void {
    this.dirty = dirty;
  }
}

const CATALOGUE = new Map<string, ItemTemplate>([
  [
    "innoxia_items_essence_arcane",
    new ItemTemplate(
      "innoxia_items_essence_arcane",
      "bottled arcane essence",
      "A small vial containing a swirling pink shard of arcane essence. Drinking it returns the essence to your aura.",
      "essence",
      0,
      [],
      0,
      0,
      [],
      [],
    ),
  ],
  [
    "innoxia_bdsm_metal_collar",
    new ItemTemplate(
      "innoxia_bdsm_metal_collar",
      "metal collar",
      "A sturdy metal slave collar. The ring on the front glows when held near a wanted criminal.",
      "collar",
      2500,
      ["finch"],
      0,
      0,
      ["equipable", "collar"],
      [],
    ),
  ],
  [
    "innoxia_race_cat_felines_fancy",
    new ItemTemplate(
      "innoxia_race_cat_felines_fancy",
      "Feline's Fancy",
      "A delicate glass bottle filled with a thick, cream-like liquid.",
      "consumable",
      150,
      ["ralph", "vicky"],
      0,
      0,
      ["consumable", "tf"],
      [],
    ),
  ],
  [
    "innoxia_race_dog_canine_crush",
    new ItemTemplate(
      "innoxia_race_dog_canine_crush",
      "Canine Crush",
      "A beer bottle filled with a dark, fizzy liquid.",
      "consumable",
      150,
      ["ralph", "vicky"],
      0,
      0,
      ["consumable", "tf"],
      [],
    ),
  ],
  [
    "innoxia_race_wolf_wolf_whiskey",
    new ItemTemplate(
      "innoxia_race_wolf_wolf_whiskey",
      "Wolf Whiskey",
      "A bottle of strong whiskey with a wolf on the label.",
      "consumable",
      150,
      ["ralph", "vicky"],
      0,
      0,
      ["consumable", "tf"],
      [],
    ),
  ],
  [
    "innoxia_race_horse_equine_cider",
    new ItemTemplate(
      "innoxia_race_horse_equine_cider",
      "Equine Cider",
      "A bottle of sweet cider.",
      "consumable",
      150,
      ["ralph", "vicky"],
      0,
      0,
      ["consumable", "tf"],
      [],
    ),
  ],
  [
    "innoxia_race_fox_vulpines_vineyard",
    new ItemTemplate(
      "innoxia_race_fox_vulpines_vineyard",
      "Vulpine's Vineyard",
      "A bottle of rich red wine.",
      "consumable",
      150,
      ["ralph", "vicky"],
      0,
      0,
      ["consumable", "tf"],
      [],
    ),
  ],
  [
    "innoxia_race_harpy_harpy_perfume",
    new ItemTemplate(
      "innoxia_race_harpy_harpy_perfume",
      "Harpy Perfume",
      "A bottle of floral perfume favoured by harpies.",
      "consumable",
      150,
      ["ralph", "vicky"],
      0,
      0,
      ["consumable", "tf"],
      [],
    ),
  ],
  [
    "innoxia_race_harpy_bubblegum_lollipop",
    new ItemTemplate(
      "innoxia_race_harpy_bubblegum_lollipop",
      "Bubblegum Lollipop",
      "A bright pink lollipop, with a little ball of gum at its core. Although it doesn't look out of the ordinary, it's somewhat unusual in the fact that it has an incredibly strong smell of bubblegum.",
      "consumable",
      10,
      ["ralph", "vicky"],
      0,
      0,
      ["consumable", "tf"],
      [],
    ),
  ],
  [
    "innoxia_race_human_vanilla_water",
    new ItemTemplate(
      "innoxia_race_human_vanilla_water",
      "Vanilla Water",
      "A bottle of faintly vanilla-scented water.",
      "consumable",
      150,
      ["ralph", "vicky"],
      0,
      0,
      ["consumable", "tf"],
      [],
    ),
  ],
  [
    "innoxia_race_demon_liliths_gift",
    new ItemTemplate(
      "innoxia_race_demon_liliths_gift",
      "Lilith's Gift",
      "A bottle of glowing purple liquid. The label simply reads 'Lilith's Gift'.",
      "consumable",
      1500,
      ["vicky"],
      0,
      0,
      ["consumable", "tf"],
      [],
    ),
  ],
  [
    "REJUVENATION_POTION",
    new ItemTemplate(
      "REJUVENATION_POTION",
      "rejuvenation potion",
      "Guaranteed to restore over-used orifices and refill all of your fluids.",
      "consumable",
      1000,
      ["ralph", "vicky"],
      0,
      0,
      ["consumable", "tf"],
      [],
    ),
  ],
  [
    "innoxia_toy_dildo",
    new ItemTemplate(
      "innoxia_toy_dildo",
      "dildo",
      "A plain but well-made dildo.",
      "toy",
      250,
      ["ashley"],
      0,
      0,
      ["toy"],
      [],
    ),
  ],
  [
    "innoxia_toy_vibrator",
    new ItemTemplate(
      "innoxia_toy_vibrator",
      "vibrator",
      "A compact vibrator.",
      "toy",
      300,
      ["ashley"],
      0,
      0,
      ["toy"],
      [],
    ),
  ],
  [
    "innoxia_gift_heart_box",
    new ItemTemplate(
      "innoxia_gift_heart_box",
      "heart-shaped gift box",
      "A gift box from Dream Lover.",
      "gift",
      100,
      ["ashley"],
      0,
      0,
      ["gift"],
      [],
    ),
  ],
  [
    "innoxia_cosmetic_lipstick",
    new ItemTemplate(
      "innoxia_cosmetic_lipstick",
      "Lipstick",
      "A tube of lipstick from Succubi's Secrets.",
      "cosmetic",
      150,
      ["kate"],
      0,
      0,
      ["cosmetic"],
      [],
    ),
  ],
  [
    "ADDICTION_REMOVAL",
    new ItemTemplate(
      "ADDICTION_REMOVAL",
      "Angel's Nectar",
      "A delicate crystal bottle filled with a cool, blue liquid.",
      "consumable",
      750,
      ["ralph"],
      0,
      0,
      ["consumable", "addition_cure"],
      [],
    ),
  ],
  [
    "FETISH_UNREFINED",
    new ItemTemplate(
      "FETISH_UNREFINED",
      "unrefined fetish",
      "A cloudy vial of unrefined fetish-infused fluid. Official fetish potions are not fully in this build.",
      "consumable",
      500,
      [],
      0,
      0,
      ["consumable", "fetish"],
      [],
    ),
  ],
  [
    "DYE_BRUSH",
    new ItemTemplate(
      "DYE_BRUSH",
      "dye-brush",
      "A small brush used to recolour clothing. Dyes are not in this build.",
      "consumable",
      150,
      [],
      0,
      0,
      ["consumable", "dye"],
      [],
    ),
  ],
]);
