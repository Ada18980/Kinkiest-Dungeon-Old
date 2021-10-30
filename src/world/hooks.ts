"use strict";

import { renderer, viewport } from '../gfx/render';
import { Actor, ActorContainer } from './actor';
import { World } from './world';

export let UpdateHooks = {
    "ExampleUpdateHook" : (a: Actor, w: World) => {
        return true; // We passed the hook!
    },
}

export let DrawHooks = {
    "ExampleDrawHook" : (ac: ActorContainer, w: World) => {
        return true; // We passed the hook!
    },
}

export class ActorUpdateHook {
    fn : (a: Actor, w: World) => boolean;
    constructor(fn : (a: Actor, w: World) => boolean) {
        this.fn = fn;
    }
}
export class ActorDrawHook {
    fn : (ac: ActorContainer, w: World) => boolean;
    constructor(fn : (ac: ActorContainer, w: World) => boolean) {
        this.fn = fn;
    }
}