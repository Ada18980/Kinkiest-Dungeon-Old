"use strict";

import { renderer } from "launcher";
import { Viewport } from "pixi-viewport";
import { getNewSprite, Image } from './sprites';

export interface ActorType {
    max_hp: number;
    sprite: string;
}

export class Actor {
    x : number;
    y : number;
    type : ActorType;
    hp : number;

    constructor(x : number, y: number, type : ActorType) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.hp = type.max_hp;
    }

    get sprite() {
        return this.type.sprite;
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
            this.sprite.render(viewport, "walkdown", this.actor.x, this.actor.y);
            if (!this.sprite.playing) this.sprite.animate(true);
        }
    }
}

