import { log, cssVar } from '../utils.js';
import { registerComponent } from './registry.js';

const TRANSPARENT = 'rgba(0,0,0,0)'

export class SpectraViewer {

	static viewerID = 'plotly-container';

	static nodata_layout = {
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

		this.initPlotViewer();
	}

	initPlotViewer() {
		Plotly.newPlot(SpectraViewer.viewerID, [{x:[],y:[]}], SpectraViewer.nodata_layout, {responsive:true});
	}

	setNoDataPlot() {
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


	addFeature(name, wave) {
		this.features.set(name, wave);
	}


	reloadPlot() {
		var plotTraces = [];

		// Add noise if available (and data is as well)
		if (this.noise && this.data) {
			plotTraces.push({
				x: this.wave,
				y: this.noise[0],
				mode: 'lines',
				line: {width:0},
				showlegend: false,
			});

			plotTraces.push({
				x: this.wave,
				y: this.noise[1],
				mode: 'lines',
				fill: 'tonexty',
				fillcolor: cssVar('--text-color-subtle'),
				line: {width:0},
				name: 'Noise'
			});
		}

		// Add data if available
		if (this.data) {
			plotTraces.push({
				x: this.wave,
				y: this.data,
				type: 'scatter',
				mode: 'lines',
				marker: {color: cssVar('--trim-color')},
				name: 'Data'
			});
		}

		for (const [traceName,traceData] of this.traces) {
			plotTraces.push({
				x: this.wave,
				y: traceData,
				type: 'scatter',
				mode: 'lines',
				marker: {color: cssVar('--trim-color')},
				name: traceName,
			});
		}


		const waveMin = Math.max(Math.min(...this.wave), this.userWaveMin);
		const waveMax = Math.min(Math.max(...this.wave), this.userWaveMax);
		log(waveMin+'-'+waveMax);

		// TODO: find the min and max of all components
		const spec_min = Math.min(...this.data);
		const spec_max = Math.max(...this.data);
		const y0 = spec_min-(spec_max*0.1);
		const y1 = spec_max+(spec_max*0.1);

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
			xaxis: {range: [waveMin,waveMax], title: {text:'λ rest (Å)'}, gridcolor: cssVar('--text-color-subtle')}, // color:colors['pale-green']}},
			yaxis: {title: {text:'f_λ (10^-17 erg s^-1 cm^-2 Å^-1)'}, gridcolor: cssVar('--text-color-subtle')}, // color:colors['pale-green']}},
			shapes: vlines,
			legend: {orientation:'h'}
		};

		var config = { responsive: true, };
		Plotly.react(SpectraViewer.viewerID, plotTraces, layout, config);
	}
}


registerComponent('spectra-viewer', () => new SpectraViewer());
