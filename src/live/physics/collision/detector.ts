import { PhysicsEntity, EntityShape } from "../entity";
import { clamp } from "../util";

export class CollisionDetector {
  // Generic collision function that routes to the proper shape-specific method.
  public collide(entityA: PhysicsEntity, entityB: PhysicsEntity): boolean {
    if (entityA.shape === EntityShape.RECTANGLE && entityB.shape === EntityShape.RECTANGLE) {
      return this.collideRectRect(entityA, entityB);
    } else if (entityA.shape === EntityShape.CIRCLE && entityB.shape === EntityShape.CIRCLE) {
      return this.collideCircleCircle(entityA, entityB);
    } else if (entityA.shape === EntityShape.RECTANGLE && entityB.shape === EntityShape.CIRCLE) {
      return this.collideRectCircle(entityA, entityB);
    } else if (entityA.shape === EntityShape.CIRCLE && entityB.shape === EntityShape.RECTANGLE) {
      return this.collideRectCircle(entityB, entityA);
    }
    return false;
  }

  // Standard AABB test between two rectangles.
  private collideRectRect(a: PhysicsEntity, b: PhysicsEntity): boolean {
    if (a.getRight() < b.getLeft() || a.getLeft() > b.getRight() ||
        a.getBottom() < b.getTop() || a.getTop() > b.getBottom()) {
      return false;
    }
    return true;
  }

  // Circle-circle collision: centers distance versus sum of radii.
  private collideCircleCircle(a: PhysicsEntity, b: PhysicsEntity): boolean {
    const dx = a.getMidX() - b.getMidX();
    const dy = a.getMidY() - b.getMidY();
    const radii = a.halfWidth + b.halfWidth; // assume width equals height for circles
    return (dx * dx + dy * dy) <= radii * radii;
  }

  // Rectangle-circle collision.
  // We clamp the circle's center to the rectangle bounds and compare the distance.
  private collideRectCircle(rect: PhysicsEntity, circle: PhysicsEntity): boolean {
    const cx = circle.getMidX();
    const cy = circle.getMidY();
    const closestX = clamp(cx, rect.getLeft(), rect.getRight());
    const closestY = clamp(cy, rect.getTop(), rect.getBottom());
    const dx = cx - closestX;
    const dy = cy - closestY;
    const distanceSq = dx * dx + dy * dy;
    return distanceSq <= (circle.halfWidth * circle.halfWidth);
  }

  // detectCollisions remains, but now uses our updated generic collision test.
  public detectCollisions(entity: PhysicsEntity, collidables: PhysicsEntity[]): PhysicsEntity[] | null {
    const collisions: PhysicsEntity[] = [];
    collidables.forEach(other => {
      if (this.collide(entity, other)) {
        collisions.push(other);
      }
    });
    return collisions.length > 0 ? collisions : null;
  }
}
