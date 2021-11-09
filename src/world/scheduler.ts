import { Actor, Dir } from "./actor";
import { cDist, truncGridDir, truncGridDirCon, truncGridDirLib } from "./math";
import { World, WorldVec } from "./world";

export class Scheduler {
    world : World;
    tasks : Task[];
    requests : number[] = [];
    requestDelay = 200;
    lastRequestTime = 0;
    constructor(world : World) {
        this.world = world;
        this.tasks = [];
    }
    update() {
        if (this.requests.length > 0 && performance.now() > this.lastRequestTime + this.requestDelay) {
            let request = this.requests[0];
            if (request != undefined) {
                if (request == 0) this.world.update(0);
                else
                    for (let d = 0; d < request; d++) {
                        let taskQueue = [];
                        for (let task of this.tasks) {
                            taskQueue.push(task);
                            this.tasks.splice(this.tasks.indexOf(task), 1);
                        }
                        // TODO sort tasks based on priority here
                        for (let task of taskQueue) {
                            task.execute(this.world);
                        }
                        this.world.update(1);
                    }
                this.lastRequestTime = performance.now();
                this.requests.splice(0, 1);
            }
            //console.log("Updated")
        }
    }

    requestUpdateTick(d : number) {
        this.requests.push(d);
        //console.log("Tick: " + d)
    }

    sendActorMoveRequest(actor : Actor, dir : WorldVec) {
        this.tasks.push(new TaskMove(actor, dir));
        //console.log("Move: " + dir)
    }

}

class Task {
    target : Actor | undefined;
    constructor(actor : Actor, priority : number = 0) {
        this.target = actor;
    }

    execute(world : World) : boolean {
        return false;
    }
}

class TaskMove extends Task {
    direction : WorldVec;

    constructor(actor : Actor, dir : WorldVec, priority : number = 0) {
        super(actor, priority);
        this.direction = dir;
    }

    override execute(world : World) : boolean {
        if (world.player && world.actorCanMove(world.player, world.player.x + this.direction.x, world.player.y + this.direction.y)) {
            let finalDir : WorldVec | undefined;
            for (let r = 1; r <= cDist(this.direction); r++) {
                let newDir1 = truncGridDir(this.direction, r);
                let newDir2 = truncGridDirCon(this.direction, r);
                let newDir3 = truncGridDirLib(this.direction, r);
                if (world.actorCanMove(world.player, world.player.x + newDir1.x, world.player.y + newDir1.y)) finalDir = newDir1;
                else if (world.actorCanMove(world.player, world.player.x + newDir2.x, world.player.y + newDir2.y)) finalDir = newDir2;
                else if (world.actorCanMove(world.player, world.player.x + newDir3.x, world.player.y + newDir3.y)) finalDir = newDir3;
                else break;
                /*
                let fdir : WorldVec | undefined;
                let pass = 0;
                let newDir1 = truncGridDir(this.direction, r);
                let newDir2 = truncGridDirCon(this.direction, r);
                let newDir3 = truncGridDirLib(this.direction, r);
                if (world.actorCanMove(world.player, world.player.x + newDir1.x, world.player.y + newDir1.y)) {fdir = newDir1; pass += 1;}
                if ( world.actorCanMove(world.player, world.player.x + newDir2.x, world.player.y + newDir2.y)) {fdir = newDir2; pass += 1;}
                if (pass < 2 && world.actorCanMove(world.player, world.player.x + newDir3.x, world.player.y + newDir3.y)) {fdir = newDir3; pass += 1;}
                if (pass < 2) break;
                else finalDir = fdir;*/
            }
            if (finalDir) world.moveActor(world.player, finalDir);

        }
        return false;
    }
}