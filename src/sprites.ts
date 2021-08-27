import { Viewport } from 'pixi-viewport';
import * as PIXI from 'pixi.js';
import { app, viewport } from './launcher';

export const TILE_SIZE = 64;
export const MIN_ZOOM = 7; // In tiles
export const MAX_ZOOM = 25; // In Tiles

let nullTexture = PIXI.Texture.from("img/null.png");

let spriteResources : SpriteResource[] = [
    {
        name: "player_mage",
        path: "img/player/mage.json",
    },
];

let sprites : Map<string, Image> = new Map<string, Image>();

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
}

interface SpriteAnimation {
    name: string; // Internal name of the animation
    frameCount: number; // Number of frames in the animation
    frameDelay: number; // Delay between each frame
    loop?: boolean; // If true, it loops
}

interface SpriteLayer {
}

export class Image {
    // Contains animations and layers
    animations : Map<string, Map<string, KDSprite>>;
    currentAnimation : string = "";

    constructor() {
        this.animations = new Map<string, Map<string, KDSprite>>();
    }

    addSprite(layer : string, animation : string, sprite : KDSprite) {
        let anim : Map<string, KDSprite> = this.animations.get(animation) || new Map<string, KDSprite>();
        if (!this.animations.has(animation)) this.animations.set(animation, anim);
        anim.set(layer, sprite);
    }

    render(viewport : Viewport, animation : string, x : number, y : number, rotation : number = 0) {
        let currRender = (animation != this.currentAnimation) ? this.animations.get(this.currentAnimation) : null;
        let toRender = this.animations.get(animation);

        if (currRender) {
            currRender.forEach((element) => {
                element.sprite.visible = false;
            });
        }

        if (toRender) {
            toRender.forEach((element) => {
                element.sprite.visible = true;
                element.sprite.position.set(x, y);
                element.sprite.rotation = rotation;

                if (element.viewport != viewport) {
                    if (element.viewport) element.viewport.removeChild(element.sprite);
                    viewport.addChild(element.sprite);
                    element.viewport = viewport;
                }
            });

            this.currentAnimation = animation;
        }
    }
}

export class KDSprite {
    sprite : PIXI.Sprite;
    frames : number;
    noLoop : boolean;
    viewport : Viewport | null = null;

    constructor(sprite : PIXI.Sprite, frames : number = 1, noLoop : boolean = false) {
        this.sprite = sprite;
        this.frames = frames;
        this.noLoop = noLoop;
    }
}

export function getSprite(name : string, frame? : number) {
    if (frame) {

    }
    return sprites.get(name);
}
export function addSprite(name: string, path: string, columns? : number, width? : number, height? : number) {
    PIXI.Loader.shared
    .add(name, path)
}

export function loadSprites() {

    spriteResources.forEach((element) => {
        PIXI.Loader.shared.add(element.name, element.path)
    })


    PIXI.Loader.shared.load((loader, resources) => {
        spriteResources.forEach((element) => {
            let resource = resources[element.name];
            let image = new Image();
            if (typeof resource !== "undefined") {
                let loader = PIXI.Loader.shared.resources[element.name];

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

                // Load the sprites in the internal format
                anims.forEach((animation : string) => {
                    layers.forEach((layer : string) => {
                        let frameData = loader?.spritesheet?.textures;
                        if (frameData) {
                            let keys = Object.keys(frameData);
                            let frameKeys = keys.filter((frame : string) => {
                                return (frameData && frameData[frame] && frame.includes(`(${layer})`) && loader?.data.meta.frameTags?.some((tag: any) => {
                                        if (tag.name != animation) return false;
                                        let indexStr = frame.split(" ")[2]?.split(".")[0];
                                        if (!indexStr) return false;
                                        let index = parseInt(indexStr);
                                        return tag.from != null && tag.to != null && index >= tag.from && index <= tag.to;
                                    })
                                );})
                            let frames = frameKeys.map((frame: string) => {return (frameData && frameData[frame]) || nullTexture;});
                            if (frames) {
                                let sprite = new PIXI.AnimatedSprite(frames);
                                //sprite.anchor.set(0.5);

                                image.addSprite(layer, animation, new KDSprite(sprite, frames.length, loader?.data?.meta?.frameTags[animation]?.noLoop));
                            }
                        }
                    });
                });

                sprites.set(element.name, image);
            }
        })
    });

    console.log(PIXI.Loader.shared);

    PIXI.Loader.shared.onComplete.add(() => {
        let sprite = getSprite("player_mage");
        if (sprite) {
            sprite.render(viewport, "walkdown", 1024, 1024);
        }
    }); // called once when the queued resources all load.

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