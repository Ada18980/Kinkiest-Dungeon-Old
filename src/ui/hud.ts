import { WallProperties, World, WorldVec } from "../world/world";
import { Player } from "./player";
import { renderer, TILE_SIZE, viewport } from '../gfx/render';
import { currentTargeting, mouseInActiveArea, targetLocation, updateMouseTargeting, viewportMouseX, viewportMouseY, worldMouseX, worldMouseY } from './control';
import { Sprite } from "@pixi/sprite";
import * as PIXI from 'pixi.js';
import { Viewport } from "pixi-viewport";
import * as filters from 'pixi-filters';

let uiSprites = new Map<string, Sprite>();
let HUD = new PIXI.Container();
let lastViewport : Viewport | undefined;

export enum TargetMode {
    MOVE = 0xffffff,
    FASTMOVE = 0xffff22,
    AIM = 0xffDD44,
    ENCHANT = 0x88ff99,
    INTERACT = 0x5588ff,
}


export function renderHUD(world : World) {
    if (lastViewport != viewport) {
        if (lastViewport) lastViewport.removeChild(HUD);
        lastViewport = viewport;
        viewport.addChild(HUD);
        HUD.zIndex = 100; // Render over all
    }

    let zone = world.zones[world.currentZone];
    if (zone) {
        // Render all the UI sprites
        let reticule = uiSprites.get("reticule");
        if (!reticule) {
            let tex = PIXI.RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE });
            let r1 = new PIXI.Graphics();
            r1.beginFill(0xffffff);
            r1.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            r1.endFill();
            r1.beginHole();
            let holethickness = 2;
            r1.drawRect(holethickness, holethickness, TILE_SIZE - holethickness*2.0, TILE_SIZE - holethickness*2.0);
            r1.endFill();
            renderer.render(r1,{renderTexture: tex});

            let ret = new PIXI.Sprite(tex);
            ret.position.x = 0;
            ret.position.y = 0;
            ret.anchor.x = 0;
            ret.anchor.y = 0;
            ret.filters = [new filters.BloomFilter(5)]
            HUD.addChild(ret);
            uiSprites.set("reticule", ret);
            reticule = ret;
        }
        if (reticule) {
            if (world.player && mouseInActiveArea) {
                updateMouseTargeting(world);

                reticule.visible = true;
                reticule.x = TILE_SIZE * targetLocation.x;
                reticule.y = TILE_SIZE * targetLocation.y;
                reticule.tint = currentTargeting;
            } else {
                reticule.visible = false;
            }
        }
    }

}