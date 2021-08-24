import * as PIXI from 'pixi.js';
import { AbstractRenderer } from 'pixi.js';

let app: PIXI.Application;
let windowSize = {width: 1920, height: 1080};
let ratio = windowSize.width / windowSize.height;

export function LauncherLaunchGame(width: number, height: number): void {
	windowSize.width = width;
	windowSize.height = height;
	ratio = windowSize.width / windowSize.height;

	function resize() {
		let zoom = (( window.outerWidth) / window.innerWidth);

		if (window.innerWidth / window.innerHeight >= ratio) {
			var w = window.innerHeight * ratio * zoom;
			var h = window.innerHeight * zoom;
		} else {
			var w = window.innerWidth * zoom;
			var h = window.innerWidth / ratio * zoom;
		}
		renderer.view.style.width = w + 'px';
		renderer.view.style.height = h + 'px';

		//renderer.view.style.position = "relative";
		//renderer.view.style.left = ((window.innerWidth - w) >> 1) + 'px'
		//renderer.view.style.top = ((window.innerHeight - h) >> 1) + 'px';

	}
	window.onresize = function(event) {
		resize();
	};



	// Creates the document
	app = new PIXI.Application({ width, height,
		autoDensity: true,
		backgroundColor: 0x1099bb,
		antialias: false,
	});
	app.view.setAttribute("id", "mainCanvas");

	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;









	let stage = app.stage;
	let renderer = app.renderer;
	document.body.appendChild(renderer.view);

	let texture = PIXI.RenderTexture.create({ width: 300, height: 300 });
	let r1 = new PIXI.Graphics();
	r1.beginFill(0x000000);
	r1.drawRect(100, 100, 100, 100);
	r1.endFill();
	renderer.render(r1,{renderTexture: texture})
	var block = new PIXI.Sprite(texture);
	block.position.x = 200;
	block.position.y = 200;
	block.anchor.x = .5;
	block.anchor.y = .5;
	stage.addChild(block);
	resize();

	// Listen for animate update
	var lastTick = performance.now();
	app.ticker.add((delta: number) => {
		let d = performance.now() - lastTick;
		lastTick = performance.now();


		function animate() {
			block.rotation += .01;
		}
		animate();
	});
}

