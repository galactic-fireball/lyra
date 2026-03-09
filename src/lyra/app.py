from flask import Flask, jsonify, redirect, url_for

def init_app():
	app = Flask(__name__)

	@app.route('/api/routes')
	def get_routes():
		routes = {}
		for rule in app.url_map.iter_rules():
			routes[rule.endpoint] = rule.rule
		return jsonify(routes)

	from lyra.views.collections import collections
	app.register_blueprint(collections, url_prefix='/collections')

	from lyra.views.spec_viewer import spec_viewer
	app.register_blueprint(spec_viewer, url_prefix='/spec-viewer')

	@app.route('/')
	def index():
		return redirect(url_for('collections.chooser'))

	return app
