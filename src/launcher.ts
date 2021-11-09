"use strict";

import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport'
import { loadSprites } from './gfx/sprites';
import { AbstractRenderer } from 'pixi.js';
import { Actor, ActorContainer } from './world/actor';
import { World } from './world/world';
import { MAX_ZOOM, MIN_ZOOM, TILE_SIZE, renderer, viewport, setRenderer, setViewport } from './gfx/render';
import { UI } from './ui/ui';
import { initControls }  from './ui/control';
import { Player } from './ui/player';
import { addHudElements } from './ui/hud';

export let app: PIXI.Application;
export let windowSize = {width: 1920, height: 1080};
export let ratio = windowSize.width / windowSize.height;

export function LauncherLaunchGame(width: number, height: number): void {

	let start = performance.now();

	setWindowSize(width, height);

	window.onresize = function(event) {
		resize();
	};

	// Creates the document
	app = new PIXI.Application({
		resizeTo: window,
		autoDensity: true,
		backgroundColor: 0x000000,
		antialias: false,
	});

	// Set up the renderer and properties
	setRenderer(app.renderer as PIXI.Renderer);
	app.view.setAttribute("id", "mainCanvas");
	renderer.plugins.interaction.autoPreventDefault = true;
	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;


	// create viewport
	setViewport(new Viewport({
		screenWidth: width,
		screenHeight: height,

		worldWidth: TILE_SIZE * 100,
		worldHeight: TILE_SIZE * 100,

		disableOnContextMenu: true,

		interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
	}));

	viewport.sortableChildren = true;

	// add the viewport to the stage
	app.stage.addChild(viewport);
	addHudElements(app.stage, viewport);
	app.stage.sortableChildren = true;
	// activate plugins
	viewport
		.drag({mouseButtons: "left"})
		.pinch()
		.wheel({smooth: 5})
		.decelerate({friction: .87})
		.clampZoom(clampZoomOptions())

	let stage = app.stage;
	document.body.appendChild(renderer.view);


	resize();

	loadSprites();

	let world = new World();
	let player = new Actor(49, 49, {
		sprite: "player_default",
		player: true,
	});
	world.addActor(player);
	world.update(0);

	//for (let i = 0; i < 100; i++) {
	//	let x = Math.random() *20 - 10;
	//	let y = Math.random() *20 - 10;
	//
	//	world.addActor(new Actor(x, y, {sprite: "player_default"}));
	//}

	console.log(world.tree_actors);

	let GUI = new UI(player, world);
	GUI.initialize(app);
	GUI.player = new Player(player);

	initControls(GUI);

	console.log("Time taken to init: " + (performance.now() - start));
}

function resize() {

	renderer.view.style.position = "absolute";
	renderer.view.style.left = 0 + 'px'
	renderer.view.style.top = 0 + 'px';

	setWindowSize(window.innerWidth, window.innerHeight);

	/*
	if (window.innerWidth / window.innerHeight >= ratio) {
		var w = window.innerHeight * ratio;
		var h = window.innerHeight;
	} else {
		var w = window.innerWidth;
		var h = window.innerWidth / ratio;
	}
	renderer.view.style.width = w + 'px';
	renderer.view.style.height = h + 'px';

	renderer.view.style.position = "absolute";
	renderer.view.style.left = ((window.innerWidth - w) >> 1) + 'px'
	renderer.view.style.top = ((window.innerHeight - h) >> 1) + 'px';
	*/

	viewport.screenWidth = window.innerWidth;
	viewport.screenHeight = window.innerHeight;

	viewport.clampZoom(clampZoomOptions());


	viewport.snap(viewport.center.x+1, viewport.center.y, {time: 0, removeOnComplete: true});
	viewport.snap(viewport.center.x-1, viewport.center.y, {time: 0, removeOnComplete: true});

	//viewport.drag();

}

function clampZoomOptions() {
	let options = {
		minScale: Math.round(10 * MIN_ZOOM * TILE_SIZE / Math.min(windowSize.width, windowSize.height))/10,
		maxScale: Math.round(10 * MAX_ZOOM * TILE_SIZE / Math.min(windowSize.width, windowSize.height) * Math.max(1, ratio))/10,
	};
	console.log(options)
	return options;
}

function setWindowSize(width: number, height: number) {
	windowSize.width = width;
	windowSize.height = height;
	ratio = windowSize.width / windowSize.height;
	if (ratio < 0.01) ratio = 0.01;
}

export function changeResolution(width: number, height: number) {
	setWindowSize(width, height);
	viewport.clampZoom(clampZoomOptions());
}