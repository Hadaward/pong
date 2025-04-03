export enum PhysicsEntityType {
    DYNAMIC = "dynamic",
    KINEMATIC = "kinematic"
}

export enum CollisionType {
    NONE = "none",
    DISPLACE = "displace",
    ELASTIC = "elastic"
}

export enum EntityShape {
    RECTANGLE = "rectangle",
    CIRCLE = "circle"
}
  
export class PhysicsEntity {
    public type: PhysicsEntityType;
    public collision: CollisionType;
    public width: number = 20;
    public height: number = 20;
    public halfWidth: number;
    public halfHeight: number;
    public x: number = 0;
    public y: number = 0;
    public vx: number = 0;
    public vy: number = 0;
    public ax: number = 0;
    public ay: number = 0;
    public restitution: number; // bounciness factor
    public friction: number = 1; // friction factor (0-1)
    public shape: EntityShape = EntityShape.RECTANGLE; // default shape

    constructor(collision: CollisionType = CollisionType.ELASTIC, type: PhysicsEntityType = PhysicsEntityType.DYNAMIC) {
        this.type = type;
        this.collision = collision;
        // For an elastic collision, set a nonzero restitution
        this.restitution = collision === CollisionType.ELASTIC ? 0.2 : 0;
        this.halfWidth = this.width * 0.5;
        this.halfHeight = this.height * 0.5;
    }

    public onCollide?(body: PhysicsEntity): void {}

    public updateBounds(): void {
        this.halfWidth = this.width * 0.5;
        this.halfHeight = this.height * 0.5;
    }

    public getMidX(): number {
        return this.x + this.halfWidth;
    }

    public getMidY(): number {
        return this.y + this.halfHeight;
    }

    public getLeft(): number {
        return this.x;
    }

    public getTop(): number {
        return this.y;
    }

    public getRight(): number {
        return this.x + this.width;
    }

    public getBottom(): number {
        return this.y + this.height;
    }
}
  