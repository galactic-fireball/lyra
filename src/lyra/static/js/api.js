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


async function postData(url, data={}) {
	const opts = {
		'method': 'POST',
		'headers': JSON_HEADERS,
		'body': JSON.stringify(data)
	}

	return await fetchJSON(url, opts);
}


export async function getSchemas() {
	log('getSchemas');

	const url = urlFor('collections.get_schemas');
	return await fetchJSON(url);
}


export function createCollection(name, desc, source, schema) {
	log ('createCollection');

	const col_data = {
		'name': name,
		'description': desc,
		'schema': schema,
		'data_dir': source
	}

	const url = urlFor('collections.new_collection');
	postData(url, col_data);
}
