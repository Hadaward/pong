import { PhysicsEntity, EntityShape, PhysicsEntityType } from "../entity";
import { clamp } from "../util";
import { CollisionDetector } from "./detector";

const STICKY_THRESHOLD = 0.0004;

export class CollisionSolver {
  /**
   * Generic resolve method that loops over collisions.
   */
  public resolve(entity: PhysicsEntity, collisions: PhysicsEntity[]): void {
    collisions.forEach(other => {
      // If both are dynamic, use dynamic resolution; otherwise, use elastic.
      if (entity.type === PhysicsEntityType.DYNAMIC && other.type === PhysicsEntityType.DYNAMIC) {
        this.resolveDynamicCollision(entity, other);
      } else {
        this.resolveElastic(entity, other);
      }
    });
  }

  /**
   * resolveElastic: Separates (with positional correction) and then reflects velocity.
   * In case a moving dynamic circle (the ball) collides with a kinematic rectangle (the racket)
   * we use a stronger correction and, if necessary, force the ball out.
   */
  public resolveElastic(movingEntity: PhysicsEntity, otherEntity: PhysicsEntity): void {
    const manifold = this.getManifold(movingEntity, otherEntity);
    if (!manifold) return;
    
    // Determine a correction factor.
    // If the collision is between a circle and a rectangle where the rectangle is kinematic,
    // use full (or slightly over) correction to avoid the ball getting stuck.
    let correctionFactor = 1.0;
    if (otherEntity.type === PhysicsEntityType.KINEMATIC && movingEntity.shape === EntityShape.CIRCLE && otherEntity.shape === EntityShape.RECTANGLE) {
      correctionFactor = 1.5; // Increase as needed.
    } else if (movingEntity.shape === EntityShape.CIRCLE || otherEntity.shape === EntityShape.CIRCLE) {
      correctionFactor = 0.5;
    }
  
    // Positional correction.
    movingEntity.x += manifold.nx * manifold.penetration * correctionFactor;
    movingEntity.y += manifold.ny * manifold.penetration * correctionFactor;
  
    // Reflect velocity along the collision normal.
    movingEntity.vx = -movingEntity.vx * otherEntity.restitution;
    movingEntity.vy = -movingEntity.vy * otherEntity.restitution;
  
    if (Math.abs(movingEntity.vx) < STICKY_THRESHOLD) {
      movingEntity.vx = 0;
    }
    if (Math.abs(movingEntity.vy) < STICKY_THRESHOLD) {
      movingEntity.vy = 0;
    }
  
    // Extra check for dynamic (ball) vs kinematic (racket) collisions:
    // If after resolution the ball is still overlapping the paddle, forcibly reposition it.
    if (otherEntity.type === PhysicsEntityType.KINEMATIC &&
        movingEntity.shape === EntityShape.CIRCLE &&
        this.isStillColliding(movingEntity, otherEntity)) {
      // Place the ball flush with the paddle's edge.
      // For example, if the ball's center is to the left of the paddle's center, place
      // the ball completely to the left of the paddle.
      if (movingEntity.getMidX() < otherEntity.getMidX()) {
        movingEntity.x = otherEntity.getLeft() - movingEntity.width;
      } else {
        movingEntity.x = otherEntity.getRight();
      }
    }
  }

  /**
   * resolveDisplacement: Similar to resolveElastic except that the velocity is zeroed out.
   */
  public resolveDisplacement(entity: PhysicsEntity, otherEntity: PhysicsEntity): void {
    const manifold = this.getManifold(entity, otherEntity);
    if (!manifold) return;
    entity.x += manifold.nx * manifold.penetration;
    entity.y += manifold.ny * manifold.penetration;
    entity.vx = 0;
    entity.vy = 0;
  }

  /**
   * getManifold: Computes the collision manifold (normal and penetration)
   * for rectangle–rectangle, circle–circle, and rectangle–circle collisions.
   */
  private getManifold(a: PhysicsEntity, b: PhysicsEntity): { nx: number, ny: number, penetration: number } | null {
    // Rectangle-Rectangle collision.
    if (a.shape === EntityShape.RECTANGLE && b.shape === EntityShape.RECTANGLE) {
      const overlapX = Math.min(a.getRight() - b.getLeft(), b.getRight() - a.getLeft());
      const overlapY = Math.min(a.getBottom() - b.getTop(), b.getBottom() - a.getTop());
      if (overlapX <= 0 || overlapY <= 0) return null;
      if (overlapX < overlapY) {
        const nx = a.getMidX() < b.getMidX() ? -1 : 1;
        return { nx, ny: 0, penetration: overlapX };
      } else {
        const ny = a.getMidY() < b.getMidY() ? -1 : 1;
        return { nx: 0, ny, penetration: overlapY };
      }
    }
    // Circle-Circle collision.
    else if (a.shape === EntityShape.CIRCLE && b.shape === EntityShape.CIRCLE) {
      const dx = b.getMidX() - a.getMidX();
      const dy = b.getMidY() - a.getMidY();
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radiusA = a.halfWidth; // for a circle, assume radius = halfWidth.
      const radiusB = b.halfWidth;
      const penetration = (radiusA + radiusB) - distance;
      if (penetration <= 0) return null;
      if (distance === 0) {
        return { nx: 1, ny: 0, penetration };
      }
      return { nx: dx / distance, ny: dy / distance, penetration };
    }
    // Rectangle-Circle collision.
    else if (a.shape === EntityShape.RECTANGLE && b.shape === EntityShape.CIRCLE) {
      const cx = b.getMidX();
      const cy = b.getMidY();
      const closestX = clamp(cx, a.getLeft(), a.getRight());
      const closestY = clamp(cy, a.getTop(), a.getBottom());
      const dx = cx - closestX;
      const dy = cy - closestY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const penetration = b.halfWidth - distance;
      if (penetration <= 0) return null;
      if (distance === 0) {
        return { nx: 0, ny: -1, penetration };
      }
      return { nx: dx / distance, ny: dy / distance, penetration };
    }
    // Circle-Rectangle collision: Swap and invert normal.
    else if (a.shape === EntityShape.CIRCLE && b.shape === EntityShape.RECTANGLE) {
      const manifold = this.getManifold(b, a);
      if (manifold) return { nx: -manifold.nx, ny: -manifold.ny, penetration: manifold.penetration };
      return null;
    }
    return null;
  }

  /**
   * resolveDynamicCollision: Uses the computed manifold to resolve collisions between two dynamic entities.
   */
  public resolveDynamicCollision(entityA: PhysicsEntity, entityB: PhysicsEntity): void {
    const manifold = this.getManifold(entityA, entityB);
    if (!manifold) return;
    
    // Use a correction factor for circles.
    let correctionFactor = 1.0;
    if (entityA.shape === EntityShape.CIRCLE || entityB.shape === EntityShape.CIRCLE) {
      correctionFactor = 0.5;
    }
    
    const correctionX = manifold.nx * manifold.penetration * 0.5 * correctionFactor;
    const correctionY = manifold.ny * manifold.penetration * 0.5 * correctionFactor;
    if (entityA.type === PhysicsEntityType.DYNAMIC && entityB.type === PhysicsEntityType.DYNAMIC) {
      entityA.x -= correctionX;
      entityA.y -= correctionY;
      entityB.x += correctionX;
      entityB.y += correctionY;
    } else if (entityA.type === PhysicsEntityType.DYNAMIC && entityB.type === PhysicsEntityType.KINEMATIC) {
      entityA.x -= correctionX * 2;
      entityA.y -= correctionY * 2;
    } else if (entityA.type === PhysicsEntityType.KINEMATIC && entityB.type === PhysicsEntityType.DYNAMIC) {
      entityB.x += correctionX * 2;
      entityB.y += correctionY * 2;
    }
  
    // Impulse resolution.
    const relVel = (entityA.vx - entityB.vx) * manifold.nx + (entityA.vy - entityB.vy) * manifold.ny;
    if (relVel > 0) return;
    const restitution = Math.min(entityA.restitution, entityB.restitution);
    const impulse = -(1 + restitution) * relVel / 2;
    entityA.vx += impulse * manifold.nx;
    entityA.vy += impulse * manifold.ny;
    entityB.vx -= impulse * manifold.nx;
    entityB.vy -= impulse * manifold.ny;
  }
  
  /**
   * Helper method: checks if two entities are still colliding using the generic collision detector.
   */
  private isStillColliding(a: PhysicsEntity, b: PhysicsEntity): boolean {
    // Create a temporary detector to test collision.
    // (In a more mature system, consider injecting a shared detector.)
    const detector = new CollisionDetector();
    return detector.collide(a, b);
  }
}