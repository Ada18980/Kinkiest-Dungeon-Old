'use strict';

/*
        <script src="./externals/pixi.min.js"></script>
        <script src="./dist/bundle.js"></script>
*/

// import * as PIXI from 'pixi.js';
import { LauncherLaunchGame } from './launcher';

// let type = 'WebGL';
// if (!PIXI.utils.isWebGLSupported()) {
// 	type = 'canvas';
// }

LauncherLaunchGame(1440, 1080);
