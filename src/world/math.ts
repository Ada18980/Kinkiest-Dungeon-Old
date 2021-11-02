import { WorldVec } from "./world";

export function getGridDir(x : number, y : number) : WorldVec {
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