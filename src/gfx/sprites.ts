"use strict";

import { TILE_SIZE, viewport } from './render';
import * as PIXI from 'pixi.js';
import { app } from '../launcher';
import {Dir} from '../world/actor';
import { Viewport } from 'pixi-viewport';


let nullTexture = PIXI.Texture.from("img/null.png");

let spriteResources : SpriteResource[] = [
    {
        name: "player_default",
        spritesheet : true,
        path: "img/player/default.json",
    },
    {
        name: "bricks",
        spritesheet : true,
        path: "img/tiles/bricks.json",
    },
    {
        name: "ui_safe_off",
        path: "img/ui/safe_off.png",
        antialias: true,
    },
    {
        name: "ui_safe_on",
        path: "img/ui/safe_on.png",
        antialias: true,
    },
    {
        name: "ui_follow_off",
        path: "img/ui/follow_off.png",
        antialias: true,
    },
    {
        name: "ui_follow_on",
        path: "img/ui/follow_on.png",
        antialias: true,
    },
    {
        name: "ui_sprint_off",
        path: "img/ui/sprint_off.png",
        antialias: true,
    },
    {
        name: "ui_sprint_on",
        path: "img/ui/sprint_on.png",
        antialias: true,
    },
    {
        name: "ui_sprintmarker",
        path: "img/ui/sprintmarker.png",
        antialias: true,
    },
    {
        name: "ui_interact",
        path: "img/ui/interact.png",
        antialias: true,
    },
];

let sprites : Map<string, BaseImage> = new Map<string, BaseImage>();
export let textures : Map<string, PIXI.Texture> = new Map<string, PIXI.Texture>();
let images : Map<string, Image> = new Map<string, Image>();

interface SpriteResource {
    /**
     * Internal name of the sprite
     */
    name: string,

    /**
     * Path of the sprite
     */
    path: string,

    /**
     * Animations. One for the whole sprite. Columns are determined by the sum of the frame count of each animation
     */
    animations? : SpriteAnimation[],
    columns?: number;

    /**
     * Layers. One for each row in the sprite sheet
     */
    layers? : SpriteLayer[],
    rows?: number;

    // Determines whether or not the texture is added as a spritesheet
    spritesheet? : boolean,

    // Determines if the texture is antialiased or not
    antialias? : boolean,
}

interface SpriteAnimation {
    name: string; // Internal name of the animation
    frameCount: number; // Number of frames in the animation
    frameDelay: number; // Delay between each frame
    loop?: boolean; // If true, it loops
}

interface SpriteLayer {
}

export class BaseImage {
    // Contains animations and layers
    animations : Map<string, Map<string, KDSpriteTemplate>>;
    name : string;

    constructor(name : string) {
        this.name = name;
        this.animations = new Map<string, Map<string, KDSpriteTemplate>>();
    }

    addSprite(layer : string, animation : string, sprite : KDSpriteTemplate) {
        let anim : Map<string, KDSpriteTemplate> = this.animations.get(animation) || new Map<string, KDSpriteTemplate>();
        if (!this.animations.has(animation)) this.animations.set(animation, anim);
        anim.set(layer, sprite);
    }

}

export class Image {
    // Contains animations and layers
    animations : Map<string, Map<string, KDSprite>>;
    currentPoses : string[] = [];
    currentRender : Map<string, KDSprite> = new Map<string, KDSprite>();
    playing: boolean = false;
    frameTimer = 0;

    constructor(image : BaseImage) {
        this.animations = new Map<string, Map<string, KDSprite>>();
        image.animations.forEach((v, k) => {
            let map = new Map<string, KDSprite>();
            v.forEach((v, k) => {
                map.set(k, new KDSprite(image.name, v));
            });

            this.animations.set(k, map);
        });

        //console.log(this.animations);
    }

    animate(start?: boolean, stop?: boolean, setFrame?: number, loop?: boolean) {
        let currRender = this.currentRender;
        if (currRender) {
            this.playing = false;
            currRender.forEach((element) => {
                //let sf = setFrame ? Math.round(setFrame * element.sprite.totalFrames) : 0;
                if (setFrame != undefined && start) element.sprite.gotoAndPlay(setFrame);
                else if (setFrame != undefined && stop) element.sprite.gotoAndStop(setFrame);
                else if (start) element.sprite.play();
                else if (stop) element.sprite.stop();

                if (loop) element.sprite.loop = loop;
                if (!this.playing && element.sprite.playing) this.playing = true;
            });
        }
    }

    // Removes an actor from the viewport
    destroy() {

    }

    // Renders the actor to the viewport
    render(direction : Dir, poses : string[], x : number, y : number, rotation : number = 0) {
        let bounds = viewport.getVisibleBounds().pad(TILE_SIZE, TILE_SIZE);
        let visible = bounds.contains(x, y);

        let currRender = (poses != this.currentPoses || !visible) ? this.currentRender : null;

        if (currRender) {
            for (let element of currRender) {
                element[1].sprite.visible = false;
            }
        }
        if (visible) {
            // Render for this many frames to prevent weirdness
            let toRender = new Map<string, KDSprite>();
            let renderedLayers : string[] = [];

            for (let I = poses.length-1; I >= 0; I--) {
                let pose = poses[I];
                let anim = pose + direction;
                let animStore = this.animations.get(anim);
                if (animStore) {
                    for (let layer of animStore) {
                        if (!renderedLayers.includes(layer[0])) {
                            toRender.set(layer[0], layer[1]);
                            renderedLayers.push(layer[0]);
                        }

                    }
                }
            }

            if (toRender) {
                for (let element of toRender) {
                    element[1].sprite.visible = visible;
                    element[1].sprite.position.set(x, y);
                    element[1].sprite.rotation = rotation;
                    element[1].sprite.zIndex = element[1].getZ(this.currentPoses) || 0;

                    if (element[1].viewport != viewport) {
                        if (element[1].viewport) element[1].viewport.removeChild(element[1].sprite);
                        viewport.addChild(element[1].sprite);
                        element[1].viewport = viewport;
                    }
                }

                this.playing = false;
                toRender.forEach((element) => {
                    if (!this.playing && element.sprite.playing) this.playing = true;
                });

                this.currentPoses = poses;
                this.currentRender = toRender;
            }
        }
    }
}

interface KDSpriteTemplate {
    frames : PIXI.Texture<PIXI.Resource>[];
    time : number;
    count : number;
    noLoop : boolean;
    zIndex : Record<string, number>;
}

interface SpriteZIndex {
    base: number,
    animation: string,
}

export class KDSprite {
    sprite : PIXI.AnimatedSprite;
    frames : number;
    noLoop : boolean;
    zIndex : Record<string, number>;
    viewport : Viewport | null = null;

    constructor(name: string, template: KDSpriteTemplate) {
        let sprite = new PIXI.AnimatedSprite(template.frames, template.frames.length > 0);
        let loader = PIXI.Loader.shared.resources[name];
        sprite.animationSpeed = 16.7/template.time;
        sprite.anchor.set(0.5);

        this.sprite = sprite;
        this.frames = template.count;
        this.noLoop = template.noLoop;
        this.zIndex = template.zIndex;
    }

    getZ(animation : string[]) {
        let current = 0;
        let I = animation.length - 1;
        while(I >= 0) {
            let anim = animation[I] || "default";
            if (this.zIndex[anim]) {
                return this.zIndex[anim];
            }
            I--;
        }
        if (this.zIndex["default"]) return this.zIndex["default"];
        return 0;
    }

}

export function getSprite(name : string) {
    return sprites.get(name);
}

export function getNewSprite(name : string) {
    let sprite = sprites.get(name);
    if (!sprite) return undefined;

    return new Image(sprite);
}

export function getGeneralSprite(name : string) {
    let sprite = images.get(name);
    if (!sprite) {
        let spr = sprites.get(name);
        if (spr) {
            sprite = new Image(spr);
            return sprite;
        }
        return undefined;
    }
    return sprite;
}


export function addSprite(name: string, path: string, columns? : number, width? : number, height? : number) {
    PIXI.Loader.shared
    .add(name, path)
}

export function loadSprites() {

    for (let element of spriteResources) {
        PIXI.Loader.shared.add(element.name, element.path)
    }

    PIXI.Loader.shared.load((loader, resources) => {
        for (let element of spriteResources) {
            let resource = resources[element.name];
            let image = new BaseImage(element.name);
            if (typeof resource !== "undefined") {
                let loader = PIXI.Loader.shared.resources[element.name];

                if (element.spritesheet) {
                    let anims : string[] = [];
                    let layers : string[] = [];

                    // Seed animations and layers from metatada
                    if (loader?.data?.meta?.frameTags) loader?.data?.meta?.frameTags.forEach((tag : any) => {
                        if (tag.name) anims.push(tag.name);
                    })
                    if (loader?.data?.meta?.layers) loader?.data?.meta?.layers.forEach((layer : any) => {
                        if (layer.name) layers.push(layer.name);
                    })

                    // Default layer and animation
                    if (anims.length == 0) anims.push("idle");
                    if (layers.length == 0) layers.push("base");

                    let frameData = loader?.spritesheet?.textures;

                    // Load the sprites in the internal format
                    if (frameData) {
                        let keys = Object.keys(frameData);
                        //console.log(keys)
                        //console.log(frameData)
                        for (let animation of anims) {
                            let zInd = 0;
                            for (let layer of layers) {
                                zInd += 1;
                                let frameKeys = keys.filter((frame : string) => {
                                    return (frameData && frameData[frame] && frame.includes(`(${layer})`) && loader?.data.meta.frameTags?.some((tag: any) => {
                                            if (tag.name != animation) return false;
                                            let indexStr = frame.split("|")[1];
                                            if (!indexStr) return false;
                                            let index = parseInt(indexStr);
                                            return tag.from != null && tag.to != null && index >= tag.from && index <= tag.to;
                                        })
                                    );});
                                let frames : PIXI.Texture<PIXI.Resource>[] = [];
                                for (let frame of frameKeys) {
                                    let data = frameData[frame];
                                    if (data) {
                                        if (element.antialias) data.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR
                                        frames.push(data); // && (data.trim.width > 1 || data.trim.height > 1)
                                    }
                                }
                                if (frames && frames.length > 0) {
                                    let time = 1000;
                                    let zIndex = {
                                        default: 1+zInd,
                                    };
                                    if (loader?.data?.frames[frameKeys[0] || 0]?.duration) time = loader?.data?.frames[frameKeys[0] || 0]?.duration;

                                    image.addSprite(layer, animation, {
                                        frames: frames,
                                        time: time,
                                        count: frames.length,
                                        noLoop: loader?.data?.meta?.frameTags[animation]?.noLoop,
                                        zIndex: zIndex,
                                    });
                                }
                            }
                        }
                    }

                    if (image.animations.size > 0)
                        sprites.set(element.name, image);
                } else if (resource.texture) {
                    if (element.antialias) resource.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR
                    textures.set(element.name, resource.texture);
                }
            }
        }
    });

    console.log(PIXI.Loader.shared);
    console.log(sprites);
    console.log(textures);

    /*PIXI.Loader.shared.onComplete.add(() => {
        let sprite = getSprite("player_mage");
        if (sprite) {
            sprite.render(viewport, "walkdown", 1024, 1024);
            if (!sprite.playing) sprite.animate(true);
        }
    }); */// called once when the queued resources all load.

}

/*

  // creating new instance of PXI.texure
  var texture = new PIXI.Texture.fromImage('my-start-frame-name');
  // creating sprite
  var runner = new PIXI.Sprite(texture);


  // this is the frame I'm using to change the picture in sprite sheet
  var frame = new PIXI.Rectangle(0, 0, 100, 100);

  // animating the sprite
  var interval = setInterval(function () {
    // moving frame one unit to right
    frame.position.x += 100;
    runner.texture.frame = frame;

    //  ending animation
    if (frame.position.x == 1000) {
       frame.position.x = 0;
       clearInterval(interval);
    }
  }, 50);*/