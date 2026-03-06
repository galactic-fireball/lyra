import { loadRoutes } from './router.js';

import './components/collections.js';
import { initComponents } from './components/registry.js'


async function init() {
	await loadRoutes();
	initComponents();
}

document.addEventListener('DOMContentLoaded', init);
