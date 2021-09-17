export let mouseLeftDown = false;
export let mouseRightDown = false;
export let mouseMiddleDown = false;

export let keys : ControlScheme = {
    moveU : false,
    moveD : false,
    moveL : false,
    moveR : false,
    spell : -1,
    wait : false,
    return : false,

};


export let keyBindings : KeyBindingScheme = {
    moveU : ['W', 'ARROWUP'],
    moveD : ['S', 'ARROWDOWN'],
    moveL : ['A', 'ARROWLEFT'],
    moveR : ['D', 'ARROWRIGHT'],
    spell : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    wait : [' ',],
    return : ['ENTER',],

};

export interface KeyBindingScheme {
    moveU : string[],
    moveD : string[],
    moveL : string[],
    moveR : string[],
    spell : string[],
    wait : string[],
    return : string[],
}

export interface ControlScheme {
    moveU : boolean,
    moveD : boolean,
    moveL : boolean,
    moveR : boolean,
    spell : number,
    wait : boolean,
    return : boolean,
}


export function initControls() {
    window.addEventListener('mousedown',(event) => {
        if (event.button == 0) mouseLeftDown = true;
        else if (event.button == 1) mouseMiddleDown = true;
        else if (event.button == 2) mouseRightDown = true;
        console.log(mouseLeftDown)
    });
    window.addEventListener('mouseup',(event) => {
        if (event.button == 0) mouseLeftDown = false;
        else if (event.button == 1) mouseMiddleDown = false;
        else if (event.button == 2) mouseRightDown = false;
        console.log(mouseLeftDown)
    });

    window.addEventListener('keydown',(event) => {

    });
}
