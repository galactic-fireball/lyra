from flask import Blueprint, render_template

from lyra.models import Collection

collections = Blueprint('collections', __name__, static_folder='static', template_folder='templates')

@collections.route('/')
def chooser():
	return render_template('collection_chooser.html')
