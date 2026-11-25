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
		this.focus = {x:0, y:0};
		this.nx = 0;
		this.ny = 0;
		this.changeHandlers = [];

		// TODO: apertures
		// TODO: spaxel markers
		// TODO: contours

		showLoading();
		this.initPlotViewer();
		const viewerElem = document.getElementById(MapViewer.viewerID);
		viewerElem.on('plotly_click', (event) => { this.onMapClick(event); });
		hideLoading();
	}

	initPlotViewer() {
		Plotly.newPlot(MapViewer.viewerID, [{z:[[2,3],[3,4]],type:'heatmap'}], MapViewer.nodata_layout, {responsive:true});
	}

	handleKeyDown(event) {
		if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) { return; }

		if (event.key === 'ArrowUp') { this.updateFocus(this.focus.x, this.focus.y+1); }
		else if (event.key === 'ArrowDown') { this.updateFocus(this.focus.x, this.focus.y-1); }
		else if (event.key === 'ArrowLeft') { this.updateFocus(this.focus.x-1, this.focus.y); }
		else if (event.key === 'ArrowRight') { this.updateFocus(this.focus.x+1, this.focus.y); }
	}

	onMapClick(event) {
		if (event?.points?.length) {
			this.updateFocus(event.points[0].x, event.points[0].y);
		}
	}

	updateFocus(x, y) {
		this.focus.x = Math.max(0, Math.min(this.nx-1,Math.round(x)));
		this.focus.y = Math.max(0, Math.min(this.ny-1,Math.round(y)));
		log(this.focus);
		this.reloadPlot();

		this.changeHandlers.forEach(func => { func(this.focus); });
	}

	addSpaxelChangeHandler(func) {
		this.changeHandlers.push(func);
	}

	setTitle(title, subtitle='') {
		this.title = title;
		this.subtitle = subtitle;
	}

	setData(data) {
		// this.data = data;
		this.data = data.map(row => row.map(val => Math.log10(val)));
		this.ny = this.data.length;
		this.nx = this.data[0].length;
	}

	reloadPlot() {
		showLoading();
		var layout = {
			title: {text: this.title, subtitle: {text: this.subtitle}},
			annotations: [],
			paper_bgcolor: TRANSPARENT,
			plot_bgcolor: TRANSPARENT,
			font: {color: cssVar('--text-color'), size:16},
			xaxis: {title: {text:'X (px)'}, gridcolor: cssVar('--text-color-subtle'), autoresize: true},
			yaxis: {title: {text:'Y (px)'}, gridcolor: cssVar('--text-color-subtle'), autoresize: true},
			clickmode: 'event+select',
			autosize: true, margin: {l:30,r:10,t:30,b:35,pad:1}
		};

		const heatmap = {z:this.data, type:'heatmap', colorscale:'Rainbow'};
		const focusBox = {
			type: 'scatter', mode: 'markers',
			x: [this.focus.x], y: [this.focus.y],
			marker: {
				symbol: 'x-thin', color: '#ffffff',
				line: { color: '#ffffff', width: 1.0 },
			},
			hoverinfo: 'skip', showlegend: false
		};
		Plotly.react(MapViewer.viewerID, [heatmap, focusBox], layout);
		hideLoading();
	}
}

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


