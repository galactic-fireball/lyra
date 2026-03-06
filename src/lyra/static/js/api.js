import { log } from './utils.js';
import { urlFor } from './router.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };


async function fetchJSON(url, opts={}) {
	const res = await fetch(url, opts);
	if (!res.ok) {
		const text = await res.text();
		log('fetch failed: ' + text);
		return null
	}

	return res.json();
}


export async function getSchemas() {
	log('getSchemas');

	let url = urlFor('collections.get_schemas');
	return await fetchJSON(url);
}
