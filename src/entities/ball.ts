import { PhysicsEntity, CollisionType, PhysicsEntityType, EntityShape } from "../live/physics";

export class Ball extends PhysicsEntity {
  constructor(x: number, y: number, size: number) {
    // The ball is dynamic.
    super(CollisionType.ELASTIC, PhysicsEntityType.DYNAMIC);
    this.x = x;
    this.y = y;
    this.width = size;
    this.height = size;
    this.restitution = 1;
    this.updateBounds();
    // Set the shape to circle for proper rendering/collision.
    this.shape = EntityShape.CIRCLE;
  }
}