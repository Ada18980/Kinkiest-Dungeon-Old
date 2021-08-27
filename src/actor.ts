"use strict";

import { renderer } from "launcher";
import { Viewport } from "pixi-viewport";
import { getNewSprite, Image } from './sprites';
import { MAX_ZOOM, MIN_ZOOM, TILE_SIZE } from './render';

// Generic entity
export interface EntityType {
    sprite: string,
}

// A few things must be defined for actors
export interface ActorType extends EntityType  {
    max_hp: number,
    player?: boolean,
}

export class Entity {
    x : number;
    y : number;
    type : EntityType;

    constructor(x : number, y: number, type : EntityType) {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    get sprite() {
        return this.type.sprite;
    }

    get xx() {
        return this.x * TILE_SIZE + TILE_SIZE/2;
    }
    get yy() {
        return this.y * TILE_SIZE + TILE_SIZE/2;
    }
}


export class Actor extends Entity {
    hp : number;
    override type : ActorType;

    constructor(x : number, y: number, type : ActorType) {
        super(x, y, type);
        this.type = type;
        this.hp = type.max_hp;
    }
}

export class ActorContainer {
    actor : Actor;
    sprite : Image | undefined = undefined;

    constructor(actor : Actor) {
        this.actor = actor;
    }

    update(delta: number) {
        // TODO actor go brr
    }

    render(viewport : Viewport) {
        if (!this.sprite) {
            this.sprite = getNewSprite(this.actor.sprite);
        }

        if (this.sprite) {
            this.sprite.render(viewport, "walkdown", this.actor.xx, this.actor.yy);
            if (!this.sprite.playing) this.sprite.animate(true);
        }
    }
}

