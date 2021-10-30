"use strict";

export class WorldObject {
    x : number;
    y : number;
    id : number = 0;

    constructor(x : number, y : number) {
        this.x = x;
        this.y = y;
    }
}

export class QuadTree<QuadType extends WorldObject> {
    head : QuadCell<QuadType>;
    constructor(radius : number) {
        this.head = new QuadCell(0, 0, radius);
    }

    // Checks all actors to make sure the x and y are correct
    refresh() {
        let refList : QuadType[] = [];
        for (let ref of this.head.refs) {
            let obj = ref[1];
            let cell = this.getCell(obj.x, obj.y);
            if (obj.x >= cell.x + cell.radius || obj.x < cell.x - cell.radius || obj.y >= cell.y + cell.radius || obj.y < cell.y - cell.radius) {
                refList.push(obj);
            }
        }
        for (let obj of refList) {
            this.remove(obj);
            this.add(obj);
        }
    }

    getAll(x : number, y : number, radius : number) : QuadType[] {return this.head.getAll(x, y, radius);}
    getCell(x : number, y : number) : QuadCell<QuadType> {return this.head.getCell(x, y);}
    add(obj : QuadType) {
        let dir = -1;
        let iter = 0;
        let max = 1000;
        while(this.getDir(obj.x, obj.y) > -1 && iter < max) {
            this.expand(this.getDir(obj.x, obj.y));
            iter += 1;
        }

        if (iter >= max) {
            console.log("Error, overflow when populating quad tree");
        }

        this.head.add(obj);
    }
    remove(obj : QuadType) : boolean {return this.head.remove(obj);}

    getDir(x : number, y : number) : number {
        if (x >= this.head.x + this.head.radius) {
            if (y >= this.head.y + this.head.radius) {
                return 3;
            } else if (y <= this.head.y - this.head.radius) {
                return 1;
            }
        } else if (x <= this.head.x - this.head.radius) {
            if (y >= this.head.y + this.head.radius) {
                return 2;
            } else if (y <= this.head.y - this.head.radius) {
                return 0;
            }
        }

        return -1;
    }

    // 0 = nw
    // 1 = ne
    // 2 = sw
    // 3 = se
    expand(dir : number) {
        let radius = this.head.radius;
        let x = this.head.x;
        let y = this.head.y;
        if (dir == 3) {
            let newCell = new QuadCell<QuadType>(x + radius, y + radius, radius * 2);
            newCell.nw = this.head;
            newCell.ne = new QuadCell<QuadType>(x+radius * 2, y, radius);
            newCell.sw = new QuadCell<QuadType>(x, y+radius * 2, radius);
            newCell.se = new QuadCell<QuadType>(x+radius * 2, y+radius * 2, radius);
            this.head = newCell;
        } else if (dir == 2) {
            let newCell = new QuadCell<QuadType>(x - radius, y + radius, radius * 2);
            newCell.nw = new QuadCell<QuadType>(x-radius * 2, y, radius);
            newCell.ne = this.head;
            newCell.sw = new QuadCell<QuadType>(x-radius * 2, y+radius * 2, radius);
            newCell.se = new QuadCell<QuadType>(x, y+radius * 2, radius);
            this.head = newCell;
        } else if (dir == 1) {
            let newCell = new QuadCell<QuadType>(x + radius, y - radius, radius * 2);
            newCell.nw = new QuadCell<QuadType>(x, y-radius * 2, radius);
            newCell.ne = new QuadCell<QuadType>(x+radius * 2, y-radius * 2, radius);
            newCell.sw = this.head;
            newCell.se = new QuadCell<QuadType>(x+radius * 2, y, radius);
            this.head = newCell;
        } else {
            let newCell = new QuadCell<QuadType>(x - radius, y - radius, radius * 2);
            newCell.nw = new QuadCell<QuadType>(x-radius * 2, y-radius * 2, radius);
            newCell.ne = new QuadCell<QuadType>(x, y-radius * 2, radius);
            newCell.sw = new QuadCell<QuadType>(x-radius * 2, y, radius);
            newCell.se = this.head;
            this.head = newCell;
        }
    }

}

class QuadCell<QuadType extends WorldObject> {
    nw : QuadCell<QuadType> | undefined = undefined;
    ne : QuadCell<QuadType> | undefined = undefined;
    sw : QuadCell<QuadType> | undefined = undefined;
    se : QuadCell<QuadType> | undefined = undefined;
    refs : Map<number, QuadType> = new Map<number, QuadType>();

    x : number;
    y : number;
    radius : number;
    quad_max : number;
    minRadius : number = 10;

    constructor(x : number, y : number, radius : number, quad_max : number = 10) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.quad_max = quad_max;
    }

    // Gets the current cell associated with the x, y point
    getCell(x: number, y: number) : QuadCell<QuadType> {

        if (this.se && x > this.x && y > this.y) return this.se.getCell(x, y);
        if (this.sw && x <= this.x && y > this.y) return this.sw.getCell(x, y);
        if (this.ne && x > this.x && y <= this.y) return this.ne.getCell(x, y);
        if (this.nw && x <= this.x && y <= this.y) return this.nw.getCell(x, y);

        return this;
    }

    getAll(x : number, y : number, radius : number) : QuadType[] {
        let ret : QuadType[]= [];
        let search : QuadCell<QuadType>[] = [];

        if (this.se && x + radius > this.x && y + radius > this.y) search.push(this.se);
        if (this.sw && x - radius <= this.x && y + radius > this.y) search.push(this.sw);
        if (this.ne && x + radius > this.x && y - radius <= this.y) search.push(this.ne);
        if (this.nw && x - radius <= this.x && y - radius <= this.y) search.push(this.nw);

        if (search.length > 0) {
            for (let s of search)
                for (let ss of s.getAll(x, y, radius))
                    ret.push(ss);
        } else {
            for (let r of this.refs) {
                if (r[1].x >= x - radius
                    && r[1].x <= x + radius
                    && r[1].y >= y - radius
                    && r[1].y <= y + radius)
                    ret.push(r[1]);
            }
        }

        return ret;
    }

    add(obj : QuadType) {
        this.refs.set(obj.id, obj);
        if (this.refs.size > this.quad_max && !this.nw && this.radius > this.minRadius) {
            let radius = this.radius/2;
            this.nw = new QuadCell<QuadType>(this.x-radius, this.y-radius, radius);
            this.ne = new QuadCell<QuadType>(this.x+radius, this.y-radius, radius);
            this.sw = new QuadCell<QuadType>(this.x-radius, this.y+radius, radius);
            this.se = new QuadCell<QuadType>(this.x+radius, this.y+radius, radius);
            for (let r of this.refs) {
                if (r[1].x > this.x && r[1].y > this.y && this.se) this.se.add(r[1]);
                else if (r[1].x <= this.x && r[1].y > this.y && this.sw) this.sw.add(r[1]);
                else if (r[1].x > this.x && r[1].y <= this.y && this.ne) this.ne.add(r[1]);
                else if (r[1].x <= this.x && r[1].y <= this.y && this.nw) this.nw.add(r[1]);
            }
        } else {
            if (obj.x > this.x && obj.y > this.y && this.se) this.se.add(obj);
            else if (obj.x <= this.x && obj.y > this.y && this.sw) this.sw.add(obj);
            else if (obj.x > this.x && obj.y <= this.y && this.ne) this.ne.add(obj);
            else if (obj.x <= this.x && obj.y <= this.y && this.nw) this.nw.add(obj);
        }
    }

    remove(obj : QuadType) : boolean {
        if (this.refs.has(obj.id)) {
            this.refs.delete(obj.id);
            if (this.refs.size <= this.quad_max) {
                delete this.nw;
                delete this.sw;
                delete this.ne;
                delete this.se;
                this.nw = undefined;
                this.ne = undefined;
                this.sw = undefined;
                this.se = undefined;
                return true;
            } else {
                if (obj.x > this.x && obj.y > this.y && this.se) return this.se.remove(obj);
                else if (obj.x <= this.x && obj.y > this.y && this.sw) return this.sw.remove(obj);
                else if (obj.x > this.x && obj.y <= this.y && this.ne) return this.ne.remove(obj);
                else if (obj.x <= this.x && obj.y <= this.y && this.nw) return this.nw.remove(obj);
                return true;
            }
        }
        return false;
    }




}