import { log } from './utils.js';

let ROUTES = null

export async function loadRoutes() {
	log('loadRoutes');
	if (!ROUTES) {
		const response = await fetch('/api/routes');
		ROUTES = await response.json();
	}
	log(ROUTES);
}


export function urlFor(endpoint, params={}) {
	log('urlFor: ' + endpoint);

	if (!ROUTES) {
		loadRoutes()
	}

	let url = ROUTES[endpoint];
	if (!url) {
		log('url unavailable');
		return null;
	}

	for (const [key,value] of Object.entries(params)) {
		url = url.replace('<'+key+'>', value);
	}

	if (url.includes('<')) {
		log('Missing parameters for ' + endpoint);
		return null;
	}

	log('url: '+ url);
	return url;
}


export function navigate(endpoint, params={}) {
	log('navigate: ' + endpoint);
	window.location.href = urlFor(endpoint, params);
}


// Catalog

export function gotoCatalog(catalog) {
	log('gotoCatalog');
	navigate('catalog.catalog_table', {catalog_slug:catalog});
}

export function gotoCatalogCreator() {
	log('gotoCatalogCreator');
	navigate('catalog.catalog_creator');
}

