import { World, WorldVec, } from "../world/world";
import { Wall, WallProperties, Zone } from '../world/zone';
import { textures } from "../gfx/sprites";
import { Player } from "./player";
import { renderer, TILE_SIZE, viewport } from '../gfx/render';
import { currentTargeting, mouseEnterUI, mouseEnterIntoActiveArea, mouseInActiveArea, mouseQueueEnterActiveArea, targetLocation, touchDown, UIModes, updateMouseTargeting, viewportMouseX, viewportMouseY, worldMouseX, worldMouseY, effTargetLocation, UIModeClick } from './control';
import { Sprite } from "@pixi/sprite";
import * as PIXI from 'pixi.js';
import { Viewport } from "pixi-viewport";
import * as filters from 'pixi-filters';
import { app, windowSize } from "../launcher";
import { cDist } from "../world/math";

let uiSprites = new Map<string, Sprite>();
let HUDMarkers = new PIXI.Container(); // Displayed on the field
let HUDScreen = new PIXI.Container(); // Displayed on the screen
let lastViewport : Viewport | undefined;

let spriteHover = new Map<string, number>();
let scaleHover = 1.2;
let currentClick = "";

let showUI = true;
let showMarkers = true;
interface MarkerType {
    name : string,
    radius? : number,
    sprite? : string,
}
export enum spriteTypeType {
    SPECIAl = "special",
    GENERIC = "generic",
}
export enum spriteTypeUI {
    MAIN = "main",
    MARKER = "marker",
}
export interface spriteType {
    type: spriteTypeType,
    ui: spriteTypeUI,
    radius? : number,
    sprite? : string,
};
let uiSpritesList : Record<string, {type: string, sprite: spriteType, quadrant?: number}> = {
    "reticule" : {type : "marker", sprite : {type: spriteTypeType.SPECIAl, ui: spriteTypeUI.MARKER}},
    "sprintmarker" : {type : "marker", sprite : {type: spriteTypeType.GENERIC, ui: spriteTypeUI.MARKER}},
    "interact" : {type : "toggle", sprite : {type: spriteTypeType.GENERIC, ui: spriteTypeUI.MAIN}, quadrant : 3},
    "follow" : {type : "toggle", sprite : {type: spriteTypeType.GENERIC, ui: spriteTypeUI.MAIN}, quadrant : 3},
    "sprint" : {type : "toggle", sprite : {type: spriteTypeType.GENERIC, ui: spriteTypeUI.MAIN}, quadrant : 3},
    //"safe" : {name : "toggle", type : {type: "generic_double", ui: "marker"}, , quadrant : 3},
};
/*
let genericMarkers : MarkerType[] = [
    {name : "sprintmarker", radius: TILE_SIZE},
];
let genericButtons : string[] = [
    "safe_off",
    "safe_on",
    "sprint_off",
    "sprint_on",
    "follow_off",
    "follow_on",
    "interact",
];*/

// This is for making things touch friendly
export function clearSpriteHover() {
    spriteHover = new Map<string, number>();
}

export enum TargetMode {
    MOVE = 0xffffff,
    AIM = 0xffDD44,
    ENCHANT = 0x88ff99,
    SPELL = 0x5588ff,
    INTERACT = 0xffff33,
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
        for (let spr in uiSpritesList) {
            if (uiSpritesList[spr]?.type == "toggle") {
                if (!uiSprites.get(spr + "_on")) renderUISprite(spr + "_on", world, zone, spr);
                if (!uiSprites.get(spr + "_off")) renderUISprite(spr + "_off", world, zone, spr);
            } else if (!uiSprites.get(spr)) renderUISprite(spr, world, zone, spr);
        }
        let reticule = uiSprites.get("reticule");
        let sprint = uiSprites.get("sprintmarker");
        /*
        let button_sprint_off = uiSprites.get("sprint_off");
        let button_sprint_on = uiSprites.get("sprint_on");
        let button_follow_off = uiSprites.get("follow_off");
        let button_follow_on = uiSprites.get("follow_on");
        let button_interact = uiSprites.get("interact");*/

        if (reticule) {
            if (world.player && mouseInActiveArea) {
                updateMouseTargeting(world);

                reticule.visible = showMarkers;
                reticule.x = TILE_SIZE * effTargetLocation.x;
                reticule.y = TILE_SIZE * effTargetLocation.y;
                reticule.tint = currentTargeting;

                if (sprint) {
                    if (currentTargeting == TargetMode.MOVE && UIModes["sprint"] && cDist({x: world.player.x - effTargetLocation.x, y: world.player.y - effTargetLocation.y}) > 1) {
                        sprint.visible = showMarkers;
                        sprint.x = TILE_SIZE * effTargetLocation.x;
                        sprint.y = TILE_SIZE * effTargetLocation.y;
                    } else {
                        sprint.visible = false;
                    }
                }
            } else {
                reticule.visible = false;
                if (sprint) sprint.visible = false;
            }
        }

        let minDimension = Math.min(windowSize.height, windowSize.width);
        let player = world.player;
        let bottomRightIndex = 0;
        let bottomLeftIndex = 0;
        let topRightIndex = 0;
        let topLeftIndex = 0;

        function getIndex(quadrant : number) {
            if (quadrant == 1) return topRightIndex;
            else if (quadrant == 2) return topLeftIndex;
            else if (quadrant == 3) return bottomLeftIndex;
            else return bottomRightIndex;
        }
        function setIndex(quadrant : number, amount : number) {
            if (quadrant == 1) topRightIndex += amount;
            else if (quadrant == 2) topLeftIndex += amount;
            else if (quadrant == 3) bottomLeftIndex += amount;
            else bottomRightIndex += amount;
        }
        function updateSingleButton(name : string, quadrant? : number) {
            let sprite = uiSprites.get(name);
            if (sprite) {
                let index = getIndex(quadrant ? quadrant : 3);

                let scale = spriteHover.get(name) || 1.0;
                sprite.visible = showUI;
                sprite.scale.x = scale * Math.min(0.15 * minDimension / sprite.texture.width, 1);
                sprite.scale.y = sprite.scale.x;
                sprite.x = windowSize.width - sprite.texture.width*0.5 * sprite.scale.x / scale - index;
                sprite.y = windowSize.height - sprite.texture.height*0.5 * sprite.scale.y / scale;

                setIndex(quadrant ? quadrant : 3, sprite.width / scale);
            }
        }
        function updateDoubleButton(name : string, quadrant? : number) {
            let sprite_on = uiSprites.get(name + "_on");
            let sprite_off = uiSprites.get(name + "_off");
            if (sprite_off && sprite_on) {
                let index = getIndex(quadrant ? quadrant : 3);

                let scale : number = spriteHover.get(name) || 1.0;
                sprite_off.visible = showUI && !(UIModes[name]);
                sprite_off.scale.x = scale * Math.min(0.15 * minDimension / sprite_off.texture.width, 1);
                sprite_off.scale.y = sprite_off.scale.x;
                sprite_off.x = windowSize.width - sprite_off.texture.width*0.5 * sprite_off.scale.x / scale - index;
                sprite_off.y = windowSize.height - sprite_off.texture.height*0.5 * sprite_off.scale.y / scale;

                sprite_on.visible = showUI && !sprite_off.visible;
                sprite_on.x = sprite_off.x;
                sprite_on.y = sprite_off.y;
                sprite_on.scale.x = sprite_off.scale.x;
                sprite_on.scale.y = sprite_off.scale.y;

                bottomRightIndex += sprite_on.width;

                setIndex(quadrant ? quadrant : 3, sprite_on.width / scale);
            }
        }

        if (player) {
            for (let spr in uiSpritesList) {
                let sprite = uiSpritesList[spr];
                if (sprite) {
                    if (sprite.type == "single") updateSingleButton(spr, sprite.quadrant);
                    else if (sprite.type == "toggle") updateDoubleButton(spr, sprite.quadrant);
                }
            }
        }

    }
}

function renderSpecialSprite(name : string, world : World, zone : Zone) {
    let ret : PIXI.Sprite | undefined;

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
    if (name == "sprint_marker") {
        let tex = textures.get("ui_sprint_on");
        if (tex) {
            ret = new PIXI.Sprite(tex);
            ret.position.x = 0;
            ret.position.y = 0;
            ret.scale.x = TILE_SIZE / tex.width;
            ret.scale.y = TILE_SIZE / tex.height;
            ret.anchor.x = 0.5;
            ret.anchor.y = 0.5;
            ret.visible = false;

            registerButton(name, ret);
        }
    }
    return ret;
}

function renderUISprite(name : string, world : World, zone : Zone, uiElementName : string) : PIXI.Sprite | undefined{
    let ret : PIXI.Sprite | undefined;

    function loadButton(str : string, sprite? : string) {
        ret = loadGenericButton(str, false, sprite, uiElementName);
    }

    let uiSprite = uiSpritesList[uiElementName];
    if (uiSprite) {
        let type = uiSprite.sprite;
        if (type) {
            if (type.type == spriteTypeType.GENERIC) {
                ret = loadGenericButton(name, type.ui == spriteTypeUI.MARKER, type.sprite, uiElementName);
            } else ret = renderSpecialSprite(name, world, zone);
            if (ret) {
                if (type.radius || type.ui == spriteTypeUI.MARKER) {
                    let rad = (type.radius != undefined) ? type.radius : TILE_SIZE;
                    ret.scale.x = rad / ret.texture.width;
                    ret.scale.y = rad / ret.texture.height;
                }

                if (type.ui == spriteTypeUI.MARKER) HUDMarkers.addChild(ret);
                else HUDScreen.addChild(ret);
                uiSprites.set(name, ret);
                return ret;
            }
        }
    }
    /*if (genericButtons.includes(name)) loadButton(name);
    else if (genericMarkers.some((element) => {return (element.name == name);})) {
        for (let gm of genericMarkers) {
            if (gm.name == name) {
                loadMarker(name, TILE_SIZE);
                break;
            }
        }
    }*/
    return undefined;
}

function loadGenericButton(name : string, marker: boolean, sprite? : string, uiElementName? : string) : PIXI.Sprite | undefined {
    let spr = sprite ? sprite : "ui_" + name;
    let tex = textures.get(spr);
    if (tex) {
        let ret : PIXI.Sprite | undefined;
        ret = new PIXI.Sprite(tex);
        ret.position.x = 0;
        ret.position.y = 0;
        if (!marker) {
            ret.anchor.x = 0.5;
            ret.anchor.y = 0.5;
        }
        ret.visible = false;

        if (!marker)
            registerButton(uiElementName? uiElementName : name, ret);
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
    currentClick = name;
}
function uiButtonClickEnd(name : string, event : Event) {
    spriteHover.set(name, 1.2);
    // Actually send the click
    if (currentClick == name)
        UIModeClick(name);

    if (currentClick == name)
        currentClick = "";
}
function uiButtonClickEndOutside(name : string) {
    spriteHover.set(name, 1.0);
    if (currentClick == name)
        currentClick = "";
}

function uiButtonOver(name : string) {
    spriteHover.set(name, 1.2);
    mouseEnterUI();
}

function uiButtonOut(name : string) {
    spriteHover.set(name, 1.0);
    mouseEnterIntoActiveArea();
    if (currentClick == name)
        currentClick = "";
}