// 1. Registry for type identification (needed for polymorphic deserialization)
interface GameObjectRegistry {
  constructors: Map<any, any>;
  getConstructor(typeId: string): new (...args: any[]) => GameObject<unknown>;
  register(
    typeId: string,
    constructor: new (...args: any[]) => GameObject<unknown>,
  ): void;
}

// Global registry instance
const gameObjectRegistry: GameObjectRegistry = {
  constructors: new Map(),
  getConstructor(typeId: string) {
    const ctor = this.constructors.get(typeId);
    if (!ctor) throw new Error(`Unknown object type: ${typeId}`);
    return ctor;
  },
  register(typeId: string, ctor: new (...args: any[]) => GameObject<unknown>) {
    this.constructors.set(typeId, ctor);
  },
};

// 2. Abstract base class with generic snapshot contract
abstract class GameObject<TSnapshot extends object> {
  readonly id: string;
  readonly typeId: string;

  constructor(id: string, typeId: string) {
    this.id = id;
    this.typeId = typeId;
  }

  // Subclasses MUST override to return their specific data
  abstract toSnapshot(): TSnapshot;

  // Subclasses MUST override to restore from data
  abstract fromSnapshot(snapshot: TSnapshot): void;

  // Clone helper (creates fresh object with same data)
  clone(newId?: string): GameObject<TSnapshot> {
    const Constructor = gameObjectRegistry.getConstructor(this.typeId);
    const clone = new Constructor(newId || generateUUID(), this.typeId);
    const snapshot = this.toSnapshot();
    clone.fromSnapshot(snapshot);
    return clone;
  }

  // For history snapshots — wraps in type-aware envelope
  toHistoryEnvelope(): GameObjectSnapshotEnvelope<TSnapshot> {
    return {
      id: this.id,
      typeId: this.typeId,
      data: this.toSnapshot(),
    };
  }

  // Static factory method (used by history deserialization)
  static fromEnvelope<T extends GameObject<unknown>>(
    envelope: GameObjectSnapshotEnvelope<unknown>,
    ctor: new (...args: any[]) => GameObject<unknown>,
  ): T {
    const obj = new (ctor as any)(envelope.id, envelope.typeId);
    obj.fromSnapshot(envelope.data);
    return obj as T;
  }
}

// 3. Typed envelope for serialization
interface GameObjectSnapshotEnvelope<T extends object = object> {
  id: string;
  typeId: string;
  data: T;
  version?: number; // For schema migrations
}

// 4. Helper decorator to auto-register constructors
function registerGameObject(typeId: string): ClassDecorator {
  return function (constructor: Function) {
    const proto = constructor.prototype;
    if (
      proto instanceof GameObject ||
      (proto.constructor && proto.constructor.prototype instanceof GameObject)
    ) {
      // Extract typeid from constructor or class name
      const effectiveTypeId = typeId || proto.constructor.name.toLowerCase();
      gameObjectRegistry.register(effectiveTypeId, constructor);
    }
  };
}
