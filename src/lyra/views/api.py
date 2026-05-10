from flask import Blueprint, jsonify, render_template, request

from lyra.models import Catalog, DataModel
from lyra.utils import serialize

api = Blueprint('api', __name__, static_folder='static', template_folder='../templates/activities')


@api.route('data-models')
def get_data_models():
	return jsonify(serialize(list(DataModel.get_models().keys())))


@api.route('data-model')
def get_data_model():
	model_name = request.args.get('model')
	dm = DataModel.from_name(model_name)
	if not dm:
		return {'error': 'Data Model not found'}, 404

	return jsonify(serialize(dm.to_dict()))


@api.route('spec-data')
def spec_data():
	catalog_slug = request.args.get('catalog')
	spec_name = request.args.get('spec_name')
	mode = request.args.get('mode', None)

	cat = Catalog.from_name(catalog_slug)
	if not cat:
		print('Catalog %s not found'%catalog_slug)
		return {'error': 'Catalog not found'}, 404

	if (not mode is None) and (mode == 'next'):
		spectrum = cat.get_next_spectrum(spec_name)
	elif (not mode is None) and (mode == 'prev'):
		spectrum = cat.get_prev_spectrum(spec_name)
	else:
		spectrum = cat.get_spectrum(spec_name)

	if not spectrum:
		print('Spectrum %s not found'%spec_name)
		return {'error': 'Spectrum not found'}, 404

	return jsonify(serialize(spectrum.model_dump()))


@api.route('activity')
def activity():
	activity = request.args.get('activity')
	return render_template(activity + '.html')


@api.route('features')
def features():
	catalog = request.args.get('catalog')
	cat = Catalog.from_name(catalog)
	return jsonify(serialize([feat.model_dump() for feat in cat.schema.features]))


@api.route('activity-data', methods=['POST'])
def activity_data():
	data = request.json
	catalog_name = data.get('catalog', None)
	if catalog_name is None:
		return {'error': 'Need catalog'}, 404

	catalog = Catalog.from_name(catalog_name)
	if catalog_name is None:
		return {'error': 'Invalid catalog'}, 404

	if catalog.mark_manifest_data(**data):
		return {'success': 'ok'}, 200

	return {'error':'mark manifest failed'}, 404
