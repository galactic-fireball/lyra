// import { Collection } from '../apiTypes.ts';
import { log } from '../utils.js';
import { gotoCollectionCreator } from '../api.js';
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


function loadCollectionCreator() {
	log('loadCollectionCreator');

	// TODO: add collection-config select items

	// TODO: collection-submit-button click event listener
}


registerComponent('collection-chooser', loadCollectionChooser);
registerComponent('collection-creator', loadCollectionCreator);
