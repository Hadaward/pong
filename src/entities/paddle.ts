import { PhysicsEntity, CollisionType, PhysicsEntityType, EntityShape } from "../live/physics";

export class Paddle extends PhysicsEntity {
  constructor(x: number, y: number, width: number, height: number) {
    // We use ELASTIC collisions for paddles, but they are kinematic.
    super(CollisionType.ELASTIC, PhysicsEntityType.KINEMATIC);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.restitution = 1;
    this.updateBounds();
    // For paddles we leave the default shape as RECTANGLE.
    this.shape = EntityShape.RECTANGLE;
  }
}