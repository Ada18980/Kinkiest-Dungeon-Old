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
    walls : PIXI.Container | undefined;

    constructor(player: Actor, world : World) {
        this.player = new Player(player);
        this.world = world;
        this.walls = new PIXI.Container();
    }

    initialize(app : PIXI.Application) {
        // Listen for animate update
        var lastTick = performance.now();

        let snapBack = false;
        viewport.addListener('moved-end', (event) => {snapBack = false;});
        viewport.addListener('drag-start', (event) => {snapBack = false;});

        if (this.player.cameraActor)
            viewport.snap(this.player.cameraActor.xx || 0, this.player.cameraActor.yy || 0, {ease: "easeInOutSine", time: 0, removeOnComplete: true});
        viewport.snapZoom({ease: "easeInOutSine", time: 1000, removeOnComplete: true, height: ratio > 1 ? (MIN_ZOOM * TILE_SIZE) : undefined, width: ratio <= 1 ? (MIN_ZOOM * TILE_SIZE) : undefined});

        app.ticker.add((delta: number) => {
            let d = performance.now() - lastTick;
            lastTick = performance.now();

            controlTicker(d, this.world, this.player);
            this.updateWorld();
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
        if (this.world) {
            let zone = this.world.zones[this.world.currentZone]
            if (zone) {
                if (this.walls)
                    viewport.removeChild(this.walls);
                delete this.walls;
                this.walls = new PIXI.Container();

                for (let i = 0; i < zone.height; i += 1) {
                    for (let ii = 0; ii < zone.width; ii += 1) {
                        let row = zone.walls[i];
                        if (row && row[ii]) {
                            let wall = row[ii] as number;
                            if (wall > 0) {
                                let texture = PIXI.RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE });
                                let r1 = new PIXI.Graphics();
                                r1.beginFill(0xFFFFFF);
                                r1.drawRect(0, 0, 64, 64);
                                r1.endFill();
                                renderer.render(r1,{renderTexture: texture})
                                let block = new PIXI.Sprite(texture);
                                block.position.x = TILE_SIZE*i;
                                block.position.y = TILE_SIZE*ii;
                                block.anchor.x = 0;
                                block.anchor.y = 0;
                                this.walls.addChild(block);
                            }
                        }
                    }
                }
                viewport.addChild(this.walls);
                viewport.worldWidth = TILE_SIZE * zone.width;
                viewport.worldHeight = TILE_SIZE * zone.height;
            }
        }
    }

    updateWorld() {
        // Update the walls
        let bounds = viewport.getVisibleBounds().pad(TILE_SIZE, TILE_SIZE);
        let walls = this.walls?.children;
        if (walls)
            for (let S of walls) {
                S.visible = bounds.contains(S.x, S.y);
            }
    }
}