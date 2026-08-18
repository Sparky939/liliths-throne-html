export {};

declare global {
  // Ambient shape of the LT global namespace object. LT is populated
  // incrementally by every converted script; as more of the engine moves
  // to TypeScript, add that module's members to the single LTNamespace
  // interface below instead of leaving them to fall through to `any`.
  //
  // Convention: every type in this file — interfaces, LTNamespace members,
  // everything — is centralized here rather than declared next to the code
  // that defines it, so there's one place to look things up. Group new
  // additions under a `// === moduleName.ts ===` heading, in roughly the
  // order modules were typed.

  // === Item hierarchy ===
  // Every "thing a character can carry" type in the codebase (generic items,
  // clothing, and eventually weapons once weapons.ts is typed) is a distinct
  // shape at runtime — they live in separate arrays (player.items/.wardrobe/
  // .weapons) with genuinely different fields (e.g. clothing has no stored
  // `value`; generic items always do). Rather than force one polymorphic
  // type across all of them, each kind gets its own catalog-entry/instance
  // pair, but they all root in these two minimal shapes so the relationship
  // is explicit instead of three unrelated types that happen to look similar.
  interface ItemBase {
    id: string;
    name: string;
  }

  // Adds `uid`: the mark of a carried instance (as opposed to a catalog
  // definition, which has no uid until LT.makeItem/makeClothing mints one).
  interface CarriedItemBase extends ItemBase {
    uid: string;
  }

  // === items.ts ===

  // Shared shape for a generic item instance a character carries (as opposed
  // to `ITEMS[id]`, the static catalog entry). Deliberately loose: weapons/
  // clothing/etc. each layer on many more kind-specific fields in their own
  // files, hence the index signature.
  interface Item extends CarriedItemBase {
    kind?: string;
    value: number;
    effects?: EnchantEffect[];
    enchanted?: boolean;
    enchantmentKnown?: boolean;
    [key: string]: any;
  }

  interface ItemCatalogEntry extends ItemBase {
    kind: string;
    value: number;
    description: string;
    soldBy?: string[];
    race?: string;
    fem?: string;
    masc?: string;
  }

  // Loosely-known character/player shape: only the fields items.ts touches
  // are named, with an index signature for the rest (no shared Character
  // type exists yet — see the similar EnchantCarrier below).
  interface ItemOwner {
    items?: Item[];
    money?: number;
    makeup?: boolean;
    raceName?: string;
    fullRace?: string;
    gender?: { hasBreasts?: boolean; hasPenis?: boolean; hasVagina?: boolean };
    isFeminine?: () => boolean;
    getRaceName?: () => string;
    [key: string]: any;
  }

  // === clothing.ts ===

  interface ClothingSlot {
    id: string;
    label: string;
  }

  // Clothing's catalog entries never store a value (LT.clothingValue/
  // clothingBuyPrice compute it on demand instead), so unlike ItemCatalogEntry
  // it stays optional here rather than being forced to match items.ts's shape.
  interface ClothingCatalogEntry extends ItemBase {
    slot: string;
    colour: string;
    colourName: string;
    covers: string[];
    value?: number;
  }

  interface ClothingItem extends ClothingCatalogEntry, CarriedItemBase {}

  // Loosely-known character shape: only the fields this file touches are named.
  // Every current caller passes the real player object, so getFemininity is
  // required rather than optional (see LT.dressPlayer, called only from
  // creationFinish.ts with the in-progress player).
  interface ClothingWearer {
    equipped: Record<string, ClothingItem | undefined>;
    wardrobe: ClothingItem[];
    essences?: number;
    breastSize?: { id?: string };
    getFemininity(): { id: string };
    [key: string]: any;
  }

  // === npcGear.ts ===

  // Loose item bag: this file moves clothing/weapon/generic items between an
  // NPC and the player without caring about kind-specific shape. Formally the
  // bottom of the item hierarchy — every CarriedItemBase (Item, ClothingItem,
  // and eventually a weapon instance type) structurally satisfies this, so
  // values flow into these functions from any of them without a cast.
  interface NpcGearItem extends Partial<CarriedItemBase> {
    slot?: string;
    [key: string]: any;
  }

  interface NpcGearCarrier {
    id?: string;
    occupation?: string;
    feminine?: boolean;
    isFeminine?: () => boolean;
    equipped?: Record<string, NpcGearItem | undefined>;
    wardrobe?: NpcGearItem[];
    items?: NpcGearItem[];
    weapons?: NpcGearItem[];
    mainWeapon?: NpcGearItem | null;
    offhandWeapon?: NpcGearItem | null;
    [key: string]: any;
  }

  interface NpcGearOptions {
    skipClothes?: boolean;
    skipBag?: boolean;
    outfit?: string;
  }

  // === npcs.ts ===

  // Generic NPC bag: each named NPC is its own ad-hoc literal with a
  // different mix of fields (level/lootMoney for enemies, playerKnowsName for
  // story NPCs, etc.), so only the fields genuinely shared/read across
  // npcs.ts's own logic are named — the index signature covers the rest.
  interface Npc {
    id?: string;
    name?: string;
    surname?: string;
    feminine?: boolean;
    raceName?: string;
    fullRace?: string;
    speechColour?: string;
    relationToPlayer?: string;
    location?: { world?: string; place?: string; x?: number; y?: number } | null;
    eyeColour?: string;
    level?: number;
    physique?: number;
    arcane?: number;
    essences?: number;
    knownSpells?: string[];
    mainWeapon?: Item | null;
    playerKnowsName?: boolean;
    gender?: { hasPenis?: boolean; hasVagina?: boolean; hasBreasts?: boolean };
    sex?: { vaginaVirgin?: boolean; penisVirgin?: boolean };
    getName?: () => string;
    getFullName?: () => string;
    isFeminine?: () => boolean;
    getSpeechColour?: () => string;
    getRaceName?: () => string;
    hasVagina?: () => boolean;
    hasPenis?: () => boolean;
    hasBreasts?: () => boolean;
    [key: string]: any;
  }

  interface HouseNpcOpts {
    id: string;
    name: string;
    raceName: string;
    speechColour: string;
    relationToPlayer?: string;
    location: { world: string; place: string } | null;
  }

  // === response.ts ===

  interface LTResponse {
    title: string;
    tooltipText: string;
    nextDialogue: string | null;
    effects: (() => void) | null;
    disabled: boolean;
    colour: string | null;
    secondsPassed: number | null;
    sexStub: boolean;
    // Not set by the constructor — assigned ad hoc by callers that need stable
    // ordering/keyboard-shortcut indices (game.ts, ui/responses.ts, and others).
    _index?: number | null;
    disable(reason?: string): LTResponse;
    withColour(hex: string): LTResponse;
    withTime(seconds: number): LTResponse;
  }

  // === enchanting.ts ===

  type Rarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";

  interface TfPotency {
    id: string;
    name: string;
    value: number;
    clothingBonus: number;
    colour: string;
    negative: boolean;
  }

  interface TfModifier {
    id: string;
    name: string;
    rarity: Rarity;
    value: number;
    attr?: string;
  }

  interface EnchantEffect {
    type: string;
    primary: string;
    secondary: string;
    potency: string;
    limit: number;
  }

  interface EnchantBonus {
    physique: number;
    arcane: number;
    health: number;
    mana: number;
    corruption: number;
    fertility: number;
    virility: number;
    damageUnarmed: number;
    damageMelee: number;
    damageRanged: number;
    damagePhysical: number;
    damageLust: number;
    damageFire: number;
    damageIce: number;
    damagePoison: number;
    damageSpells: number;
    resistPhysical: number;
    resistLust: number;
    resistFire: number;
    resistIce: number;
    resistPoison: number;
    spellCost: number;
    criticalDamage: number;
    [attr: string]: number;
  }

  interface EnchantCarrier {
    equipped?: Record<string, Item | undefined>;
    mainWeapon?: Item;
    offhandWeapon?: Item;
    enchantBonus?: EnchantBonus;
    wardrobe?: Item[];
    items?: Item[];
    weapons?: Item[];
    essences?: number;
    [key: string]: any;
  }

  interface CombatEnemyLike {
    level?: number;
    name?: string;
    getName?: () => string;
  }

  type CarriedRef =
    | {
        list: Item[];
        index: number;
        item: Item;
        equipped?: undefined;
        slot?: undefined;
      }
    | {
        equipped: true;
        slot: string;
        item: Item;
        list?: undefined;
        index?: undefined;
      }
    | null;

  // === occupations.ts ===

  interface Occupation {
    id: string;
    name: string;
    description: string;
    speech: string;
    feminineOnly: boolean;
    masculineOnly: boolean;
    colour: string;
  }

  interface OccupationOwner {
    isFeminine: () => boolean;
  }

  // === bodyEnums.ts ===

  interface BodyEnumEntry {
    id: string;
    name: string;
    colour: string;
  }

  interface EnumEntry {
    id: string;
    name: string;
  }

  interface SwatchEntry {
    id: string;
    name: string;
    hex: string;
  }

  interface HairStyleEntry {
    id: string;
    name: string;
    minLength: number;
  }

  interface HelpEntry {
    id: string;
    name: string;
    help: string;
  }

  interface PiercingType {
    id: string;
    name: string;
    help: string;
    needs?: string;
  }

  interface TattooSlot {
    id: string;
    name: string;
    needs?: string;
  }

  // === body.ts ===

  interface Orifice {
    wetness: string;
    capacity: string;
    depth: string;
    elasticity: string;
    plasticity: string;
    modifiers: string[];
    stuffed: boolean;
    virgin: boolean;
  }

  interface BodyCovering {
    type: string;
    primary: string;
    secondary: string;
    pattern: string;
    modifier: string;
  }

  // The full shape LT.createBody returns. `opts` (its input) stays a loose bag —
  // it's a write-only options object consumed once here, not worth mirroring
  // field-for-field when the payoff (this return type) is already fully typed.
  interface CharacterBody {
    height: number;
    femininity: number;
    bodySize: string;
    muscle: string;
    bodyMaterial: string;
    genitalArrangement: string;
    pubicHair: string;
    facialHair: string;
    underarmHair: string;
    assHair: string;
    feral: boolean;
    subspecies: string;
    fleshSubspecies: string;
    raceStage: string;
    subspeciesOverride: string | null;
    halfDemonSubspecies: string | null;
    piercedStomach: boolean;
    takesAfterMother: boolean;
    arm: { type: string; rows: number; underarmHair: string };
    ass: { type: string; size: string; hipSize: string; anus: Orifice; bleached: boolean };
    breast: {
      type: string;
      shape: string;
      size: string;
      rows: number;
      milkStorage: number;
      milkStored: number;
      nipple: { shape: string; size: string; countPerBreast: number; pierced: boolean; puffy: boolean; fuckable: boolean };
      areolae: { shape: string; size: string };
      orifice: Orifice;
    };
    breastCrotch: { type: string; shape: string; size: string; rows: number; milkStorage: number; milkStored: number };
    face: {
      type: string;
      lipSize: string;
      lipsPuffy: boolean;
      piercedLip: boolean;
      mouth: Orifice;
      tongue: { length: number; pierced: boolean; modifiers: string[] };
    };
    eye: { type: string; iris: string; irisShape: string; pupilShape: string; pairs: number };
    ear: { type: string; pierced: boolean };
    hair: { type: string; length: string; style: string; colour: string; neckFluff: boolean };
    leg: { type: string; configuration: string; footStructure: string };
    torso: { type: string; covering: BodyCovering };
    antenna: { type: string; length: number; rows: number; perRow: number };
    horn: { type: string; length: number; rows: number; perRow: number };
    tail: { type: string; count: number; girth: string; lengthPercent: number };
    tentacle: { type: string; count: number; girth: string; lengthPercent: number };
    wing: { type: string; size: string };
    spinneret: Orifice;
    penis: {
      type: string;
      length: number;
      girth: string;
      pierced: boolean;
      virgin: boolean;
      modifiers: string[];
      testicle: { size: string; count: number; internal: boolean; cumStorage: number; cumStored: number };
      urethra: Orifice;
    };
    vagina: {
      type: string;
      labiaSize: string;
      clitSize: string;
      clitGirth: string;
      pierced: boolean;
      hymen: boolean;
      virgin: boolean;
      orifice: Orifice;
      urethra: Orifice;
    };
    coverings: { HUMAN: BodyCovering; HAIR: BodyCovering; EYE_IRISES: BodyCovering; [key: string]: BodyCovering };
  }

  // Loosely-known character bag: only the fields this file calls as methods are
  // named, with an index signature for the many attribute/save fields it reads
  // and writes generically (no shared Character type exists yet).
  interface BodyCarrier {
    body?: CharacterBody;
    isFeminine?: () => boolean;
    hasPenis?: () => boolean;
    hasVagina?: () => boolean;
    hasBreasts?: () => boolean;
    gender?: { hasPenis?: boolean; hasVagina?: boolean; hasBreasts?: boolean };
    [key: string]: any;
  }

  // === combat.ts, status.ts, damage.ts ===

  // Shared shape for a character actively participating in combat (player or
  // enemy). Loosely known on purpose — no canonical Character type exists yet
  // project-wide (see EnchantCarrier/ItemOwner for the equivalent pattern
  // elsewhere) — hence the index signature for the many appearance/body/etc.
  // fields this domain doesn't touch.
  interface Combatant {
    health?: number;
    maxHealth?: number;
    lust?: number;
    mana?: number;
    maxMana?: number;
    essences?: number;
    level?: number;
    blocking?: boolean;
    resisting?: boolean;
    remainingAP?: number;
    maxAP?: number;
    selectedMoves?: SelectedMove[];
    combatBehaviour?: string;
    knownSpells?: string[];
    attractedToPlayer?: boolean;
    name?: string;
    getName?: () => string;
    statuses?: Record<string, { id: string; turns: number } | undefined>;
    enchantBonus?: EnchantBonus;
    shields?: Record<string, number>;
    moveCooldowns?: Record<string, number>;
    mainWeapon?: Item | null;
    offhandWeapon?: Item | null;
    weapons?: Item[];
    [key: string]: any;
  }

  interface SelectedMove {
    id: string;
    target?: Combatant;
  }

  interface Move {
    id: string;
    name: string;
    ap: number;
    cooldown?: number;
    special?: boolean;
    // Kind-specific extras layered on by combat/spells.ts and combat/tease.ts —
    // spells.ts isn't typed yet, hence `any` rather than a real Spell shape.
    spell?: any;
    tease?: boolean;
    titleOf?: (src: Combatant) => string;
    canUse?: (src: Combatant, tgt?: Combatant | null) => boolean;
    cannotUseReason?: (src?: Combatant, tgt?: Combatant | null) => string;
    tooltip: (src: Combatant, tgt?: Combatant | null) => string;
    predict: (src: Combatant, tgt?: Combatant | null) => string;
    perform: (src: Combatant, tgt?: Combatant | null, turnIndex?: number) => string;
  }

  interface ThrownWeaponRecord {
    ch: Combatant;
    slot: string;
    weapon: Item;
  }

  interface CombatStartOpts {
    enemy?: Combatant;
    escapeChance?: number;
    submitBlocked?: boolean;
    victoryNode?: string | null;
    defeatNode?: string | null;
    returnNode?: string | null;
    onVictory?: (() => string | void) | null;
    onDefeat?: (() => string | void) | null;
    onEscape?: (() => void) | null;
    behaviour?: string;
  }

  interface CombatState {
    active: boolean;
    turn: number;
    player: Combatant | null;
    enemy: Combatant | null;
    escapeChance: number;
    submitBlocked: boolean;
    victoryNode?: string | null;
    defeatNode?: string | null;
    returnNode?: string | null;
    escaped: boolean;
    finished: string | null;
    lastResolution: string;
    onVictory?: (() => string | void) | null;
    onDefeat?: (() => string | void) | null;
    onEscape?: (() => void) | null;
    responseTab?: number;
    thrownThisTurn?: ThrownWeaponRecord[];
    thrownThisCombat?: ThrownWeaponRecord[];
    start: (opts: CombatStartOpts) => void;
    typeWeight: (type: string, src: Combatant, tgt: Combatant, already: number, rnd?: () => number) => number;
    affordableEnemySpell: (src: Combatant) => string | null;
    pickEnemyMove: (src: Combatant, tgt: Combatant, used?: Record<string, boolean>, rnd?: () => number) => { id: string; type: string };
    planEnemy: () => void;
    remainingAp: () => number;
    canQueue: (moveId: string) => string | null;
    queue: (moveId: string) => string | null;
    predictions: (ch: Combatant) => string[];
    endTurn: () => void;
    resolveCharacter: (ch: Combatant, lines: string[]) => void;
    escape: () => boolean;
    finish: () => void;
    bar: (ch: Combatant, colour: string) => string;
  }

  // === grid.ts, roam.ts ===

  interface GridLocation {
    name: string;
    placeType?: string;
    type?: string;
    subtype?: string;
    color?: string;
    icon?: { src?: string };
    sublocations?: GridLocation[];
    [key: string]: any;
  }

  interface GridTile {
    x: number;
    y: number;
    isNavigable: boolean;
    location: GridLocation | null;
    isStartingPoint?: boolean;
    travelConfig?: any;
    [key: string]: any;
  }

  interface GridState {
    gridSize: number;
    gridWidth: number;
    gridHeight: number;
    visibleTiles: number;
    zoomLevel: number;
    playerPosition: { x: number; y: number };
    gridName: string;
    gridStyle: string;
    gridPruningValue: number;
    gridSymmetrical: boolean;
    isDrawing: boolean;
    drawMethod: string;
    lastTransMethod: string;
    gridData?: GridTile[][];
    locations: GridLocation[];
    homes: any[];
    favoritedLocations: any[];
    locationConditions: any[];
    currentTile: GridTile | null;
    currentLocation: string;
    currentLocationType: string;
    currentLocationSubtype: string;
    currentEstablishment: string;
    currentRegion: string;
    currentTilePeople: any[];
    hidden: boolean;
    selectedTile: GridTile | null;
    onMove?: (tile: GridTile | null, grid: GridState) => void;
    onLoad?: (tile: GridTile | null, grid: GridState) => void;
    [key: string]: any;
  }

  // === LTNamespace ===
  // Base index signature plus every module's typed members, merged into one
  // interface. `LT.whatever` resolves to the specific signature below when
  // one exists, and falls through to `any` via the index signature otherwise.
  interface LTNamespace {
    [key: string]: any;

    // items.ts
    ITEMS: Record<string, ItemCatalogEntry>;
    itemType(id: string): ItemCatalogEntry | null;
    itemBuyPrice(id: string): number;
    makeItem(id: string): Item | null;
    shopItemIds(seller: string): string[];
    addItem(
      player: ItemOwner | null | undefined,
      id: string,
      count?: number,
    ): Item | null;
    countItems(player: ItemOwner | null | undefined, id: string): number;
    removeItemById(player: ItemOwner | null | undefined, id: string): boolean;
    removeItemByUid(
      player: ItemOwner | null | undefined,
      itemUid: string,
    ): Item | null;
    applyTfItem(player: ItemOwner, type: ItemCatalogEntry): string;
    useCarriedItem(
      player: ItemOwner | null | undefined,
      item: Item | null | undefined,
    ): string;
    buyItem(player: ItemOwner, id: string): string;
    itemShopHtml(seller: string, intro?: string): string;
    itemShopResponses(seller: string, leaveNode: string | null): LTResponse[];

    // clothing.ts
    SLOTS: ClothingSlot[];
    CLOTHING: Record<string, ClothingCatalogEntry>;
    makeClothing(id: string): ClothingItem;
    coversArea(player: ClothingWearer, area: string): boolean;
    creationClothedEnough(player: ClothingWearer): boolean | undefined;
    dressPlayer(player: ClothingWearer): void;
    unequipToWardrobe(player: ClothingWearer, slot: string): boolean;
    clothingValue(itemOrId: string | ClothingCatalogEntry | null | undefined): number;
    clothingBuyPrice(itemOrId: string | ClothingCatalogEntry | null | undefined): number;
    nyanStock(group?: string): string[];
    equipFromWardrobe(player: ClothingWearer, uid: string): boolean | undefined;

    // npcGear.ts
    dressNpcOutfit<T extends NpcGearCarrier | null | undefined>(npc: T, outfitType?: string | null): T;
    supplyNpcInventory<T extends NpcGearCarrier | null | undefined>(npc: T): T;
    prepareNpcGear<T extends NpcGearCarrier | null | undefined>(npc: T, opts?: NpcGearOptions | null): T;
    dressUniqueNpc<T extends NpcGearCarrier | null | undefined>(id: string, npc: T): T;
    npcEquippedList(npc: NpcGearCarrier | null | undefined): { slot: string; item: NpcGearItem }[];
    npcHasLoot(npc: NpcGearCarrier | null | undefined): boolean;
    takeNpcClothing(npc: NpcGearCarrier | null | undefined, slot: string): NpcGearItem | null;
    takeNpcItem(npc: NpcGearCarrier | null | undefined, uid: string): NpcGearItem | null;
    takeNpcWeapon(npc: NpcGearCarrier | null | undefined, which: string): NpcGearItem | null;
    stripNpc(npc: NpcGearCarrier | null | undefined): NpcGearItem[];
    takeAllNpcItems(npc: NpcGearCarrier | null | undefined): NpcGearItem[];
    takeAllNpcWeapons(npc: NpcGearCarrier | null | undefined): NpcGearItem[];
    openNpcLoot(npc: NpcGearCarrier | null | undefined, returnNode?: string | null): void;
    currentLootNpc(): NpcGearCarrier | null;

    // npcs.ts
    isWorkTime(): boolean;
    isOfficeHours(): boolean;
    hourOfDay(): number;
    ensureHouseNpcs(): Record<string, Npc>;
    updateHouseNpcLocations(): void;
    ensureFelicia(): Npc;
    ensureScarlett(): Npc;
    ensureHelena(): Npc;
    ensureCandi(): Npc;
    ensureFinch(): Npc;
    ensureAmber(): Npc;
    ensureNyan(): Npc;
    ensureKate(): Npc;
    ensureAshley(): Npc;
    ensureBunny(): Npc;
    ensureLoppy(): Npc;
    ensureAngel(): Npc;
    ensureKatherine(): Npc;
    ensureArthur(): Npc;
    ensureBrax(): Npc;
    ensureVicky(): Npc;
    npcAtCurrentTile(): Npc[];

    // response.ts
    Response: {
      new (
        title: string,
        tooltipText?: string | null,
        nextDialogue?: string | null,
        effects?: (() => void) | null,
      ): LTResponse;
      prototype: LTResponse;
    };
    effectsOnly(
      title: string,
      tooltipText?: string | null,
      effects?: (() => void) | null,
    ): LTResponse;

    // enchanting.ts
    TF_POTENCY: Record<string, TfPotency>;
    TF_MODIFIER: Record<string, TfModifier>;
    CLOTHING_MAJOR_SECONDARIES: string[];
    CLOTHING_ATTRIBUTE_SECONDARIES: string[];
    CLOTHING_SPECIAL_SECONDARIES: string[];
    WEAPON_MAJOR_SECONDARIES: string[];
    WEAPON_ATTRIBUTE_SECONDARIES: string[];
    ENCHANT_MAX_EFFECTS: number;
    ENCHANT_MAX_POTION_EFFECTS: number;
    ENCHANT_MAX_WEAPON_EFFECTS: number;
    SEALED_COST: Record<string, number>;
    isWeaponIngredient(item: Item | null | undefined): boolean;
    itemEffect(
      type?: string,
      primary?: string,
      secondary?: string,
      potency?: string,
      limit?: number | null,
    ): EnchantEffect;
    itemEffectCost(effect: EnchantEffect): number;
    enchantCost(
      ingredient: Item | null | undefined,
      effects: EnchantEffect[] | null | undefined,
    ): number;
    effectLabel(effect: EnchantEffect): string;
    emptyEnchantBonus(): EnchantBonus;
    clearEnchantBonus(ch: EnchantCarrier): void;
    applyEffectToBonus(
      bonus: EnchantBonus,
      effect: EnchantEffect,
      sign?: number,
    ): void;
    reapplyWornEnchantments(ch: EnchantCarrier | null | undefined): void;
    itemIsSealed(item: Item | null | undefined): boolean;
    sealBreakCost(item: Item | null | undefined): number;
    incrementEssenceCount(amount: number, withText?: boolean): string;
    startEnchantmentQuest(): string;
    completeEnchantmentQuest(): string;
    canEnchant(): boolean;
    awardCombatEssences(enemy?: CombatEnemyLike | null): string;
    awardOrgasmEssences(): string;
    craftEnchantedItem(
      ingredient: Item | null | undefined,
      effects: EnchantEffect[] | null | undefined,
    ):
      | { error: string; item?: undefined; cost?: undefined }
      | { item: Item; cost: number; error?: undefined };
    findCarriedByUid(player: EnchantCarrier, uid: string): CarriedRef;
    replaceCarried(player: EnchantCarrier, uid: string, next: Item): boolean;

    // occupations.ts
    OCCUPATIONS: Occupation[];
    availableOccupations(player: OccupationOwner): Occupation[];
    findOccupation(id: string): Occupation | null;

    // bodyEnums.ts
    BODY_SIZE: Record<string, BodyEnumEntry>;
    BODY_SIZE_LIST: BodyEnumEntry[];
    MUSCLE: Record<string, BodyEnumEntry>;
    MUSCLE_LIST: BodyEnumEntry[];
    LIP: Record<string, BodyEnumEntry>;
    LIP_LIST: BodyEnumEntry[];
    HAIR_LENGTH: Record<string, BodyEnumEntry>;
    HAIR_LENGTH_LIST: BodyEnumEntry[];
    HAIR_STYLE: HairStyleEntry[];
    CUP: Record<string, BodyEnumEntry>;
    CUP_LIST: BodyEnumEntry[];
    BREAST_SHAPE: BodyEnumEntry[];
    SIZE5: BodyEnumEntry[];
    SKIN: SwatchEntry[];
    HAIR_COLOUR: SwatchEntry[];
    EYE: SwatchEntry[];
    hairLengthIndex(id: string): number;
    bodyShapeOf(size: BodyEnumEntry | null | undefined, muscle: BodyEnumEntry | null | undefined): { name: string; colour: string };
    findById<T extends { id: any }>(arr: T[], id: any): T;
    BODY_HAIR: EnumEntry[];
    BODY_MATERIAL: EnumEntry[];
    GENITAL_ARRANGEMENT: EnumEntry[];
    RACE_STAGE: EnumEntry[];
    NIPPLE_SHAPE: EnumEntry[];
    AREOLAE_SHAPE: EnumEntry[];
    EYE_SHAPE: EnumEntry[];
    FOOT_STRUCTURE: EnumEntry[];
    LEG_CONFIGURATION: EnumEntry[];
    WETNESS: EnumEntry[];
    ELASTICITY: EnumEntry[];
    PLASTICITY: EnumEntry[];
    ORIFICE_DEPTH: EnumEntry[];
    PENETRATION_GIRTH: EnumEntry[];
    WING_SIZE: EnumEntry[];
    PART_TYPE: Record<string, EnumEntry>;
    RACE: EnumEntry[];
    PIERCING_SLOTS: string[];
    ORIFICE_MODIFIER: EnumEntry[];
    PENETRATION_MODIFIER: EnumEntry[];
    TONGUE_MODIFIER: EnumEntry[];
    FLUID_FLAVOUR: EnumEntry[];
    FLUID_MODIFIER: EnumEntry[];
    TF_COLOURS: SwatchEntry[];
    SELF_TRANSFORM_RACES: string[];
    MAKEUP_SLOTS: HelpEntry[];
    MAKEUP_COLOURS: SwatchEntry[];
    PIERCING_TYPES: PiercingType[];
    TATTOO_SLOTS: TattooSlot[];
    TATTOO_TYPES: HelpEntry[];

    // body.ts
    emptyOrifice(opts?: { wetness?: any; capacity?: any; depth?: any; elasticity?: any; plasticity?: any; modifiers?: string[]; stuffed?: boolean; virgin?: boolean }): Orifice;
    createBody(opts?: Record<string, any> | null): CharacterBody;
    syncCharacterFromBody(ch: BodyCarrier | null | undefined): BodyCarrier | null | undefined;
    ensureBody(ch: BodyCarrier | null | undefined): CharacterBody | null;
    ensureCharacterSystems(ch: BodyCarrier | null | undefined): BodyCarrier | null | undefined;
    serializeBody(body: CharacterBody | null | undefined): CharacterBody | null;
    applySavedBody(ch: BodyCarrier | null | undefined, data: Record<string, any> | null | undefined): BodyCarrier | null | undefined;

    // combat.ts
    combat: CombatState;
    MOVES: Record<string, Move>;
    ResponseCombat(title: string, tooltipText: string, opts: CombatStartOpts): LTResponse;

    // status.ts
    applyStatus(ch: Combatant | null | undefined, id: string, turns: number): void;
    getStatus(ch: Combatant | null | undefined, id: string): { id: string; turns: number } | null | undefined;
    clearStatuses(ch: Combatant | null | undefined): void;
    apPenalty(ch: Combatant | null | undefined): number;
    consumeFlash(ch: Combatant): number;
    tickStatuses(ch: Combatant | null | undefined): string[];
    statusSummary(ch: Combatant | null | undefined): string;

    // damage.ts
    SHIELD_TYPES: string[];
    resistFromStatuses(ch: Combatant | null | undefined, type: string): number;
    refreshShields(ch: Combatant | null | undefined): void;
    shieldAbsorb(ch: Combatant | null | undefined, type: string | null | undefined, amount: number): number;
    applyTypedDamage(target: Combatant | null | undefined, amount: number, type?: string | null): number;
    strikeDamageType(weapon: Item | null | undefined): string;
    spellCostOf(ch: Combatant | null | undefined, spell: { cost?: number } | null | undefined): number;
    lustDamageBonus(ch: Combatant | null | undefined): number;
    applyEnchantDamage(ch: Combatant | null | undefined, weapon: Item | null | undefined, amount: number): number;
    lustDamageMultiplier(ch: Combatant | null | undefined): number;
    modifyOutgoingLust(ch: Combatant | null | undefined, amount: number): number;

    // roam.ts
    findPlaceTile(gridName: string, placeType: string | null | undefined): GridTile | null;
    enterWorld(gridName: string, placeType?: string | null, coords?: { x: number; y: number } | null): GridTile | null;
    travelToPlace(gridName: string, placeType?: string | null): boolean;
    useTileTravel(): boolean;
  }

  interface Window {
    LT: LTNamespace;
  }

  var LT: LTNamespace;

  // A handful of globals live outside the LT namespace: they're declared
  // inside an IIFE (mainly js/grid/*) and exposed only via a runtime
  // `window.X = X` assignment, which TS can't see as a real declaration.
  // Declared loosely here rather than fixed up per converted file.
  var grid: any;
  var player: any;
  var ltGame: any;
  var selectedTile: any;
  var gridContainer: any;
  var gridInfoBox: any;
  var LT_GRID_META: any;
  var allGrids: any;
  function getCurrentTile(...args: any[]): any;
  function openUI(...args: any[]): any;
  function print(...args: any[]): any;
  function updateInfo(...args: any[]): any;
  function movePlayer(...args: any[]): any;
  function getLocation(...args: any[]): any;
  function getLocationByName(...args: any[]): any;
  function findTile(...args: any[]): any;
  function findTileMinified(...args: any[]): any;
  function findFirstNavigableTile(...args: any[]): any;
  function goToTileLocation(...args: any[]): any;
  function selectTile(...args: any[]): any;
  function showGrid(...args: any[]): any;
  function hideGrid(...args: any[]): any;
  function unhideGrid(...args: any[]): any;
  function renderGrid(...args: any[]): any;
  function loadGrid(...args: any[]): any;
  function cycleGridZoom(...args: any[]): any;
  function createEmptyGrid(...args: any[]): any;
  function createClusteredGrid(...args: any[]): any;
  function generateGrid(...args: any[]): any;
  function generateContinent(...args: any[]): any;
  function generateCellular(...args: any[]): any;
  function generateDrunkards(...args: any[]): any;
  function generateDungeon(...args: any[]): any;
  function thickenCorridors(...args: any[]): any;
  function addRooms(...args: any[]): any;
  function addBetterRooms(...args: any[]): any;
  function declareGridVariables(...args: any[]): any;
  function getMinifiedGrid(...args: any[]): any;
  function getMaxifiedGrid(...args: any[]): any;
  function startDrawing(...args: any[]): any;
}
