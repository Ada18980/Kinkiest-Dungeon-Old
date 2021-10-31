"use strict";


import { Actor, ActorContainer, Dir } from "./actor";
import { renderer, viewport } from '../gfx/render';
import { Viewport } from "pixi-viewport";
import { QuadTree, WorldObject } from "./quadtree";

export interface WorldDir {
    x : number,
    y : number,
}

export class Zone {
    walls: Uint16Array[];
    width : number;
    height : number;

    constructor(width: number, height: number) {
        this.walls = [];
        this.width = width;
        this.height = height;
        for (let y = 0; y < height; y++) {
            this.walls.push(new Uint16Array(width));
        }
    }

    get(x : number, y : number) : number {
        let row = this.walls[y];
        if (row) {
            let cell = row[x];
            if (cell) return cell;
        }
        return -1;
    }

    isEdge(x : number, y : number) : boolean {
        return (x == 0 || x == this.width - 1 || y == 0 || y == this.height - 1);
    }

    // Returns the number of walls (1) around the area
    getWallNeighborCount(x : number, y : number) : number {
        let num = 0;
        let maxX = Math.min(this.width-1, x+1);
        let maxY = Math.min(this.height-1, y+1);

        for (let xx = Math.max(0, x-1); xx <= maxX; xx++)
            for (let yy = Math.max(0, y-1); yy <= maxY; yy++) {
                if ((xx != x || yy != y) && this.get(xx, yy) == 1) num += 1;
            }

        return num;
    }

    createMaze(width: number = this.width, height: number = this.height) {
        if (width > this.width) width = this.width;
        if (height > this.height) height = this.height;

        let change = 1;
        let iters = 0;
        let max = 100;
        while (change > 0 && iters < max) {
            change = 0;
            for (let y = 0; y < height; y++) {
                let row = this.walls[y];
                if (row)
                    for (let x = 0; x < width; x++) {
                        // Processing loop for each cell
                        // Initialization step
                        if (iters == 0) {
                            row[x] = (!this.isEdge(x, y) && Math.random() > 0.5 && (y != 50 && x != 50)) ? 1 : 0;
                            change += 1;
                        } else { // After initialization
                            let neighbors = this.getWallNeighborCount(x, y);
                            let start = row[x];
                            if (neighbors == 0 || neighbors > 6) row[x] = 0;
                            else if (neighbors == 3) row[x] = 1;
                            if (start != row[x]) change += 1;
                        }


                    }
            }
            iters += 1;
            console.log(change)
        }
    }
}

export class World {
    actors : Map<number, Actor> = new Map<number, Actor>();
    player : Actor | undefined = undefined;
    containers : Map<number, ActorContainer> = new Map<number, ActorContainer>();
    tree_actors : QuadTree<Actor> = new QuadTree<Actor>(1);
    id_inc = 0; // Increment by one each time an actor is added
    zones : Zone[];
    currentZone : number = 0;

    constructor() {
        let zone = new Zone(100, 100);
        this.zones = [zone];
        zone.createMaze();
    }



    moveActor(actor : Actor, dir : WorldDir) : number {
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
        // TODO actually serialize

        // Blorp

        // TODO finish serializing
        this.containers = oldContainers;
        this.tree_actors = oldActorMap;
    }

    deserialize(data : string) {
        this.populateContainers();
    }

}