"use strict";


import { Actor, ActorContainer, Dir } from "./actor";
import { renderer, viewport } from '../gfx/render';
import { Viewport } from "pixi-viewport";
import { QuadTree, WorldObject } from "./quadtree";
import { getRandomFunction } from "../random";
import {createLightMap, lightMap, propagateLight} from "./light";
import { Scheduler } from "./scheduler";
import { WallProperties, Zone } from "./zone";

export interface WorldVec {
    x : number,
    y : number,
}
export class World {
    actors : Map<number, Actor> = new Map<number, Actor>();
    player : Actor | undefined = undefined;
    containers : Map<number, ActorContainer> = new Map<number, ActorContainer>();
    tree_actors : QuadTree<Actor> = new QuadTree<Actor>(1);
    id_inc = 0; // Increment by one each time an actor is added
    zones : Zone[];
    currentZone : number = 0;

    scheduler : Scheduler | undefined;

    constructor() {
        let zone = new Zone(60, 60);
        this.zones = [zone];
        this.scheduler = new Scheduler(this);
        let start = performance.now();
        zone.createMaze();
        console.log("Maze generation took " + (performance.now() - start)/1000);
    }

    actorCanMove(actor : Actor, x : number, y : number, force?: false) : boolean {
        let ethereal = false; // Here we will add any buff or ability that lets the actor pass through
        let zone = this.zones[this.currentZone];
        if (!zone) return false;
        if (x >= 0 && y >= 0 && x < zone.width && y < zone.height) {
            let occuupied = !force && false; // Cant move into occupied spaces
            if ((ethereal || !WallProperties[zone.get(x, y)].collision) && !occuupied) {
                return true;
            }
        }
        return false;
    }

    moveActor(actor : Actor, dir : WorldVec) : number {
        if (this.actors.get(actor.id)) {
            actor.x += dir.x;
            actor.y += dir.y;

            if (!actor.type.noFace) {
                actor.faceDir(dir);
            }

            return Math.max(Math.abs(dir.x), Math.abs(dir.y));
        }
        return 0;
    }

    update(delta: number) {
        this.actors.forEach((ac) => {
            ac.update(delta);

        });
        this.tree_actors.refresh();
        let zone = this.zones[this.currentZone];
        if (this.player && zone) {
            zone.updateLight(this.player.x, this.player.y, 7, 0.0, 0.05);
        }
    }

    render(delta: number) {
        this.containers.forEach((ac) => {
            ac.render(delta);
        });
    }

    addActor(actor : Actor) {
        let iterations = 0;
        let max = 10000;
        while(this.actors.has(this.id_inc)) {
            this.id_inc++;
        }
        actor.id = this.id_inc
        this.actors.set(this.id_inc, actor);
        this.addActorContainer(actor);
        this.tree_actors.add(actor);
    }
    removeActor(actor : Actor) {
        let ac = this.containers.get(actor.id)
        if (ac) {
            ac.destroy(true);
            this.actors.delete(actor.id);
            this.containers.delete(actor.id);
            this.tree_actors.remove(actor);
        }
    }
    addActorContainer(actor : Actor) {
        let ac = new ActorContainer(actor);
        if (!this.player && actor.type.player) this.player = actor;
        this.containers.set(actor.id, ac);
    }

    // Called upon loading a game
    populateContainers() {
        this.actors.forEach((actor) => {
            if (!Array.from(this.containers).some((element) => {return element[1].actor == actor;})) {
                this.addActorContainer(actor);
                this.tree_actors.add(actor);
            }
        });
    }

    serialize() {
        let oldContainers = this.containers;
        let oldActorMap = this.tree_actors;
        this.containers = new Map<number, ActorContainer>();
        let scheduler = this.scheduler;
        this.scheduler = undefined;
        // TODO actually serialize

        // Blorp

        // TODO finish serializing
        this.scheduler = scheduler;
        this.containers = oldContainers;
        this.tree_actors = oldActorMap;
    }

    deserialize(data : string) {
        this.populateContainers();
    }

}