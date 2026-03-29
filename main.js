const linksData = [
	{ "title": "YouTube", "link": "https://www.youtube.com/@thefatspacecat", "icon": "https://api.iconify.design/lucide:youtube.svg?color=white" },
	{ "title": "GitHub", "link": "https://github.com/thefatspacecat", "icon": "https://api.iconify.design/lucide:github.svg?color=white" }
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

	const timeline = gsap.timeline();

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

document.addEventListener("DOMContentLoaded", () => {
	gsap.set(".content-wrapper", { opacity: 1 });
	renderLinks();
	runAnimation();
});

window.addEventListener('pageshow', (event) => {
	if (event.persisted) {
		gsap.set(".content-wrapper", { opacity: 1 });
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
    // Scale star count based on screen area relative to 1920x1080
    const referenceArea = 1920 * 1080;
    const screenArea = window.innerWidth * window.innerHeight;
    const densityRatio = screenArea / referenceArea;

    const layers = [
        { id: 'stars-small', count: Math.round(700 * densityRatio) },
        { id: 'stars-medium', count: Math.round(200 * densityRatio) },
        { id: 'stars-big', count: Math.round(100 * densityRatio) }
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

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        initStars();
    }, 250);
});