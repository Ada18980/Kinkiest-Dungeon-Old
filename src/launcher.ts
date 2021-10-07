"use strict";

import * as PIXI from 'pixi.js';
import { loadSprites } from './sprites';
import { MAX_ZOOM, MIN_ZOOM, TILE_SIZE } from './render';
import { AbstractRenderer } from 'pixi.js';
import { Viewport } from 'pixi-viewport'
import { Actor, ActorContainer } from './actor';
import { Floor } from './world';
import { mouseLeftDown, mouseRightDown, mouseMiddleDown, initControls } from './control';

export let app: PIXI.Application;
export let renderer: PIXI.Renderer;
let viewport: Viewport;
export let windowSize = {width: 1920, height: 1080};
export let ratio = windowSize.width / windowSize.height;

export function LauncherLaunchGame(width: number, height: number): void {
	initControls();

	setWindowSize(width, height);

	window.onresize = function(event) {
		resize();
	};

	// Creates the document
	app = new PIXI.Application({
		resizeTo: window,
		autoDensity: true,
		backgroundColor: 0x1099bb,
		antialias: false,
	});

	// Set up the renderer and properties
	renderer = app.renderer as PIXI.Renderer;
	app.view.setAttribute("id", "mainCanvas");
	renderer.plugins.interaction.autoPreventDefault = true;
	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;


	// create viewport
	viewport = new Viewport({
		screenWidth: width,
		screenHeight: height,

		worldWidth: 2048,
		worldHeight: 2048,

		disableOnContextMenu: true,

		interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
	});

	viewport.sortableChildren = true;

	// add the viewport to the stage
	app.stage.addChild(viewport);
	// activate plugins
	viewport
		.drag({mouseButtons: "left"})
		.pinch()
		.wheel({smooth: 5})
		.decelerate({friction: .87})
		//.clamp({direction: "all", })
		.clampZoom(clampZoomOptions())

	let stage = app.stage;
	document.body.appendChild(renderer.view);

	for (let i = 0; i < 1024/TILE_SIZE; i += 1) {
		for (let ii = 0; ii <= 2048/TILE_SIZE; ii += 1) {
			let texture = PIXI.RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE });
			let r1 = new PIXI.Graphics();
			r1.beginFill(0x000000);
			r1.drawRect(0, 0, 64, 64);
			r1.endFill();
			renderer.render(r1,{renderTexture: texture})
			let block = new PIXI.Sprite(texture);
			block.position.x = 2*TILE_SIZE*i + (ii % 2 == 0 ? 0 : TILE_SIZE);
			block.position.y = TILE_SIZE*ii;
			block.anchor.x = 0;
			block.anchor.y = 0;
			viewport.addChild(block);
		}
	}

	resize();

	loadSprites();

	// Listen for animate update
	var lastTick = performance.now();



	let world = new Floor();
	world.addActor(new Actor(4, 4, {
		sprite: "player_default",
		player: true,
	}));

	let snapBack = false;
	viewport.addListener('moved-end', (event) => {snapBack = false;});
	viewport.addListener('drag-start', (event) => {snapBack = false;});

	console.log(world.player)
	viewport.snap(world.player?.xx || 0, world.player?.yy || 0, {ease: "easeInOutSine", time: 1000, removeOnComplete: true});
	viewport.snapZoom({ease: "easeInOutSine", time: 1000, removeOnComplete: true, height: ratio > 1 ? (MIN_ZOOM * TILE_SIZE) : undefined, width: ratio <= 1 ? (MIN_ZOOM * TILE_SIZE) : undefined});

	app.ticker.add((delta: number) => {
		let d = performance.now() - lastTick;
		lastTick = performance.now();

		world.render(viewport);

		if ((viewport.center.x > viewport.worldWidth || viewport.center.x < 0 || viewport.center.y > viewport.worldHeight || viewport.center.y < 0)) {
			if (!mouseLeftDown) {
				if (!snapBack)
					viewport.snap(Math.max(0, Math.min(viewport.center.x, viewport.worldWidth)), Math.max(0, Math.min(viewport.center.y, viewport.worldHeight)), {ease: "easeInOutSine", time: 500, removeOnComplete: true, removeOnInterrupt: true});
				snapBack = true;
			}
		} else snapBack = false;
	});
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
	return {
		minWidth: MIN_ZOOM * TILE_SIZE,
		minHeight: MIN_ZOOM * TILE_SIZE,
		maxWidth: MAX_ZOOM * TILE_SIZE * Math.max(1, ratio),
		maxHeight: MAX_ZOOM * TILE_SIZE / Math.min(1, ratio),
	};
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