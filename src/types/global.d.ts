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
    genUid?(prefix?: string): void;
    equip?(): void;
    [key: string]: any;
  }

  // Ported from upstream PR #5: the real ItemInstance class lives in
  // items.ts's own local scope (this codebase has no cross-file module
  // imports — everything bridges through LT.*), so other files that need to
  // `extends LT.Item` (clothing.ts) reference its constructor shape via this
  // interface rather than the concrete class name.
  interface ItemConstructor {
    new (opts: ItemCatalogEntry): Item;
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
    // Genuine pre-existing field-shape collision, found while auditing this
    // interface against Character: items.ts's "use a cosmetic item" path
    // (LT.useCarriedItem) and content/arcadeShops.ts both do
    // `player.makeup = true` — a boolean — but body.ts/advancedAppearance.ts/
    // engine/save.ts all read/write `player.makeup` as
    // Record<string, {colour, modifier}>. Whichever runs second clobbers the
    // other's idea of what `.makeup` means; using a cosmetic item after
    // customizing makeup would silently discard the customization. Not fixed
    // here — this pass is type-declarations only, no runtime-logic changes —
    // but left as an honest union (instead of two disconnected interfaces
    // that individually looked fine) so the collision stays visible instead
    // of hidden. TODO(ts): fix the two `player.makeup = true` assignments
    // (items.ts, content/arcadeShops.ts) to not stomp the real makeup record.
    makeup?: boolean | Record<string, { colour?: string; modifier?: string } | undefined>;
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

  // effects/enchanted/enchantmentKnown mirror Item's own (optional) fields
  // rather than being pulled in via `extends Item`: ClothingInstance really
  // does `extends LT.Item` at the runtime class level (see items.ts's
  // ItemConstructor comment), so a carried clothing item can genuinely carry
  // enchantments the same way a generic Item can (enchanting.ts's
  // reapplyWornEnchantments reads `.effects` off whatever's in `equipped`
  // without caring which kind it is) — but `extends Item` directly isn't
  // used because Item.value is required and clothing catalog entries
  // deliberately never store one (see ClothingCatalogEntry above); these
  // three fields are declared in parallel instead, at the same optionality
  // Item itself uses.
  interface ClothingItem extends ClothingCatalogEntry, CarriedItemBase {
    // Never actually set on clothing (enchanting.ts's isWeaponIngredient
    // checks `item.kind === "weapon"`, which is always false for clothing)
    // — declared for the same structural-parity reason as effects/enchanted/
    // enchantmentKnown above, so code that reads `.kind` generically off a
    // CarriedThing keeps compiling without an `in` guard.
    kind?: string;
    effects?: EnchantEffect[];
    enchanted?: boolean;
    enchantmentKnown?: boolean;
  }

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
    // Not named `occupation?: string` here on purpose: npcGear.ts's own
    // usage (`npc.occupation === "prostitute"`) really does treat it as a
    // plain string id, but Character.occupation is a full `Occupation | null`
    // record (a genuinely different concept, not just a looser/stricter
    // version of the same field) — found when Character started extending
    // this interface. Left to fall through the index signature below rather
    // than forcing either side to fit the other; `npc.occupation === "..."`
    // still typechecks fine against `any`.
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
  //
  // Deliberately does NOT also extend NpcGearCarrier: that interface types
  // items/equipped/wardrobe/weapons/mainWeapon/offhandWeapon with the loose
  // NpcGearItem bag, while Combatant/ItemOwner type the same field names
  // with the stricter Item — TS requires identical (not just compatible)
  // types for a property named by multiple extended interfaces, so all
  // three together don't typecheck. Real Npc objects still satisfy
  // NpcGearCarrier structurally (Item is narrower than NpcGearItem, so it's
  // assignable) without needing the formal extends.
  interface Npc extends Combatant, StatusEffectCarrier, ItemOwner {
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

  // === slavery.ts ===
  // Slave house-management: its own save-flag-backed record type, distinct
  // from both Character and Npc (a SlaveRecord is a plain data bag stored in
  // LT.game.flags.ownedSlaves/pendingSlaves; LT.slaveAsNpc projects one onto
  // a real Npc for rendering/interaction, same as every other npcs.ts entry).

  interface SlaveJob {
    id: string;
    name: string;
    nameM: string;
    description: string;
    income: number;
    cap: number;
    affection: number;
    obedience: number;
    stamina: number;
    obePay?: number;
    affPay?: number;
    colour: string;
    needs?: string | null;
    place?: { world: string; place: string } | null;
    dayOnly?: boolean;
    noSex?: boolean;
    needsLicense?: boolean;
  }

  interface SlaveJobHoursPreset {
    id: string;
    name: string;
    description: string;
    start: number;
    length: number;
  }

  interface SlavePermissionSetting {
    id: string;
    name: string;
    description: string;
    def?: boolean;
  }

  interface SlavePermissionGroup {
    id: string;
    name: string;
    exclusive: boolean;
    settings: SlavePermissionSetting[];
  }

  interface HouseUpgrade {
    id: string;
    name: string;
    cost: number;
    cap: number;
    home?: boolean;
    unique?: boolean;
    permanent?: boolean;
    colour: string;
    description: string;
  }

  // Legacy save compatibility: a room's occupant used to be stored as the
  // bare upgrade id string; newer saves wrap it in { u: id }. Both are read
  // by LT.roomUpgradeAt/findUpgradeKey/countUpgrade via `rec.u || rec`.
  type HouseRoomRecord = { u: string } | string;

  interface JobAvailability {
    ok: boolean;
    reason?: string;
  }

  interface SlaveWorkPlace {
    world: string;
    place?: string;
    x?: number;
    y?: number;
  }

  interface SlaveRecord {
    id: string;
    name: string;
    feminine: boolean;
    raceName: string;
    fullRace: string;
    collared: boolean;
    job: string;
    // Always length 24: one LT.SLAVE_JOBS id per hour of the day.
    hours: string[];
    aff: number;
    obe: number;
    perms: Record<string, boolean>;
    home: string;
    earned: number;
    // Set only while queued in LT.pendingSlaves(), cleared once collected.
    waiting?: boolean;
    // Original Npc id this record was snapshotted from, if any (absent for
    // slaves who started as a pending/alley encounter with no stable id).
    src?: string;
    // Last hour a workplace-sex event was already offered for this slave —
    // prevents re-triggering within the same hour.
    _sexHour?: number;
    [key: string]: any;
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
    // Marks the synthetic "next/first page" response ui/responses.ts builds
    // when there are more responses than fit on one page — not a real
    // dialogue response, never set by the LT.Response constructor.
    _pageFlip?: boolean;
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
    // Really ClothingItem (same equipped/wardrobe reality as Character/
    // ClothingWearer) — widened from Item when the inheritance audit found
    // the mismatch; ClothingItem now carries effects/enchanted/
    // enchantmentKnown too, so reapplyWornEnchantments' generic `.effects`
    // read still works.
    equipped?: Record<string, ClothingItem | undefined>;
    // Character.mainWeapon/offhandWeapon are `Item | null` (never simply
    // absent — set to null, not left undefined) — found via the inheritance
    // audit's `skipLibCheck: false` re-run (see the extends clause's
    // comment on the Character interface itself for why that check is
    // needed at all here).
    mainWeapon?: Item | null;
    offhandWeapon?: Item | null;
    enchantBonus?: EnchantBonus;
    wardrobe?: ClothingItem[];
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

  // Anything enchantCost/isWeaponIngredient/itemIsSealed/sealBreakCost/
  // craftEnchantedItem can be handed as an "ingredient": findCarriedByUid
  // searches wardrobe/equipped (ClothingItem) alongside items/weapons (Item)
  // in one pass, and content/enchantNodes.ts's enchanting UI genuinely picks
  // its ingredient from that same search — so these functions need to
  // accept either kind, not just Item.
  type CarriedThing = Item | ClothingItem;

  // findCarriedByUid searches wardrobe (ClothingItem[]) alongside items/
  // weapons (Item[]) in one pass, and equipped (also ClothingItem) — so the
  // found item/list is honestly a union of both kinds, not just Item.
  type CarriedRef =
    | {
        list: Item[] | ClothingItem[];
        index: number;
        item: CarriedThing;
        equipped?: undefined;
        slot?: undefined;
      }
    | {
        equipped: true;
        slot: string;
        item: ClothingItem;
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
      // Not set by LT.createBody's initial construction — only backfilled
      // once content/bodyChanging.ts's ensureExtras() runs (same for
      // breastCrotch's whole field set below), hence optional.
      milkFlavour?: string;
      milkModifiers?: string[];
      milkRegen?: number;
      nipple: { shape: string; size: string; countPerBreast: number; pierced: boolean; puffy: boolean; fuckable: boolean };
      areolae: { shape: string; size: string };
      orifice: Orifice;
    };
    // LT.createBody only ever constructs {type, shape, size, rows,
    // milkStorage, milkStored} here — nipple/areolae/orifice/milk* are all
    // backfilled later by ensureExtras() (unlike `breast` above, which gets
    // nipple/areolae/orifice at construction), hence optional.
    breastCrotch: {
      type: string;
      shape: string;
      size: string;
      rows: number;
      milkStorage: number;
      milkStored: number;
      milkFlavour?: string;
      milkModifiers?: string[];
      milkRegen?: number;
      nipple?: { shape: string; size: string; countPerBreast: number; pierced: boolean; puffy: boolean; fuckable: boolean };
      areolae?: { shape: string; size: string };
      orifice?: Orifice;
    };
    face: {
      type: string;
      lipSize: string;
      lipsPuffy: boolean;
      piercedLip: boolean;
      // Not set by LT.createBody's initial construction (unlike
      // piercedLip) — only ever written by advancedAppearance.ts's
      // syncPiercingToBody() when the player toggles a nose piercing.
      piercedNose?: boolean;
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
      // Not set by LT.createBody's initial construction — only backfilled
      // once ensureExtras() runs, hence optional.
      cumFlavour?: string;
      cumModifiers?: string[];
      cumExpulsion?: number;
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
      // Not set by LT.createBody's initial construction — only backfilled
      // once ensureExtras() runs, hence optional.
      modifiers?: string[];
      girlcumFlavour?: string;
      girlcumModifiers?: string[];
      squirter?: boolean;
      eggLayer?: boolean;
      orifice: Orifice;
      urethra: Orifice;
    };
    // No fixed key set actually relied on directly (HUMAN/HAIR/EYE_IRISES
    // etc. are always looked up dynamically via bodyChanging.ts's
    // coveringOf(b, key), which backfills a missing entry on demand) — a
    // plain string-keyed record matches every real access site and, unlike
    // requiring specific keys, allows the `coverings = {}` backfill both
    // ensureExtras() and coveringOf() perform before first use.
    coverings: Record<string, BodyCovering>;
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

  // Return shape of bodyShapeOf/getBodyShape — pulled out to a named type so
  // player.ts's Character.getBodyShape() and bodyEnums.ts's LT.bodyShapeOf
  // both point at the same declaration instead of two matching inline literals.
  interface BodyShape {
    name: string;
    colour: string;
  }

  // === enums.ts ===
  // enums.ts itself stays untyped (out of scope for this pass) — these shapes
  // are declared here because Character (below) needs real types for
  // LT.Gender/LT.Orientation/LT.Femininity/LT.PERSONALITY entries rather than
  // falling through LTNamespace's index signature to `any`.

  interface FemininityEntry {
    id: string;
    name: string;
    value: number;
    colour: string;
  }

  interface GenderEntry {
    id: string;
    name: string;
    hasPenis: boolean;
    hasVagina: boolean;
    hasBreasts: boolean;
    feminine: boolean;
    colour: string;
  }

  interface OrientationEntry {
    id: string;
    name: string;
    colour: string;
  }

  interface PersonalityTrait {
    id: string;
    name: string;
    colour: string;
    exclusive: string[];
  }

  // === player.ts ===

  // Canonical, fully-typed player character shape: what `new LT.GameCharacter(...)`
  // actually produces.
  //
  // NPCs deliberately stay on the looser `Npc` bag (see npcs.ts) rather than
  // extending Character or being unified with it: a repo-wide grep confirms
  // `GameCharacter` is only ever constructed in this one file, and every NPC
  // in npcs.ts is its own ad-hoc object literal with a very different, much
  // smaller field mix (no body/appearance fields, no applyHumanDefaults,
  // often no `sex`/`items`/`equipped` at all). Forcing them into one type
  // would mean making most of Character's fields optional again, which
  // defeats the point of typing it strictly here. Functions that operate on
  // *either* a real Character or an Npc/enemy (maxHealthOf, refreshVitals,
  // effectivePhysique, etc.) keep taking the older, looser `Combatant`
  // instead of `Character` for that reason — Character's required fields
  // would reject a bare Npc literal that Combatant happily accepts.
  //
  // Character formally `extends` every "character-shaped" interface in this
  // file it's compatible with, rather than just structurally happening to
  // satisfy them (an earlier version of this comment claimed the latter —
  // it was never actually compiler-checked, since interface-extends
  // conflicts inside a .d.ts are silently skipped under this project's
  // `skipLibCheck: true`; verified for real here with a one-off
  // `tsc --noEmit --skipLibCheck false` re-run, not the normal
  // `npm run typecheck`). That check found two genuine, pre-existing
  // mismatches, both fixed in place: EnchantCarrier's mainWeapon/
  // offhandWeapon were `Item | undefined` (missing `| null`, which
  // Character's fields actually use), and NpcGearCarrier's `occupation`
  // turned out to mean something genuinely different from Character's own
  // (see NpcGearCarrier's comment) — left unnamed there rather than forced
  // to unify. Anyone adding a new carrier interface or widening one of
  // these should re-run that full check rather than trusting a plain
  // `npm run typecheck` pass to catch conflicts introduced here.
  interface Character
    extends ItemOwner,
      OccupationOwner,
      ClothingWearer,
      BodyCarrier,
      EnchantCarrier,
      NpcGearCarrier,
      StatusEffectCarrier,
      Combatant {
    id?: string;
    player: boolean;
    names: { masculine: string; androgynous: string; feminine: string };
    surname: string;
    gender: GenderEntry;
    femininityValue: number;
    orientation: OrientationEntry;
    // Personality traits are toggled by id (LT.PERSONALITY's ids) as a
    // presence-map; there's no fixed key set to name individually.
    personality: Record<string, boolean>;
    birthday: Date;
    level: number;
    experience: number;
    experienceForLevel: number;
    physique: number;
    arcane: number;
    maxHealth: number;
    health: number;
    maxMana: number;
    mana: number;
    corruption: number;
    arousal: number;
    lust: number;
    essences: number;
    knownSpells: string[];
    items: Item[];
    money: number;
    location: { world?: string; place?: string; x?: number; y?: number } | null;
    // Only ever populated by LT.makeClothing (see clothing.ts's dressPlayer/
    // equipFromWardrobe/unequipToWardrobe) — really ClothingItem, not the
    // generic Item this was typed as before the inheritance audit found the
    // mismatch.
    equipped: Record<string, ClothingItem | undefined>;
    wardrobe: ClothingItem[];
    mainWeapon: Item | null;
    offhandWeapon: Item | null;
    weapons: Item[];
    occupation: Occupation | null;
    sex: { vaginal: number; anal: number; oral: number; penisVirgin: boolean; vaginaVirgin: boolean };

    // Set by setGender(), not the constructor — once present, overrides
    // gender.hasPenis/hasVagina in hasPenis()/hasVagina() below.
    penisPresent?: boolean;
    vaginaPresent?: boolean;

    // Appearance fields: all set by applyHumanDefaults(), not the constructor.
    heightCm: number;
    skin: SwatchEntry;
    bodySize: BodyEnumEntry;
    muscle: BodyEnumEntry;
    lipSize: BodyEnumEntry;
    lipsPuffy: boolean;
    eye: SwatchEntry;
    hairLength: BodyEnumEntry;
    hairStyle: HairStyleEntry;
    hair: SwatchEntry;
    breastSize: BodyEnumEntry;
    breastShape: BodyEnumEntry;
    nippleSize: BodyEnumEntry;
    areolaeSize: BodyEnumEntry;
    nipplesPuffy: boolean;
    assSize: BodyEnumEntry;
    hipSize: BodyEnumEntry;
    anusBleached: boolean;
    penisLength: number;
    testicleSize: BodyEnumEntry;
    vaginaCapacity: BodyEnumEntry;
    labiaSize: BodyEnumEntry;
    clitorisSize: BodyEnumEntry;
    // Only actually populated once LT.createBody exists (true in the real
    // boot order — body.ts loads before player.ts — but not something this
    // type can guarantee for every caller), hence optional.
    body?: CharacterBody;

    // Never set by player.ts itself — populated by character creation
    // (content/characterCreation.ts) — optional since GameCharacter's own
    // constructor never assigns either.
    fullRace?: string;
    raceName?: string;

    // Read by describeBody() but written by advancedAppearance.ts — shapes
    // now verified field-for-field against that file's actual writers
    // (content/advancedAppearance.ts typing pass).
    makeup?: Record<string, { colour?: string; modifier?: string } | undefined>;
    piercings?: Record<string, boolean | undefined>;
    tattoos?: Record<string, { name?: string; type?: string; colour?: string; writing?: string } | undefined>;

    enchantBonus?: EnchantBonus;
    statusEffects?: Record<string, AppliedStatusEffect | undefined>;

    isPlayer(): boolean;
    isFeminine(): boolean;
    getFemininity(): FemininityEntry;
    getFemininityValue(): number;
    setFemininity(entry: FemininityEntry | number): void;
    getGender(): GenderEntry;
    setGender(gender: GenderEntry): void;
    hasPenis(): boolean;
    hasVagina(): boolean;
    hasBreasts(): boolean;
    applyHumanDefaults(): void;
    getBodyShape(): BodyShape;
    describeBody(): string;
    getName(): string;
    setName(masculine: string, androgynous?: string, feminine?: string): void;
    getRaceName(): string;
    getAgeValue(now?: Date): number;
    setAge(age: number, now?: Date): void;
    hasPersonalityTrait(id: string): boolean;
    togglePersonality(id: string): void;
    she(): string;
    her(): string;
    getGenderColour(): string;

    // Every other file in the codebase that touches a player object reaches
    // for fields Character doesn't name yet (slavery.ts's captivity/collar
    // state, combat's runtime AP bookkeeping, save-game bookkeeping, etc.) —
    // same convention as every other "shape" interface in this file.
    [key: string]: any;
  }

  interface GameCharacterOpts {
    id?: string;
    player?: boolean;
  }

  // === statusEffects.ts ===
  // The persistent, world-ticking status-effect system (weather, pregnancy,
  // well-rested, etc: `ch.statusEffects`). Distinct from Combatant.statuses,
  // the older combat-only bag defined in combat/status.ts — that file
  // early-returns its entire IIFE once `LT.applyStatus` already exists (see
  // its own top-of-file comment), and statusEffects.ts's script loads first
  // in boot.js, so combat/status.ts's implementation never actually runs.
  // LT.applyStatus/getStatus/clearStatuses/apPenalty/consumeFlash/
  // tickStatuses/statusSummary are the ones statusEffects.ts defines (see
  // the "status.ts" section above) — not redeclared here to avoid a
  // duplicate-property error; StatusEffectCarrier below is looser than
  // Combatant, and Combatant's own index signature accepts it structurally.

  interface AppliedStatusEffect {
    id: string;
    lastApplied: number;
    secondsPassed?: number;
    secondsRemaining?: number;
    combatTurns?: number;
  }

  interface StatusEffectBonus {
    physique: number;
    arcane: number;
    health: number;
    mana: number;
    corruption: number;
    fertility: number;
    virility: number;
    damageUnarmed: number;
    damagePhysical: number;
    damageLust: number;
    resistPhysical: number;
    resistLust: number;
    resistFire: number;
    resistIce: number;
    spellCost: number;
    restingLust: number;
    actionPoints: number;
    [key: string]: number;
  }

  // Loosely-known character-or-combatant shape: statusEffects.ts runs across
  // both the player (Character) and any Npc/enemy, using only the handful of
  // fields it reads/writes directly.
  interface StatusEffectCarrier {
    player?: boolean;
    location?: { world?: string; place?: string } | null;
    lust?: number;
    health?: number;
    arcane?: number;
    statusEffects?: Record<string, AppliedStatusEffect | undefined>;
    name?: string;
    getName?: () => string;
    [key: string]: any;
  }

  interface StatusEffectDef {
    // Assigned after the fact by se(id, opts) — not part of the literal
    // passed to it, hence optional despite always being present once stored
    // in LT.STATUS_EFFECTS.
    id?: string;
    name: string;
    priority: number;
    beneficial: boolean;
    sex?: boolean;
    combat?: boolean;
    // All callbacks accept a possibly-null carrier: several definitions
    // (RECOVERING_AURA, nameOf's callers, etc.) are invoked with whatever
    // `ch` the current caller happened to have on hand, including tooltip
    // rendering paths where it can be null/undefined, and defend
    // internally (`ch && ch.player`, nameOf's own `if (!ch) return
    // "someone"`) rather than assuming a real carrier.
    icon: string | ((ch: StatusEffectCarrier | null | undefined) => string);
    extra?: string[] | ((ch: StatusEffectCarrier | null | undefined) => string[]);
    attributes?: Partial<StatusEffectBonus> | ((ch: StatusEffectCarrier | null | undefined) => Partial<StatusEffectBonus>);
    description: string | ((ch: StatusEffectCarrier | null | undefined) => string);
    conditions?: (ch: StatusEffectCarrier | null | undefined) => boolean;
    onExpire?: (ch: StatusEffectCarrier | null | undefined) => string;
  }

  interface StatusEffectListEntry {
    id: string;
    def: StatusEffectDef;
    applied: AppliedStatusEffect;
  }

  // === combat.ts, status.ts, damage.ts ===

  // Shared shape for a character actively participating in combat (player or
  // enemy/NPC). Deliberately stays this loose rather than being replaced by
  // `Character` everywhere: combat code runs against enemies too, which are
  // bare Npc/ad-hoc literals that don't satisfy Character's required fields
  // (see the design-decision comment on Character in the player.ts section).
  // Character itself formally `extends Combatant` (it's the more specific,
  // fully-fleshed-out case), so a real player object still flows into any
  // Combatant-typed function without a cast — this interface just also
  // accepts the lighter-weight enemy/NPC case Character can't.
  interface Combatant {
    health?: number;
    maxHealth?: number;
    lust?: number;
    mana?: number;
    maxMana?: number;
    // Named explicitly (rather than left to the index signature) because
    // player.ts's effectivePhysique/effectiveArcane/effectiveCorruption read
    // these on whatever combatant (player or enemy) is passed in.
    physique?: number;
    arcane?: number;
    corruption?: number;
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

  // === content/bodyChanging.ts ===
  // Shared shape for anything the pills()/toggles() UI helpers render as a
  // selectable option — every enum-entry-like array in the codebase
  // (BodyEnumEntry, EnumEntry, SwatchEntry, HairStyleEntry) structurally
  // satisfies this, since they all carry at least `id` and usually `name`,
  // with `colour`/`hex` covering the two different ways entries record a
  // display colour (hexOf() checks both).
  interface PillEntry {
    id: string;
    name: string;
    colour?: string;
    hex?: string;
  }

  // === content/encounters.ts ===
  interface EncounterEntry {
    id: string;
    weight: number;
    available?: () => boolean;
    // Returns a node id to redirect to, or null/nothing when the encounter
    // declines to fire this time (e.g. startStormAttack's storm-not-active
    // guard) — same shape LT.rollEncounterTable relies on to fall through
    // to the next weighted pick.
    start?: () => string | null | undefined;
    node?: string;
  }

  interface EncounterResult {
    entry: EncounterEntry;
    node: string;
  }

  // === content/nodes.ts ===
  // The content-node registry backing LT.defineNode/getNode/hasNode, used
  // by ~186 call sites across every content/ file. Deliberately minimal —
  // only `id` is named, everything else (ui, title, chrome, getContent,
  // getResponses, applyPreParsingEffects, secondsPassed, travelDisabled,
  // continuesDialogue, tabs, and more) falls through the index signature.
  // A fully-named shape would need auditing all 186 call sites' actual
  // field usage; out of scope for this pass.
  interface ContentNodeDef {
    id: string;
    [key: string]: any;
  }

  // === ui/openUI.ts ===
  // The stage/left/right/overlay panel-switcher registry every top-level UI
  // section (character sheet, inventory, phone, etc.) registers into via
  // LT.registerUI. opts is whatever the caller passes to LT.openUI/closeUI —
  // genuinely free-form per section, hence the index signature.
  interface UIOpenOpts {
    target?: string;
    [key: string]: any;
  }

  interface UISectionHooks {
    target?: string;
    onOpen?: ((opts: UIOpenOpts) => void) | null;
    onClose?: ((opts: UIOpenOpts) => void) | null;
    render?: ((opts: UIOpenOpts) => void) | null;
  }

  interface UISectionEntry {
    id: string;
    target: string;
    onOpen: ((opts: UIOpenOpts) => void) | null;
    onClose: ((opts: UIOpenOpts) => void) | null;
    render: ((opts: UIOpenOpts) => void) | null;
  }

  interface ChromeOpts {
    left?: boolean;
    right?: boolean;
    title?: string;
  }

  // === ui/menus/saveLoad.ts ===
  // Summary row for the save/load screen, as built by LT.listSaves()
  // (engine/save.ts) — that file's own save-blob internals aren't typed
  // yet, hence this covers only the fields the UI actually reads.
  interface SaveEntry {
    name: string;
    savedAt?: string;
    playerName?: string;
    world?: string | null;
    place?: string | null;
  }

  // === ui/menus/chromeButtons.ts ===
  // Covers both the LEFT (icon+action) and RIGHT (label+dir, for the D-pad)
  // button lists — every field optional since neither list uses all of them.
  interface ChromeButtonSpec {
    id: string;
    icon?: string;
    label?: string;
    tip: string;
    dir?: string;
    action?: () => void;
  }

  // === LTNamespace ===
  // Base index signature plus every module's typed members, merged into one
  // interface. `LT.whatever` resolves to the specific signature below when
  // one exists, and falls through to `any` via the index signature otherwise.
  interface LTNamespace {
    [key: string]: any;

    // items.ts
    Item: ItemConstructor;
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

    // slavery.ts
    SLAVE_JOBS: Record<string, SlaveJob>;
    SLAVE_JOB_HOURS: Record<string, SlaveJobHoursPreset>;
    SLAVE_BASE_STAMINA: number;
    SLAVE_PERMISSIONS: Record<string, SlavePermissionGroup>;
    HOUSE_UPGRADES: Record<string, HouseUpgrade>;
    pendingSlaves(): SlaveRecord[];
    ownedSlaves(): SlaveRecord[];
    houseRooms(): Record<string, HouseRoomRecord>;
    charImages(): Record<string, string>;
    canManageHouse(): boolean;
    isEmptyHouseRoom(placeType: string | null | undefined): boolean;
    currentRoomKey(): string;
    parseRoomKey(key: string | null | undefined): { world: string; x: number; y: number } | null;
    roomUpgradeAt(key?: string | null): HouseUpgrade | null;
    findUpgradeKey(upgradeId: string): string | null;
    countUpgrade(upgradeId: string): number;
    applyRoomUpgradeVisual(key: string, upgrade: HouseUpgrade | null | undefined): void;
    refreshAllRoomVisuals(): void;
    convertRoom(upgradeId: string): string;
    normalizeSlave<T extends SlaveRecord | null | undefined>(rec: T): T;
    snapshotSlave(npc: Npc | null | undefined): SlaveRecord;
    enslaveNpc(npc: Npc | null | undefined): SlaveRecord;
    collectPendingSlave(index: number): SlaveRecord | null;
    takeOwnership(npc: Npc | null | undefined): SlaveRecord | null;
    findSlave(id: string): SlaveRecord | null;
    slaveJobName(rec: SlaveRecord | null | undefined, hour?: number | null): string;
    getSlaveJob(rec: SlaveRecord | null | undefined, hour?: number | null): string;
    isSlaveAtWork(rec: SlaveRecord | null | undefined, hour?: number | null): boolean;
    countWorkingJob(hour: number, jobId: string, skipId?: string | null): number;
    jobHourAvailable(jobId: string, rec: SlaveRecord, hour: number): JobAvailability;
    slavesInRoom(key?: string | null): SlaveRecord[];
    jobAvailable(jobId: string, rec: SlaveRecord): JobAvailability;
    setSlaveJobHour(rec: SlaveRecord, hour: number, jobId: string): string;
    applySlaveHoursPreset(rec: SlaveRecord, presetId: string, jobId?: string | null, force?: boolean): string;
    primarySlaveJob(rec: SlaveRecord): string;
    slaveHoursSummary(rec: SlaveRecord): string;
    setSlaveJob(rec: SlaveRecord, jobId: string): string;
    slaveHourlyIncome(rec: SlaveRecord, jobId: string): number;
    dailySlaveStamina(rec: SlaveRecord): number;
    overworkLevel(rec: SlaveRecord): number;
    hasSlavePermission(rec: SlaveRecord | null | undefined, settingId: string): boolean;
    setSlavePermission(rec: SlaveRecord, groupId: string, settingId: string): void;
    slaveBehaviourName(rec: SlaveRecord): string;
    assignSlaveHome(rec: SlaveRecord, key: string): string;
    slaveWorkPlace(rec: SlaveRecord): SlaveWorkPlace | null;
    placeSlave(rec: SlaveRecord): void;
    slaveAsNpc(rec: SlaveRecord): Npc;
    syncSlaveNpcs(): void;
    tickSlavery(seconds: number): void;
    slavesAtCurrentTile(): SlaveRecord[];
    jobSexText(rec: SlaveRecord): string;
    maybeWorkplaceSex(): string;
    isSafeImageUrl(url: string | null | undefined): boolean;
    setCharacterImage(id: string | null | undefined, url: string | null | undefined): boolean;
    getCharacterImage(id: string | null | undefined): string;
    promptCharacterImage(id: string): boolean;
    portraitHtml(id: string | null | undefined, cls?: string | null): string;
    compactCharacterSave(): void;
    namedCharacterIds(): string[];

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
    isWeaponIngredient(item: CarriedThing | null | undefined): boolean;
    itemEffect(
      type?: string,
      primary?: string,
      secondary?: string,
      potency?: string,
      limit?: number | null,
    ): EnchantEffect;
    itemEffectCost(effect: EnchantEffect): number;
    enchantCost(
      ingredient: CarriedThing | null | undefined,
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
    itemIsSealed(item: CarriedThing | null | undefined): boolean;
    sealBreakCost(item: CarriedThing | null | undefined): number;
    incrementEssenceCount(amount: number, withText?: boolean): string;
    startEnchantmentQuest(): string;
    completeEnchantmentQuest(): string;
    canEnchant(): boolean;
    awardCombatEssences(enemy?: CombatEnemyLike | null): string;
    awardOrgasmEssences(): string;
    craftEnchantedItem(
      ingredient: CarriedThing | null | undefined,
      effects: EnchantEffect[] | null | undefined,
    ):
      | { error: string; item?: undefined; cost?: undefined }
      | { item: CarriedThing; cost: number; error?: undefined };
    findCarriedByUid(player: EnchantCarrier, uid: string): CarriedRef;
    replaceCarried(player: EnchantCarrier, uid: string, next: CarriedThing): boolean;

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
    bodyShapeOf(size: BodyEnumEntry | null | undefined, muscle: BodyEnumEntry | null | undefined): BodyShape;
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

    // enums.ts
    Femininity: Record<string, FemininityEntry>;
    // MALE/FEMALE are assigned onto the object after the initial literal
    // (LT.Gender.MALE = LT.Gender.M_P_MALE), so they aren't part of its
    // type — Record<string, GenderEntry> already covers looking them up.
    Gender: Record<string, GenderEntry>;
    Orientation: Record<string, OrientationEntry>;
    PERSONALITY: PersonalityTrait[];
    MONTHS: string[];
    femininityFromValue(n: number): FemininityEntry;
    article(word: string): string;

    // player.ts
    GameCharacter: {
      new (opts?: GameCharacterOpts): Character;
      prototype: Character;
    };
    maxHealthOf(ch: Combatant): number;
    maxManaOf(ch: Combatant): number;
    effectivePhysique(ch: Combatant): number;
    effectiveArcane(ch: Combatant): number;
    effectiveCorruption(ch: Combatant): number;
    experienceNeeded(level: number): number;
    unarmedDamage(ch: Combatant | null | undefined): number;
    refreshVitals<T extends Combatant | null | undefined>(ch: T, fill?: boolean): T;
    incrementExperience(amount: number): string;
    createNewPlayer(): Character;
    describeBody(p: Character | null | undefined): string;

    // combat.ts
    combat: CombatState;
    MOVES: Record<string, Move>;
    ResponseCombat(title: string, tooltipText: string, opts: CombatStartOpts): LTResponse;

    // status.ts
    applyStatus(ch: Combatant | null | undefined, id: string, turns: number): void;
    // `turns` is optional: the real implementation (statusEffects.ts's
    // LT.getStatus) falls back to `rec.secondsRemaining`, which isn't
    // always set.
    getStatus(ch: Combatant | null | undefined, id: string): { id: string; turns?: number } | null | undefined;
    clearStatuses(ch: Combatant | null | undefined): void;
    apPenalty(ch: Combatant | null | undefined): number;
    consumeFlash(ch: Combatant): number;
    tickStatuses(ch: Combatant | null | undefined): string[];
    statusSummary(ch: Combatant | null | undefined): string;

    // statusEffects.ts (persistent world effects — see that interface
    // section's comment for how this relates to the combat-only bag above)
    statusIcon(name: string): string;
    worldRegionOf(world?: string | null): string;
    isInNewWorld(ch?: StatusEffectCarrier | null): boolean;
    isStormRegion(ch?: StatusEffectCarrier | null): boolean;
    isVulnerableToArcaneStorm(ch?: StatusEffectCarrier | null): boolean;
    STATUS_EFFECTS: Record<string, StatusEffectDef>;
    getStatusDef(id: string): StatusEffectDef | null;
    hasStatusEffect(ch: StatusEffectCarrier | null | undefined, id: string): boolean;
    getAppliedStatus(ch: StatusEffectCarrier | null | undefined, id: string): AppliedStatusEffect | null | undefined;
    addStatusEffect(
      ch: StatusEffectCarrier | null | undefined,
      id: string,
      duration?: number | { combatTurns?: number; secondsRemaining?: number } | null,
    ): boolean;
    removeStatusEffect(ch: StatusEffectCarrier | null | undefined, id: string): boolean;
    removeCombatStatusEffects(ch: StatusEffectCarrier | null | undefined): void;
    listStatusEffects(ch: StatusEffectCarrier | null | undefined): StatusEffectListEntry[];
    statusBonus(ch: StatusEffectCarrier | null | undefined): StatusEffectBonus;
    getRestingLust(ch: StatusEffectCarrier | null | undefined): number;
    stormDoublesEssences(ch?: StatusEffectCarrier | null): boolean;
    formatStatusDuration(seconds: number): string;
    refreshConditionalStatusEffects(ch: StatusEffectCarrier | null | undefined): void;
    tickWorldStatusEffects(ch: StatusEffectCarrier | null | undefined, seconds: number): void;
    applySleepEffect(ch: StatusEffectCarrier | null | undefined, additionalMinutes?: number): void;
    applySexEndStatusEffects(ch: StatusEffectCarrier | null | undefined, orgasmed: boolean): void;
    statusTooltip(ch: StatusEffectCarrier | null | undefined, id: string): string;
    paintStatusEffects(ch?: StatusEffectCarrier | null): void;
    serializeStatusEffects(
      ch: StatusEffectCarrier | null | undefined,
    ): Record<string, { id: string; secondsRemaining?: number; combatTurns?: number; lastApplied: number; secondsPassed?: number }>;
    applySavedStatusEffects(ch: StatusEffectCarrier | null | undefined, data: Record<string, any> | null | undefined): void;

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

    // content/bodyChanging.ts
    bodyChangingTarget?: Character | null;
    bodyChangingReturn?: string | null;
    getTrueSubspecies(ch: Character | null | undefined): string;
    isDemonTFMenu(ch?: Character | null): boolean;
    getUnableToTransformDescription(ch?: Character | null): string;
    isAbleToSelfTransform(ch?: Character | null): boolean;
    hasSpinneret(ch?: Character | null): boolean;
    hasNipples(ch?: Character | null): boolean;
    hasBreastsCrotch(ch?: Character | null): boolean;
    applyBodyChangingAct(act: string): boolean;
    openBodyChanging(ch?: Character | null, returnNode?: string | null): void;

    // content/nodes.ts
    defineNode(node: ContentNodeDef): ContentNodeDef;
    getNode(id: string): ContentNodeDef;
    hasNode(id: string): boolean;

    // content/encounters.ts
    pickWeightedEncounter(entries: EncounterEntry[]): EncounterEntry | null;
    rollEncounterTable(entries: EncounterEntry[] | null | undefined, force?: boolean): EncounterResult | null;
    encounterTableIdForPlace(placeType: string | null | undefined): string | null;
    streetEncounterEntries(): EncounterEntry[];
    parkEncounterEntries(): EncounterEntry[];
    harpyWalkwayEntries(): EncounterEntry[];
    harpyLookForTroubleEntries(): EncounterEntry[];
    generateHarpyAttacker(opts?: { feminine?: boolean; race?: any; level?: number } | null): Combatant;
    maybePlaceEncounter(opts?: { tableId?: string; force?: boolean; noRedirect?: boolean } | null): string | null;
    // Reassigned by both content/weather.ts and content/encounters.ts (the
    // latter loads after weather.ts in boot.ts, so its implementation is
    // the one actually live at runtime) — typed to accept either
    // implementation's return shape.
    maybeStormEncounter(): string | null | undefined;
    harpyExploreResponses(): LTResponse[];

    // ui/openUI.ts
    registerUI(id: string, hooks?: UISectionHooks | null): void;
    getActive(target?: string | null): string | null;
    openUI(id: string, opts?: UIOpenOpts | null): string;
    closeUI(id: string): void;
    setTitle(text?: string | null): void;
    setChrome(opts?: ChromeOpts | null): void;
    initOpenUI(): void;

    // engine/save.ts (partial — only the surface ui/menus/saveLoad.ts
    // consumes; save.ts's own internals aren't deep-typed yet)
    listSaves(): SaveEntry[];
    readSave(name: string): any;
    saveGame(name: string): void;
    exportSave(name: string): void;
    deleteSave(name: string): void;
    loadGame(name: string): void;
    importSave(file: File, onDone?: (name: string | null) => void): void;
    rememberReturn(): void;
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
