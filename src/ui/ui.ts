import { Viewport } from "pixi-viewport";
import { World } from "../world/world";
import * as PIXI from 'pixi.js';
import { MAX_ZOOM, MIN_ZOOM, TILE_SIZE, renderer, viewport } from '../gfx/render';
import { mouseLeftDown, mouseRightDown, mouseMiddleDown, initControls, controlTick, controlTicker } from './control';
import { ratio } from '../launcher';

import { Player } from './player';
import { Actor } from '../world/actor';

export class UI {
    player : Player;
    world : World;

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
            viewport.snap(this.player.cameraActor.xx || 0, this.player.cameraActor.yy || 0, {ease: "easeInOutSine", time: 1000, removeOnComplete: true});
        viewport.snapZoom({ease: "easeInOutSine", time: 1000, removeOnComplete: true, height: ratio > 1 ? (MIN_ZOOM * TILE_SIZE) : undefined, width: ratio <= 1 ? (MIN_ZOOM * TILE_SIZE) : undefined});

        app.ticker.add((delta: number) => {
            let d = performance.now() - lastTick;
            lastTick = performance.now();

            controlTicker(d, this.world, this.player);
            this.world.render(d);

            if ((viewport.center.x > viewport.worldWidth || viewport.center.x < 0 || viewport.center.y > viewport.worldHeight || viewport.center.y < 0)) {
                if (!mouseLeftDown) {
                    if (!snapBack)
                        viewport.snap(Math.max(0, Math.min(viewport.center.x, viewport.worldWidth)), Math.max(0, Math.min(viewport.center.y, viewport.worldHeight)), {ease: "easeInOutSine", time: 500, removeOnComplete: true, removeOnInterrupt: true});
                    snapBack = true;
                }
            } else snapBack = false;
        });
    }

    loadWorld() {
        for (let i = 0; i < 1024/TILE_SIZE; i += 1) {
            for (let ii = 0; ii <= 2048/TILE_SIZE; ii += 1) {
                let texture = PIXI.RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE });
                let r1 = new PIXI.Graphics();
                r1.beginFill(0x000000);
                r1.drawRect(0, 0, 64, 64);
                r1.endFill();
                renderer.render(r1,{renderTexture: texture})
                let block = new PIXI.Sprite(texture);
                block.position.x = 2*TILE_SIZE*i + (ii % 2 == 0 ? 0 : TILE_SIZE);
                block.position.y = TILE_SIZE*ii;
                block.anchor.x = 0;
                block.anchor.y = 0;
                viewport.addChild(block);
            }
        }
    }
}