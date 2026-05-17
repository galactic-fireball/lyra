// import { Catalog } from '../apiTypes.ts';
import { log, showLoading } from '../utils.js';
import { gotoCatalog, gotoCatalogCreator } from '../router.js';
import { getDataModels, getDataModel, getCatalogs, createCatalog, getCatalog, getSpecInfo } from '../api.js';
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
		catalogs.forEach(key => {
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
				const td = document.createElement('td');
				const tdi = document.createElement('input');
				tdi.classList.add('form-item');
				tdi.value = field[item];
				td.appendChild(tdi);
				fieldRow.appendChild(td);
			}
			fieldTable.appendChild(fieldRow);
		}

		const fieldNamesContainer = document.querySelector('#feature-names-list');
		for (const name of model.features.names) {
			const el = document.createElement('div');
			el.textContent = name;
			el.classList.add('name-pill')
			fieldNamesContainer.appendChild(el);
		}

		const attrColumns = ['name', 'type', 'units', 'is_log'];
		const attrTable = document.querySelector('#feature-attr-table > tbody');
		for (const attr of model.features.attributes) {
			const attrRow = document.createElement('tr');
			for (const item of attrColumns) {
				const td = document.createElement('td');
				const tdi = document.createElement('input');
				tdi.classList.add('form-item');
				tdi.value = attr[item];
				td.appendChild(tdi);
				attrRow.appendChild(td);
			}
			attrTable.appendChild(attrRow);
		}

		document.querySelector('#column-format').value = model.features.column_format;
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
				'repository': document.querySelector('#catalog-source').value,
				'manifest': document.querySelector('#catalog-manifest').value,
				'data_model': modelSelector.value,
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


function resolveColumn(columnFormat, name, attr) {
	return columnFormat.replaceAll('{name}',name).replaceAll('{name_lower}',name.toLowerCase()).replaceAll('{name_upper}',name.toUpperCase())
					   .replaceAll('{attr}',attr).replaceAll('{attr_lower}',attr.toLowerCase()).replaceAll('{attr_upper}',attr.toUpperCase())
}


async function loadCatalogTable() {
	log('loadCatalogTable');
	const tableContainer = document.querySelector('#table-container');
	const catalogName = tableContainer.dataset.catalog;
	log(catalogName);
	const catalog = await getCatalog(catalogName);
	log(catalog);
	const specInfo = await getSpecInfo(catalogName);
	log(specInfo);

	const table = document.querySelector('#catalog-table');
	const thead = document.createElement('thead');
	const headRow = document.createElement('tr');
	const select = document.createElement('th');
	select.textContent = 'Select'
	headRow.appendChild(select);
	const view = document.createElement('th');
	view.textContent = 'View'
	headRow.appendChild(view);
	const name = document.createElement('th');
	name.textContent = 'Name';
	headRow.appendChild(name);

	const nameColumn = catalog.data_model.name_column;
	for (const field of catalog.data_model.fields) {
		const fieldHead = document.createElement('th');
		fieldHead.textContent = field.name;
		headRow.appendChild(fieldHead);
	}

	for (const line of catalog.data_model.features.lines) {
		for (const attr of catalog.data_model.features.attributes) {
			const colName = resolveColumn(catalog.data_model.features.column_format, line.name, attr.name);
			const attrHead = document.createElement('th');
			attrHead.textContent = colName;
			headRow.appendChild(attrHead);
		}
	}

	thead.appendChild(headRow);
	table.appendChild(thead);

	const tbody = document.createElement('tbody');
	for (const spec of specInfo) {
		log(spec);
		const specName = spec[nameColumn];
		log(specName);
		const row = document.createElement('tr');

		const selectBox = document.createElement('input');
		selectBox.type = 'checkbox';
		const selectField = document.createElement('td');
		selectField.appendChild(selectBox);
		row.appendChild(selectField);

		const link = document.createElement('a');
		link.href = '/spec-viewer/'+catalog.slug+'/'+specName;
		link.textContent = 'View';
		log(link.href);
		const linkField = document.createElement('td');
		linkField.appendChild(link);
		row.appendChild(linkField);

		const nameField = document.createElement('td');
		nameField.textContent = specName;
		row.appendChild(nameField);

		for (const field of catalog.data_model.fields) {
			const fieldField = document.createElement('td');
			fieldField.textContent = spec[field.column];
			row.appendChild(fieldField);
		}

		for (const line of catalog.data_model.features.lines) {
			for (const attr of catalog.data_model.features.attributes) {
				const colName = resolveColumn(catalog.data_model.features.column_format, line.name, attr.name);
				const attrField = document.createElement('td');
				attrField.textContent = spec[colName];
				row.appendChild(attrField);
			}
		}

		tbody.appendChild(row);
	}

	table.appendChild(tbody);
}


registerComponent('catalog-chooser', loadCatalogChooser);
registerComponent('catalog-creator', loadCatalogCreator);
registerComponent('catalog-table', loadCatalogTable);
