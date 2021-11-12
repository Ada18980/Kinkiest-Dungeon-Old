"use strict";

import { Wall } from "../world/zone";

// Enum convention:
// Wall: Starts at -1 up to 99,9999
// ActorIndex: Starts at 1,000,000 to 999,999,999
// ItemIndex: Starts at 1,000,000,000 to 1,999,999,999
// SpellIndex: Starts at 2,000,000,000 to 2,999,999,999
// ... split into 1 billion increment chunks
// You really shouldn't need more than 1 billion strings tbh...
// Like, at one byte per character that's easily in the gigabytes
// If you need that then please make your own resolution system
// Text: Starts at 1,000,000,000,000 up to whatever

export enum Strings {
    PLAYER = 1000000000000,
    DOOR_LOCKED,
}

export enum StringType {
    DESC,
    DESC_CLOSE,
    NAME,
    NAME_CLOSE,
}

export let Name : Map<number, string> = new Map<number, string>([
    [Strings.DOOR_LOCKED, "Door (Closed)"],
]);

export let Desc : Map<number, string> = new Map<number, string>([
    [Wall.DOOR_CLOSED, "A closed door."],
    [Wall.DOOR_OPEN, "An open door. You can close it or lock it."],
    [Strings.DOOR_LOCKED, "A closed door."],
]);

export let NameClose : Map<number, string> = new Map<number, string>([
    [Strings.DOOR_LOCKED, "Door (Locked)"],
    [Strings.PLAYER, "Me"],
]);

export let DescClose : Map<number, string> = new Map<number, string>([
    [Strings.DOOR_LOCKED, "The door is locked"],
    [Strings.PLAYER, "That's me!"],
]);

export let Dialogue : Map<string, string> = new Map<string, string>([
    ["screen_door", "Door Menu"],
    ["door_close", "Close Door"],
]);

export function textGet(str: string | number, type : StringType = StringType.DESC) {
    let result = "";
    if (typeof str === "number") {
        let record_lang : Map<number, string> = Desc;
        let record : Map<number, string> = Desc;
        switch (type) {
            case StringType.DESC:
                record_lang = Desc;
                record = Desc;
                break;
            case StringType.NAME:
                record_lang = Name;
                record = Name;
                break;
            case StringType.NAME_CLOSE:
                record_lang = NameClose;
                record = NameClose;
                break;
            case StringType.DESC_CLOSE:
                record_lang = DescClose;
                record = DescClose;
                break;
        }

        if (record_lang.get(str) != undefined) result = record_lang.get(str) || "";
        else if (record.get(str) != undefined) result = record.get(str) || "";
    } else {
        let record_lang : Map<string, string> = Dialogue;
        let record : Map<string, string> = Dialogue;

        if (record_lang.get(str) != undefined) result = record_lang.get(str) || "";
        else if (record.get(str) != undefined) result = record.get(str) || "";
    }
    return result;
}