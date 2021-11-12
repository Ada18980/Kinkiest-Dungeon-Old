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
import { renderSpecialSprite, uiSpritesList, spriteType, spriteTypeType, spriteTypeUI, QUADRANT, SpriteListed, uiScreens, renderTextSprite } from "./uiElements";
import { RRradius, screens, updateScreens } from "./screen";

export let uiSprites = new Map<string, Sprite>();
let HUDMarkers = new PIXI.Container(); // Displayed on the field
let HUDScreen = new PIXI.Container(); // Displayed on the screen
let lastViewport : Viewport | undefined;

let spriteHover = new Map<string, number>();
let spriteScale = new Map<string, number>();
let scaleHover = 1.2;
let currentClick = "";

let buttonSize = 0.15; // Fraction of screen for min button size

let showUI = true;
let showMarkers = true;


export function getQuadrantXY(quadrant? : QUADRANT, w? : number, h? : number) : {x: number, y: number} {
    if (!w) w = windowSize.width;
    if (!h) h = windowSize.height;
    switch (quadrant) {
        case QUADRANT.BOTTOMCENTER: return {x: w*0.5, y:h};
        case QUADRANT.TOPCENTER: return {x: w*0.5, y:h};
        case QUADRANT.LEFTCENTER: return {x: 0, y:h*0.5};
        case QUADRANT.RIGHTCENTER: return {x: w, y:h*0.5};
        case QUADRANT.BOTTOMLEFT: return {x: 0, y:h};
        case QUADRANT.TOPLEFT: return {x: 0, y:0};
        case QUADRANT.BOTTOMRIGHT: return {x: w, y:h};
        case QUADRANT.TOPRIGHT: return {x: w, y:0};
        case QUADRANT.TOPRIGHTCORNER: return {x: w + RRradius*0.7, y:-RRradius * 0.7};
        case QUADRANT.TOPRIGHTVERTICAL: return {x: w, y:0};
        case QUADRANT.TOPLEFTVERTICAL: return {x: 0, y:0};
    }
    return {x:0, y:0};
}

export function getQuadrantMult(quadrant? : QUADRANT) : {x: number, y: number} {
    switch (quadrant) {
        case QUADRANT.BOTTOMCENTER: return {x: 0, y:-0.5};
        case QUADRANT.TOPCENTER: return {x: 0, y:0.5};
        case QUADRANT.LEFTCENTER: return {x: 0.5, y:0};
        case QUADRANT.RIGHTCENTER: return {x: -0.5, y:0};
        case QUADRANT.BOTTOMLEFT: return {x: 0.5, y:-0.5};
        case QUADRANT.TOPLEFT: return {x: 0.5, y:0.5};
        case QUADRANT.BOTTOMRIGHT: return {x: -0.5, y:-0.5};
        case QUADRANT.TOPRIGHT: return {x: -0.5, y:0.5};
        case QUADRANT.TOPRIGHTCORNER: return {x: -0.5, y:0.5};
        case QUADRANT.TOPRIGHTVERTICAL: return {x: -0.5, y:0.5};
        case QUADRANT.TOPLEFTVERTICAL: return {x: 0.5, y:0.5};
    }
    return {x:0, y:0};
}

export function getQuadrantIndexMod(quadrant? : QUADRANT) : {x: number, y: number} {
    switch (quadrant) {
        case QUADRANT.BOTTOMCENTER: return {x: 0, y:-1};
        case QUADRANT.TOPCENTER: return {x: 0, y:1};
        case QUADRANT.LEFTCENTER: return {x: 1, y:0};
        case QUADRANT.RIGHTCENTER: return {x: -1, y:0};
        case QUADRANT.BOTTOMLEFT: return {x: 1, y:0};
        case QUADRANT.TOPLEFT: return {x: 1, y:0};
        case QUADRANT.BOTTOMRIGHT: return {x: -1, y:0};
        case QUADRANT.TOPRIGHT: return {x: -1, y:0};
        case QUADRANT.TOPRIGHTCORNER: return {x: -1, y:0};
        case QUADRANT.TOPRIGHTVERTICAL: return {x: 0, y:1};
        case QUADRANT.TOPLEFTVERTICAL: return {x: 0, y:1};
    }
    return {x:0, y:0};
}


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

export function renderHUD(world : World | undefined) {
    updateScreens();

    if (lastViewport != viewport) {
        if (lastViewport) {
            lastViewport.removeChild(HUDMarkers);
        }
        lastViewport = viewport;
        viewport.addChild(HUDMarkers);
    }

    let zone = world ? world.zones[world.currentZone] : undefined;

    function uiSpritePopulate(spr : string, oldname? :string) {
        let name = oldname ? oldname : spr;
        if (uiSpritesList[name]?.type == "toggle") {
            if (!uiSprites.get(spr + "_on")) renderUISprite(spr + "_on", world, zone, spr, oldname);
            if (!uiSprites.get(spr + "_off")) renderUISprite(spr + "_off", world, zone, spr, oldname);
        } else if (!uiSprites.get(spr)) renderUISprite(spr, world, zone, spr, oldname);
    }

    for (let s of screens) {
        let screen = s[1];
        if (screen && screen.cont.visible) {

            for (let spr in uiSpritesList) {
                if (uiSpritesList[spr]?.sprite.ui == spriteTypeUI.SCREEN) {
                    //console.log(uiSprites.get(s[0] + "|" + spr))
                    uiSpritePopulate(s[0] + "|" + spr, spr);
                }
            }
        }
    }
    for (let spr in uiSpritesList) {
        if (uiSpritesList[spr]?.sprite.ui != spriteTypeUI.SCREEN) uiSpritePopulate(spr);
    }
    let reticule = uiSprites.get("reticule");
    let sprint = uiSprites.get("sprintmarker");
    /*
    let button_sprint_off = uiSprites.get("sprint_off");
    let button_sprint_on = uiSprites.get("sprint_on");
    let button_follow_off = uiSprites.get("follow_off");
    let button_follow_on = uiSprites.get("follow_on");
    let button_interact = uiSprites.get("interact");*/

    if (reticule && world) {
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
    let player = world ? world.player : undefined;

    function getIndex(quadrant? : QUADRANT, screen: string = "main") : number {
        if (quadrant == QUADRANT.BOTTOMRIGHT) return quadrantIndex.get(quadrant)?.get(screen) || 0;
        else if (quadrant == QUADRANT.TOPRIGHT) return quadrantIndex.get(quadrant)?.get(screen) || 0;
        else if (quadrant == QUADRANT.TOPLEFT) return quadrantIndex.get(quadrant)?.get(screen) || 0;
        else if (quadrant == QUADRANT.BOTTOMLEFT) return quadrantIndex.get(quadrant)?.get(screen) || 0;
        return 0;
    }
    function setIndex(quadrant : number, amount : QUADRANT, screen: string = "main") {
        if (quadrant == QUADRANT.BOTTOMRIGHT) quadrantIndex.get(quadrant)?.set(screen, (quadrantIndex.get(quadrant)?.get(screen) || 0) + amount);
        else if (quadrant == QUADRANT.TOPRIGHT) quadrantIndex.get(quadrant)?.set(screen, (quadrantIndex.get(quadrant)?.get(screen) || 0) + amount);
        else if (quadrant == QUADRANT.TOPLEFT) quadrantIndex.get(quadrant)?.set(screen, (quadrantIndex.get(quadrant)?.get(screen) || 0) + amount);
        else if (quadrant == QUADRANT.BOTTOMLEFT) quadrantIndex.get(quadrant)?.set(screen, (quadrantIndex.get(quadrant)?.get(screen) || 0) + amount);
    }
    function updateSingleButton(name : string, quadrant? : QUADRANT, show : boolean = showUI, screen : string = "main", w? : number, h? : number) {

        let sprite = uiSprites.get(name);
        if (sprite) {
            let index = getIndex(quadrant, screen);

            let scale = spriteHover.get(name) || 1.0;
            let ss = spriteScale.get(name);
            sprite.visible = show;
            sprite.scale.x = scale * (ss ? ss : Math.min(buttonSize * minDimension / sprite.texture.width, 1));
            sprite.scale.y = sprite.scale.x;
            sprite.x = getQuadrantXY(quadrant, w, h).x + sprite.texture.width*getQuadrantMult(quadrant).x * sprite.scale.x / scale + getQuadrantIndexMod(quadrant).x * index;
            sprite.y = getQuadrantXY(quadrant, w, h).y + sprite.texture.height*getQuadrantMult(quadrant).y * sprite.scale.y / scale + getQuadrantIndexMod(quadrant).y * index;

            if (quadrant != undefined) setIndex(quadrant, sprite.width / scale, screen);
        }
    }
    function updateDoubleButton(name : string, quadrant? : QUADRANT, show : boolean = showUI, screen : string = "main", w? : number, h? : number) {
        let sprite_on = uiSprites.get(name + "_on");
        let sprite_off = uiSprites.get(name + "_off");
        if (sprite_off && sprite_on) {
            let index = getIndex(quadrant, screen);

            let scale : number = spriteHover.get(name) || 1.0;
            let ss = spriteScale.get(name);
            sprite_off.visible = show && !(UIModes[name]);
            sprite_off.scale.x = scale * (ss ? ss : Math.min(buttonSize * minDimension / sprite_off.texture.width, 1));
            sprite_off.scale.y = sprite_off.scale.x;
            sprite_off.x = getQuadrantXY(quadrant, w, h).x + sprite_off.texture.width*getQuadrantMult(quadrant).x * sprite_off.scale.x / scale + getQuadrantIndexMod(quadrant).x * index;
            sprite_off.y = getQuadrantXY(quadrant, w, h).y + sprite_off.texture.height*getQuadrantMult(quadrant).y * sprite_off.scale.y / scale + getQuadrantIndexMod(quadrant).y * index;

            sprite_on.visible = show && !sprite_off.visible;
            sprite_on.x = sprite_off.x;
            sprite_on.y = sprite_off.y;
            sprite_on.scale.x = sprite_off.scale.x;
            sprite_on.scale.y = sprite_off.scale.y;

            //bottomRightIndex += sprite_on.width;
            if (quadrant != undefined) setIndex(quadrant, sprite_on.width / scale, screen);
        }
    }

    function updateSprite(sprite : SpriteListed, prefix : string, spr : string, show : boolean = showUI, screen : string = "main", w? : number, h? : number) {

        if (sprite.type == "single") updateSingleButton(prefix + spr, sprite.quadrant, show, screen, w, h);
        else if (sprite.type == "toggle") updateDoubleButton(prefix + spr, sprite.quadrant, show, screen, w, h);
    }

    /*
    let bottomRightIndex = 0;
    let bottomLeftIndex = 0;
    let topRightIndex = 0;
    let topLeftIndex = 0;*/
    let quadrantIndex = new Map<QUADRANT, Map<string, number>>();
    for (const quad of Object.values(QUADRANT)) {
        const map = new Map<string, number>();
        map.set("main", 0);
        for (let s of screens) {
            map.set(s[0], 0);
        }
        quadrantIndex.set(quad as QUADRANT, map);
    }
    for (const spr in uiSpritesList) {
        let sprite = uiSpritesList[spr];
        if (sprite) {
            if (sprite.sprite.ui == spriteTypeUI.SCREEN) {

                for (let screen of screens) {
                    if (!sprite.sprite.screen || screen[0] == sprite.sprite.screen) {
                        let w = (uiScreens[screen[0]]?.width || 1) * windowSize.height;
                        let h = (uiScreens[screen[0]]?.height || 1) * windowSize.height;
                        updateSprite(sprite, screen[0] + "|", spr, screen[1].cont.visible, screen[0], w, h);
                    }
                }
            } else {
                updateSprite(sprite, "", spr);
            }

        }
    }
}

function renderUISprite(name : string, world : World | undefined, zone : Zone | undefined, uiElementName : string, origName? : string) : PIXI.Sprite | undefined{
    let orig = origName ? origName : uiElementName;
    let origSprite = origName ? origName : name;
    let ret : PIXI.Sprite | undefined;

    function loadButton(str : string, sprite? : string) {
        ret = loadGenericButton(str, false, sprite, uiElementName);
    }

    let uiSprite = uiSpritesList[orig];
    if (uiSprite) {

        let type = uiSprite.sprite;
        if (type) {

            // We dont run this if there is not a relevant screen
            let screenToRender : string | undefined;
            if (type.ui == spriteTypeUI.SCREEN) {
                if (!type.screen || screens.get(type.screen)) {
                    // We found a screen, now check if it's visible
                    let sucess = false;
                    for (let s of screens) {
                        if (!type.screen || s[0] == type.screen) {

                            let screen = s[1];
                            if (screen && screen.cont.visible) {
                                screenToRender = s[0];
                                sucess = true;
                                break;
                            }
                        }
                    }
                    if (!sucess) return undefined;
                } else return undefined;
            }

            if (type.type == spriteTypeType.GENERIC) {
                ret = loadGenericButton(origSprite, type.ui == spriteTypeUI.MARKER, type.sprite, uiElementName);
            } else if (type.type == spriteTypeType.SPECIAL) {
                ret = renderSpecialSprite(origSprite, world, zone);
            } else if (type.type == spriteTypeType.TEXT && type.text) {
                ret = renderTextSprite(origSprite, world, zone, type.text, type.radius ? (type.radius * windowSize.height) : 12, type.wrap);
            }
            if (ret) {

                if (type.type != spriteTypeType.TEXT)
                    if (type.radius || type.ui == spriteTypeUI.MARKER) {
                        if (type.ui == spriteTypeUI.MARKER) {
                            let rad = (type.radius != undefined) ? type.radius * TILE_SIZE : TILE_SIZE;
                            ret.scale.x = rad / ret.texture.width;
                            ret.scale.y = rad / ret.texture.height;
                        } else if (type.radius) {
                            let rad = type.radius * windowSize.height;
                            spriteScale.set(name, rad / ret.texture.height)
                        }

                    }
                let set = false;
                if (type.ui == spriteTypeUI.MARKER) {HUDMarkers.addChild(ret); set = true;}
                else if (type.ui == spriteTypeUI.MAIN) {HUDScreen.addChild(ret); set = true;}
                else if (type.ui == spriteTypeUI.SCREEN && screenToRender) {
                    let screen = screens.get(screenToRender);
                    if (screen) {
                        screen.cont.addChild(ret);
                        set = true;
                    }
                }
                if (set) {
                    uiSprites.set(name, ret);
                }
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

export function registerButton(name : string, button : PIXI.Sprite) {
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