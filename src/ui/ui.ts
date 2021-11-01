import { Viewport } from "pixi-viewport";
import { Wall, World, Zone } from "../world/world";
import * as PIXI from 'pixi.js';
import * as filters from 'pixi-filters';
import { MAX_ZOOM, MIN_ZOOM, TILE_SIZE, renderer, viewport } from '../gfx/render';
import { mouseLeftDown, mouseRightDown, mouseMiddleDown, initControls, controlTick, controlTicker } from './control';
import { ratio } from '../launcher';

import { Player } from './player';
import { Actor } from '../world/actor';
import { getGeneralSprite } from "../gfx/sprites";

export class UI {
    player : Player;
    world : World;
    walls : PIXI.Container | undefined;
    light : PIXI.Container | undefined;
    currentZone : Zone | undefined;
    currentLighting : number[][] | undefined;

    constructor(player: Actor, world : World) {
        this.player = new Player(player);
        this.world = world;
        this.walls = new PIXI.Container();
        this.light = new PIXI.Container();
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
                this.loadWorld();
            }

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
        // Verify all items are loaded
        let requiredSprites = [{sprite: "bricks", anim: ["floor",
                                "pillar", "call", "n",
                                "lcu", "lcd", "lcud",
                                "rcu", "rcd", "rcud",
                                "ucl", "ucr", "uclr",
                                "dcl", "dcr", "dclr",
                                "urc", "ulc", "drc", "dlc",
                                "cdr", "cur", "cdl", "cul",
                                "cndr", "cnur", "cndl", "cnul",
                                "cl", "cr", "cu", "cd",
                                "cfor", "cback",
                                "lru", "lrd", "udr", "udl",
                                "r", "l", "d", "u",
                                "lr", "ud", "dl", "dr", "ul", "ur"]}];

        for (let rs of requiredSprites) {
            if (!getGeneralSprite(rs.sprite)) return;
        }

        let textures = new Map<string, PIXI.Texture>();
        for (let rs of requiredSprites) {
            for (let rsa of rs.anim) {
                //let texture = PIXI.RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE });
                let genSprite = getGeneralSprite(rs.sprite);
                if (genSprite) {
                    let animsprite = genSprite.animations.get(rsa);
                    if (animsprite) {
                        let layer = animsprite.get("tile");
                        if (layer && layer.sprite.textures) {
                            let tex = layer.sprite.textures[0] as PIXI.Texture<PIXI.Resource>;
                            if (tex){
                                textures.set(rs.sprite + rsa, tex);
                            }
                            //renderer.render(layer.sprite.textures[0],{renderTexture: texture})
                        } else console.log("Layer not found" + animsprite.keys);
                    } else console.log("Anim not found: " + rsa);
                } else console.log("Sprite not found");
            }
        }

        let lighttex = PIXI.RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE });
        let r1 = new PIXI.Graphics();
        r1.beginFill(0x000000);
        r1.drawRect(0, 0, 64, 64);
        r1.endFill();
        renderer.render(r1,{renderTexture: lighttex});

        const outlineFilter = new filters.OutlineFilter(6, 0x000000);

        if (this.world) {
            let zone = this.world.zones[this.world.currentZone]
            if (zone) {
                if (this.walls)
                    viewport.removeChild(this.walls);

                if (this.light)
                    viewport.removeChild(this.light);
                delete this.walls;
                this.walls = new PIXI.Container();

                delete this.light;
                this.light = new PIXI.Container();

                for (let i = 0; i < zone.height; i += 1) {
                    for (let ii = 0; ii < zone.width; ii += 1) {
                        let row = zone.walls[i];
                        if (row && row[ii] != undefined) {
                            let wall = row[ii] as number;
                            if (wall > -1) {
                                let suff = (wall == Wall.WALL) ? zone.getWallDirection(ii, i) :
                                    ("floor");
                                let tex = textures.get("bricks" + suff);
                                if (tex) {
                                    let block = new PIXI.Sprite(tex);
                                    block.position.x = TILE_SIZE*ii;
                                    block.position.y = TILE_SIZE*i;
                                    block.anchor.x = 0;
                                    block.anchor.y = 0;
                                    this.walls.addChild(block);
                                } else console.log("Tex not found: bricks" + suff);
                            }
                            if (lighttex) {
                                let block = new PIXI.Sprite(lighttex);
                                block.position.x = TILE_SIZE*ii;
                                block.position.y = TILE_SIZE*i;
                                block.anchor.x = 0;
                                block.anchor.y = 0;
                                this.light.addChild(block);
                            } else console.log("Light tex not found!!!!");
                        }
                    }
                }
                viewport.addChild(this.walls);
                viewport.addChild(this.light);
                this.light.filters = [outlineFilter];
                viewport.worldWidth = TILE_SIZE * zone.width;
                viewport.worldHeight = TILE_SIZE * zone.height;
            }
            this.currentZone = zone;
        }

        console.log(textures)
    }

    updateWorld() {

        // Update the walls
        let bounds = viewport.getVisibleBounds().pad(TILE_SIZE, TILE_SIZE);
        let walls = this.walls?.children;
        let light = this.light?.children;
        if (walls)
            for (let S of walls) {
                S.visible = bounds.contains(S.x, S.y);
            }
        let t1 = 1.0/TILE_SIZE;
        if (light && this.currentZone)
            for (let S of light) {
                S.visible = bounds.contains(S.x, S.y);
                if (S.visible) {
                    let weight = 10.0;
                    S.alpha = (S.alpha * 10.0 + (1.0 - Math.min(1.0, 1.2*this.currentZone.getLight(S.x*t1, S.y*t1)))) / (1.0 + weight);
                    if (S.alpha < 0.01) S.alpha = 0.0;
                }
            }
    }
}