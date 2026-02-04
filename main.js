var delta = [0, 0];
var stage = [window.screenX, window.screenY, window.innerWidth, window.innerHeight];
getBrowserDimensions();

var isMouseDown = false;

var worldAABB;
var world;
var iterations = 10;
var timeStep = 1 / 60;

var lastTime = performance.now();
var accumulator = 0;

var walls = [];
var wall_thickness = 200;
var wallsSetted = false;

var mouseJoint;
var mouse = { x: 0, y: 0 };

var mouseOnClick = [];

var elements = [];
var bodies = [];
var properties = [];

var query, page = 0;

var gWebSearch, gImageSearch;
var imFeelingLuckyMode = false;
var resultBodies = [];

var gravity = { x: 0, y: 0 };

function init() {
	document.addEventListener('pointerdown', onPointerDown, false);
	document.addEventListener('pointerup', onPointerUp, false);
	document.addEventListener('pointermove', onPointerMove, false);
	document.addEventListener('pointercancel', onPointerUp, false);

	// init box2d
	worldAABB = new b2AABB();
	updateWorldBounds();
	world = new b2World(worldAABB, new b2Vec2(0, 0), true);

	// walls
	setWalls();

	// Get box2d elements
	elements = [...document.querySelectorAll('.box2d')];
	var len = elements.length;

	for (var i = 0; i < len; i++) {
		properties[i] = getElementProperties(elements[i]);
	}

	for (var i = 0; i < len; i++) {
		var element = elements[i];
		element.style.position = 'absolute';
		element.style.left = properties[i][0] + 'px';
		element.style.top = properties[i][1] + 'px';
		element.style.width = properties[i][2] + 'px';
		element.addEventListener('mousedown', onElementMouseDown, false);
		element.addEventListener('mouseup', onElementMouseUp, false);
		element.addEventListener('click', onElementClick, false);

		bodies[i] = createBox(world, properties[i][0] + (properties[i][2] >> 1), properties[i][1] + (properties[i][3] >> 1), properties[i][2] / 2, properties[i][3] / 2, false);

		element.style.left = '0px';
		element.style.top = '0px';

		while (element.offsetParent) {

			element = element.offsetParent;
			element.style.position = 'static';

		}

	}
	render();
	requestAnimationFrame(mainLoop);
}

function onPointerDown(event) {
	if (event.isPrimary === false) return;
	isMouseDown = true;
	mouse.x = event.clientX;
	mouse.y = event.clientY;
}

function onPointerUp(event) {
	if (event.isPrimary === false) return;
	isMouseDown = false;
}

function onPointerMove(event) {
	mouse.x = event.clientX;
	mouse.y = event.clientY;
}



function onElementMouseDown(event) {

	event.preventDefault();

	mouseOnClick[0] = event.clientX;
	mouseOnClick[1] = event.clientY;

}

function onElementMouseUp(event) {

	event.preventDefault();

}

function onElementClick(event) {
	var range = 5;

	// 1. Check if this was a Drag or a Click
	if (mouseOnClick[0] > event.clientX + range || mouseOnClick[0] < event.clientX - range &&
		mouseOnClick[1] > event.clientY + range || mouseOnClick[1] < event.clientY - range) {
		event.preventDefault(); // It was a drag, do nothing
		return;
	}
	const linkUrl = this.href;

	if (linkUrl) {
		event.preventDefault();

		gsap.to(".box2d", {
			opacity: 0,
			duration: 0.5,
			ease: "power2.inOut",
			onComplete: () => {
				window.location.href = linkUrl;
			}
		});
	}
}


function mainLoop(currentTime) {
	requestAnimationFrame(mainLoop);

	var frameTime = (currentTime - lastTime) / 1000;
	lastTime = currentTime;

	if (frameTime > 0.25) frameTime = 0.25;

	accumulator += frameTime;

	while (accumulator >= timeStep) {
		updatePhysics();
		accumulator -= timeStep;
	}

	render();
}

function updatePhysics() {
	if (getBrowserDimensions())
		setWalls();

	delta[0] += (0 - delta[0]) * .5;
	delta[1] += (0 - delta[1]) * .5;

	world.m_gravity.x = gravity.x * 350 + delta[0];
	world.m_gravity.y = gravity.y * 350 + delta[1];

	mouseDrag();

	world.Step(timeStep, iterations);
}

function render() {
	var RAD = 57.2957795;
	var len = elements.length;

	for (var i = 0; i < len; i++) {
		var body = bodies[i];
		var element = elements[i];

		var p = body.m_position;

		var x = (p.x - (properties[i][2] >> 1));
		var y = (p.y - (properties[i][3] >> 1));
		var angle = body.m_rotation * RAD;

		element.style.transform =
			'translate3d(' + x + 'px, ' + y + 'px, 0) ' +
			'rotate(' + angle + 'deg)';
	}
}


function createBox(world, x, y, width, height, fixed, element) {

	var boxSd = new b2BoxDef();

	if (fixed === undefined) fixed = true;
	if (fixed === false) boxSd.density = 1.0;

	boxSd.restitution = 0.5;
	boxSd.friction = 0.5;

	boxSd.extents.Set(width, height);

	var boxBd = new b2BodyDef();
	boxBd.AddShape(boxSd);
	boxBd.position.Set(x, y);
	boxBd.linearVelocity.Set(Math.random() * 5 - 1, Math.random() * 5 - 1);
	boxBd.angularVelocity = Math.random() * 0.05 - 0.01;
	boxBd.userData = { element: element };

	return world.CreateBody(boxBd)
}

function mouseDrag() {

	if (isMouseDown && !mouseJoint) {

		var body = getBodyAtMouse();

		if (body) {
			var md = new b2MouseJointDef();
			md.body1 = world.m_groundBody;
			md.body2 = body;
			md.target.Set(mouse.x, mouse.y);
			md.maxForce = 30000.0 * body.m_mass;
			md.timeStep = timeStep;
			mouseJoint = world.CreateJoint(md);
			body.WakeUp();
		}
	}

	if (!isMouseDown) {

		if (mouseJoint) {

			world.DestroyJoint(mouseJoint);
			mouseJoint = null;
		}
	}

	if (mouseJoint) {

		var p2 = new b2Vec2(mouse.x, mouse.y);
		mouseJoint.SetTarget(p2);
	}
}

function getBodyAtMouse() {
	var mousePVec = new b2Vec2();
	mousePVec.Set(mouse.x, mouse.y);

	var aabb = new b2AABB();
	aabb.minVertex.Set(mouse.x - 1, mouse.y - 1);
	aabb.maxVertex.Set(mouse.x + 1, mouse.y + 1);

	var k_maxCount = 10;
	var shapes = [];
	var count = world.Query(aabb, shapes, k_maxCount);
	var body = null;

	for (var i = 0; i < count; i++) {
		if (shapes[i].m_body.IsStatic() == false) {
			if (shapes[i].TestPoint(mousePVec)) {
				body = shapes[i].m_body;
				break;
			}
		}
	}

	return body;
}

function setWalls() {

	if (wallsSetted) {

		world.DestroyBody(walls[0]);
		world.DestroyBody(walls[1]);
		world.DestroyBody(walls[2]);
		world.DestroyBody(walls[3]);

		walls[0] = null;
		walls[1] = null;
		walls[2] = null;
		walls[3] = null;
	}

	walls[0] = createBox(world, stage[2] / 2, - wall_thickness, stage[2], wall_thickness);
	walls[1] = createBox(world, stage[2] / 2, stage[3] + wall_thickness, stage[2], wall_thickness);
	walls[2] = createBox(world, - wall_thickness, stage[3] / 2, wall_thickness, stage[3]);
	walls[3] = createBox(world, stage[2] + wall_thickness, stage[3] / 2, wall_thickness, stage[3]);

	wallsSetted = true;

}

function getElementProperties(element) {
	const rect = element.getBoundingClientRect();

	return [
		rect.left + window.scrollX,
		rect.top + window.scrollY,
		rect.width,
		rect.height
	];
}

function getBrowserDimensions() {

	var changed = false;

	if (stage[0] != window.screenX) {

		delta[0] = (window.screenX - stage[0]) * 50;
		stage[0] = window.screenX;
		changed = true;
	}

	if (stage[1] != window.screenY) {

		delta[1] = (window.screenY - stage[1]) * 50;
		stage[1] = window.screenY;
		changed = true;
	}

	if (stage[2] != window.innerWidth) {

		stage[2] = window.innerWidth;
		changed = true;
	}

	if (stage[3] != window.innerHeight) {

		stage[3] = window.innerHeight;
		changed = true;
	}

	return changed;
}

function updateWorldBounds() {
	worldAABB.minVertex.Set(-200, -200);
	worldAABB.maxVertex.Set(window.screen.width + 200, window.screen.height + 200);
}
window.addEventListener('resize', updateWorldBounds);












const linksData = [
	{ "title": "Official Website", "link": "https://example.com", "icon": "https://api.iconify.design/lucide:globe.svg?color=white" },
	{ "title": "Follow on Twitter", "link": "https://twitter.com", "icon": "https://api.iconify.design/lucide:twitter.svg?color=white" },
	{ "title": "Check GitHub", "link": "https://github.com", "icon": "https://api.iconify.design/lucide:github.svg?color=white" }
];

function renderLinks() {
	const container = document.getElementById('links-list');
	container.innerHTML = '';
	linksData.forEach(item => {
		const linkEl = document.createElement('a');
		linkEl.className = 'link-item';
		linkEl.href = item.link;
		linkEl.innerHTML = `
            <div class="link-icon" style="-webkit-mask-image: url('${item.icon}'); mask-image: url('${item.icon}');"></div>
            <span class="link-title">${item.title}</span>
        `;
		// Removed click handler for simplicity if you are doing physics
		container.appendChild(linkEl);
	});
}

function runAnimation() {
	const isMobile = window.matchMedia("(max-width: 600px)").matches;
	const targetScale = isMobile ? 0.9 : 0.5;

	const timeline = gsap.timeline({
		// THIS IS THE KEY: Trigger the switch once animation is done
		onComplete: switchToAbsolute
	});

	timeline.from(".word", {
		y: (i) => i % 2 === 0 ? 400 : -400,
		duration: 1.6,
		ease: "elastic.out(1, 0.4)",
		stagger: 0.2,
		delay: 0.2
	})
		.to(".jump-text", { scale: targetScale, duration: 1.2, ease: "back.inOut(1.7)" }, "-=1")
		.to(".text-mask-container", { height: "80px", duration: 1.2, ease: "expo.inOut" }, "<")
		.to(".links-container", { height: "auto", opacity: 1, duration: 1.2, ease: "expo.inOut" }, "<")
		.from(".link-item", { y: 20, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.1 }, "-=0.5")
		.to("#star-container", {
			clipPath: "circle(150% at 50% 50%)",
			duration: 2.5,
			ease: "power3.out" // Starts slow, speeds up, ends slow
		}, "-=1");
}
function switchToAbsolute() {
	// 1. Select the items (Words and Links)
	const elements = [...document.querySelectorAll('.word, .link-item')];

	// 2. Capture state (Position + Styles) BEFORE moving
	const states = elements.map(el => {
		const rect = el.getBoundingClientRect();
		const style = window.getComputedStyle(el);

		// Detect if this element is inside the scaled title
		const parentJumpText = el.closest('.jump-text');

		// If it is inside .jump-text, we must account for the scale (0.5 or 0.9)
		// If not (like the links), scale is 1
		const scale = parentJumpText ? gsap.getProperty(parentJumpText, "scale") : 1;

		return {
			element: el,
			left: rect.left + window.scrollX,
			top: rect.top + window.scrollY,
			width: rect.width,
			height: rect.height,
			// Calculate the "Visual" font size (Original Size * Scale)
			fontSize: parseFloat(style.fontSize) * scale,
			fontWeight: style.fontWeight,
			fontFamily: style.fontFamily
		};
	});

	// 3. Move elements and apply "Baked" styles
	states.forEach(state => {
		const el = state.element;

		// Move to body to isolate from old parents
		document.body.appendChild(el);

		// Apply Position
		el.style.position = 'absolute';
		el.style.left = state.left + 'px';
		el.style.top = state.top + 'px';
		el.style.width = state.width + 'px';
		el.style.height = state.height + 'px';

		// --- THIS FIXES THE TEXT LOOK ---
		// We forcibly apply the calculated styles to the span itself
		el.style.fontSize = state.fontSize + 'px';
		el.style.fontWeight = state.fontWeight;
		el.style.fontFamily = state.fontFamily;

		// Reset layout messiness
		el.style.transform = 'none';
		el.style.margin = '0';
		el.style.padding = '0';
		el.style.lineHeight = '1'; // Tighter bounding box for physics
		el.style.whiteSpace = 'nowrap'; // Prevent wrapping
		el.style.display = 'flex';
		el.style.alignItems = 'center';
		el.style.justifyContent = 'center';
		el.style.boxSizing = 'border-box';

		el.style.transition = 'none'

		el.classList.add("box2d");
	});

	// 4. Hide the old wrapper
	document.querySelector('.content-wrapper').style.visibility = 'hidden';

	// 5. Start Physics (If you have the function ready)
	console.log("Layout locked. Styles baked. Ready for Physics.");
	init();
}

document.addEventListener("DOMContentLoaded", () => {
	gsap.set(".content-wrapper", { opacity: 1 });
	renderLinks();
	runAnimation();
});

window.addEventListener('pageshow', (event) => {
	if (event.persisted) {
		gsap.set(".box2d", { opacity: 1 });
	}
});



///

// --- 1. CONFIGURATION ---
const generateBoxShadows = (n) => {
	let value = '';
	for (let i = 0; i < n; i++) {
		const x = Math.floor(Math.random() * window.innerWidth);
		const y = Math.floor(Math.random() * 2000); // 2000 to match CSS height
		value += `${x}px ${y}px #FFF`;
		if (i < n - 1) value += ', ';
	}
	return value;
};

// --- 2. INITIALIZATION ---
const initStars = () => {
	const layers = [
		{ id: 'stars-small', count: 700 },
		{ id: 'stars-medium', count: 200 },
		{ id: 'stars-big', count: 100 }
	];

	layers.forEach(layer => {
		const el = document.getElementById(layer.id);
		el.classList.add('star-layer');
		el.style.setProperty('--star-shadows', generateBoxShadows(layer.count));
	});
};

initStars();

// --- 3. MOUSE INTERACTION ---
const wrappers = document.querySelectorAll('.layer-wrapper');

document.addEventListener('mousemove', (e) => {
	const x = e.clientX;
	const y = e.clientY;

	// Center of screen
	const cx = window.innerWidth / 2;
	const cy = window.innerHeight / 2;

	wrappers.forEach(wrapper => {
		// Read the speed from the HTML data-attribute
		const speed = parseFloat(wrapper.getAttribute('data-speed'));

		// Calculate shift
		const moveX = (x - cx) * speed * -0.25; // -1 to invert (parallax feel)
		const moveY = (y - cy) * speed * -0.25;

		// Apply only the translation to the wrapper
		wrapper.style.transform = `translate(${moveX}px, ${moveY}px)`;
	});
});