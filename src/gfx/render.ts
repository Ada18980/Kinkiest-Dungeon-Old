
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport'
import { Wall, World, Zone } from '../world/world';
import { getGeneralSprite } from "../gfx/sprites";
import * as filters from 'pixi-filters';

export const TILE_SIZE = 64;
export const MIN_ZOOM = 5; // In tiles
export const MAX_ZOOM = 25; // In Tiles

export let renderer: PIXI.Renderer;
export let viewport: Viewport;

export function setRenderer(r : PIXI.Renderer) {
    renderer = r;
}

export function setViewport(v : Viewport) {
    viewport = v;
}

let blurQuality : number | undefined = 8; // scale of 8 to 2 or OFF
let blurQualityMax : 8; // scale of 8 to 2 or OFF
let blurQualityMin : 2; // scale of 8 to 2 or OFF

let walls = new PIXI.Container();
let light = new PIXI.Container();
let fog = new PIXI.Container();

let textures : Map<string, PIXI.Texture> = new Map<string, PIXI.Texture>();

export function renderWorld(world : World) {

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

    textures = new Map<string, PIXI.Texture>();
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


    const outlineFilter = new filters.OutlineFilter(24, 0x000000);
    const fogFilter = new PIXI.filters.BlurFilter(28.0, blurQuality);//

    if (world) {
        let zone = world.zones[world.currentZone]
        if (zone) {
            if (walls)
                viewport.removeChild(walls);
            if (light)
                viewport.removeChild(light);
            if (fog)
                viewport.removeChild(fog);

            walls = new PIXI.Container();
            light = new PIXI.Container();
            fog = new PIXI.Container();

            for (let i = 0; i < zone.height; i += 1) {
                for (let ii = 0; ii < zone.width; ii += 1) {
                    let row = zone.walls[i];
                    if (row && row[ii] != undefined) {
                        let wall = row[ii] as number;
                        if (wall > -1) {
                            let suff = (wall == Wall.WALL) ? zone.getWallDirection(ii, i) :
                                ("floor");
                            let tex = textures.get("bricksfloor");
                            if (tex) {
                                let block = new PIXI.Sprite(tex);
                                block.position.x = TILE_SIZE*ii;
                                block.position.y = TILE_SIZE*i;
                                block.anchor.x = 0;
                                block.anchor.y = 0;
                                walls.addChild(block);
                            } else console.log("Tex not found: bricks" + suff);
                        }
                        if (lighttex) {
                            let block = new PIXI.Sprite(lighttex);
                            block.position.x = TILE_SIZE*ii;
                            block.position.y = TILE_SIZE*i;
                            block.anchor.x = 0;
                            block.anchor.y = 0;
                            light.addChild(block);

                            block = new PIXI.Sprite(lighttex);
                            block.position.x = TILE_SIZE*ii;
                            block.position.y = TILE_SIZE*i;
                            block.anchor.x = 0;
                            block.anchor.y = 0;
                            fog.addChild(block);
                        } else console.log("Light tex not found!!!!");
                    }
                }
            }
            viewport.addChild(walls);
            viewport.addChild(light);
            if (blurQuality != blurQualityMin || !blurQuality) {
                fog.filters = [outlineFilter, fogFilter];
                viewport.addChild(fog);
            } else {
                viewport.removeChild(fog);
            }
            viewport.worldWidth = TILE_SIZE * zone.width;
            viewport.worldHeight = TILE_SIZE * zone.height;
            return true;
        }
    }
    return false;
}

let lastBounds = new PIXI.Rectangle(0, 0, 1, 1);

export function updateWorldRender(zone : Zone) {
    //if (this.lastBounds != viewport.getVisibleBounds()) {
        // Update the walls
        let bounds = viewport.getVisibleBounds().pad(TILE_SIZE, TILE_SIZE);
        let cwalls = walls.children;
        let clight = light.children;
        let cfog = fog.children;
        let t1 = 1.0/TILE_SIZE;
        for (let S of cwalls) {
            S.visible = bounds.contains(S.x, S.y);

            if (S.visible) {
                let li = zone.getLight(S.x*t1, S.y*t1);
                let wall = zone.get(S.x*t1, S.y*t1);
                if (li > 0 && wall == Wall.WALL) {
                    let suff = zone.getWallDirectionVision(S.x*t1, S.y*t1, true);
                    let tex = textures.get("bricks" + suff);
                    if (tex) {
                        (S as PIXI.Sprite).texture = tex;
                    }
                }
            }
        }
        if (blurQuality != blurQualityMin || !blurQuality) {
            for (let S of clight) {
                S.visible = bounds.contains(S.x, S.y);
                if (S.visible) {
                    let weight = 50.0;
                    let li = zone.getLight(S.x*t1, (S.y)*t1);
                    let wa = zone.get(S.x*t1, (S.y)*t1);

                    if (li > 0 && !wa) {
                        S.visible = false;
                        S.alpha = 0.0;
                    } else {
                        S.alpha = (S.alpha * weight + (1.0 - Math.min(1.0, 1.2*li))) / (1.0 + weight);
                        if (S.alpha < 0.01) S.alpha = 0.0;
                        if (S.alpha > 0.99) S.alpha = 1.0;
                    }
                }
            }
            for (let S of cfog) {
                S.visible = bounds.contains(S.x, S.y);
                if (S.visible) {
                    let weight = 50.0;
                    let li = zone.getLight(S.x*t1, (S.y)*t1);

                    if (li == 0) weight = 25.0;
                    S.alpha = (S.alpha * weight + (1.0 - Math.min(1.0, 1.2*li))) / (1.0 + weight);
                    if (S.alpha < 0.01) S.alpha = 0.0;
                    if (S.alpha > 0.99) S.alpha = 1.0;
                }
            }
        } else {
            for (let S of clight) {
                S.visible = bounds.contains(S.x, S.y);
                if (S.visible) {
                    let weight = 25.0;
                    let li = zone.getLight(S.x*t1, (S.y)*t1);

                    S.alpha = (S.alpha * weight + (1.0 - Math.min(1.0, 1.2*li))) / (1.0 + weight);
                    if (S.alpha < 0.01) S.alpha = 0.0;
                    if (S.alpha > 0.99) S.alpha = 1.0;
                }
            }
        }
        //this.lastBounds = viewport.getVisibleBounds();
    //}
}