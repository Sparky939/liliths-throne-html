interface NameEntry {
  masculine: string;
  feminine: string;
  neutral: string;
  surname: string;
}

interface GenderEntry {
  hasPenis: boolean;
  hasVagina: boolean;
  hasBreasts: boolean;
  femininity: number;
}

interface SpeciesEntry {
  id: string;
  name: string;
  description: string;
  fem: string;
  masc: string;
  tags: string[];
}

interface BodyPartSlotEntry {}

class Gender implements GenderEntry {
  hasPenis: boolean;
  hasVagina: boolean;
  hasBreasts: boolean;
  femininity: number;

  constructor(
    hasPenis: boolean,
    hasVagina: boolean,
    hasBreasts: boolean,
    femininity: number,
  ) {
    this.hasPenis = hasPenis;
    this.hasVagina = hasVagina;
    this.hasBreasts = hasBreasts;
    this.femininity = femininity;
  }
}

interface OrientationEntry {
  mascPhilia: number;
  femPhilia: number;
  transMascPhilia: number;
  transFemPhilia: number;
  nbFemPhilia: number;
  nbMascPhilia: number;
}

interface PersonalityEntry {
  traits: string[];
}

interface CombatStatsEntry {
  level: number;
  physique: number;
  arcane: number;
  corruption: number;
  health: number;
  stamina: number;
  mana: number;
  arousal: number;
  lust: number;
  essences: number;
  knownSpells: string[];
}

interface InventoryEntry {
  items: Item[];
  money: number;
}

type MapPath = string[];

interface LocationEntry {
  mapPath: MapPath;
  x: number;
  y: number;
}

class Location implements LocationEntry {
  mapPath: MapPath;
  x: number;
  y: number;

  constructor(mapPath: MapPath, x: number, y: number) {
    this.mapPath = mapPath;
    this.x = x;
    this.y = y;
  }
  isValid(): boolean {
    return false;
  }
}

// Enum to do
interface FeatureEntry {
  id: string;
  name: string;
  // description is a id to the feature-description creator
  description: string;
  size: number;
  count: number;
}

interface CharacterEntry {
  id: string;
  names: NameEntry;
  gender: GenderEntry;
  orientation: OrientationEntry;
  personality: PersonalityEntry;
  birthday: Date;
  combatStats: CombatStatsEntry;
  inventory: InventoryEntry;
  features: FeatureEntry[];
}

class Character implements CharacterEntry {
  id: string;
  names: NameEntry;
  gender: Gender;
  orientation: OrientationEntry;
  personality: PersonalityEntry;

  constructor(
    id: string,
    names: NameEntry,
    gender: Gender,
    orientation: OrientationEntry,
    personality: PersonalityEntry,
  ) {
    this.id = id;
    this.names = names;
    this.gender = gender;
    this.orientation = orientation;
    this.personality = personality;
  }
  whereAmI(): Location {}
}
class Npc extends Character {
  affinity: number;
  partners: string[];
  children: string[];
  // base npcs may not have parents
  parents: { mother: string; father: string } | null;
}

class PlayerCharacter extends Character {
    consumeItem(item: Item) {

    }
    transform(transformation: )
}
