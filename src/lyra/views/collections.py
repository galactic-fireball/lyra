from flask import Blueprint, jsonify, render_template, request

from lyra.models import Collection, Schema

collections = Blueprint('collections', __name__, static_folder='static', template_folder='../templates/collection')

@collections.route('/')
def chooser():
	return render_template('collection_chooser.html')


@collections.route('/collection-creator')
def collection_creator():
	return render_template('collection_creator.html')


@collections.route('/schemas')
def get_schemas():
	return jsonify({k:s.model_dump() for k,s in Schema.get_schemas().items()})


@collections.route('/new-collection', methods=['POST'])
def new_collection():
	new_col = Collection(**request.json)


@collections.get('/<collection_slug>')
def collection_table(collection_slug):
	col = Collection.from_name(collection_slug)
	return render_template('collection_table.html', collection=col, spectra=col.get_spectra())

# TODO: for IFU collection, display map
