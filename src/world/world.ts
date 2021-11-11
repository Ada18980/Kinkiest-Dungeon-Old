"use strict";


import { Actor, ActorContainer, Dir } from "./actor";
import { renderer, viewport } from '../gfx/render';
import { Viewport } from "pixi-viewport";
import { QuadTree, WorldObject } from "./quadtree";
import { getRandomFunction } from "../random";
import {createLightMap, lightMap, propagateLight} from "./light";
import { Scheduler } from "./scheduler";
import { Wall, WallProperties, Zone } from "./zone";
import { getMapActorType } from "./mapActors";

export interface WorldVec {
    x : number,
    y : number,
}
export class World {
    actors : Map<number, Actor> = new Map<number, Actor>();
    actorlist : Actor[] | undefined;
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
        this.populateZoneActors();
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
        while(this.actors.has(this.id_inc)) {
            this.id_inc++;
            if (this.id_inc > Number.MAX_SAFE_INTEGER) {
                this.id_inc = 1;
            }
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

    // Populates actors for the current zone
    populateZoneActors() {
        let zone = this.zones[this.currentZone];
        if (zone) {
            // First step is to clear all Map actors that don't match their grid square
            for (let y = 0; y < zone.height; y++) {
                for (let x = 0; x < zone.width; x++) {
                    let actors = this.tree_actors.getAll(x, y, 1.1);
                    let mapActor : Actor | undefined;
                    for (let a of actors) {
                        if (a.data && a.type.tags.get("map") && a.x == x && a.y == y) {
                            let tile = a.type.tags.get("map");
                            if (tile != undefined && typeof tile == "number") {
                                // We have confirmed that it is a map object. Now we will compare the map...
                                if (zone.get(x, y) != tile || mapActor) {
                                    // We delete!
                                    this.removeActor(a);
                                } else mapActor = a;
                            }
                        }
                    }
                    // If we don't have one we generate one...
                    if (!mapActor) {
                        this.generateMapActor(x, y, zone, zone.get(x, y));
                    }
                }
            }
        }
    }

    // Generate a map actor based on a tile
    generateMapActor(x : number, y : number, zone : Zone, tile : Wall) {
        let actor = new Actor(x, y, getMapActorType(x, y, zone, tile));
        this.addActor(actor);
    }

    serialize() : string {
        console.log(this.actors)
        /*let oldContainers = this.containers;
        let oldActorMap = this.tree_actors;
        this.containers = new Map<number, ActorContainer>();
        this.tree_actors = new QuadTree<Actor>(1);
        let scheduler = this.scheduler;
        this.scheduler = undefined;
        this.actorlist = Array.from(this.actors, ([name, value]) => (value));
        this.actors = new Map<number, Actor>();*/
        // TODO actually serialize

        // Blorp
        let wor : any = {};
        wor.actorlist = this.actorlist;
        wor.zones = this.zones;
        wor.currentZone = this.currentZone;

        let str = JSON.stringify(wor);

        console.log(wor);

        // TODO finish serializing
        //this.scheduler = scheduler;
        //this.containers = oldContainers;
        //this.tree_actors = oldActorMap;
        //this.actors = convertActorList(this.actorlist);

        return str;
    }

    deserialize(data : string) {
        this.populateContainers();
    }

}

function convertActorList(list : Actor[]) : Map<number, Actor> {
    let ret = new Map<number, Actor>();

    for (let a of list) {
        ret.set(a.id, a);
    }
    return ret;
}