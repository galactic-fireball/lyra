import { loadRoutes } from './api.js';

import './components/collections.js';
import { initComponents } from './components/registry.js'


function init() {
	loadRoutes();
	initComponents();
}

document.addEventListener('DOMContentLoaded', init);
