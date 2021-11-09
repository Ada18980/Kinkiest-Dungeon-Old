import { sign } from "@pixi/utils";
import { WorldVec } from "./world";

export function cDist(vec : WorldVec) : number {
    return Math.max(Math.abs(vec.x), Math.abs(vec.y));
}

export function truncGridDir(vec : WorldVec, range : number) : WorldVec {
    if (range < 1) {
        return {x : 0, y : 0};
    }
    let cdist = cDist(vec);//Math.max(Math.abs(vec.x), Math.abs(vec.y)); // Chebyshev dist
    let factor = range / cdist;
    return {x : sign(vec.x) * Math.round(factor * Math.abs(vec.x)), y : sign(vec.y) * Math.round(factor * Math.abs(vec.y))};
}
// Conservative version of truncGridDir
export function truncGridDirCon(vec : WorldVec, range : number) : WorldVec {
    if (range < 1) {
        return {x : 0, y : 0};
    }
    let cdist = cDist(vec);//Math.max(Math.abs(vec.x), Math.abs(vec.y)); // Chebyshev dist
    let factor = range / cdist;
    return {x : sign(vec.x) * Math.floor(factor * Math.abs(vec.x)), y : sign(vec.y) * Math.floor(factor * Math.abs(vec.y))};
}
// Liberal version of truncGridDir
export function truncGridDirLib(vec : WorldVec, range : number) : WorldVec {
    if (range < 1) {
        return {x : 0, y : 0};
    }
    let cdist = cDist(vec);//Math.max(Math.abs(vec.x), Math.abs(vec.y)); // Chebyshev dist
    let factor = range / cdist;
    return {x : sign(vec.x) * Math.ceil(factor * Math.abs(vec.x)), y : sign(vec.y) * Math.ceil(factor * Math.abs(vec.y))};
}

export function getGridDir(x : number, y : number, range: number = 1) : WorldVec {
    if (range > 1) {
        // Use slower algorithm
        let cdist = Math.max(Math.abs(x), Math.abs(y)); // Chebyshev dist
        // Normalize x and y
        let xx = Math.round(cdist) > range ? range * Math.min(1, Math.abs(x) / cdist) : Math.abs(x);
        let yy = Math.round(cdist) > range ? range * Math.min(1, Math.abs(y) / cdist) : Math.abs(y);
        // Now round
        return {x: sign(x) * Math.round(xx), y: sign(y) * Math.round(yy)};
    }
    // Otherwise use faster algorithm
    if (x > 0) {
        if (y > 0) {
            if (y < x * 0.38268343236) {
                return {x : 1, y : 0};
            } else if (x < y * 0.38268343236) {
                return {x : 0, y : 1};
            } else return {x : 1, y : 1};
        } else {
            if (y > x * -0.38268343236) {
                return {x : 1, y : 0};
            } else if (x < y * -0.38268343236) {
                return {x : 0, y : -1};
            } else return {x : 1, y : -1};
        }
    } else {
        if (y > 0) {
            if (y < x * -0.38268343236) {
                return {x : -1, y : 0};
            } else if (x > y * -0.38268343236) {
                return {x : 0, y : 1};
            } else return {x : -1, y : 1};
        } else {
            if (y > x * 0.38268343236) {
                return {x : -1, y : 0};
            } else if (x > y * 0.38268343236) {
                return {x : 0, y : -1};
            } else return {x : -1, y : -1};
        }
    }
    return {x : 0, y : 0};
}