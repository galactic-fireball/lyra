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
		const controllerElem = document.querySelector('#activity-controller');
		this.controllerElem = controllerElem
		this.panelElem = document.querySelector('#activity-panel');
		this.currentCollection = controllerElem.dataset.collection;
		this.currentSpecName = controllerElem.dataset.spec;
		this.currentSpec = null;
	}

	static async initialize() {
		const ac = new ActivityController();
		ac.initActivitySwitcher();
		await ac.setSpecData();
		await ac.updatePanel();
		// turn off loading screen?
		return ac;
	}

	initActivitySwitcher() {
		const switcher = document.querySelector('#activity-switcher');
		const actButton = document.querySelector('#activity-button');
		const menu = document.querySelector('#activity-menu');

		log('FA');
		log(window.FontAwesome);
		const activityClass = ACTIVITIES.get(this.currentActivityName);
		actButton.textContent = 'Activity: ' + activityClass.label;
		actButton.addEventListener('click', () => {
			menu.classList.toggle('open');
		});

		for (const actName of ACTIVITIES.keys()) {
			const actItem = document.createElement('div');
			actItem.textContent = ACTIVITIES.get(actName).label;
			actItem.classList.add('activity-item');
			actItem.addEventListener('click', () => {
				this.currentActivityName = actName;
				this.updatePanel();
			});
			menu.appendChild(actItem);
		}
	}

	async setSpecData() {
		this.currentSpec = await getSpecData(this.currentCollection, this.currentSpecName);
		log(this.currentSpec);
	}

	async updatePanel() {
		// TODO: if this.currentActivity is already set, send a shutdown first?

		const activityClass = ACTIVITIES.get(this.currentActivityName);
		if (activityClass) {
			const html = await getActivityHTML(this.currentActivityName);
			this.panelElem.innerHTML = html;
		}

		this.currentActivity = new activityClass(this);
		this.currentActivity.updateViewer();
	}

	updateViewer() {
		if (!this.currentSpec) { return; }

		this.viewer.setTitle(this.currentSpec.name, 'RA: ' + this.currentSpec.metadata.ra.toFixed(3) + ' | DEC: ' + this.currentSpec.metadata.dec.toFixed(3) + ' | Redshift: ' + this.currentSpec.metadata.redshift.toFixed(4));
		this.viewer.setWaveArray(this.currentSpec.wave);
		this.viewer.addData(this.currentSpec.data, this.currentSpec.noise);
	}
}

registerComponent('activity-container', ActivityController.initialize);


class Activity {
	static label = 'Default';

	constructor(controller) {
		this.controller = controller
		this.viewer = controller.viewer;
	}

	updateViewer() {
		this.controller.updateViewer();
	}
}


class ViewActivity extends Activity {
	static label = 'View';

	constructor(controller) {
		super(controller);
	}

	updateViewer() {
		super.updateViewer();
		this.viewer.reloadPlot();
	}
}
ACTIVITIES.set('view', ViewActivity);


class FeatureVerifyActivity extends Activity {
	static label = 'Feature Verification';

	constructor(controller) {
		super(controller);
	}

	updateViewer() {
		super.updateViewer();

		// this.viewer.addFeature('OIII', 5008);
		// this.viewer.addComponent('Data', this.currentSpec.data);

		this.viewer.reloadPlot();
	}
}
ACTIVITIES.set('feat-verify', FeatureVerifyActivity);






