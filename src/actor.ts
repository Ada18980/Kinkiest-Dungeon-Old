"use strict";

import { renderer } from "launcher";
import { Viewport } from "pixi-viewport";
import { getNewSprite, Image } from './sprites';
import { MAX_ZOOM, MIN_ZOOM, TILE_SIZE } from './render';

export enum Dir {
    UP = "_up",
    DOWN = "_down",
    LEFT = "_left",
    RIGHT = "_right",
}

// A few things must be defined for actors
export interface ActorType  {
    player?: boolean,
    sprite?: string,
}

export abstract class ActorTag {
    update(actor: Actor, delta : number) {}
    render(actor: Actor, viewport : Viewport) {}
}

export interface ActorData {
    value? : number;
    values? : number[];
    string? : string;
    strings? : string[];
}

export class Actor {
    x : number;
    y : number;
    direction : Dir;
    type : ActorType;
    tags: ActorTag[];
    data: Map<string, ActorData>;
    id : number = 0;

    constructor(x : number, y: number, type : ActorType, actorTags?: ActorTag[]) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.direction = Dir.DOWN;
        if (actorTags) {
            this.tags = actorTags;
        } else this.tags = [];
        this.data = new Map<string, ActorData>();
    }

    update(delta: number) {
        if (this.tags)
            for (const tag of this.tags) {
                tag.update(this, delta);
            }
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

export class ActorContainer {
    actor : Actor;
    sprite : Image | undefined = undefined;

    constructor(actor : Actor) {
        this.actor = actor;
    }

    render(viewport : Viewport) {
        if (!this.sprite && this.actor.sprite) {
            this.sprite = getNewSprite(this.actor.sprite);
        }

        // TODO if actor is player, get player outfit
        if (this.sprite) {
            this.sprite.render(viewport, this.actor.direction, ["walk", "cuffed_f"], this.actor.xx, this.actor.yy);
            if (!this.sprite.playing) this.sprite.animate(true);
        }
    }
}

