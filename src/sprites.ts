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
    sprite : PIXI.Sprite;
    columns : number = 1;
    width : number = 50;
    height : number = 64;
    constructor(sprite : PIXI.Sprite, columns : number = 1, width : number = 50, height : number = 64) {
        this.sprite = sprite;
        this.columns = columns;
        this.width = width;
        this.height = height;
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
            if (typeof resource !== "undefined") {
                let loader = PIXI.Loader.shared.resources[element.name];
                let animation = "walkdown";
                let layer = "hair";
                let frameData = loader?.spritesheet?.textures;
                if (frameData) {
                    let keys = Object.keys(frameData);
                    let frameKeys = keys.filter((frame : string) => {
                        return (frameData && frameData[frame] && frame.includes(`(${layer})`) && loader?.data.meta.frameTags?.some((tag: any) => {
                                if (tag.name != animation) return false;
                                let indexStr = frame.split(" ")[2]?.split(".")[0];
                                if (!indexStr) return false;
                                let index = parseInt(indexStr);
                                console.log(tag.from);
                                console.log(tag.to);
                                console.log(tag.from != null && tag.to != null && index >= tag.from && index <= tag.to);
                                return tag.from != null && tag.to != null && index >= tag.from && index <= tag.to;
                            })
                        );})
                    let frames = frameKeys.map((frame: string) => {return (frameData && frameData[frame]) || nullTexture;});
                    console.log(frameData);
                    console.log(keys);
                    console.log(frameKeys);
                    console.log(frames);
                    if (frames)
                        sprites.set(element.name, new Image(new PIXI.AnimatedSprite(frames)));
                }
            }
        })
    });

    console.log(PIXI.Loader.shared);

    PIXI.Loader.shared.onComplete.add(() => {
        let sprite = getSprite("player_mage");
        if (sprite) {
            sprite.sprite.anchor.set(0.5);
            sprite.sprite.position.set(1024,1024);
            viewport.addChild(sprite.sprite);
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