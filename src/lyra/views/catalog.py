from flask import Blueprint, jsonify, render_template, request

from lyra.models import Catalog

catalog = Blueprint('catalog', __name__, static_folder='static', template_folder='../templates/catalog')

@catalog.route('/')
def chooser():
	return render_template('catalog_chooser.html')


@catalog.route('/catalog-creator')
def catalog_creator():
	return render_template('catalog_creator.html')


@catalog.route('/catalogs')
def get_catalogs():
	# TODO: fix jsonify and serializing issues
	return jsonify(list(Catalog.get_catalogs().keys()))


# @catalog.route('/schemas')
# def get_schemas():
# 	return jsonify({k:s.model_dump() for k,s in Schema.get_schemas().items()})


@catalog.route('/new-catalog', methods=['POST'])
def new_catalog():
	cat = Catalog(**request.json)
	return jsonify(cat.slug), 200


@catalog.get('/<catalog_slug>')
def catalog_table(catalog_slug):
	cat = Catalog.from_name(catalog_slug)
	# TODO: check for cat is None
	return render_template('catalog_table.html', catalog=cat, spectra=cat.get_spectra())

# TODO: for IFU catalog, display map

# /Users/sara/Dropbox/research/bgc/bgc-research/spectra_samples/nls1/spectra
# spec-7311-57038-0389