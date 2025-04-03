import { CollisionType, EntityShape, PhysicsEntity, PhysicsEntityType } from "../live/physics";
import { Ball } from "./ball";

export class PowerUP extends PhysicsEntity {
    private onPowerUpGet: () => void;

    public color: string = "magenta";
    
    constructor(x: number, y: number, onPowerUpGet: () => void) {
        super(CollisionType.NONE, PhysicsEntityType.KINEMATIC);
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.updateBounds();
        this.shape = EntityShape.CIRCLE;
        this.onPowerUpGet = onPowerUpGet;
    }

    public onCollide(body: PhysicsEntity): void {
        if (body instanceof Ball) {
            this.onPowerUpGet();
        }
    }
}