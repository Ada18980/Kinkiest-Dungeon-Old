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