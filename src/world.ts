"use strict";


import { Actor, ActorContainer } from "./actor";
import { renderer } from "launcher";
import { Viewport } from "pixi-viewport";

export class Floor {
    actors : ActorContainer[] = [];

    constructor() {

    }

    update(delta: number) {
        this.actors.forEach((ac) => {
            ac.update(delta);
        });
    }

    render(viewport : Viewport) {
        this.actors.forEach((ac) => {
            ac.render(viewport);
        });
    }

    addActor(actor : Actor) {
        this.actors.push(new ActorContainer(actor));
    }
}