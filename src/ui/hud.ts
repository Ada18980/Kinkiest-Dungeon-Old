import { WallProperties, World, WorldVec, Zone } from "../world/world";
import { textures } from "../gfx/sprites";
import { Player } from "./player";
import { renderer, TILE_SIZE, viewport } from '../gfx/render';
import { currentTargeting, mouseEnterUI, mouseEnterIntoActiveArea, mouseInActiveArea, mouseQueueEnterActiveArea, targetLocation, touchDown, UIModes, updateMouseTargeting, viewportMouseX, viewportMouseY, worldMouseX, worldMouseY } from './control';
import { Sprite } from "@pixi/sprite";
import * as PIXI from 'pixi.js';
import { Viewport } from "pixi-viewport";
import * as filters from 'pixi-filters';
import { app, windowSize } from "../launcher";

let uiSprites = new Map<string, Sprite>();
let HUDMarkers = new PIXI.Container(); // Displayed on the field
let HUDScreen = new PIXI.Container(); // Displayed on the screen
let lastViewport : Viewport | undefined;

let spriteHover = new Map<string, number>();
let scaleHover = 1.2;

// This is for making things touch friendly
export function clearSpriteHover() {
    spriteHover = new Map<string, number>();
}

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
        if (!reticule) {
            reticule = renderUISprite("reticule", world, zone);
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
            let button_follow = uiSprites.get("follow");
            let button_follow_on = uiSprites.get("follow_on");
            if (!button_follow) {
                button_follow = renderUISprite("follow", world, zone);
            }
            if (!button_follow_on) {
                button_follow_on = renderUISprite("follow_on", world, zone);
            }
            if (button_follow && button_follow_on) {
                let scale = spriteHover.get("follow") || 1.0;
                button_follow.visible = true;
                button_follow.scale.x = scale * Math.min(0.25 * minDimension / button_follow.texture.width, 1);
                button_follow.scale.y = button_follow.scale.x;
                button_follow.x = button_follow.texture.width/2 * button_follow.scale.x / scale;
                button_follow.y = button_follow.texture.height/2 * button_follow.scale.y / scale;

                button_follow_on.visible = UIModes.follow && button_follow.visible;
                button_follow_on.x = button_follow.x;
                button_follow_on.y = button_follow.y;
                button_follow_on.scale.x = button_follow.scale.x;
                button_follow_on.scale.y = button_follow.scale.y;
            }
            let button_interact = uiSprites.get("interact");
            if (!button_interact) {
                button_interact = renderUISprite("interact", world, zone);
            }
            if (button_interact) {
                let scale = spriteHover.get("interact") || 1.0;
                button_interact.visible = true;
                button_interact.scale.x = scale * Math.min(0.25 * minDimension / button_interact.texture.width, 1);
                button_interact.scale.y = button_interact.scale.x;
                button_interact.x = windowSize.width - button_interact.texture.width/2 * button_interact.scale.x / scale;
                button_interact.y = windowSize.height - button_interact.texture.height/2 * button_interact.scale.y / scale;
            }
        }

    }
}

function renderUISprite(name : string, world : World, zone : Zone) : PIXI.Sprite | undefined{
    let ret : PIXI.Sprite | undefined;
    let ui = false;
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

        ret = new PIXI.Sprite(tex);
        ret.position.x = 0;
        ret.position.y = 0;
        ret.anchor.x = 0;
        ret.anchor.y = 0;
        ret.visible = false;
        ret.filters = [new filters.BloomFilter(5)]
    }
    if (name == "follow") {
        ui = true;
        let tex = textures.get("ui_follow");
        if (tex) {
            ret = new PIXI.Sprite(tex);
            ret.position.x = 0;
            ret.position.y = 0;
            ret.anchor.x = 0.5;
            ret.anchor.y = 0.5;
            ret.visible = false;

            registerButton(name, ret);
        }
    }
    if (name == "follow_on") {
        ui = true;
        let tex = textures.get("ui_follow_on");
        if (tex) {
            ret = new PIXI.Sprite(tex);
            ret.position.x = 0;
            ret.position.y = 0;
            ret.anchor.x = 0.5;
            ret.anchor.y = 0.5;
            ret.visible = false;
        }
    }
    if (name == "interact") {
        ui = true;
        let tex = textures.get("ui_interact");
        if (tex) {
            ret = new PIXI.Sprite(tex);
            ret.position.x = 0;
            ret.position.y = 0;
            ret.anchor.x = 0.5;
            ret.anchor.y = 0.5;
            ret.visible = false;

            registerButton(name, ret);
        }
    }
    if (ret) {
        if (ui)
            HUDScreen.addChild(ret);
        else
            HUDMarkers.addChild(ret);
        uiSprites.set(name, ret);
        return ret;
    }
    return undefined;
}

function registerButton(name : string, button : PIXI.Sprite) {
    button.interactive = true;
    button  .on('pointerdown', (event) => uiButtonClick(name, event))
            .on('pointerup', (event) => uiButtonClickEnd(name, event))
            .on('pointerupout', (event) => uiButtonClickEndOutside(name))
            .on('pointerover', (event) => uiButtonOver(name))
            .on('pointerout', (event) => uiButtonOut(name));
}

function uiButtonClick(name : string, event : Event) {
    mouseEnterUI();
    spriteHover.set(name, 1.1);
}
function uiButtonClickEnd(name : string, event : Event) {
    spriteHover.set(name, 1.2);
    // Actually send the click

}
function uiButtonClickEndOutside(name : string) {
    spriteHover.set(name, 1.0);
}

function uiButtonOver(name : string) {
    spriteHover.set(name, 1.2);
    mouseEnterUI();
}

function uiButtonOut(name : string) {
    spriteHover.set(name, 1.0);
    mouseEnterIntoActiveArea();
}