"use strict";

import { Text, Desc } from "../string/text";
import { ActorType, tags } from "./actor";
import { Wall, WallProperties, Zone } from "./zone";

export enum Door {
    OPEN = 1,
    CLOSED = 2,
}

export function getMapActorType(x : number, y : number, zone : Zone, tile : Wall) : ActorType{
    let ret = tags([
        {tag:"map", val: tile},
        {tag:"desc", val: tile},
    ]);
    let sprite : string | undefined;

    if (tile == Wall.DOOR_CLOSED || tile == Wall.DOOR_OPEN) {
        ret.set("door", tile == Wall.DOOR_CLOSED ? Door.OPEN : Door.CLOSED);
        // if (locked)
        //ret.set("desc", Text.DOOR_LOCKED);
    }

    return {
        sprite: sprite,
        tags: ret,
    };
}