import { log, showLoading, hideLoading } from '../utils.js';
import { registerComponent, getComponent } from './registry.js';
import { getCatalog, getActivityHTML, getSpecData, getSpecMap, getSpaxelData, getNextSpecData, getPrevSpecData, getFeatures, sendActivityData } from '../api.js';


const ACTIVITIES = new Map();


export class ActivityController {

	constructor() {
		log('new ActivityController');
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
		log(ac);
		ac.currentCatalog = await getCatalog(ac.currentCatalogName);
		log('CATALOG');
		log(ac.currentCatalog);
		ac.initActivitySwitcher();

		log('mapViewer');
		log(ac.mapViewer);

		if (ac.mapViewer !== null) {
			log('mapViewer is here');
			ac.specViewer.setNoDataPlot()
			await ac.setMapData();
		} else {
			log('would call setSpecData, no mapViewer');
			await ac.setSpecData();
		}

		await ac.initializePanel();
		hideLoading();
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

	async setMapData() {
		log('setMapData');
		this.currentMap = await getSpecMap(this.currentCatalog.slug, this.currentSpecName, 'median');
	}

	async setSpecData() {
		log('setSpecData');
		log(this.currentCatalog);
		this.currentSpec = await getSpecData(this.currentCatalog.slug, this.currentSpecName);
		log(this.currentSpec);
	}

	async setSpaxelData(x, y) {
		log('setSpaxelData');
		this.currentSpec = await getSpaxelData(this.currentCatalog.slug, this.currentSpecName, x, y);
		log(this.currentSpec);
	}

	async nextSpec() {
		showLoading();
		this.currentSpec = await getNextSpecData(this.currentCatalog, this.currentSpecName);
		if (!this.currentSpec) { this.specViewer.setNoDataPlot(); hideLoading(); return; }

		this.currentSpecName = this.currentSpec.name;
		this.updatePanel();
		this.updateURL(this.currentSpecName);
		hideLoading();
	}

	async prevSpec() {
		showLoading();
		this.currentSpec = await getPrevSpecData(this.currentCatalog, this.currentSpecName);
		if (!this.currentSpec) { this.specViewer.setNoDataPlot(); hideLoading(); return; }

		this.currentSpecName = this.currentSpec.name;
		this.updatePanel();
		this.updateURL(this.currentSpecName);
		hideLoading();
	}

	updateURL(specName) {
		const newUrl = '/spec-viewer/' + this.currentCatalog + '/' + this.currentSpecName;
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
	}

	updateMapViewer() {
		log('updateMapViewer');
		if (!this.mapViewer) { return; }
		log('updateMapViewer viewer good')
		// if (!this.currentSpec) { this.mapViewer.setNoDataPlot(); return; }
		if (!this.currentMap) { this.mapViewer.setNoDataPlot(); return; }
		log('updateMapViewer map good')

		// this.mapViewer.setTitle(this.currentSpec.name, 'RA: ' + this.currentSpec.target.ra.toFixed(3) + ' | DEC: ' + this.currentSpec.target.dec.toFixed(3) + ' | Redshift: ' + this.currentSpec.target.z.toFixed(4));
		this.mapViewer.setTitle('SPEC NAME', 'SPEC INFO');
		this.mapViewer.setData(this.currentMap);
		log('updateMapViewer data set');
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

	setupHotKeys() {}

	updateViewers() {
		log('updateViewers');
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

	constructor(controller) {
		super(controller);
	}

	updateSpecViewer() {
		super.updateSpecViewer();
		if (!this.controller.currentSpec) { return; }
		this.specViewer.reloadPlot();
	}

	updateMapViewer() {
		super.updateMapViewer();
		if (!this.controller.currentMap) { return; }
		this.mapViewer.addClickHandler((eventData) => this.onMapClick(eventData));
		this.mapViewer.reloadPlot();
	}

	async onMapClick(eventData) {
		log('onMapClick');
		log(eventData);
		showLoading();
		var point = eventData.points[0];
		log('X = ' + point.x + ', Y = ' + point.y);
		await this.controller.setSpaxelData(point.x, point.y);
		this.updateSpecViewer();
		hideLoading();
	}
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
		log('feat verify initialize');
		log(this.controller.currentCatalog);
		const featSelector = document.querySelector('#feature-selector');
		const features = this.controller.currentCatalog.data_model.features.lines;
		for (const feat of features) {
			this.features.set(feat.name, feat.center)

			const option = document.createElement('option');
			option.value = feat.name;
			option.textContent = feat.name
			featSelector.appendChild(option);
		}

		featSelector.addEventListener('change', (event) => {
			this.currentFeature = event.target.value;
			this.updateSpecViewer();
		});

		document.addEventListener('keydown', (event) => { this.handleKeyDown(event); });
	}


	handleKeyDown(e) {
		if (e.key === 'ArrowLeft') {
			this.controller.prevSpec();
		} else if (e.key == 'ArrowRight') {
			this.controller.nextSpec();
		} else if (e.key == '0') {
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
		super.updateSpecViewer();
		this.specViewer.removeAllFeatures();

		if (this.currentFeature) {
			this.specViewer.addFeature(this.currentFeature, this.features.get(this.currentFeature));
		}

		this.specViewer.reloadPlot();
	}
}
ACTIVITIES.set('feat-verify', FeatureVerifyActivity);

