import { log } from '../utils.js';

const COMPONENT_REGISTRY = new Map();
const COMPONENT_INSTANCES = new Map();

export function registerComponent(component, initFunc) {
	log('registerComponent');
	COMPONENT_REGISTRY.set(component, initFunc);
}

export function initComponents() {
	log('initComponents');
	document.querySelectorAll('[data-component]').forEach(el => {
		const name = el.dataset.component;

		if (COMPONENT_INSTANCES.has(name)) { return; }

		log('starting ' + name);
		const initFunc = COMPONENT_REGISTRY.get(name);
		if (initFunc) {
			const instance = initFunc();
			COMPONENT_INSTANCES.set(name, instance);
		}
	});
}

export function getComponent(name) {
	log('getComponent');
	log(COMPONENT_INSTANCES);
	if (!COMPONENT_INSTANCES.has(name)) { return null; }
	return COMPONENT_INSTANCES.get(name);
}
