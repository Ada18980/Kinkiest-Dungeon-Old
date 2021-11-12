
import { Desc, DescClose } from "../string/text";
import { World } from "../world/world";
import { Actor, ActorContainer } from "../world/actor";
import { cDist } from "../world/math";
import { setScreen } from "./screen";

export class Player {
    controlActor : Actor | null = null;
    cameraActor : Actor | null = null;

    constructor(player : Actor | null) {
        this.controlActor = player;
        this.cameraActor = player;
    }
}

export function inspectActor(actor : Actor, world : World) : boolean {
    let close = world.player && cDist({x:world.player.x - actor.x, y:world.player.y - actor.y}) <= 1;
    if (close && actor.type.tags.get("door")) {
        setScreen("door", true);
        return true;
    }

    return false;
}

export function inspect(x : number, y : number, world : World) : boolean {
    let actor : Actor | undefined;
    let search : Actor[] = world.tree_actors.getAll(x, y, 0);
    for (let a of search) {
        if (a.type.tags.get("player")) {
            actor = a;
            break;
        } else if (a.type.tags.get("desc")) actor = a;
    }
    if (actor) {
        if (!inspectActor(actor, world)) {
            let d = actor.type.tags.get("desc");
            if (d) {
                let desc : string | undefined;
                if (world.player && cDist({x:world.player.x - actor.x, y:world.player.y - actor.y}) <= 1) {
                    desc = DescClose[d];
                }
                if (!desc) desc = Desc[d];
                if (desc) {
                    console.log(desc);
                    return true;
                }
            }
        } else return true;
    }
    return false;
}
