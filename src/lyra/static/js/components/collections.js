// import { Collection } from '../apiTypes.ts';
import { log, showLoading } from '../utils.js';
import { gotoCollection, gotoCollectionCreator } from '../router.js';
import { getSchemas, getCollections, createCollection } from '../api.js';
import { registerComponent } from './registry.js';


async function loadCollectionChooser() {
	log('loadCollectionChooser');

	const ncButton = document.querySelector('#new-collection-button');
	if (ncButton) {
		ncButton.addEventListener('click', function() {
			log('new collection click');
			gotoCollectionCreator();
		});
	}

	// TODO: add collection items to collections-list
	let collections = await getCollections();
	const collectionsList = document.querySelector('#collections-list');
	if (collectionsList) {
		Object.keys(collections).forEach(key => {
			const colButton = document.createElement('button');
			colButton.textContent = key;
			colButton.classList.add('button-typeA');

			colButton.addEventListener('click', function() {
				log('collection click');
				gotoCollection(colButton.textContent);
			});

			collectionsList.appendChild(colButton);
		});
	}
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

			const collectionData = {
				'name': document.querySelector('#collection-name').value,
				'description': document.querySelector('#collection-desc').value,
				'schema': document.querySelector('#collection-schema').value,
				'data_dir': document.querySelector('#collection-source').value,
				'manifest': document.querySelector('#collection-manifest').value,
				'name_col': document.querySelector('#collection-name-col').value,
			}

			newCollection(collectionData);
		});
	}
}


function newCollection(collectionData) {
	showLoading();
	createCollection(collectionData)
	// TODO: open spectra viewer with new collection
}


registerComponent('collection-chooser', loadCollectionChooser);
registerComponent('collection-creator', loadCollectionCreator);
