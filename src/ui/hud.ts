import { WallProperties, World, WorldVec, Zone } from "../world/world";
import { textures } from "../gfx/sprites";
import { Player } from "./player";
import { renderer, TILE_SIZE, viewport } from '../gfx/render';
import { currentTargeting, mouseInActiveArea, targetLocation, updateMouseTargeting, viewportMouseX, viewportMouseY, worldMouseX, worldMouseY } from './control';
import { Sprite } from "@pixi/sprite";
import * as PIXI from 'pixi.js';
import { Viewport } from "pixi-viewport";
import * as filters from 'pixi-filters';
import { app, windowSize } from "../launcher";

let uiSprites = new Map<string, Sprite>();
let HUDMarkers = new PIXI.Container(); // Displayed on the field
let HUDScreen = new PIXI.Container(); // Displayed on the screen
let lastViewport : Viewport | undefined;

export enum TargetMode {
    MOVE = 0xffffff,
    FASTMOVE = 0xffff22,
    AIM = 0xffDD44,
    ENCHANT = 0x88ff99,
    INTERACT = 0x5588ff,
}

export function addHudElements(stage : PIXI.Container, viewport : Viewport) {
    if (lastViewport) {
        lastViewport.removeChild(HUDMarkers);
    }
    lastViewport = viewport;
    viewport.addChild(HUDMarkers);
    HUDMarkers.zIndex = 100;

    stage.addChild(HUDScreen);
    HUDScreen.zIndex = 1000;
}

export function renderHUD(world : World) {
    if (lastViewport != viewport) {
        if (lastViewport) {
            lastViewport.removeChild(HUDMarkers);
        }
        lastViewport = viewport;
        viewport.addChild(HUDMarkers);
    }

    let zone = world.zones[world.currentZone];
    if (zone) {
        let reticule = uiSprites.get("reticule");
        let button_follow = uiSprites.get("follow");
        if (!reticule) {
            reticule = renderUISprite("reticule", world, zone);
        }
        if (!button_follow) {
            button_follow = renderUISprite("follow", world, zone);
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
        let minDimension = Math.min(windowSize.height, windowSize.width);
        let player = world.player;
        if (player) {
            if (button_follow) {
                button_follow.visible = true;
                button_follow.x = 0;
                button_follow.y = 0;
                button_follow.scale.x = Math.min(0.4 * minDimension / button_follow.texture.width, 1);
                button_follow.scale.y = button_follow.scale.x;
            }
        }
    }
}

function renderUISprite(name : string, world : World, zone : Zone) : PIXI.Sprite | undefined{

    if (name == "reticule") {
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
        ret.visible = false;
        ret.filters = [new filters.BloomFilter(5)]
        HUDMarkers.addChild(ret);
        uiSprites.set("reticule", ret);
        return ret;
    }
    if (name == "follow") {
        let tex = textures.get("ui_follow");
        if (tex) {
            let ret = new PIXI.Sprite(tex);
            ret.position.x = 0;
            ret.position.y = 0;
            ret.anchor.x = 0;
            ret.anchor.y = 0;
            ret.visible = false;
            HUDScreen.addChild(ret);
            uiSprites.set("follow", ret);
            return ret;
        }
    }
    return undefined;
}