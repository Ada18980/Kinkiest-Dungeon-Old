"use strict";

import { getNewSprite, Image } from '../gfx/sprites';
import { MAX_ZOOM, MIN_ZOOM, TILE_SIZE, renderer, viewport } from '../gfx/render';
import { ActorUpdateHook, ActorDrawHook } from './hooks';
import { WorldObject } from "./quadtree";
import { WorldVec } from './world';

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
    tags?: Map<string, ActorTag>,
    updateHooks? : Map<string, string>,
    drawHooks? : Map<string, string>,
    idleAnim? : boolean,
    noFace? : boolean,
}

export interface ActorTag {
    tag: string,
    val: number,
}

export interface ActorData {
    value? : number;
    values? : number[];
    string? : string;
    strings? : string[];
}

export class Actor extends WorldObject {
    direction : Dir;
    type : ActorType;
    data: Map<string, ActorData>;

    constructor(x : number, y: number, type : ActorType) {
        super(x, y);
        this.type = type;
        this.direction = Dir.DOWN;
        this.data = new Map<string, ActorData>();
    }

    update(delta: number) {
        if (this.type.updateHooks) {
            for (let H in this.type.updateHooks) {
                // Do hooks here
            }
        }
    }

    // Returns if the actor turned
    faceDir(dir : WorldVec) : boolean {
        if (dir.x == 0 && dir.y == 0) return false;
        let DirIdeal = Dir.DOWN;
        let DirNonIdeal : Dir[] = [];
        if (dir.y > 0) {
            DirIdeal = Dir.DOWN;
            if (dir.x > 0) {
                DirNonIdeal = [Dir.RIGHT];
            } else if (dir.x < 0) {
                DirNonIdeal = [Dir.LEFT];
            }
        } else if (dir.y < 0) {
            DirIdeal = Dir.UP;
            if (dir.x > 0) {
                DirNonIdeal = [Dir.RIGHT];
            } else if (dir.x < 0) {
                DirNonIdeal = [Dir.LEFT];
            }
        } else if (dir.x > 0) {
            DirIdeal = Dir.RIGHT;
            if (dir.y > 0) {
                DirNonIdeal = [Dir.UP];
            } else if (dir.y < 0) {
                DirNonIdeal = [Dir.DOWN];
            }
        } else if (dir.x < 0) {
            DirIdeal = Dir.LEFT;
            if (dir.y > 0) {
                DirNonIdeal = [Dir.UP];
            } else if (dir.y < 0) {
                DirNonIdeal = [Dir.DOWN];
            }
        }
        if (DirNonIdeal.includes(this.direction)) return false;
        else if (DirIdeal != this.direction) {this.direction = DirIdeal; return true;}
        return false;
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

    // Trigger on destruction events
    destroy(code : number = -1) {
        if (code == -1) return; // Exit doing nothing if no return code is given
    }
}

export class ActorContainer {
    actor : Actor;
    sprite : Image | undefined = undefined;
    xx : number = 0;
    yy : number = 0;

    constructor(actor : Actor) {
        this.actor = actor;
        this.xx = actor.xx;
        this.yy = actor.yy;
    }

    render(delta: number) {
        if (!this.sprite && this.actor.sprite) {
            this.sprite = getNewSprite(this.actor.sprite);
        }

        let dx = this.actor.xx - this.xx;
        let dy = this.actor.yy - this.yy;
        let speed = 1;
        if (Math.abs(dx) > Math.abs(dy) - 0.1 && Math.abs(dx) < Math.abs(dy) + 0.1) speed = 1.41;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > TILE_SIZE * 1.1) speed = Math.max(Math.abs(dx), Math.abs(dy))/(TILE_SIZE*1.1);
        if (dx != 0 || dy != 0) {
            let speedMult = Math.min(TILE_SIZE/30 * speed, 30);
            this.xx += speedMult * Math.cos(Math.atan2(dy, dx));
            this.yy += speedMult * Math.sin(Math.atan2(dy, dx));
            if (Math.abs(dx) < speedMult) this.xx = this.actor.xx;
            if (Math.abs(dy) < speedMult) this.yy = this.actor.yy;
        }

        // TODO if actor is player, get player outfit
        if (this.sprite) {
            let playAnim = this.actor.type.idleAnim || (dx != 0 || dy != 0)
            let pose = ["walk"];

            this.sprite.render(this.actor.direction, pose, this.xx, this.yy);
            if (!this.sprite.playing && playAnim) this.sprite.animate(true, false, 1);
            if (!playAnim && this.sprite.playing) this.sprite.animate(false, true, 0);
        }
    }

    destroy(destroyActor: boolean, code : number = -1) {
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (destroyActor)
            this.actor.destroy(code);
    }
}

