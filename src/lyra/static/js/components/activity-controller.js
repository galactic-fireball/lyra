import { log, showLoading, hideLoading } from '../utils.js';
import { registerComponent, getComponent } from './registry.js';
import { getCatalog, getActivityHTML, getSpecData, getSpecMap, getSpaxelData, getNextSpecData, getPrevSpecData, getFeatures, sendActivityData } from '../api.js';

const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

const ACTIVITIES = new Map();


export class ActivityController {

	constructor() {
		this.specViewer = getComponent('spectra-viewer');
		this.mapViewer = getComponent('map-viewer');
		this.currentActivityName = 'view';
		this.currentActivity = null;
		const controllerElem = document.querySelector('#activity-controller');
		this.controllerElem = controllerElem
		this.panelElem = document.querySelector('#activity-panel');
		this.currentCatalogName = controllerElem.dataset.catalog;
		this.currentCatalog = null;
		this.currentSpecName = controllerElem.dataset.spec;
		log('currentCatalogName: '+this.currentCatalogName);
		log('currentSpecName: '+this.currentSpecName);
		this.currentSpec = null;
	}

	static async initialize() {
		showLoading();
		const ac = new ActivityController();
		ac.currentCatalog = await getCatalog(ac.currentCatalogName);
		ac.initActivitySwitcher();

		if (ac.mapViewer !== null) {
			ac.specViewer.setNoDataPlot()
			await ac.setMapData();
			ac.mapViewer.addSpaxelChangeHandler((spaxel) => ac.onMapChange(spaxel));
		} else {
			await ac.setSpecData();
		}

		document.addEventListener('keydown', (event) => ac.handleKeyDown(event));

		await ac.initializePanel();
		hideLoading();
		return ac;
	}

	initActivitySwitcher() {
		const switcher = document.querySelector('#activity-switcher');
		const actButton = document.querySelector('#activity-button');
		const menu = document.querySelector('#activity-menu');

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
				const activityClass = ACTIVITIES.get(this.currentActivityName);
				actButton.textContent = 'Activity: ' + activityClass.label;
				this.initializePanel();
			});
			menu.appendChild(actItem);
		}
	}

	async initializePanel() {
		// TODO: if this.currentActivity is already set, send a shutdown first?

		const activityClass = ACTIVITIES.get(this.currentActivityName);
		if (activityClass) {
			const html = await getActivityHTML(this.currentActivityName);
			this.panelElem.innerHTML = html;
		}

		this.currentActivity = new activityClass(this);
		this.currentActivity.initialize();
		this.currentActivity.updateViewers();
	}

	handleKeyDown(event) {
		if ((this.mapViewer !== null) && (ARROWS.includes(event.key))) {
			this.mapViewer.handleKeyDown(event);
			event.preventDefault();
			return;
		}

		if (this.specViewer !== null) {
			if (event.key === 'ArrowLeft') {
				this.prevSpec();
				return; // TODO: handled in spec-viewer
			} else if (event.key == 'ArrowRight') {
				this.nextSpec();
				return; // TODO: handled in spec-viewer
			}
		}

		this.currentActivity.handleKeyDown(event);
	}

	async onMapChange(spaxel) {
		showLoading();
		await this.setSpaxelData(spaxel.x, spaxel.y);
		hideLoading();
	}

	async setMapData() {
		this.currentMap = await getSpecMap(this.currentCatalog.slug, this.currentSpecName, 'median');
		this.updateMapViewer();
	}

	async setSpecData() {
		this.currentSpec = await getSpecData(this.currentCatalog.slug, this.currentSpecName);
		this.updateSpecViewer();
	}

	async setSpaxelData(x, y) {
		this.currentSpec = await getSpaxelData(this.currentCatalog.slug, this.currentSpecName, x, y);
		this.updateSpecViewer();
	}

	async nextSpec() {
		showLoading();
		this.currentSpec = await getNextSpecData(this.currentCatalog.slug, this.currentSpecName);
		if (!this.currentSpec) { this.specViewer.setNoDataPlot(); hideLoading(); return; }

		this.currentSpecName = this.currentSpec.name;
		this.updatePanel();
		this.updateURL(this.currentSpecName);
		hideLoading();
	}

	async prevSpec() {
		showLoading();
		this.currentSpec = await getPrevSpecData(this.currentCatalog.slug, this.currentSpecName);
		if (!this.currentSpec) { this.specViewer.setNoDataPlot(); hideLoading(); return; }

		this.currentSpecName = this.currentSpec.name;
		this.updatePanel();
		this.updateURL(this.currentSpecName);
		hideLoading();
	}

	updateURL(specName) {
		const newUrl = '/spec-viewer/' + this.currentCatalog.slug + '/' + this.currentSpecName;
		history.pushState({spec: this.currentSpecName}, '', newUrl);
	}

	updatePanel() {
		this.currentActivity.updateSpecViewer();
	}

	updateSpecViewer() {
		if (!this.currentSpec) { this.specViewer.setNoDataPlot(); return; }

		this.specViewer.setTitle(this.currentSpec.name, 'RA: ' + this.currentSpec.target.ra.toFixed(3) + ' | DEC: ' + this.currentSpec.target.dec.toFixed(3) + ' | Redshift: ' + this.currentSpec.target.z.toFixed(4));
		this.specViewer.setWaveArray(this.currentSpec.wave);
		this.specViewer.addData(this.currentSpec.flux, this.currentSpec.err);
		this.specViewer.reloadPlot();
	}

	updateMapViewer() {
		if (!this.mapViewer) { return; }
		if (!this.currentMap) { this.mapViewer.setNoDataPlot(); return; }

		// this.mapViewer.setTitle(this.currentSpec.name, 'RA: ' + this.currentSpec.target.ra.toFixed(3) + ' | DEC: ' + this.currentSpec.target.dec.toFixed(3) + ' | Redshift: ' + this.currentSpec.target.z.toFixed(4));
		this.mapViewer.setData(this.currentMap);
		this.mapViewer.reloadPlot();
	}
}

registerComponent('activity-container', ActivityController.initialize);


class Activity {
	static label = 'Default';

	constructor(controller) {
		this.controller = controller
		this.specViewer = controller.specViewer;
		this.mapViewer = controller.mapViewer;
	}

	initialize() {}

	handleKeyDown() {}

	updateViewers() {
		this.updateMapViewer();
		this.updateSpecViewer();
	}

	updateSpecViewer() {
		this.controller.updateSpecViewer();
	}

	updateMapViewer() {
		this.controller.updateMapViewer();
	}

	onMapClick(eventData) {}
}


class ViewActivity extends Activity {
	static label = 'View';
}

ACTIVITIES.set('view', ViewActivity);


class FeatureVerifyActivity extends Activity {
	static label = 'Feature Verification';

	constructor(controller) {
		super(controller);
		this.features = new Map();
		this.currentFeature = null;
	}


	async initialize() {
		const featSelector = document.querySelector('#feature-selector');
		const features = this.controller.currentCatalog.data_model.features.lines;
		for (const feat of features) {
			this.features.set(feat.name, feat.center)

			const option = document.createElement('option');
			option.value = feat.name;
			option.textContent = feat.name
			featSelector.appendChild(option);
		}
		this.currentFeature = features[0].name;

		featSelector.addEventListener('change', (event) => {
			this.currentFeature = event.target.value;
			this.updateSpecViewer();
		});
	}

	handleKeyDown(e) {
		if (e.key == '0') {
			this.markSpec(0);
		} else if (e.key == '1') {
			this.markSpec(1);
		} else if (e.key == '2') {
			this.markSpec(2);
		}
	}

	markSpec(value) {
		sendActivityData({
			catalog:this.controller.currentCatalog.name,
			spec_name:this.controller.currentSpecName,
			data_col:this.currentFeature+'_INSPECT',
			data_val:value
		});
		this.controller.nextSpec();
	}


	updateSpecViewer() {
		this.specViewer.removeAllFeatures();

		if (this.currentFeature) {
			this.specViewer.addFeature(this.currentFeature, this.features.get(this.currentFeature));
		}

		super.updateSpecViewer();
	}
}

ACTIVITIES.set('feat-verify', FeatureVerifyActivity);

