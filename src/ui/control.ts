import { WallProperties, World } from "../world/world";
import { Player } from "./player";
import { TILE_SIZE, viewport } from '../gfx/render';
import { Sprite } from "@pixi/sprite";

export let mouseLeftDown = false;
export let mouseRightDown = false;
export let mouseMiddleDown = false;

export let keyBindingsDefault = {
    moveU : ['W', 'ArrowUp'],
    moveD : ['S', 'ArrowDown'],
    moveL : ['A', 'ArrowLeft'],
    moveR : ['D', 'ArrowRight'],
    spell : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    wait : [' ',],
    return : ['Enter',],

};

export class ControlKey {
    value : number = -1;
    keys : string[];
    refreshControlTick : boolean = false;

    constructor(keys : string[], refreshControlTick : boolean = false) {
        this.keys = keys;
        this.refreshControlTick = refreshControlTick;
    }
}


export let keys = {
    moveU : new ControlKey(keyBindingsDefault.moveU, true),
    moveD : new ControlKey(keyBindingsDefault.moveD, true),
    moveL : new ControlKey(keyBindingsDefault.moveL, true),
    moveR : new ControlKey(keyBindingsDefault.moveR, true),
    spell : new ControlKey(keyBindingsDefault.spell),
    wait : new ControlKey(keyBindingsDefault.wait, true),
    return : new ControlKey(keyBindingsDefault.return),

};



export let controlTick = false;
let controlTime = 240;
let controlDiagGrace = 0;
let controlDiagGraceTime = 80;
let controlMove = false;
let finishMove = false;
let lastDir = {x : 0, y : 0};
let movePressed = false;

let lastXX = 0;
let lastYY = 0

let lastCameraMove = 0;

export function controlTicker(delta : number, world : World, camera : Player) {
    controlTime -= delta;
    if (controlMove) {
        if (controlDiagGrace < controlDiagGraceTime)
            controlDiagGrace += delta;
    } else if (controlDiagGrace > 0) controlDiagGrace -= delta
    if (controlTime < 0) {
        controlTime = 0;
        controlTick = true;
    }

    if (controlTick && world && world.player) {
        let dir = {x : 0, y : 0};
        if (keys.moveU.value > 0) {dir.y = -1; controlMove = true;}
        else if (keys.moveD.value > 0) {dir.y = 1; controlMove = true;}
        if (keys.moveL.value > 0) {dir.x = -1; controlMove = true;}
        else if (keys.moveR.value > 0) {dir.x = 1; controlMove = true;}

        let zone = world.zones[world.currentZone];
        if (zone) {
            if (dir.x != 0
                && WallProperties[zone.get(world.player.x + dir.x, world.player.y + dir.y)].collision
                && !WallProperties[zone.get(world.player.x + dir.x, world.player.y)].collision) {
                dir.y = 0;
            } else if (dir.y != 0
                && WallProperties[zone.get(world.player.x + dir.x, world.player.y + dir.y)].collision
                && !WallProperties[zone.get(world.player.x, world.player.y + dir.y)].collision) {
                dir.x = 0;
            }
        }

        if (finishMove) {
            dir = lastDir;
            controlMove = true;
        }

        if (controlMove && controlDiagGrace > controlDiagGraceTime) {
            // Replace with WorldSendAIMoveRequest(world.player, dir)
            //
            // Replace with WorldRequestUpdateTick(1)
            if (world.scheduler) {
                world.scheduler.sendActorMoveRequest(world.player, dir);
                world.scheduler.requestUpdateTick(1);
            }
            controlTick = false;
            controlTime = 270;
            //console.log(dir)
            if (finishMove) {
                controlMove = false;
                finishMove = false;
            }
            movePressed = false;
        }
        lastDir = dir;
    }

    if (camera.cameraActor) {
        let container = world.containers.get(camera.cameraActor.id)
            if (container) {
                let bounds = viewport.getVisibleBounds().pad(-TILE_SIZE);
                let XX = camera.cameraActor.xx + lastDir.x * TILE_SIZE;
                let YY = camera.cameraActor.yy + lastDir.y * TILE_SIZE;
                if (!bounds.contains(XX, YY) && performance.now() - lastCameraMove > 500) {
                    let ease = "easeInOutSine";
                    let time = 1000;
                    if (performance.now() - lastCameraMove < 1000 ) {
                        time = 1000;
                        ease = "easeOutSine";
                    }
                    //viewport.snap(XX, YY, {ease: "easeInOutSine", time: 1000});

                    if (container.xx != container.actor.xx || container.yy != container.actor.yy) {
                        let sprites = container.sprite?.currentRender;
                        if (sprites) {
                            /*let sprite : Sprite | undefined;
                            for (let s of sprites) {
                                if (s[1] && s[1].sprite) {
                                    sprite = s[1].sprite;
                                    break;
                                }
                            }
                            if (sprite)
                                viewport.follow(sprite, {speed: 100, acceleration: 0.15});*/
                            viewport.snap(XX, YY, {ease: "easeInOutSine", time: 1000, removeOnInterrupt: true});
                            lastXX = XX;
                            lastYY = YY;
                            lastCameraMove = performance.now();
                        }
                    }
                    //else viewport.plugins.remove('follow');

                }
            }
        }

}

export function initControls() {
    window.addEventListener('mousedown',(event) => {
        if (event.button == 0) mouseLeftDown = true;
        else if (event.button == 1) mouseMiddleDown = true;
        else if (event.button == 2) mouseRightDown = true;
        //console.log(mouseLeftDown)
    });
    window.addEventListener('mouseup',(event) => {
        if (event.button == 0) mouseLeftDown = false;
        else if (event.button == 1) mouseMiddleDown = false;
        else if (event.button == 2) mouseRightDown = false;
        //console.log(mouseLeftDown)
    });

    window.addEventListener('keydown',(event) => {
        if (!event.repeat) {
            let key = event.key;
            for (let KB of Object.keys(keys)) {
                let binding = keys[KB as keyof typeof keys];
                if (binding.keys.includes(key)) {
                    binding.value = binding.keys.indexOf(key);
                    if (binding.refreshControlTick) {movePressed = true;}
                }
            }
        }
    });
    window.addEventListener('keyup',(event) => {
        let key = event.key;
        for (let KB of Object.keys(keys)) {
            let binding = keys[KB as keyof typeof keys];
            if (binding.keys.includes(key)) {
                binding.value = -1;
                if (binding.refreshControlTick) {controlDiagGrace = 0; controlMove = false;}
            }
        }

        // If all movekeys are released then we simply ignore dialog grace
        if (keys.moveD.value == -1 && keys.moveL.value == -1 && keys.moveR.value == -1 && keys.moveU.value == -1) {
            if (controlTick && controlDiagGrace == 0) {
                controlDiagGrace = controlDiagGraceTime + 1;
                finishMove = true;
            }
            controlTick = true;
        }
    });
}
