import { renderer, TILE_SIZE } from "../gfx/render";
import { windowSize } from "launcher";
import { Strings, textGet } from "../string/text";
import { World } from "../world/world";
import { Zone } from "../world/zone";
import { registerButton,  } from "./hud";
import * as PIXI from 'pixi.js';
import { Sprite } from "@pixi/sprite";
import * as filters from 'pixi-filters';
import { textures } from "../gfx/sprites";


export enum QUADRANT {
    BOTTOMLEFT = 3,
    BOTTOMRIGHT = 0,
    TOPLEFT = 2,
    TOPRIGHT = 1,
    BOTTOMCENTER = 4,
    TOPCENTER = 5,
    LEFTCENTER = 6,
    RIGHTCENTER = 7,
    TOPRIGHTCORNER,
    TOPRIGHTVERTICAL,
    TOPLEFTVERTICAL,
}

export interface MarkerType {
    name : string,
    radius? : number,
    sprite? : string,
}
export enum spriteTypeType {
    SPECIAL = "special",
    GENERIC = "generic",
    TEXT = "text",
}
export enum spriteTypeUI {
    MAIN = "main",
    MARKER = "marker",
    SCREEN = "screen",
}
export interface spriteType {
    type: spriteTypeType, // Whether it's a special rendered texture or if its just a sprite
    ui: spriteTypeUI, // Whether it's part of the main window, the world, or a screen
    screen? : string, // Name of the screen it belongs to. If undefined, it will apply to all screens!
    radius? : number, // Radius of the marker on the screen in tile size OR height increments. Default is 1
    sprite? : string, // The sprite to render if it's not special
    text? : string, // The text string from Dialogue to render
    wrap? : number, // Word wrap amount in height units
};
export interface ScreenType {
    title?: string, // Title displayed at top
    colorInner: number, // Color of the inner
    colorOuter: number, // Color of the border
    alpha?: number, // Transparency
    sprite? : string, // Sprite, to replace the main body
    tabs? : number, // If the screen has tabs it will generate a switcher
    modal? : boolean, // Required, no close button
}
export interface SpriteListed {type: string, sprite: spriteType, quadrant?: QUADRANT}

export let uiSpritesList : Record<string, SpriteListed> = {
    "reticule" : {type : "marker", sprite : {type: spriteTypeType.SPECIAL, ui: spriteTypeUI.MARKER}},
    "sprintmarker" : {type : "marker", sprite : {type: spriteTypeType.GENERIC, ui: spriteTypeUI.MARKER}},
    "interact" : {type : "toggle", sprite : {type: spriteTypeType.GENERIC, ui: spriteTypeUI.MAIN}, quadrant : QUADRANT.BOTTOMRIGHT},
    "follow" : {type : "toggle", sprite : {type: spriteTypeType.GENERIC, ui: spriteTypeUI.MAIN}, quadrant : QUADRANT.BOTTOMRIGHT},
    "sprint" : {type : "toggle", sprite : {type: spriteTypeType.GENERIC, ui: spriteTypeUI.MAIN}, quadrant : QUADRANT.BOTTOMRIGHT},
    "close" : {type : "single", sprite : {type: spriteTypeType.GENERIC, ui: spriteTypeUI.SCREEN, radius: 0.04}, quadrant : QUADRANT.TOPRIGHTCORNER},
    "door_close" : {type : "single", sprite : {type: spriteTypeType.TEXT, ui: spriteTypeUI.SCREEN, radius: 20, text: "door_close"}, quadrant : QUADRANT.TOPLEFTVERTICAL},
    //"safe" : {name : "toggle", type : {type: "generic_double", ui: "marker"}, , quadrant : 3},
};

// width and height are based on the screen height;
// The game is specced such that the UI should look fine on a vertical phone with 1:3 aspect ratio
// As such width should always be < 0.33
// Please design your UI to meet these requirements
export let uiScreens : Record <string, {width: number, height: number, type: ScreenType}> = {
    "door" : {width: 0.3, height: 0.4, type: {title: "screen_door", colorInner: 0x111111, colorOuter: 0xffffff, alpha: 0.9}},
}




export function renderSpecialSprite(name : string, world : World | undefined, zone : Zone | undefined) {
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

export function renderTextSprite(name : string, world : World | undefined, zone : Zone | undefined, text : string, size : number, wrap : number | undefined) {
    let ret : PIXI.Sprite | undefined;

    console.log(name)

    const style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: Math.round(size),
        fill: ['#ffffff', '#888888'], // gradient
        stroke: '#000000',
        strokeThickness: 1,
        dropShadow: true,
        wordWrap: wrap != undefined,
        wordWrapWidth: wrap,
        lineJoin: 'round',
        align: 'left',
    });

    ret = new PIXI.Text(textGet(text), style);
    ret.anchor.x = 0.5;
    ret.anchor.y = 0.5;
    ret.visible = false;

    return ret;
}