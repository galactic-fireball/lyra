import { COMPONENT_REGISTRY } from './components/registry.js'


function init() {
	document.querySelectorAll('[data-component]').forEach(el => {
		const name = el.dataset.component;
		const initFunc = COMPONENT_REGISTRY[name];
		if (initFunc) {
			initFunc();
		}
	});
}


document.addEventListener('DOMContentLoaded', init);
