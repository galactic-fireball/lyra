import { log, cssVar, showLoading, hideLoading } from '../utils.js';
import { registerComponent } from './registry.js';

// TODO: make a common Viewer class for MapViewer and SpectraViewer
const TRANSPARENT = 'rgba(0,0,0,0)'

export class MapViewer {

	static viewerID = 'mv-plotly-container';

	static nodata_layout = {
		title: {text: '', subtitle: {text: ''}},
		annotations: [{text: 'No Data', font:{size:30}, xref: 'paper', x:0.5,
		yref: 'paper', y:0.5, showarrow:false}], paper_bgcolor: TRANSPARENT,
		plot_bgcolor: TRANSPARENT,
	};

	constructor() {
		this.title = '';
		this.subtitle = '';
		this.data = null;
		this.clickHandlers = [];

		// TODO: apertures
		// TODO: spaxel markers
		// TODO: contours

		showLoading();
		this.initPlotViewer();
		const viewerElem = document.getElementById(MapViewer.viewerID);
		viewerElem.on('plotly_click', (eventData) => { this.clickHandlers.forEach(func => func(eventData)); });
		hideLoading();
	}

	initPlotViewer() {
		Plotly.newPlot(MapViewer.viewerID, [{z:[[2,3],[3,4]],type:'heatmap'}], MapViewer.nodata_layout, {responsive:true});
	}

	addClickHandler(func) {
		this.clickHandlers.push(func);
	}

	setTitle(title, subtitle='') {
		this.title = title;
		this.subtitle = subtitle;
	}


	setData(data) {
		// this.data = data;
		this.data = data.map(row => row.map(val => Math.log10(val)));
	}


	reloadPlot() {
		log('map-viewer reloadPlot');
		log(this.data);
		showLoading();
		var layout = {
			title: {text: this.title, subtitle: {text: this.subtitle}},
			annotations: [],
			paper_bgcolor: TRANSPARENT,
			plot_bgcolor: TRANSPARENT,
			font: {color: cssVar('--text-color'), size:16},
			xaxis: {title: {text:'X (px)'}, gridcolor: cssVar('--text-color-subtle'), autoresize: true},
			yaxis: {title: {text:'Y (px)'}, gridcolor: cssVar('--text-color-subtle'), autoresize: true},
		};
		Plotly.react(MapViewer.viewerID, [{z:this.data, type:'heatmap', colorscale:'Rainbow'}], layout);
		hideLoading();
	}
}

log('MAP VIEWER JS LOADED');
registerComponent('map-viewer', () => new MapViewer());


let dragging = false;
function setup_split_adjust() {
	const container = document.querySelector('.split-container');
	if (!container) { return; }
	const mapPanel = document.getElementById('map-viewer');
	const specPanel = document.getElementById('spectra-viewer');
	const splitter = document.querySelector('.splitter')

	splitter.addEventListener('mousedown', () => {
		dragging = true;
		document.body.style.cursor = 'col-resize';
	});

	document.addEventListener('mouseup', () => {
		dragging = false;
		document.body.style.cursor = '';
	});

	document.addEventListener('mousemove', (e) => {
		if (!dragging) { return; }
		const minWidth = 200;
		const rect = container.getBoundingClientRect();
		let mapWidth = e.clientX - rect.left;
		mapWidth = Math.min(rect.width-minWidth, Math.max(minWidth, mapWidth));
		const mapPercent = (mapWidth / rect.width) * 100;
		mapPanel.style.flexBasis = `${mapPercent}%`;
		specPanel.style.flexBasis = `${100-mapPercent}%`;
	});

	const observer = new ResizeObserver(entries => {
		for (const entry of entries) {
			const plot = entry.target.querySelector('.plotly-container');
			if (plot) { Plotly.Plots.resize(plot); }
		}
	});
	observer.observe(document.getElementById('map-viewer'));
	observer.observe(document.getElementById('spectra-viewer'));
}

setup_split_adjust()


