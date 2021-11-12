"use strict";

import { Viewport } from "pixi-viewport";
import { World} from '../world/world';
import { Wall, Zone } from '../world/zone';
import * as PIXI from 'pixi.js';
import { MAX_ZOOM, MIN_ZOOM, TILE_SIZE, renderer, viewport, renderWorld, updateWorldRender} from '../gfx/render';
import { mouseLeftDown, mouseRightDown, mouseMiddleDown, initControls, controlTick, controlTicker, updateCamera, mouseEnterUI, mouseEnterIntoActiveArea } from './control';
import { renderHUD, uiSprites } from './hud';
import { app, ratio, windowSize } from '../launcher';

import { Player } from './player';
import { Actor } from '../world/actor';
import { Strings, textGet } from "../string/text";
import { uiScreens } from "./uiElements";
import { textures } from "../gfx/sprites";
import * as filters from 'pixi-filters';


export interface Screen {
    name : string,
    cont : PIXI.Container,
    elements : Record<string, PIXI.Sprite>,
}

export let screens : Map<string, Screen> = new Map<string, Screen>();
let lastScreenSize = {x: 0, y: 0};
let RRradius = 30;

let allowMultipleScreens = false;

export function closeScreen(screen : Screen) {
    screen.cont.y = windowSize.height * 3;
    screen.cont.visible = false;
}

export function openScreen(screen : Screen) {
    let h = uiScreens[screen.name]?.height || 0;
    screen.cont.y = windowSize.height*(0.5-h/2);
    screen.cont.visible = true;
}

export function setScreen(name : string, open : boolean) {
    if (!allowMultipleScreens) {
        for (let s in screens) {
            let ss = screens.get(s);
            if (ss && s != name) closeScreen(ss);
        }
    }
    let ss = screens.get(name);
    if (ss) {
        if (!ss.cont.visible && open)
            openScreen(ss);
        else if (ss.cont.visible && !open)
            closeScreen(ss);
    }
}

export function updateScreens() {
    let update = false;
    if (lastScreenSize.x != windowSize.width || lastScreenSize.y != windowSize.height) {
        update = true;
        lastScreenSize.x = windowSize.width;
        lastScreenSize.y = windowSize.height;
    }

    for (let name in uiScreens) {
        let screen = uiScreens[name];
        if (screen) {
            if (!screens.get(name) || update) {
                let scr = screens.get(name);
                if (update && scr) {
                    app.stage.removeChild(scr.cont);
                    screens.delete(name);
                    for (let uiSprite of uiSprites) {
                        if (uiSprite[0].includes(name + "|")) {
                            uiSprites.delete(name + "|");
                        }
                    }
                }
                let cont = new PIXI.Container();
                cont.sortableChildren = true;
                let w = windowSize.height * screen.width;
                let h = windowSize.height * screen.height;
                if (screen.type.sprite) {
                    let spr = new PIXI.Sprite(textures.get(screen.type.sprite));
                    spr.zIndex = -999;
                    cont.addChild(spr);
                } else {
                    let tex = PIXI.RenderTexture.create({ width: w + 2 * RRradius, height: h + 2 * RRradius});
                    tex.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
                    let r1 = new PIXI.Graphics();
                    r1.beginFill(screen.type.colorOuter);
                    r1.drawRoundedRect(0, 0, w + 2 * RRradius, h + 2 * RRradius, RRradius);
                    r1.endFill();
                    r1.beginHole();
                    let holethickness = 1;
                    r1.drawRoundedRect(holethickness, holethickness, w + 2 * RRradius - holethickness*2, h + 2 * RRradius - holethickness*2, RRradius - holethickness);
                    r1.endFill();
                    renderer.render(r1,{renderTexture: tex});


                    let tex2 = PIXI.RenderTexture.create({ width: w + 2 * RRradius, height: h + 2 * RRradius });
                    tex2.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
                    r1 = new PIXI.Graphics();
                    r1.beginFill(screen.type.colorInner);
                    r1.drawRoundedRect(0, 0, w + 2 * RRradius, h + 2 * RRradius, RRradius);
                    r1.endFill();
                    renderer.render(r1,{renderTexture: tex2});

                    let inner = new PIXI.Sprite(tex2);
                    inner.position.x = -RRradius;
                    inner.position.y = -RRradius;
                    inner.anchor.x = 0;
                    inner.anchor.y = 0;
                    inner.visible = true;
                    inner.zIndex = -999;
                    inner.alpha = screen.type.alpha ? screen.type.alpha : 1;

                    let outer = new PIXI.Sprite(tex);
                    outer.position.x = -RRradius;
                    outer.position.y = -RRradius;
                    outer.anchor.x = 0;
                    outer.anchor.y = 0;
                    outer.visible = true;
                    outer.zIndex = -998;
                    outer.filters = [new filters.GlowFilter({color: screen.type.colorOuter, distance: 5, innerStrength: 0.2, outerStrength: 1})]

                    cont.addChild(inner);
                    cont.addChild(outer);
                }

                if (screen.type.title) {
                    const style = new PIXI.TextStyle({
                        fontFamily: 'Arial',
                        fontSize: Math.round(RRradius * 0.9),
                        fontWeight: 'bold',
                        fill: ['#ffffff', '#888888'], // gradient
                        stroke: '#000000',
                        strokeThickness: 3,
                        dropShadow: true,
                        dropShadowColor: '#000000',
                        dropShadowBlur: 4,
                        dropShadowAngle: Math.PI * 1.5,
                        dropShadowDistance: 6,
                        wordWrap: true,
                        wordWrapWidth: cont.width - RRradius * 2,
                        lineJoin: 'round',
                        align: "center",
                    });

                    const richText = new PIXI.Text(textGet(screen.type.title), style);
                    richText.anchor.x = 0.5;
                    richText.anchor.y = 0;
                    richText.x = w*0.5;
                    richText.y = -0.9 * RRradius;
                    richText.zIndex = 1000;

                    cont.addChild(richText);
                }

                cont.x = windowSize.width/2 - w/2;
                cont.y = windowSize.height/2 - h/2;
                cont.visible = false;
                cont.interactive = true;
                registerScreen(name, cont);
                screens.set(name, {name : name, cont: cont, elements: {}});

                console.log(screens)
                app.stage.addChild(cont);
            }
        }
    }
}



export function registerScreen(name : string, screen : PIXI.Container) {
    screen.interactive = true;
    screen  .on('pointerdown', (event) => uiScreenClick(name, event))
            .on('pointerup', (event) => uiScreenClickEnd(name, event))
            .on('pointerupout', (event) => uiScreenClickEndOutside(name))
            .on('pointerover', (event) => uiScreenOver(name))
            .on('pointerout', (event) => uiScreenOut(name));
}

function uiScreenClick(name : string, event : Event) {
    mouseEnterUI();
}
function uiScreenClickEnd(name : string, event : Event) {

}
function uiScreenClickEndOutside(name : string) {
}

function uiScreenOver(name : string) {
    mouseEnterUI();
}

function uiScreenOut(name : string) {
    mouseEnterIntoActiveArea();
}