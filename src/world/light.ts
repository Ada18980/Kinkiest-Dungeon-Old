


// s = source x and y points and w weights
// dx, dy = destination x and y

import { Wall, Zone } from "./world";

// w = weight multiplier
export interface LightMapPoint {
    dx : number;
    dy : number;
    s : LightSourcePoint[];
}

export interface LightSourcePoint {
    x : number,
    y : number,
    w : number,
}

export function propagateLight(zone : Zone, x : number, y : number, range : number, dispersion : number, darkness : number) {
    zone.light = [];
    for (let y = 0; y < zone.height; y++) {
        let row : number[] = [];
        for (let x = 0; x < zone.width; x++) {
            row[x] = 0;
        }
        zone.light.push(row);
    }
    zone.setLight(x, y, 1.0);

    // Begin running the lightmap
    let lightmult = 1.0;
    for (let r = 0; r < range && r < lightMap.length; r++) {
        let ring = lightMap[r]; // Get a ring from the lightmap
        if (ring) {
            for (let cell of ring) {
                let sum = 0.0;
                let block = zone.get(x + cell.dx, y + cell.dy) == Wall.WALL;
                // For each ring cell we look at dependent light points and add up
                for (let source of cell.s) {
                    if (zone.get(x + source.x, y + source.y) < Wall.WALL || (source.x == 0 && source.y == 0)) {
                        //if (!block || (source.y >= cell.dy)) {
                            sum = Math.max(sum, zone.getLight(x + source.x, y + source.y) * source.w);
                        //}
                    }
                }
                if (!block && sum <= 0.99) {
                    let neighbors = zone.getWallNeighborCount(x + cell.dx, y + cell.dy);
                    if (neighbors >= 3 + 3 * sum) {
                        sum = Math.max(0, sum - 0.05 * neighbors);
                    }
                }
                if (sum < dispersion * lightmult) {
                    sum = 0;
                }
                if (sum > 0) zone.setLight(x + cell.dx, y + cell.dy, lightmult * Math.min(1.0, sum));
                else zone.setLight(x + cell.dx, y + cell.dy, -1);
            }
        }
        lightmult *= (1.0 - darkness);
    }
}


// TODO make it so walls dont get lit up from above, but do get lit up from below

export let lightMap : LightMapPoint[][] = [
[// range 1
    {dx : 1, dy : 0, s : [
        {x : 0, y : 0, w : 1},
    ]},
    {dx : 0, dy : 1, s : [
        {x : 0, y : 0, w : 1},
    ]},
    {dx : -1, dy : 0, s : [
        {x : 0, y : 0, w : 1},
    ]},
    {dx : 0, dy : -1, s : [
        {x : 0, y : 0, w : 1},
    ]},
    {dx : 1, dy : 1, s : [
        {x : 0, y : 0, w : 0.99},
    ]},
    {dx : 1, dy : -1, s : [
        {x : 0, y : 0, w : 0.99},
    ]},
    {dx : -1, dy : 1, s : [
        {x : 0, y : 0, w : 0.99},
    ]},
    {dx : -1, dy : -1, s : [
        {x : 0, y : 0, w : 0.99},
    ]},
],
];

let maxRange = 10;

export function createLightMap() {
    if (lightMap.length < maxRange) {
        for (let i = 1; i < maxRange; i++) {
            createLightMapRing();
            console.log(lightMap);
        }
    }
}

function createLightMapRing() {
    let d = lightMap.length + 1; // Current radius
    let ring = [];
    for (let y = -d; y <= d; y++) {
        for (let x = -d; x <= d; x++) {
            if (Math.abs(x) == d || Math.abs(y) == d) {
                let cell : LightMapPoint = {
                    dx : x, dy : y,
                    s : []
                }
                let neighbors = [];
                for (let xx = x-1; xx <= x+1; xx++) {
                    for (let yy = y-1; yy <= y+1; yy++) {
                        if (xx != x || yy != y) {
                            if (Math.abs(xx) < d && Math.abs(yy) < d) {
                                // Enforce directionality
                                if ((Math.abs(xx) <= Math.abs(x))
                                    && (Math.abs(yy) <= Math.abs(y)))
                                        neighbors.push({x : xx, y : yy, w : 0.0});
                            }
                        }
                    }
                }
                for (let n of neighbors) {
                    if (neighbors.length == 1) n.w = 1.0;
                    else if (n.x == cell.dx || n.y == cell.dy) n.w = 1.0;
                    else n.w = 0.7;
                    cell.s.push(n);
                }
                ring.push(cell);
            }
        }
    }
    lightMap.push(ring);
}
