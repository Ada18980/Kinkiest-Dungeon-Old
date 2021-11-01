


// s = source x and y points and w weights
// dx, dy = destination x and y
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
        {x : 0, y : 0, w : 0.71},
    ]},
    {dx : 1, dy : -1, s : [
        {x : 0, y : 0, w : 0.71},
    ]},
    {dx : -1, dy : 1, s : [
        {x : 0, y : 0, w : 0.71},
    ]},
    {dx : -1, dy : -1, s : [
        {x : 0, y : 0, w : 0.71},
    ]},
],
];