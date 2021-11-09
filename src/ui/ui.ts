import { Viewport } from "pixi-viewport";
import { World} from '../world/world';
import { Wall, Zone } from '../world/zone';
import * as PIXI from 'pixi.js';
import { MAX_ZOOM, MIN_ZOOM, TILE_SIZE, renderer, viewport, renderWorld, updateWorldRender} from '../gfx/render';
import { mouseLeftDown, mouseRightDown, mouseMiddleDown, initControls, controlTick, controlTicker, updateCamera } from './control';
import { renderHUD } from './hud';
import { ratio, windowSize } from '../launcher';

import { Player } from './player';
import { Actor } from '../world/actor';

export class UI {
    player : Player;
    world : World;
    currentZone : Zone | undefined;
    currentLighting : number[][] | undefined;

    constructor(player: Actor, world : World) {
        this.player = new Player(player);
        this.world = world;
    }

    initialize(app : PIXI.Application) {
        // Listen for animate update
        var lastTick = performance.now();

        let snapBack = false;
        viewport.addListener('moved-end', (event) => {snapBack = false;});
        viewport.addListener('drag-start', (event) => {snapBack = false;});

        if (this.player.cameraActor)
            viewport.snap(this.player.cameraActor.xx || 0, this.player.cameraActor.yy || 0, {ease: "easeInOutSine", time: 0, removeOnComplete: true});
        //viewport.snapZoom({ease: "easeInOutSine", time: 1000, removeOnComplete: true, height: ratio > 1 ? (MIN_ZOOM * TILE_SIZE) : undefined, width: ratio <= 1 ? (MIN_ZOOM * TILE_SIZE) : undefined});

        app.ticker.add((delta: number) => {
            if (this.world && this.currentZone != this.world.zones[this.world.currentZone]) {
                if (renderWorld(this.world))
                    this.currentZone = this.world.zones[this.world.currentZone];
            }

            let d = performance.now() - lastTick;
            lastTick = performance.now();

            controlTicker(d, this.world, this.player);
            if (this.currentZone) updateWorldRender(this.currentZone);
            if (this.world.scheduler) this.world.scheduler.update();
            this.world.render(d);
            updateCamera(this.world, this.player);

            renderHUD(this.world);
            if (!viewport.moving)
                viewport.moveCorner(Math.round(viewport.corner.x), Math.round(viewport.corner.y));

            if ((viewport.center.x > viewport.worldWidth || viewport.center.x < 0 || viewport.center.y > viewport.worldHeight || viewport.center.y < 0)) {
                if (!mouseLeftDown) {
                    if (!snapBack)
                        viewport.snap(Math.max(0, Math.min(viewport.center.x, viewport.worldWidth)), Math.max(0, Math.min(viewport.center.y, viewport.worldHeight)), {ease: "easeInOutSine", time: 500, removeOnComplete: true, removeOnInterrupt: true});
                    snapBack = true;
                }
            } else snapBack = false;
        });
    }
}