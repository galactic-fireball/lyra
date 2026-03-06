from flask import Blueprint, jsonify, render_template

from lyra.models import Collection, Schema

collections = Blueprint('collections', __name__, static_folder='static', template_folder='templates')

@collections.route('/')
def chooser():
	return render_template('collection_chooser.html')


@collections.route('/collection-creator')
def collection_creator():
	return render_template('collection_creator.html')


@collections.route('/schemas')
def get_schemas():
	return jsonify({k:s.model_dump() for k,s in Schema.get_schemas().items()})
