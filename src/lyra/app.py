from flask import Flask

def init_app():
	app = Flask(__name__)

	from lyra.views.collections import collections
	app.register_blueprint(collections, url_prefix='/collections')

	return app