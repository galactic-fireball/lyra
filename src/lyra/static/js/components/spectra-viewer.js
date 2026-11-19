import { log, cssVar, showLoading, hideLoading } from '../utils.js';
import { registerComponent } from './registry.js';

const TRANSPARENT = 'rgba(0,0,0,0)'

export class SpectraViewer {

	static viewerID = 'sv-plotly-container';

	static nodata_layout = {
		title: {text: '', subtitle: {text: ''}},
		annotations: [{text: 'No Data', font:{size:30}, xref: 'paper', x:0.5,
		yref: 'paper', y:0.5, showarrow:false}], paper_bgcolor: TRANSPARENT,
		plot_bgcolor: TRANSPARENT,
	};


	constructor() {
		this.userWaveMin = 0;
		this.userWaveMax = 999999;

		this.title = '';
		this.subtitle = ''
		this.wave = null;
		this.data = null;
		this.noise = null;
		this.traces = new Map();
		this.features = new Map();

		showLoading();
		this.initPlotViewer();
		hideLoading();
	}

	initPlotViewer() {
		Plotly.newPlot(SpectraViewer.viewerID, [{x:[],y:[]}], SpectraViewer.nodata_layout, {responsive:true});
	}

	setNoDataPlot() {
		this.title = null;
		this.subtitle = null;
		Plotly.react(SpectraViewer.viewerID, [{x:[],y:[]}], SpectraViewer.nodata_layout, {responsive:true});
	}


	setTitle(title, subtitle='') {
		this.title = title;
		this.subtitle = subtitle;
	}


	setWaveArray(data) {
		this.wave = data;
	}


	addData(data, noise=null) {
		this.data = data;
		if (!noise) {
			this.noise = null;
			return;
		}

		this.noise = [];
		this.noise.push(this.data.map((v,i) => v+noise[i]));
		this.noise.push(this.data.map((v,i) => v-noise[i]));
	}


	addComponent(name, trace_data) {
		this.traces.set(name, trace_data);
	}


	removeComponent(name) {
		this.traces.delete(name);
	}


	removeAllComponents() {
		this.traces = new Map();
	}


	addFeature(name, wave) {
		this.features.set(name, wave);
	}


	removeFeature(name) {
		this.features.delete(name);
	}


	removeAllFeatures() {
		this.features = new Map();
	}


	reloadPlot() {
		log('spec-viewer reloadPlot');
		showLoading();

		const waveMin = Math.max(Math.min(...this.wave), this.userWaveMin);
		const waveMax = Math.min(Math.max(...this.wave), this.userWaveMax);
		log(waveMin+'-'+waveMax);


		let y0 = 100;
		let y1 = -100;
		const plotMask = this.wave.map(w => (w >= waveMin && w <= waveMax));
		const plotWave = this.wave.filter((_,i) => plotMask[i]);

		var plotTraces = [];
		// Add noise if available (and data is as well)
		if (this.noise && this.data) {
			const plotNoise0 = this.noise[0].filter((_,i) => plotMask[i]);
			plotTraces.push({
				x: plotWave,
				y: plotNoise0,
				mode: 'lines',
				line: {width:0},
				showlegend: false,
				hoverinfo: 'skip',
			});

			const plotNoise1 = this.noise[1].filter((_,i) => plotMask[i]);
			plotTraces.push({
				x: plotWave,
				y: plotNoise1,
				mode: 'lines',
				fill: 'tonexty',
				fillcolor: cssVar('--text-color-subtle'),
				line: {width:0},
				name: 'Noise',
				hoverinfo: 'skip',
			});
		}

		// Add data if available
		if (this.data) {
			const plotData = this.data.filter((_,i) => plotMask[i]);
			const spec_min = Math.min(...plotData);
			const spec_max = Math.max(...plotData);
			y0 = Math.min(y0, spec_min-(spec_max*0.1));
			y1 = Math.max(y1, spec_max+(spec_max*0.1));

			plotTraces.push({
				x: plotWave,
				y: plotData,
				type: 'scatter',
				mode: 'lines',
				marker: {color: cssVar('--trim-color')},
				name: 'Data',
			});
		}

		for (const [traceName,traceData] of this.traces) {
			const plotTrace = traceData.filter((_,i) => plotMask[i]);
			const spec_min = Math.min(...plotTrace);
			const spec_max = Math.max(...plotTrace);
			y0 = Math.min(y0, spec_min-(spec_max*0.1));
			y1 = Math.max(y1, spec_max+(spec_max*0.1));

			plotTraces.push({
				x: plotWave,
				y: plotTrace,
				type: 'scatter',
				mode: 'lines',
				marker: {color: cssVar('--trim-color')},
				name: traceName,
			});
		}

		var vlines = []
		log(this.features);
		for (const [featName, featWave] of this.features) {
			if (featWave < waveMin || featWave > waveMax) { continue; }
			vlines.push({
				type: 'line', x0: featWave, x1: featWave, y0:y0, y1:y1,
				line: {dash:'dash', color:cssVar('--rred')}
			});
		}

		var layout = {
			title: {text: this.title, subtitle: {text: this.subtitle}},
			paper_bgcolor: TRANSPARENT,
			plot_bgcolor: TRANSPARENT,
			font: {color: cssVar('--text-color'), size:16},
			xaxis: {title: {text:'λ rest (Å)'}, gridcolor: cssVar('--text-color-subtle')}, // color:colors['pale-green']}},
			yaxis: {title: {text:'f_λ (10^-17 erg s^-1 cm^-2 Å^-1)'}, gridcolor: cssVar('--text-color-subtle')}, // color:colors['pale-green']}},
			shapes: vlines,
			legend: {orientation:'h'}
		};

		var config = { responsive: true, };
		Plotly.react(SpectraViewer.viewerID, plotTraces, layout);//, config);
		hideLoading();
	}
}


registerComponent('spectra-viewer', () => new SpectraViewer());
