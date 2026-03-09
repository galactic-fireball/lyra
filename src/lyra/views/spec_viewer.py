from flask import Blueprint, jsonify, render_template

from lyra.models import Collection

spec_viewer = Blueprint('spec-viewer', __name__, static_folder='static', template_folder='../templates/spec_viewer')


@spec_viewer.route('/')
def spec_viewer_root():
	return render_template('spec_viewer.html')


@spec_viewer.get('/<collection_slug>/<spec_name>')
def show_spec(collection_slug, spec_name):
	col = Collection.from_name(collection_slug)
	if not col:
		print('Collection %s not found'%collection_slug)
		return None

	spectrum = col.get_spectrum(spec_name)
	if not spectrum:
		print('Spectrum %s not found'%spec_name)
		return None

	return jsonify(spectrum.model_dump())
