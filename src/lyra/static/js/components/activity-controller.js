import { log, showLoading } from '../utils.js';
import { registerComponent, getComponent } from './registry.js';
import { getActivityHTML, getSpecData } from '../api.js';


const ACTIVITIES = new Map();


export class ActivityController {

	constructor() {
		log('new ActivityController')
		this.viewer = getComponent('spectra-viewer');
		log(this.viewer);
		this.currentActivityName = 'view';
		this.currentActivity = null;
		this.controllerElem = document.querySelector('#activity-controller');
		this.panelElem = document.querySelector('#activity-panel');
		this.currentCollection = this.controllerElem.dataset.collection;
		this.currentSpecName = this.controllerElem.dataset.spec;
		this.currentSpec = null;
	}

	static async initialize() {
		const ac = new ActivityController();
		await ac.setSpecData();
		await ac.updatePanel();
		ac.updateViewer();
		// turn off loading screen?
		return ac;
	}

	async setSpecData() {
		this.currentSpec = await getSpecData(this.currentCollection, this.currentSpecName);
		log(this.currentSpec);
	}

	async updatePanel() {
		// TODO: if this.currentActivity is already set, send a shutdown first?

		this.currentActivity = ACTIVITIES.get(this.currentActivityName);
		if (this.currentActivity) {
			const html = await getActivityHTML(this.currentActivityName);
			this.panelElem.innerHTML = html;
		}
	}

	updateViewer() {
		if (!this.currentSpec) { return; }

		this.viewer.setTitle(this.currentSpec.name, 'RA: ' + this.currentSpec.metadata.ra.toFixed(3) + ' | DEC: ' + this.currentSpec.metadata.dec.toFixed(3) + ' | Redshift: ' + this.currentSpec.metadata.redshift.toFixed(4));
		this.viewer.setWaveArray(this.currentSpec.wave);
		this.viewer.addData(this.currentSpec.data, this.currentSpec.noise);

		// add components
		// this.viewer.addComponent('Data', this.currentSpec.data);

		// add noise
		// add features
		this.viewer.addFeature('OIII', 5008);

		this.viewer.reloadPlot()
	}
}

registerComponent('activity-container', ActivityController.initialize);


class ViewActivity {
	constructor() {

	}
}


ACTIVITIES.set('view', ViewActivity);
