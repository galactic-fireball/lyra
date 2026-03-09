import { log, showLoading } from '../utils.js';
import { registerComponent } from './registry.js';

function initSpecPlot() {
	log('initSpecPlot');


}

registerComponent('plot-display', initSpecPlot);
