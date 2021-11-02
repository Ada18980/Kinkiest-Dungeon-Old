import { Actor, Dir } from "./actor";
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
            world.moveActor(world.player, this.direction);
        }
        return false;
    }
}