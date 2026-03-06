import { log } from '../utils.js';

const COMPONENT_REGISTRY = new Map();

export function registerComponent(component, initFunc) {
	log('registerComponent');
	COMPONENT_REGISTRY.set(component, initFunc);
}

export function initComponents() {
	log('initComponents');
	document.querySelectorAll('[data-component]').forEach(el => {
		const name = el.dataset.component;
		log('starting ' + name);
		const initFunc = COMPONENT_REGISTRY.get(name);
		if (initFunc) { initFunc(); }
	});
}
