"use strict";


import { Actor, ActorContainer } from "./actor";
import { renderer } from "launcher";
import { Viewport } from "pixi-viewport";

export class Floor {
    actors : Actor[] = [];
    player : Actor | undefined = undefined;
    containers : ActorContainer[] = [];
    id_inc = 0; // Increment by one each time an actor is added

    constructor() {

    }

    update(delta: number) {
        this.actors.forEach((ac) => {
            ac.update(delta);
        });
    }

    render(viewport : Viewport) {
        this.containers.forEach((ac) => {
            ac.render(viewport);
        });
    }

    addActor(actor : Actor) {
        this.actors.push(actor);
        this.addActorContainer(actor);
        actor.id = this.id_inc++;
    }
    addActorContainer(actor : Actor) {
        let ac = new ActorContainer(actor);
        if (!this.player && actor.type.player) this.player = actor;
        this.containers.push(ac);
    }

    populateContainers() {
        this.actors.forEach((actor) => {
            if (!this.containers.some((element) => {return element.actor == actor;})) {
                this.addActorContainer(actor);
            }
        });
    }

    serialize() {
        let oldContainers = this.containers;
        this.containers = [];
        // TODO actually serialize
        this.containers = oldContainers;
    }

    deserialize(data : string) {
        this.populateContainers();
    }

}