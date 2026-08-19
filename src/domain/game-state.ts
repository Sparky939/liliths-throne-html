// Complete snapshot of everything that matters
interface FullGameSnapshot {
  id: string; // Unique checkpoint ID
  timestamp: number; // When this checkpoint occurred
  label: string; // "Apply wolf transformation", "Buy item X", etc.

  // Subsystem snapshots (owned by respective subsystems)
  body: BodySnapshot;
  playerStats: PlayerStatsSnapshot;
  inventory: InventorySnapshot;
  relationships: RelationshipSnapshot;
  questState: QuestStateSnapshot;
  worldState: WorldStateSnapshot;
  resources: ResourceSnapshot;
  flags: FlagStateSnapshot;
}

// Each subsystem provides its own snapshot format
interface PlayerStatsSnapshot {
  physique: number;
  arcane: number;
  libido: number;
  corruption: number;
  stamina: number;
  level: number;
  experience: number;
  fetishLevels: Record<FetishId, number>;
}

interface InventorySnapshot {
  items: ItemStack[];
  equipment: EquipmentSlot[];
  totalCapacity: number;
}

interface WorldStateSnapshot {
  currentDay: number;
  currentTime: TimeOfDay;
  currentLocation: LocationId;
  mapUnlocks: LocationId[];
  encounterFlags: EncounterFlag[];
}

interface QuestStateSnapshot {
  activeQuests: ActiveQuest[];
  completedQuests: CompletedQuest[];
  questFlags: Record<string, QuestFlagValue>;
}

// Central history — knows nothing about individual subsystems
class GameHistory {
  private checkpoints: FullGameSnapshot[] = [];
  private currentIndex: number = -1;

  // Transaction-based workflow
  beginTransaction(label?: string): TransactionScope {
    return new TransactionScope(this, label);
  }

  commitTransaction(scope: TransactionScope): void {
    const snapshot = this.captureFullState();
    this.checkpoints.splice(this.currentIndex + 1);
    this.checkpoints.push(snapshot);
    this.currentIndex++;
  }

  rollbackTransaction(scope: TransactionScope): void {
    // Don't create checkpoint — discard pending changes
  }

  // Restore to previous state (undo/redo)
  restoreTo(index: number): boolean {
    if (index >= 0 && index < this.checkpoints.length) {
      const snapshot = this.checkpoints[index];
      this.applySnapshot(snapshot);
      this.currentIndex = index;
      return true;
    }
    return false;
  }
}

// Scoped transaction — wraps a block of operations
class TransactionScope {
  constructor(
    private history: GameHistory,
    private label: string,
  ) {
    // Pre-flight: capture pre-mutation state for rollback
    this.preMutationState = history.captureFullState();
  }

  private preMutationState: FullGameSnapshot;

  commit(): void {
    this.history.commitTransaction(this);
  }

  rollback(): void {
    this.history.rollbackTransaction(this);
  }
}

class GameState {
  player: PlayerCharacter;
  npcs: Npc[];
  world: World;
  debugMode: boolean;
  history: Historian;
}

class GameObject {
  id: string;
  uid: string;
  constructor(id: string, uid: string) {
    this.id = id;
    this.uid = uid;
  }
  snapshot() {
    if (window.game.debugMode) {
      window.game.history.logUpdate(this);
    }
  }
}
