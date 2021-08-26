import * as PIXI from 'pixi.js';
import { app, viewport } from './launcher';

export const TILE_SIZE = 64;
export const MIN_ZOOM = 7; // In tiles
export const MAX_ZOOM = 25; // In Tiles

let spriteResources : SpriteResource[] = [
    {
        name: "player_mage",
        path: "img/player/mage.png",
    },
    {
        name: "player_mage2",
        path: "img/player/mage_2.png",
    },
];

let sprites : Map<string, Image> = new Map<string, Image>();

interface SpriteResource {
    name: string,
    path: string,
    columns? : number,
    width? : number,
    height? : number,
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
                sprites.set(element.name, new Image(new PIXI.Sprite(resource.texture), element.columns, element.width, element.height));
            }
        })
    });

    console.log(sprites);

    PIXI.Loader.shared.onComplete.add(() => {
        let sprite = getSprite("player_mage");
        if (sprite) {
            sprite.sprite.anchor.set(0.5);
            sprite.sprite.position.set(1024,1024);
            viewport.addChild(sprite.sprite);
        }
        sprite = getSprite("player_mage2");
        if (sprite) {
            sprite.sprite.anchor.set(0.5);
            sprite.sprite.position.set(1124,1024);
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