from flask import Blueprint, render_template

from lyra.models import Collection

collections = Blueprint('collections', __name__, static_folder='static', template_folder='templates')

@collections.route('/')
def list_collections():
	s = ''
	cols = Collection.get_collections()

	for col in cols:
		s += '<h1>%s</h1>\n'%col

	return s
