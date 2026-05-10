import { log } from './utils.js';
import { urlFor } from './router.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };


async function fetchJSON(url, opts={}) {
	const res = await fetch(url, opts);
	if (!res.ok) {
		const text = await res.text();
		log('fetch failed: ' + text);
		return null;
	}

	return res.json();
}


async function fetchWithParams(url, params={}) {
	const newURL = url + '?' + new URLSearchParams(params).toString();
	const res = await fetch(newURL);
	if (!res.ok) {
		const text = await res.text();
		log('fetch failed ' + text);
		return null;
	}

	return res;
}


async function postData(url, data={}) {
	const opts = {
		'method': 'POST',
		'headers': JSON_HEADERS,
		'body': JSON.stringify(data)
	}

	return await fetchJSON(url, opts);
}


export async function getDataModels() {
	log('getDataModels');
	const url = urlFor('api.get_data_models');
	return await fetchJSON(url);
}

// TODO: sync api for data dict
export async function getDataModel(modelName) {
	log('getDataModel');
	const url = urlFor('api.get_data_model');
	const res = await fetchWithParams(url, {model:modelName});
	return res.json();
}

export async function getCatalogs() {
	log('getCatalogs');
	const url = urlFor('catalog.get_catalogs');
	return await fetchJSON(url);
}


export async function createCatalog(catalogData) {
	log('createCatalog');

	const url = urlFor('catalog.new_catalog');
	const res = await postData(url, catalogData);
	return res;
}


export async function getActivityHTML(activity) {
	const url = urlFor('api.activity');
	const res = await fetchWithParams(url, {activity:activity});
	return res.text();
}


export async function getSpecData(catalog, spec_name) {
	const url = urlFor('api.spec_data');
	const res = await fetchWithParams(url, {catalog:catalog,spec_name:spec_name});
	return res.json();
}


export async function getNextSpecData(catalog, spec_name) {
	const url = urlFor('api.spec_data');
	const res = await fetchWithParams(url, {catalog:catalog,spec_name:spec_name,mode:'next'});
	if (!res) { return null; }
	return res.json();
}


export async function getPrevSpecData(catalog, spec_name) {
	const url = urlFor('api.spec_data');
	const res = await fetchWithParams(url, {catalog:catalog,spec_name:spec_name,mode:'prev'});
	if (!res) { return null; }
	return res.json();
}


export async function getFeatures(catalog) {
	const url = urlFor('api.features');
	const res = await fetchWithParams(url, {catalog:catalog});
	if (!res) { return null; }
	return res.json();
}

export async function sendActivityData(data) {
	log('sendActivityData');
	const url = urlFor('api.activity_data');
	await postData(url, data);
}



