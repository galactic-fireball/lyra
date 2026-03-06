import { log } from './utils.js';

let ROUTES = null

export async function loadRoutes() {
	log('loadRoutes');
	const response = await fetch('/api/routes');
	ROUTES = await response.json();
	log(ROUTES);
}


function urlFor(endpoint, params) {
	log('urlFor')

	if (!ROUTES) {
		log('routes not initialized');
		return null;
	}

	let url = ROUTES[endpoint];
	if (!url) {
		log('url unavailable');
		return null;
	}

	for (const [key,value] of Object.entries(params)) {
		url = url.replace('{'+key+'}', value);
	}

	if (url.includes('{')) {
		log('Missing parameters for ' + endpoint);
		return null;
	}

	return url;
}


export function navigate(endpoint, params={}) {
	log('navigate');
	window.location.href = urlFor(endpoint, params);
}


// COLLECTIONS

export function gotoCollectionCreator() {
	log('gotoCollectionCreator');
	navigate('collections.collection_creator');
}
