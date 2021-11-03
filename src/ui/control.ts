import { WallProperties, World, WorldVec } from "../world/world";
import { Player } from "./player";
import { TILE_SIZE, viewport } from '../gfx/render';
import { Sprite } from "@pixi/sprite";
import { windowSize } from "../launcher";
import { UI } from "./ui";
import { clearSpriteHover, TargetMode } from "./hud";
import { getGridDir } from "../world/math";

export let mouseLeftDown = false;
export let mouseRightDown = false;
export let mouseMiddleDown = false;
export let mouseX = 0;
export let mouseY = 0;
export let viewportMouseX = 0;
export let viewportMouseY = 0;
export let worldMouseX = 0;
export let worldMouseY = 0;

export let mouseInActiveArea = true;
export let mouseEnteringActiveArea = false;
export let currentTargeting : TargetMode = TargetMode.MOVE;
export let targetLocation : WorldVec = {x : 0, y : 0};

export let UIModes = {
    follow : false,
};

export function mouseEnterUI() {
    mouseInActiveArea = false;
}
export function mouseEnterIntoActiveArea() {
    mouseInActiveArea = true;
}
export function mouseQueueEnterActiveArea() {
    mouseEnteringActiveArea = true;
}

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
let leftClicked = false;
let rightClicked = false;
let middleClicked = false;
let mouseDragged = false;

let mouseDragStartX = 0;
let mouseDragStartY = 0;
let maxDrag = 5;

export let touchDown = false;

export function updateMouseTargeting(world : World) {
    if (world.player) {
        if (currentTargeting == TargetMode.MOVE) {
            let dir = {x : 0, y : 0};
            if (worldMouseX != world.player.x || worldMouseY != world.player.y)
                dir = getGridDir(viewportMouseX - world.player.xx, viewportMouseY - world.player.yy);
            targetLocation = {x: world.player.x + dir.x, y: world.player.y + dir.y};
        }
    }
}

function controlLeftClick(world : World, camera : Player) {

    if (world.scheduler && world.player) {
        updateMouseTargeting(world);
        if (currentTargeting == TargetMode.MOVE && mouseInActiveArea) {
            world.scheduler.sendActorMoveRequest(world.player, {
                x : targetLocation.x - world.player.x,
                y : targetLocation.y - world.player.y});
            world.scheduler.requestUpdateTick(1);
        }
    }

    if (!mouseInActiveArea && mouseEnteringActiveArea) mouseInActiveArea = true;


}

export function controlTicker(delta : number, world : World, camera : Player) {
    controlTime -= delta;

    if (leftClicked && !mouseDragged) {
        // Do left mouse click
        controlLeftClick(world, camera);
        leftClicked = false;
    }

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

        if (zone && WallProperties[zone.get(world.player.x + dir.x, world.player.y + dir.y)].collision) {
            controlMove = false;
            controlTick = false;
            controlTime = 10;
            finishMove = false;
            movePressed = false;
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

function updateMouse(GUI : UI) {
    if (mouseLeftDown && (Math.abs(mouseDragStartX - mouseX) > maxDrag || Math.abs(mouseDragStartY - mouseY) > maxDrag)) mouseDragged = true;
    let bounds = viewport.getVisibleBounds();

    if (viewport) {
        viewportMouseX = viewport.corner.x + bounds.width * mouseX / windowSize.width;
        viewportMouseY = viewport.corner.y + bounds.height * mouseY / windowSize.height;

        if (GUI.world) {
            let zone = GUI.world.zones[GUI.world.currentZone];
            if (zone) {
                worldMouseX = Math.max(0, Math.min(zone.width, Math.floor(viewportMouseX/TILE_SIZE)));
                worldMouseY = Math.max(0, Math.min(zone.height, Math.floor(viewportMouseY/TILE_SIZE)));
            }
        }
    }
}

export function initControls(GUI : UI) {
    document.addEventListener("mousemove", (event) => {
        mouseX = event.clientX; // Gets Mouse X
        mouseY = event.clientY; // Gets Mouse Y
        updateMouse(GUI);
    });

    window.addEventListener('touchend',(event) => {
        if (!mouseDragged)
            leftClicked = true;
        mouseLeftDown = false;
        mouseDragged = false
        touchDown = false;

        clearSpriteHover();

        let touch = event.changedTouches[0];
        if (touch) {
            mouseX = touch.pageX; // Gets Mouse X
            mouseY = touch.pageY; // Gets Mouse Y
            mouseDragStartX = mouseX;
            mouseDragStartY = mouseY;
        }

        mouseQueueEnterActiveArea();
    });
    window.addEventListener('touchstart',(event) => {
        mouseLeftDown = true;
        touchDown = true;
        let touch = event.changedTouches[0];
        if (touch) {
            mouseX = touch.pageX; // Gets Mouse X
            mouseY = touch.pageY; // Gets Mouse Y
            mouseDragStartX = mouseX;
            mouseDragStartY = mouseY;
            updateMouse(GUI);
        }
    });
    window.addEventListener('touchmove',(event) => {
        let touch = event.changedTouches[0];
        if (touch) {
            if (mouseLeftDown && (Math.abs(mouseDragStartX - touch.pageX) > maxDrag || Math.abs(mouseDragStartY - touch.pageY) > maxDrag)) mouseDragged = true;
        }
    });
    window.addEventListener('mousedown',(event) => {
        if (event.button == 0) {mouseLeftDown = true; mouseDragStartX = mouseX; mouseDragStartY = mouseY;}
        else if (event.button == 1) {mouseMiddleDown = true;}
        else if (event.button == 2) {mouseRightDown = true; }
        //console.log(mouseLeftDown)
    });
    window.addEventListener('mouseup',(event) => {
        if (event.button == 0) {mouseLeftDown = false; leftClicked = !mouseDragged; mouseDragged = false;}
        else if (event.button == 1) {mouseMiddleDown = false; middleClicked = true;}
        else if (event.button == 2) {mouseRightDown = false; rightClicked = true;}
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
