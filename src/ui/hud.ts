import { WallProperties, World } from "../world/world";
import { Player } from "./player";
import { TILE_SIZE, viewport } from '../gfx/render';
import { Sprite } from "@pixi/sprite";
import { PixelateFilter } from "@pixi/filter-pixelate";

let uiSprites = new Map<string, Sprite>();

export function renderHUD(world : World) {
    let zone = world.zones[world.currentZone];
    if (zone) {

    }

}