// The atomic operation — what actually changes on the body
type TransformOperation =
  | { kind: 'SET_TYPE'; part: BodyPartSlot; type: BodyPartTypeId }
  | { kind: 'RESIZE'; part: BodyPartSlot; delta: number; clamp: Range }
  | { kind: 'ADD_MODIFIER'; part: BodyPartSlot; modifier: PartModifier }
  | { kind: 'REMOVE_MODIFIER'; part: BodyPartSlot; modifier: PartModifier }
  | { kind: 'ADD_PART'; part: BodyPartSlot; type: BodyPartTypeId }
  | { kind: 'REMOVE_PART'; part: BodyPartSlot }  // shrinks to zero / type → NONE
  | { kind: 'ADJUST_FEMININITY'; delta: number }
  | { kind: 'ADJUST_MASCULINITY'; delta: number }
  | { kind: 'SET_COVERING'; part: BodyPartSlot; covering: CoveringType };

// How a potion or equipment enchantment describes what it does
interface TransformEffect {
  primaryModifier: BodyArea;        // FACE, PENIS, BREASTS, CORE, TAIL, etc.
  secondaryModifier: TransformOp;   // TYPE_CHANGE, SIZE_UP, SIZE_DOWN, ADD_MOD, REMOVE
  raceEssence?: RaceId;            // which race's parts to use
  potency: Potency;                // MINOR, REGULAR, MAJOR
  isRandom?: boolean;              // if true, pick random part from race's list
}

class Transformation implements TransformationEntry {
  id: string;
  name: string;
  targetFeatures: FeatureEntry[];

  constructor(
    id: string,
    name: string,
    targetFeatures: FeatureEntry[],
  ) {
    this.id = id;
    this.name = name;
    this.targetFeatures = targetFeatures;
  }
  applyToCharacter(character: Character): Character {
    return character;
  }
