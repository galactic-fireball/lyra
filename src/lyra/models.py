import pathlib
from pydantic import BaseModel
import toml
from typing import List


COLLECTION_DIR = pathlib.Path(__file__).resolve().parent.parent.parent.joinpath('collections')
DEFAULT_CONFIG_NAME = 'config.toml'
DEFAULT_DATA_NAME = 'data_file.csv'


class Component(BaseModel):
	name: str
	color: str


class Collection(BaseModel):
	name: str
	components: List[Component]


	@classmethod
	def from_name(cls, name):
		config_file = COLLECTION_DIR.joinpath(name, DEFAULT_CONFIG_NAME)
		if not config_file.exists():
			raise Exception('Not found: %s'%str(col_dir))

		return cls(**toml.load(config_file))


	@staticmethod
	def get_collections():
		print(str(COLLECTION_DIR))
		cols = [f.stem for f in COLLECTION_DIR.glob('*')]
		print(cols)
		return cols
