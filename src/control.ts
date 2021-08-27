export let mouseLeftDown = false;
export let mouseRightDown = false;
export let mouseMiddleDown = false;

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
}
