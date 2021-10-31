"use strict";


import { Actor, ActorContainer, Dir } from "./actor";
import { renderer, viewport } from '../gfx/render';
import { Viewport } from "pixi-viewport";
import { QuadTree, WorldObject } from "./quadtree";
import { getRandomFunction } from "../random";

export interface WorldVec {
    x : number,
    y : number,
}

export class Zone {
    walls: Uint16Array[];
    width : number;
    height : number;
    seed = "kinky";

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
            if (cell != undefined) return cell;
        }
        return -1;
    }
    set(x : number, y : number, value : number) {
        let row = this.walls[y];
        if (row) {
            row[x] = value;
        }
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
    // Returns the neighbors of a cells as WorldVec
    getNeighbors(x : number, y : number) : WorldVec[] {
        let neighbors : WorldVec[] = [];
        let maxX = Math.min(this.width-1, x+1);
        let maxY = Math.min(this.height-1, y+1);

        for (let xx = Math.max(0, x-1); xx <= maxX; xx++)
            for (let yy = Math.max(0, y-1); yy <= maxY; yy++) {
                if ((xx != x || yy != y)) neighbors.push({x : xx, y : yy});
            }

        return neighbors;
    }

    createMaze(width: number = this.width, height: number = this.height) {
        let rand = getRandomFunction(this.seed);

        if (width > this.width) width = this.width;
        if (height > this.height) height = this.height;

        let cells : Uint16Array[] = [];
        for (let y = 0; y < height; y++) {
            cells.push(new Uint16Array(width));
        }

        // Initialization
        for (let y = 0; y < height; y++) {
            let row = cells[y];
            if (row)
                for (let x = 0; x < width; x++) {
                    // Initialization step
                    row[x] = 1;
                }
        }

        // http://justinparrtech.com/JustinParr-Tech/wp-content/uploads/Creating%20Mazes%20Using%20Cellular%20Automata_v2.pdf
        function randCell(rand : () => number) : WorldVec {
            return {
                x : 1 + Math.floor(rand() * (width/2 - 1.000001 )) * 2,
                y : 1 + Math.floor(rand() * (height/2 - 1.000001 )) * 2
            }
        }
        function getCell(x : number, y : number) : number {
            let row = cells[y];
            if (row) {
                let cell = row[x];
                if (cell != undefined) return cell;
            }
            return -1;
        }
        function setCell(x : number, y : number, value : number) {
            let row = cells[y];
            if (row) {
                row[x] = value;
            }
        }
        function getNeighborCells(x : number, y : number) : WorldVec[] {
            let neighbors : WorldVec[] = [];

            if (x + 2 < width - 1) neighbors.push({x : x + 2, y : y});
            if (y + 2 < height - 1) neighbors.push({x : x, y : y + 2});
            if (x - 2 >= 1) neighbors.push({x : x - 2, y : y});
            if (y - 2 >= 1) neighbors.push({x : x, y : y - 2});

            return neighbors;
        }
        function getCellWallNeighborCount(x : number, y : number) : number {
            let num = 0;

            if (getCell(x + 1, y)) num += 1;
            if (getCell(x - 1, y)) num += 1;
            if (getCell(x, y + 1)) num += 1;
            if (getCell(x, y - 1)) num += 1;
            if (getCell(x + 1, y + 1)) num += 1;
            if (getCell(x + 1, y - 1)) num += 1;
            if (getCell(x - 1, y + 1)) num += 1;
            if (getCell(x - 1, y - 1)) num += 1;

            return num;
        }

        function getCellWallNeighborCountExtended(x : number, y : number) : number {
            let num = 0;

            if (getCell(x + 2, y)) num += 1;
            if (getCell(x - 2, y)) num += 1;
            if (getCell(x, y + 2)) num += 1;
            if (getCell(x, y - 2)) num += 1;

            return num;
        }
        let seeds : WorldVec[] = [{x : 49, y : 49}];
        let seed_prob = 0.4; // Branching factor
        let connect_prob = 0.2; // Reconnection factor
        let pillar_prob = 0.0; // Chance of a pillar remaining
        let freewall_prob = 0; // Chance of a freewall remaining
        let iters = 0;
        let max = 10000;
        while (iters < max && seeds.length > 0) {
            let cur_seed = seeds[Math.floor(rand() * seeds.length)];
            if (cur_seed) {
                setCell(cur_seed.x, cur_seed.y, 0);
                let neighbors = getNeighborCells(cur_seed.x, cur_seed.y);
                let neighbors_noConn = 0;
                for (let i = 0; i < neighbors.length * 2; i++) {
                    let ind = Math.floor(rand() * neighbors.length);
                    let neighbor = neighbors[ind];
                    if (neighbor && getCell((cur_seed.x + neighbor.x) / 2, (cur_seed.y + neighbor.y) / 2) != 0) {
                        neighbors_noConn += 1; // There is no connection
                    } else {// Skip if there is a connection
                        neighbors.splice(ind, 1);
                        continue;
                    }
                    if (rand() > connect_prob && getCell(neighbor.x, neighbor.y) == 0) { // We dont add new branches
                        neighbors.splice(ind, 1);
                        continue;
                    }
                    if (neighbor) {
                        setCell(neighbor.x, neighbor.y, 0); // Make the cell empty and a seed
                        seeds.push(neighbor);
                        setCell((cur_seed.x + neighbor.x) / 2, (cur_seed.y + neighbor.y) / 2, 0); // Create a connection
                        break;
                    }
                }
                if (neighbors_noConn == 0 || rand() > seed_prob)
                    seeds.splice(seeds.indexOf(cur_seed), 1);
            }
            /*for (let y = 1; y < height; y += 2) {
                let row = this.walls[y];
                if (row)
                    for (let x = 1; x < width; x += 2) {
                        // Processing loop for each cell
                        // Each 'cell' is a grid square surrounded by walls




                    }
            }*/
            iters += 1;
            //if (iters % 100 == 0)
            //    console.log(seeds.length);
        }
        this.walls = cells;

        // Remove freewalls
        for (let y = 2; y < height; y += 2) {
            let row = this.walls[y];
            if (row)
                for (let x = 2; x < width; x += 2) {
                    // Clean up pillars
                    if (getCell(x, y) == 1
                    && (rand() > freewall_prob && getCellWallNeighborCount(x, y) == 1 && getCellWallNeighborCountExtended(x, y) == 3)) this.set(x, y, 0);
                }
        }
        // Remove pillars
        for (let y = 2; y < height; y += 2) {
            let row = this.walls[y];
            if (row)
                for (let x = 2; x < width; x += 2) {
                    // Clean up pillars
                    if (getCell(x, y) == 1
                    && (rand() > pillar_prob && getCellWallNeighborCount(x, y) == 0)) this.set(x, y, 0);
                }
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