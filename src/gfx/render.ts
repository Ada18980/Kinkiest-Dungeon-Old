
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport'

export const TILE_SIZE = 63;
export const MIN_ZOOM = 5; // In tiles
export const MAX_ZOOM = 25; // In Tiles

export let renderer: PIXI.Renderer;
export let viewport: Viewport;

export function setRenderer(r : PIXI.Renderer) {
    renderer = r;
}

export function setViewport(v : Viewport) {
    viewport = v;
}
