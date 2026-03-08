// import { Collection } from '../apiTypes.ts';
import { log, showLoading } from '../utils.js';
import { gotoCollectionCreator } from '../router.js';
import { getSchemas, createCollection } from '../api.js';
import { registerComponent } from './registry.js';


function loadCollectionChooser() {
	log('loadCollectionChooser');

	const ncButton = document.querySelector('#new-collection-button');
	if (ncButton) {
		ncButton.addEventListener('click', function() {
			log('new collection click');
			gotoCollectionCreator();
		});
	}

	// TODO: add collection items to collections-list
}


async function loadCollectionCreator() {
	log('loadCollectionCreator');

	let schemas = await getSchemas();
	const schemaSelector = document.querySelector('#collection-schema');
	if (schemaSelector) {
		Object.keys(schemas).forEach(key => {
			const option = document.createElement('option');
			option.value = key;
			option.textContent = key;
			schemaSelector.appendChild(option);
		});
	}

	// TODO: collection-submit-button click event listener
	const submitButton = document.querySelector('#collection-submit-button');
	if (submitButton) {
		submitButton.addEventListener('click', function() {
			log('collection creator submit');
			const name = document.querySelector('#collection-name').value;
			const desc = document.querySelector('#collection-desc').value;
			const source = document.querySelector('#collection-source').value;
			const schema = document.querySelector('#collection-schema').value;

			createCollection(name, desc, source, schema);
			showLoading();
			// TODO: open spectra viewer with new collection
		});
	}
}


registerComponent('collection-chooser', loadCollectionChooser);
registerComponent('collection-creator', loadCollectionCreator);
