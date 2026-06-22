from flask import Blueprint, jsonify, render_template

from spark.io.models import SparkSpec, SparkCube

from lyra.models import Catalog

spec_viewer = Blueprint('spec-viewer', __name__, static_folder='static', template_folder='../templates/spec_viewer')


# @spec_viewer.route('/')
# def spec_viewer_root():
# 	return render_template('spec_viewer.html')


@spec_viewer.get('/<catalog_slug>/<spec_name>')
def show_spec(catalog_slug, spec_name):
	print('show_spec')
	cat = Catalog.from_name(catalog_slug)
	if not cat:
		print('Catalog %s not found'%catalog_slug)
		return {'error': 'Catalog not found'}, 404

	spectrum = cat.get_spectrum(spec_name)
	if not spectrum:
		print('Spectrum %s not found'%spec_name)
		return {'error': 'Spectrum not found'}, 404

	print('Rendering: %s [%s]'%(spectrum.target.name,cat.slug))

	if isinstance(spectrum, SparkCube):
		print('is cube')
		template = 'map_viewer.html'
	elif isinstance(spectrum, SparkSpec):
		print('is spec')
		template = 'spec_viewer.html'
	else:
		raise Exception('Unsupported') # TODO: handle

	return render_template(template, catalog_slug=cat.slug, spec_name=spectrum.target.name)
