from flask import Blueprint, jsonify, render_template, request

from lyra.models import Collection

api = Blueprint('api', __name__, static_folder='static', template_folder='../templates/activities')


@api.route('spec-data')
def spec_data():
	collection_slug = request.args.get('collection')
	spec_name = request.args.get('spec_name')

	col = Collection.from_name(collection_slug)
	if not col:
		print('Collection %s not found'%collection_slug)
		return {'error': 'Collection not found'}, 404

	spectrum = col.get_spectrum(spec_name)
	if not spectrum:
		print('Spectrum %s not found'%spec_name)
		return {'error': 'Spectrum not found'}, 404

	return jsonify(spectrum.model_dump())


@api.route('activity')
def activity():
	activity = request.args.get('activity')
	return render_template(activity + '.html')
