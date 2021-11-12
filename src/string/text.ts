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

export let Name : Record<number, string> = {
    [Strings.DOOR_LOCKED] : "Door (Closed)",
};

export let Desc : Record<number, string> = {
    [Wall.DOOR_CLOSED] : "A closed door.",
    [Wall.DOOR_OPEN] : "An open door. You can close it or lock it.",
    [Strings.DOOR_LOCKED] : "A closed door.",
};

export let NameClose : Record<number, string> = {
    [Strings.DOOR_LOCKED] : "Door (Locked)",
    [Strings.PLAYER] : "Me",
};

export let DescClose : Record<number, string> = {
    [Strings.DOOR_LOCKED] : "The door is locked",
    [Strings.PLAYER] : "That's me!",
};

export let Dialogue : Record<string, string> = {
    "screen_door" : "Door Menu",
};

export function textGet(str: string | number, type : StringType = StringType.DESC) {
    let result = "";
    if (typeof str === "number") {
        let record_lang : Record<number, string> = Desc;
        let record : Record<number, string> = Desc;
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

        if (record_lang[str] != undefined) result = record_lang[str] || "";
        else if (record[str] != undefined) result = record[str] || "";
    } else {
        let record_lang : Record<string, string> = Dialogue;
        let record : Record<string, string> = Dialogue;

        if (record_lang[str] != undefined) result = record_lang[str] || "";
        else if (record[str] != undefined) result = record[str] || "";
    }
    return result;
}