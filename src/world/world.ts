"use strict";


import { Actor, ActorContainer, Dir } from "./actor";
import { renderer, viewport } from '../gfx/render';
import { Viewport } from "pixi-viewport";
import { QuadTree, WorldObject } from "./quadtree";

export interface WorldDir {
    x : number,
    y : number,
}

export class World {
    actors : Map<number, Actor> = new Map<number, Actor>();
    player : Actor | undefined = undefined;
    containers : Map<number, ActorContainer> = new Map<number, ActorContainer>();
    tree_actors : QuadTree<Actor> = new QuadTree<Actor>(1);
    id_inc = 0; // Increment by one each time an actor is added

    constructor() {

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