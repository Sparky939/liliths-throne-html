Lilith's Throne TypeScript Migration: Developer GuideVersion: 1.0
Target Audience: New and existing contributors
Last Updated: August 2026

Table of Contents

Overview
Original LT Architecture
TypeScript Target Architecture
GameObject Hierarchy
Core Systems Implementation
Getting Started
Contributor Guidelines


1. Overview
Project Goal
Migrate Lilith's Throne from Java/JavaFX to TypeScript/browser while:

Preserving all existing content (dialogue, assets, characters)
Improving type safety and maintainability
Supporting modding with a stable public API
Enabling time-travel debugging via full game history

Key Decisions Made
DecisionRationaleClass-based domain entitiesMatches original Java code; easier team adoptionFunctional transformation logicPure functions for testabilityCentralized GameHistoryAtomic snapshots across all subsystemsGeneric GameObject<T>DRY pattern for serialization/deserializationTransactional mutationsConsistent state even on failure

2. Original LT Architecture
2.1 Core Game Loop// Pseudocode of original Java game loop
while (gameRunning) {
    processInput();
    updateGameLogic();     // Transformations, combat, encounters
    renderScreen();        // JavaFX UI
    flushEvents();         // Dialogue, notifications
}2.2 Body System Architecture
LT models the body as independent body part objects, each with a type and attributes:Character
└── Body
    ├── Arm       → type: ArmType (HUMAN, DEMON, WOLF, SPIDER...)
    ├── Leg       → type: LegType (BIPEDAL, TAUR, ARACHNID, HOOFED...)
    ├── Penis     → type: PenisType + length + girth + modifiers[]
    ├── Vagina    → type: VaginaType + capacity + modifiers[]
    ├── Tail[]    → multiple tails possible
    ├── Horn[]    → up to 3 rows
    ├── Antenna[] → up to 3 rows
    ├── Wing[]    → size tracked
    ├── Breast[]  → multiple rows possible
    ├── Face      → determines muzzle/snout
    ├── Ear, Eye, Hair, Torso, Ass, Anus, Mouth, Tongue...
    └── FluidCum, FluidMilk, FluidGirlCumKey Insight: Race is derived from body part types, not stored as a simple field. The game calculates race by weighing which race's parts dominate.
2.3 Transformation System
Transformations work in three layers:
Layer 1: Per-Part Type Swapping// Original Java pattern (simplified)
body.getArm().setType(character, ArmType.WOLF_MORPH);
body.getLeg().setType(character, LegType.WOLF_MORPH);Layer 2: Effect Composition (Enchanting)
Potions/equipment carry enchantment effects with:

Primary Modifier: Which body part to target (FACE, PENIS, CORE, TAIL...)
Secondary Modifier: What operation to perform (TYPE_CHANGE, SIZE_UP, ADD_MODIFIER...)
Potency: How strong (MINOR/REGULAR/MAJOR = WEEKLY/DAILY/HOURLY)
Potion Effect Structure:
├── Primary: PENIS
├── Secondary: GIRTH_INCREASE
├── Race Essence: WOLF_MORPH (if type change)
├── Potency: MAJOR (applies hourly)
└── Source: ENCHANTED_EQUIPMENT vs CONSUMABLE_POTIONLayer 3: Application Modes
ModeDescriptionExampleDirect MenuPlayer selects exact part → exact changeTransform Menu → Arms → WolfRandom PotionGame picks one random part from race's listDrink Wolf Essence → random wolf featureSpecified PotionEnchanter sets primary/secondary modifiersCraft: Penis + Knotted ModifierEquipment TickSlow changes over time (daily/hourly)Wear Growth Shirt → breasts increase weeklyForced TFCombat loss triggers predefined effectsDefeated by Brax → wolf transformation
2.4 Immunity & Constraints
ConstraintRuleDemon ImmunityDemons cannot have body part types changed by potions/equipmentSize ClampingAll dimensions have min/max bounds; shrinking past minimum removes the partRace DerivationAfter any transformation, race is recalculated from part weightingsGender SeparationMasculinity/femininity sliders affect appearance but are independent from race
2.5 Modding API (Original)
Mods in the Java version extend via:

Adding new Race enum entries
Registering new Item definitions
Hooking into dialogue events
Using reflection to access internal APIs (fragile)

Target for TS: Provide typed, version-stable public API without exposing internals.

3. TypeScript Target Architecture
3.1 Folder Structuresrc/
├── domain/                     # Pure business logic (ZERO external deps)
│   ├── types/                  # Type definitions only
│   │   ├── body-state.types.ts
│   │   ├── character.types.ts
│   │   ├── transform.types.ts
│   │   └── race.types.ts
│   ├── entities/               # Domain objects with identity
│   │   ├── Character.ts
│   │   ├── Body.ts
│   │   ├── BodyPart.ts
│   │   ├── Item.ts
│   │   └── NPC.ts
│   ├── rules/                  # Pure validation/calculations
│   │   ├── transformation-rules.ts
│   │   ├── damage-calculation.ts
│   │   └── stat-calculations.ts
│   └── events/                 # Domain event definitions
│       ├── TransformationApplied.ts
│       └── ItemConsumed.ts
│
├── core/                       # Infrastructure + orchestration
│   ├── services/               # Transaction coordinators
│   │   ├── TransformationService.ts
│   │   ├── SaveLoadService.ts
│   │   ├── QuestService.ts
│   │   └── CombatService.ts
│   ├── repositories/           # Data access abstraction
│   │   ├── CharacterRepository.ts
│   │   ├── ItemRepository.ts
│   │   └── WorldRepository.ts
│   ├── infrastructure/         # External integrations
│   │   ├── EventBus.ts
│   │   ├── GameHistory.ts      # Centralized time-travel
│   │   ├── GameLoop.ts
│   │   └── LocalStorageAdapter.ts
│   └── persistence/            # Serialization
│       ├── GameStateSerializer.ts
│       └── migrations/
│
├── ui/                         # Rendering + user interaction
│   ├── components/             # Reusable UI pieces
│   ├── views/                  # Screen layouts
│   └── controllers/            # Input handling
│
├── mod-api/                    # Stable public surface for modders
│   ├── types.ts                # Exported type declarations
│   ├── index.ts                # Public functions
│   └── loader.ts               # Mod loading + sandboxing
│
├── data/                       # Content layer (from LubricatedKitty fork)
│   ├── dialogue/
│   ├── items/
│   ├── races/
│   └── assets/
│
└── main.ts                     # App bootstrap3.2 Dependency Rules┌─────────────┐
│    ui/      │  Can import: core/, domain/, data/
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   core/     │  Can import: domain/, data/
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  domain/    │  Can import: NOTHING (pure TS)
└─────────────┘Golden Rule: domain/ never knows about core/. Business logic is pure and testable without mocks.

4. GameObject Hierarchy
4.1 Base Class Design// domain/entities/game-object.ts

/**
 * Abstract base class for all serializable game objects.
 * Uses generics for type-safe snapshot contracts.
 */
export abstract class GameObject<TSnapshot extends object> {
  readonly id: string;
  readonly typeId: string;

  constructor(id: string, typeId: string) {
    this.id = id;
    this.typeId = typeId;
  }

  /**
   * Serialize current state to snapshot data.
   * Subclasses MUST override.
   */
  abstract toSnapshot(): TSnapshot;

  /**
   * Restore state from snapshot data.
   * Subclasses MUST override.
   */
  abstract fromSnapshot(snapshot: TSnapshot): void;

  /**
   * Clone this object (creates deep copy).
   */
  clone(newId?: string): GameObject<TSnapshot> {
    const Constructor = gameObjectRegistry.getConstructor(this.typeId);
    const clone = new Constructor(newId || generateUUID(), this.typeId);
    const snapshot = this.toSnapshot();
    clone.fromSnapshot(snapshot);
    return clone;
  }

  /**
   * Wrap snapshot in type-aware envelope for history.
   */
  toHistoryEnvelope(): GameObjectSnapshotEnvelope<TSnapshot> {
    return {
      id: this.id,
      typeId: this.typeId,
      data: this.toSnapshot(),
      version: (this.constructor as typeof GameObject).SNAPSHOT_VERSION,
    };
  }
}

/**
 * Registry mapping typeId → constructor
 */
export const gameObjectRegistry = {
  constructors: new Map<string, new (...args: any[]) => GameObject<unknown>>(),

  register(
    typeId: string,
    ctor: new (...args: any[]) => GameObject<unknown>
  ): void {
    this.constructors.set(typeId, ctor);
  },

  getConstructor(
    typeId: string
  ): new (...args: any[]) => GameObject<unknown> {
    const ctor = this.constructors.get(typeId);
    if (!ctor) {
      throw new Error(`Unknown object type: ${typeId}`);
    }
    return ctor;
  },
};

/**
 * Decorator for auto-registration
 */
export function registerGameObject(typeId: string): ClassDecorator {
  return function (constructor: Function) {
    const typeIdKey = typeId || constructor.name.toLowerCase();
    gameObjectRegistry.register(typeIdKey, constructor as any);
  };
}4.2 Snapshot Envelope// domain/types/snapshot-envelope.ts

export interface GameObjectSnapshotEnvelope<T extends object = object> {
  id: string;
  typeId: string;
  data: T;
  version: number;
}4.3 Example: Arm Class// domain/entities/arm.ts

import { GameObject, registerGameObject } from './game-object';
import { ArmType, armTypeRegistry } from '../types/race.types';
import { Modifier, modifierRegistry } from '../types/body-state.types';
import { Covering } from './covering';

@registerGameObject('arm')
export class Arm extends GameObject<ArmSnapshotData> {
  static SNAPSHOT_VERSION = 1;

  type: ArmType;
  row: number;
  modifiers: Modifier[];
  skinCoverage: Covering;

  constructor(
    id: string,
    typeId: string,
    initialState?: Partial<Omit<Arm, 'id' | 'typeId'>>
  ) {
    super(id, typeId);
    this.type = initialState?.type ?? ArmType.DEFAULT;
    this.row = initialState?.row ?? 1;
    this.modifiers = [...(initialState?.modifiers ?? [])];
    this.skinCoverage = initialState?.skinCoverage ?? new Covering();
  }

  toSnapshot(): ArmSnapshotData {
    return {
      type: this.type.id,
      row: this.row,
      modifiers: this.modifiers.map((m) => m.id),
      skinCoverage: this.skinCoverage.toJSON(),
    };
  }

  fromSnapshot(snapshot: ArmSnapshotData): void {
    this.type = armTypeRegistry.get(snapshot.type);
    this.row = snapshot.row;
    this.modifiers = snapshot.modifiers.map((id) => modifierRegistry.get(id));
    this.skinCoverage.fromJSON(snapshot.skinCoverage);
  }

  // Business logic methods
  setType(newType: ArmType): void {
    this.type = newType;
  }

  addModifier(modifier: Modifier): void {
    if (!this.modifiers.includes(modifier)) {
      this.modifiers.push(modifier);
    }
  }

  removeModifier(modifier: Modifier): void {
    this.modifiers = this.modifiers.filter((m) => m !== modifier);
  }
}

/**
 * Snapshot data interface (pure data, no methods)
 */
export interface ArmSnapshotData {
  type: string;        // ArmType ID
  row: number;
  modifiers: string[]; // Modifier IDs
  skinCoverage: CoveringJSON;
}

interface CoveringJSON {
  type: string;
  color: string;
  // ... other fields
}4.4 Example: Body Class (Composite)// domain/entities/body.ts

import { GameObject, registerGameObject } from './game-object';
import { Arm, ArmSnapshotData } from './arm';
import { Leg, LegSnapshotData } from './leg';
import { Penis, PenisSnapshotData } from './penis';
import { Vagina, VaginaSnapshotData } from './vagina';
import { DerivedFeatures, calculateDerivedFeatures } from '../rules/stat-calculations';
import { BodyStateSnapshot } from '../types/body-state.types';

@registerGameObject('body')
export class Body extends GameObject<BodySnapshotData> {
  static SNAPSHOT_VERSION = 1;

  // Part containers
  arm: Arm;
  leg: Leg;
  penis: Penis;
  vagina: Vagina;
  tails: Tail[];
  horns: Horn[];
  antennae: Antenna[];
  wings: Wing[];

  // Computed (re-calculated after mutations)
  derivedFeatures: DerivedFeatures;

  constructor(id: string, typeId: string, initialState?: Partial<Body>) {
    super(id, typeId);
    this.arm = initialState?.arm ?? new Arm(generateUUID(), 'arm');
    this.leg = initialState?.leg ?? new Leg(generateUUID(), 'leg');
    this.penis = initialState?.penis ?? new Penis(generateUUID(), 'penis');
    this.vagina = initialState?.vagina ?? new Vagina(generateUUID(), 'vagina');
    this.tails = initialState?.tails ?? [];
    this.horns = initialState?.horns ?? [];
    this.antennae = initialState?.antennae ?? [];
    this.wings = initialState?.wings ?? [];
    this.derivedFeatures = initialState?.derivedFeatures ?? {
      height: 170,
      weight: 65,
      voicePitch: 1.0,
      skinTexture: SkinTexture.HUMAN,
    };
  }

  toSnapshot(): BodySnapshotData {
    return {
      parts: {
        arm: this.arm.toSnapshot(),
        leg: this.leg.toSnapshot(),
        penis: this.penis.toSnapshot(),
        vagina: this.vagina.toSnapshot(),
        tails: this.tails.map((t) => t.toSnapshot()),
        horns: this.horns.map((h) => h.toSnapshot()),
        antennae: this.antennae.map((a) => a.toSnapshot()),
        wings: this.wings.map((w) => w.toSnapshot()),
      },
      derivedFeatures: this.derivedFeatures,
    };
  }

  fromSnapshot(snapshot: BodySnapshotData): void {
    this.arm.fromSnapshot(snapshot.parts.arm);
    this.leg.fromSnapshot(snapshot.parts.leg);
    this.penis.fromSnapshot(snapshot.parts.penis);
    this.vagina.fromSnapshot(snapshot.parts.vagina);
    this.tails = snapshot.parts.tails.map((s) => {
      const tail = new Tail(generateUUID(), 'tail');
      tail.fromSnapshot(s);
      return tail;
    });
    this.horns = snapshot.parts.horns.map((s) => {
      const horn = new Horn(generateUUID(), 'horn');
      horn.fromSnapshot(s);
      return horn;
    });
    this.antennae = snapshot.parts.antennae.map((s) => {
      const antenna = new Antenna(generateUUID(), 'antenna');
      antenna.fromSnapshot(s);
      return antenna;
    });
    this.wings = snapshot.parts.wings.map((s) => {
      const wing = new Wing(generateUUID(), 'wing');
      wing.fromSnapshot(s);
      return wing;
    });
    this.derivedFeatures = snapshot.derivedFeatures;
  }

  // Mutation with automatic recalculation
  setType(partName: PartSlot, newType: BodyPartTypeId): string {
    // Get the part
    const part = this.getPartByName(partName);
    part.setType(newType);

    // Recalculate derived features
    this.derivedFeatures = calculateDerivedFeatures(this);

    // Generate description
    return generateTransformationDescription(partName, newType);
  }

  private getPartByName(name: PartSlot): GameObject<any> {
    switch (name) {
      case 'ARM': return this.arm;
      case 'LEG': return this.leg;
      case 'PENIS': return this.penis;
      case 'VAGINA': return this.vagina;
      // ... other parts
    }
  }

  recalculateDerivedFeatures(): void {
    this.derivedFeatures = calculateDerivedFeatures(this);
  }
}

export interface BodySnapshotData {
  parts: {
    arm: ArmSnapshotData;
    leg: LegSnapshotData;
    penis: PenisSnapshotData;
    vagina: VaginaSnapshotData;
    tails: TailSnapshot[];
    horns: HornSnapshot[];
    antennae: AntennaSnapshot[];
    wings: WingSnapshot[];
  };
  derivedFeatures: DerivedFeatures;
}
5. Core Systems Implementation
5.1 Game History (Centralized)// core/infrastructure/game-history.ts

import { GameObject, GameObjectSnapshotEnvelope } from '../../domain/entities/game-object';
import { Body } from '../../domain/entities/body';
import { PlayerStatsSnapshot } from '../../domain/types/character.types';
import { InventorySnapshot } from '../../domain/types/inventory.types';

/**
 * Full game state snapshot
 */
export interface FullGameSnapshot {
  id: string;
  timestamp: number;
  label: string;

  // Subsystem snapshots
  body: Body;
  stats: PlayerStatsSnapshot;
  inventory: InventorySnapshot;
  relationships: Record<string, number>;
  worldState: WorldStateSnapshot;
}

/**
 * History checkpoint
 */
export interface Checkpoint {
  id: string;
  timestamp: number;
  label: string;
  preState: FullGameSnapshot;
  postState: FullGameSnapshot;
}

export class GameHistory {
  private checkpoints: Checkpoint[] = [];
  private currentIndex: number = -1;
  private readonly maxDepth: number = 200;

  constructor(private body: Body) {}

  /**
   * Begin a transaction scope
   */
  beginTransaction(label: string): TransactionScope {
    return new TransactionScope(this, label);
  }

  /**
   * Commit a transaction (create checkpoint)
   */
  commit(scope: TransactionScope): void {
    const checkpoint: Checkpoint = {
      id: generateUUID(),
      timestamp: Date.now(),
      label: scope.label,
      preState: scope.preState,
      postState: this.captureCurrentState(),
    };

    // Remove future checkpoints if rewinding
    this.checkpoints.splice(this.currentIndex + 1);
    this.checkpoints.push(checkpoint);
    this.currentIndex++;

    // Trim old history
    if (this.checkpoints.length > this.maxDepth) {
      this.checkpoints.shift();
      this.currentIndex--;
    }
  }

  /**
   * Restore to previous checkpoint (undo)
   */
  undo(): boolean {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.restoreCheckpoint(this.checkpoints[this.currentIndex]);
      return true;
    }
    return false;
  }

  /**
   * Redo after undo
   */
  redo(): boolean {
    if (this.currentIndex < this.checkpoints.length - 1) {
      this.currentIndex++;
      this.restoreCheckpoint(this.checkpoints[this.currentIndex]);
      return true;
    }
    return false;
  }

  /**
   * Jump to specific checkpoint (for debugging)
   */
  goToCheckpoint(index: number): boolean {
    if (index >= 0 && index < this.checkpoints.length && index !== this.currentIndex) {
      this.currentIndex = index;
      this.restoreCheckpoint(this.checkpoints[index]);
      return true;
    }
    return false;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getTotalCheckpoints(): number {
    return this.checkpoints.length;
  }

  exportForDebug(): DebugHistoryExport {
    return {
      currentCheckpoint: this.currentIndex,
      totalCheckpoints: this.checkpoints.length,
      entries: this.checkpoints.map((cp) => ({
        id: cp.id,
        label: cp.label,
        timestamp: cp.timestamp,
      })),
    };
  }

  private captureCurrentState(): FullGameSnapshot {
    return {
      id: generateUUID(),
      timestamp: Date.now(),
      label: 'Current State',
      body: this.body.clone(),
      stats: this.captureStats(),
      inventory: this.captureInventory(),
      relationships: this.captureRelationships(),
      worldState: this.captureWorldState(),
    };
  }

  private restoreCheckpoint(checkpoint: Checkpoint): void {
    this.body.fromSnapshot(checkpoint.preState.body.toSnapshot());
    // Restore other subsystems similarly
  }

  // Placeholder methods - implement per your actual data model
  private captureStats(): PlayerStatsSnapshot { throw new Error('Implement'); }
  private captureInventory(): InventorySnapshot { throw new Error('Implement'); }
  private captureRelationships(): Record<string, number> { throw new Error('Implement'); }
  private captureWorldState(): WorldStateSnapshot { throw new Error('Implement'); }
}

/**
 * Transaction scope class
 */
export class TransactionScope {
  preState: FullGameSnapshot;

  constructor(
    private history: GameHistory,
    public label: string
  ) {
    this.preState = this.captureInitialState();
  }

  commit(): void {
    this.history.commit(this);
  }

  rollback(): void {
    // Do nothing - don't create checkpoint
  }

  private captureInitialState(): FullGameSnapshot {
    return this.history.captureCurrentState();
  }
}

export interface DebugHistoryExport {
  currentCheckpoint: number;
  totalCheckpoints: number;
  entries: {
    id: string;
    label: string;
    timestamp: number;
  }[];
}

export interface WorldStateSnapshot {
  currentDay: number;
  currentTime: number;
  currentLocation: string;
  mapUnlocks: string[];
}5.2 Transformation Service// core/services/transformation-service.ts

import { Character } from '../../domain/entities/character';
import { Body } from '../../domain/entities/body';
import { TransformEffect, TransformEffectType } from '../../domain/types/transform.types';
import { GameHistory } from '../infrastructure/game-history';
import { EventBus } from '../infrastructure/event-bus';
import { canApplyTransformation } from '../../domain/rules/transformation-rules';

/**
 * Orchestrates all transformation logic
 */
export class TransformationService {
  constructor(
    private history: GameHistory,
    private eventBus: EventBus
  ) {}

  /**
   * Apply a single transformation effect
   */
  applyTransformation(character: Character, effect: TransformEffect): Result {
    const scope = this.history.beginTransaction(`Transform: ${effect.name}`);

    try {
      // 1. Validate
      const validation = canApplyTransformation(character, effect);
      if (!validation.valid) {
        scope.rollback();
        return { success: false, error: validation.reason };
      }

      // 2. Apply to body
      const description = this.resolveAndApply(effect, character.body);

      // 3. Recalculate derived features
      character.body.recalculateDerivedFeatures();

      // 4. Commit
      scope.commit();

      // 5. Emit event
      this.eventBus.emit('TRANSFORMATION_APPLIED', {
        characterId: character.id,
        effect,
        description,
        checkpointIndex: this.history.getCurrentIndex(),
      });

      return { success: true, description };
    } catch (err) {
      scope.rollback();
      console.error('Transformation failed:', err);
      throw err;
    }
  }

  /**
   * Apply multiple effects atomically
   */
  applyBatchTransformations(character: Character, effects: TransformEffect[]): Result {
    const scope = this.history.beginTransaction(`Batch: ${effects.length} transformations`);

    try {
      const descriptions: string[] = [];

      for (const effect of effects) {
        const desc = this.resolveAndApply(effect, character.body);
        descriptions.push(desc);
      }

      character.body.recalculateDerivedFeatures();
      scope.commit();

      this.eventBus.emit('BATCH_TRANSFORMATION_APPLIED', {
        characterId: character.id,
        effects,
        descriptions,
        checkpointIndex: this.history.getCurrentIndex(),
      });

      return { success: true, description: descriptions.join('\n') };
    } catch (err) {
      scope.rollback();
      throw err;
    }
  }

  private resolveAndApply(effect: TransformEffect, body: Body): string {
    switch (effect.type) {
      case TransformEffectType.SET_TYPE:
        return body.setType(effect.part, effect.newType);

      case TransformEffectType.RESIZE:
        return this.applyResize(body, effect);

      case TransformEffectType.ADD_MODIFIER:
        return this.applyAddModifier(body, effect);

      default:
        throw new Error(`Unknown effect type: ${effect.type}`);
    }
  }

  private applyResize(body: Body, effect: ResizeEffect): string {
    const part = body.getPartByName(effect.part);
    part.resize(effect.delta);
    return `${effect.part} size adjusted by ${effect.delta}`;
  }

  private applyAddModifier(body: Body, effect: AddModifierEffect): string {
    const part = body.getPartByName(effect.part);
    part.addModifier(effect.modifier);
    return `${effect.modifier.name} added to ${effect.part}`;
  }
}

interface Result {
  success: boolean;
  description?: string;
  error?: string;
}5.3 Event Bus// core/infrastructure/event-bus.ts

export type EventHandler<T extends GameEvent = GameEvent> = (event: T) => void;

export type GameEvent =
  | { type: 'TRANSFORMATION_APPLIED'; characterId: string; description: string }
  | { type: 'ITEM_CONSUMED'; itemId: string; quantity: number }
  | { type: 'QUEST_COMPLETED'; questId: string };

export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  on<E extends GameEvent>(eventType: E['type'], handler: EventHandler<E>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => this.off(eventType, handler as EventHandler);
  }

  off<E extends GameEvent>(eventType: E['type'], handler: EventHandler<E>): void {
    this.listeners.get(eventType)?.delete(handler as EventHandler);
  }

  emit<E extends GameEvent>(event: E): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach((h) => h(event));
    }
  }
}
6. Getting Started
6.1 Prerequisites# Install Node.js 18+ and npm
node --version   # Should show v18+
npm --version    # Should show v9+6.2 Initial Setup# Clone the repository
git clone https://github.com/your-team/liliths-throne-ts.git
cd liliths-throne-ts

# Install dependencies
npm install

# Initialize git hooks (optional, for linting on commit)
npm run prepare

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build6.3 First Contribution Workflow

Fork the repo on GitHub
Create a feature branch:
   git checkout -b feat/add-arm-transformation
   ```
3. **Make your changes** (follow contributor guidelines below)
4. **Run lint + tests**:
   ```bash
   npm run lint
   npm run test
   ```
5. **Commit with conventional message**:
   ```bash
   git commit -m "feat(domain): add arm transformation logic"
   ```
6. **Push and open PR**:
   ```bash
   git push origin feat/add-arm-transformation
   ```

### 6.4 Your First Task Examples

| Difficulty | Task | Files to Touch |
|---|---|---|
| Beginner | Add a new body part type (e.g., Spider Arm) | `domain/types/race.types.ts`, `domain/entities/spider-arm.ts` |
| Intermediate | Implement a new transformation potion effect | `domain/types/transform.types.ts`, `core/services/transformation-service.ts` |
| Advanced | Add mod API endpoint for custom transformation registration | `mod-api/index.ts`, `mod-api/loader.ts` |
| Expert | Implement differential snapshots for reduced memory usage | `core/infrastructure/game-history.ts` |

---

## 7. Contributor Guidelines

### 7.1 Code Stylebash
Use Prettier for formatting
npm run format
Use ESLint for linting
npm run lint
Run before every commit (auto-fixed issues)
npm run lint -- --fix
**Naming Conventions:**

| Element | Convention | Example |
|---|---|---|
| **Classes** | PascalCase | `TransformationService` |
| **Functions** | camelCase | `applyTransformation()` |
| **Interfaces/Types** | PascalCase | `TransformEffect` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_HISTORY_DEPTH` |
| **Private members** | underscore prefix | `_history: GameHistory` |
| **Test files** | `.test.ts` suffix | `transformation-service.test.ts` |

### 7.2 Testing Requirements

| Change Type | Minimum Tests |
|---|---|
| New entity/class | Unit tests for all public methods |
| New business rule | Unit tests for edge cases |
| New service integration | Integration tests for key flows |
| UI component change | Visual regression tests |

**Example Test:**typescript
// domain/rules/transformation-rules.test.ts
import { canApplyTransformation } from './transformation-rules';
import { Character } from '../entities/character';
import { TransformEffect, TransformEffectType } from '../types/transform.types';
describe('canApplyTransformation', () => {
it('should deny demon body part transformation', () => {
const demon = new Character('demon-1', 'demon');
const effect: TransformEffect = {
type: TransformEffectType.SET_TYPE,
part: 'ARM',
newType: 'WOLF_ARM',
};
const result = canApplyTransformation(demon, effect);

expect(result.valid).toBe(false);
expect(result.reason).toContain('immune');

});
it('should allow human transformation', () => {
const human = new Character('human-1', 'human');
const effect: TransformEffect = {
type: TransformEffectType.SET_TYPE,
part: 'ARM',
newType: 'WOLF_ARM',
};
const result = canApplyTransformation(human, effect);

expect(result.valid).toBe(true);

});
});
### 7.3 Documentation Requirements

Every public API method should have JSDoc:typescript
/**

Applies a transformation effect to the character's body.

@param character - The target character
@param effect - The transformation effect to apply
@returns Result object with success status and description

@throws {ValidationError} If the transformation cannot be applied

@example

 * const result = transformationService.applyTransformation(
 *   player,
 *   { type: TransformEffectType.SET_TYPE, part: 'ARM', newType: 'WOLF_ARM' }
 * );
 * if (result.success) {
 *   console.log(result.description); // "Your arms become wolf-like."
 * }
 * ```
 */
applyTransformation(
  character: Character,
  effect: TransformEffect
): Result {
  // ...
}7.4 Common Pitfalls
MistakeCorrectionImporting core/ from domain/Move logic to core/ or extract to shared utilsMutable state without snapshotsAlways wrap mutations in beginTransaction()Hardcoding IDsUse constants or registry lookupsNo error handlingWrap in try/catch with proper rollbackSkipping testsAdd unit tests for all new public APIsBreaking mod APIVersion any breaking changes in mod-api/types.ts
7.5 Migration Checklist
When porting from Java, verify:

 Type mapping correct (Java enum → TS enum or union type)
 Null handling explicit (Java nullable → TS T | undefined)
 Serialization format compatible with original saves
 Event names match for mod compatibility
 Dialogue strings unchanged
 Asset paths preserved


Appendix A: Quick Reference
Common Imports// Domain types
import { BodyState } from '@/domain/types/body-state.types';
import { TransformEffect } from '@/domain/types/transform.types';

// Domain entities
import { Character } from '@/domain/entities/character';
import { Body } from '@/domain/entities/body';

// Core services
import { TransformationService } from '@/core/services/transformation-service';
import { GameHistory } from '@/core/infrastructure/game-history';

// Mod API
import { getTransformationHistory } from '@/mod-api/public';Path Aliases (tsconfig.json){
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/domain/*": ["./src/domain/*"],
      "@/core/*": ["./src/core/*"],
      "@/ui/*": ["./src/ui/*"],
      "@/mod-api/*": ["./src/mod-api/*"],
      "@/data/*": ["./src/data/*"]
    }
  }
}
Appendix B: Glossary
TermDefinitionBody PartIndividual anatomical component (Arm, Leg, Penis, etc.)TypeThe race/species classification of a body part (HUMAN, WOLF, DEMON)ModifierQualitative enhancement (KNOTTED, RIBBED, TENTACLED)EffectTransformation instruction (primary + secondary modifier)CheckpointFull game state snapshot at a point in timeTransactionAtomic operation wrapping pre/post snapshotsSnapshotSerialized state of an object or entire gameEnvelopeType-aware wrapper for snapshots (includes typeId)

Appendix C: Troubleshooting
ProblemSolutionType errors on buildRun npm run build to see full error logTests failing silentlyRun npm run test -- --verboseHistory not restoringCheck that fromSnapshot() is called on all objectsMod API not loadingEnsure mod-api/loader.ts scans correct directorySerialization mismatchVerify SNAPSHOT_VERSION matches between client and server

Support

Documentation issues: Open an issue on GitHub
Implementation questions: Join the Discord (link in README)
Bug reports: Include reproduction steps and error logs
Feature requests: Tag with enhancement label


Happy coding! 🎮✨
This guide is a living document. If you find gaps or improvements, contribute a PR.