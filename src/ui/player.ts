
import { Actor, ActorContainer } from "../world/actor";

export class Player {
    controlActor : Actor | null = null;
    cameraActor : Actor | null = null;

    constructor(player : Actor | null) {
        this.controlActor = player;
        this.cameraActor = player;
    }
}

