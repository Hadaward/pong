import { CollisionType, PhysicsEntity, PhysicsEntityType } from "./entity";
import { CollisionDetector } from "./collision/detector";
import { CollisionSolver } from "./collision/solver";

export interface EngineSettings {
  gravityX: number;
  gravityY: number;
  friction: number;
}

export class Engine {
  // Using a Set to store entities.
  public entities: Set<PhysicsEntity> = new Set<PhysicsEntity>();
  public collider: CollisionDetector;
  public solver: CollisionSolver;
  public settings: EngineSettings;

  constructor(settings?: Partial<EngineSettings>) {
    this.collider = new CollisionDetector();
    this.solver = new CollisionSolver();

    // Set default settings or use provided settings.
    this.settings = {
      gravityX: settings?.gravityX ?? 0,
      gravityY: settings?.gravityY ?? 98,
      friction: settings?.friction ?? 300,
    };
  }

  // Adds an entity to the simulation.
  public addEntity(entity: PhysicsEntity): void {
    this.entities.add(entity);
  }

  // Removes an entity from the simulation.
  public removeEntity(entity: PhysicsEntity): void {
    this.entities.delete(entity);
  }
  
  // The main update step: update physics (with gravity and friction) then resolve collisions.
  public step(elapsed: number): void {
    const gx = this.settings.gravityX * elapsed;
    const gy = this.settings.gravityY * elapsed;

    // Update each entity's velocity and position.
    for (const entity of this.entities.values()) {
      if (entity.type === PhysicsEntityType.DYNAMIC) {
        // Apply acceleration and gravity.
        entity.vx += entity.ax * elapsed + gx;
        entity.vy += entity.ay * elapsed + gy;
        
        // Apply friction to horizontal velocity when there is no horizontal input.
        if (Math.abs(entity.ax) < 0.001) {
          if (entity.vx > 0) {
            entity.vx = Math.max(0, entity.vx - this.settings.friction * entity.friction * elapsed);
          } else if (entity.vx < 0) {
            entity.vx = Math.min(0, entity.vx + this.settings.friction * entity.friction * elapsed);
          }
        }
      } else if (entity.type === PhysicsEntityType.KINEMATIC) {
        // Kinematic entities update only with their own acceleration.
        entity.vx += entity.ax * elapsed;
        entity.vy += entity.ay * elapsed;
      }
      // Update the entity's position.
      entity.x += entity.vx * elapsed;
      entity.y += entity.vy * elapsed;
    }

    // Collision resolution:
    // Convert the Set of entities into an array for pairwise iteration.
    const entities = Array.from(this.entities.values());
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i];
        const entityB = entities[j];
        // Use the generic collision detection (supports rectangles and circles)
        if (this.collider.collide(entityA, entityB)) {
          entityA.onCollide?.(entityB);
          entityB.onCollide?.(entityA);

          if (entityA.collision === CollisionType.NONE || entityB.collision === CollisionType.NONE) {
            continue;
          }

          if (
            entityA.type === PhysicsEntityType.DYNAMIC &&
            entityB.type === PhysicsEntityType.KINEMATIC
          ) {
            this.solver.resolveElastic(entityA, entityB);
          } else if (
            entityB.type === PhysicsEntityType.DYNAMIC &&
            entityA.type === PhysicsEntityType.KINEMATIC
          ) {
            this.solver.resolveElastic(entityB, entityA);
          } else if (
            entityA.type === PhysicsEntityType.DYNAMIC &&
            entityB.type === PhysicsEntityType.DYNAMIC
          ) {
            // For two dynamic entities, use the impulse-based resolution.
            this.solver.resolveDynamicCollision(entityA, entityB);
          }
        }
      }
    }
  }
}