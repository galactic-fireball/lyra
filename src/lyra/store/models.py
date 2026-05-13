import json
import pathlib

from lyra.utils import serialize

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent.parent.joinpath('data')
CATALOG_DIR = DATA_DIR.joinpath('catalogs')
DATAMODEL_DIR = DATA_DIR.joinpath('models')

def get_abs_path(path):
	if not path.is_absolute():
		path = DATA_DIR.joinpath(path)
	return path.resolve()


def json_store(obj, path):
	with open(get_abs_path(path), 'w') as f:
		json.dump(serialize(obj), f, indent=4)


def load_json(_path):
	path = get_abs_path(_path)
	if not path.exists():
		print('Could not find json file: %s'%str(path))
		return None

	with open(path, 'r') as f:
		data = json.load(f)
	return data


def store_catalog(cat):
	CATALOG_DIR.mkdir(parents=True, exist_ok=True)
	cat_file = CATALOG_DIR.joinpath(cat.slug+'.json')
	json_store(cat.dict(), cat_file)


def load_catalog(cat_name):
	cat_file = CATALOG_DIR.joinpath(cat_name)
	if not cat_file.exists():
		cat_file = CATALOG_DIR.joinpath(cat_name.replace(' ', '-'))
	return load_json(cat_file)


def load_catalogs():
	return [load_json(cat_file) for cat_file in CATALOG_DIR.glob('*.json')]


def load_model(model_name):
	model_file = DATAMODEL_DIR.joinpath(model_name)
	if not model_file.exists():
		model_file = DATAMODEL_DIR.joinpath(model_name.replace(' ', '-'))
	return load_json(model_file)



def load_models():
	return [load_json(model_file) for model_file in DATAMODEL_DIR.glob('*.json')]
