from flask import Flask, redirect, url_for

def init_app():
	app = Flask(__name__)

	from lyra.views.collections import collections
	app.register_blueprint(collections, url_prefix='/collections')

	@app.route('/')
	def index():
		return redirect(url_for('collections.chooser'))

	return app