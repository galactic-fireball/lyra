// import { Catalog } from '../apiTypes.ts';
import { log, showLoading } from '../utils.js';
import { gotoCatalog, gotoCatalogCreator } from '../router.js';
import { getDataModels, getDataModel, getCatalogs, createCatalog } from '../api.js';
import { registerComponent } from './registry.js';


async function loadCatalogChooser() {
	log('loadCatalogChooser');

	const ncButton = document.querySelector('#new-catalog-button');
	if (ncButton) {
		ncButton.addEventListener('click', function() {
			log('new catalog click');
			gotoCatalogCreator();
		});
	}

	// TODO: add catalog items to catalog-list
	let catalogs = await getCatalogs();
	const catalogList = document.querySelector('#catalog-list');
	if (catalogList) {
		Object.keys(catalogs).forEach(key => {
			const catButton = document.createElement('li');
			catButton.textContent = key;
			catButton.classList.add('button-typeA');

			catButton.addEventListener('click', function() {
				log('catalog click');
				gotoCatalog(catButton.textContent);
			});

			catalogList.appendChild(catButton);
		});
	}
}


async function loadCatalogCreator() {
	log('loadCatalogCreator');

	async function updateModelDetails(modelName) {
		let model = await getDataModel(modelName);
		log(model);
		document.querySelector('#model-name').value = model.name;
		document.querySelector('#model-name-col').value = model.name_column;

		const tableColumns = ['name', 'column', 'type', 'units', 'is_log'];
		const fieldTable = document.querySelector('#fields-table > tbody');
		for (const field of model.fields) {
			const fieldRow = document.createElement('tr');
			for (const item of tableColumns) {
				const td = document.createElement('td')
				td.textContent = field[item];
				fieldRow.appendChild(td);
			}
			fieldTable.appendChild(fieldRow);
		}
	}

	document.querySelectorAll('.card-header').forEach(header => {
		header.addEventListener('click', () => {
			const card = header.parentElement;
			document.querySelectorAll('.modal-card').forEach(c => {
				if (c !== card) {
					c.classList.remove('open');
				}
			});
			card.classList.toggle('open');
		});
	});

	let models = await getDataModels();
	const modelSelector = document.querySelector('#catalog-model');
	if (modelSelector) {
		for (const name of models) {
			const option = document.createElement('option');
			option.value = name;
			option.textContent = name;
			modelSelector.appendChild(option);
		}
	}

	updateModelDetails(modelSelector.value)

	const submitButton = document.querySelector('#catalog-submit-button');
	if (submitButton) {
		submitButton.addEventListener('click', function() {
			log('catalog creator submit');

			const catalogData = {
				'name': document.querySelector('#catalog-name').value,
				'description': document.querySelector('#catalog-desc').value,
				'data_dir': document.querySelector('#catalog-source').value,
				'manifest': document.querySelector('#catalog-manifest').value,
				'model': modelSelector.value,
			}

			newCatalog(catalogData);
		});
	}
}


async function newCatalog(catalogData) {
	showLoading();
	const newCatalogName = await createCatalog(catalogData)
	if (!newCatalogName) { return; }
	await gotoCatalog(newCatalogName);
}


registerComponent('catalog-chooser', loadCatalogChooser);
registerComponent('catalog-creator', loadCatalogCreator);
