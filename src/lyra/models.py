import numpy as np
import numpy.typing as npt
import pathlib
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, PlainSerializer
import toml
from typing import Annotated, Any


COLLECTION_DIR = pathlib.Path(__file__).resolve().parent.parent.parent.joinpath('collections')
SCHEMA_DIR = COLLECTION_DIR.joinpath('schemas')

DEFAULT_CONFIG_NAME = 'config.toml'
DEFAULT_DATA_NAME = 'data_file.csv'



def deserialize_list(data: list) -> npt.NDArray:
	return np.array(data)


def serialize_array(array: npt.NDArray) -> list:
	return array.tolist()


NDArray = Annotated[npt.NDArray, BeforeValidator(deserialize_list), PlainSerializer(serialize_array, return_type=list)]


class Component(BaseModel):
	name: str = Field(None, description='The name of the component.')
	label: str = Field(None, description='The label of the component used in the UI.')
	color: str = Field('black', description='The color used to plot the component.')


class Feature(BaseModel):
	name: str = Field(None, description='The name of the feature.')
	label: str = Field(None, description='The label of the feature used in the UI.')
	wave: float = Field(None, description='The wavelength of the feature.')
	wave_unit: str = Field(None, description='The unit used for the wavelength.')
	color: str = Field('black', description='The color used to plot the feature.')


class ActionTag(BaseModel):
	name: str = Field(None, description='The name of the action tag.')
	label: str = Field(None, description='The label of the action tag used in the UI.')
	hotkey: str = Field(None, description='The hotkey used to trigger the action tag.')
	value: Any = Field(None, description='The value placed in the column of Action.data_id in the data_file')


class Action(BaseModel):
	name: str = Field(None, description='The name of the action.')
	label: str = Field(None, description='The label of the action used in the UI.')
	data_id: str = Field(None, description='The column name in the data_file representing the action.')
	tag_list: list[ActionTag] = Field(default_factory=list, description='list of possible action tags.')
	tags: dict[str,ActionTag] = Field(default_factory=dict, description='dict of ActionTag names to the representative ActionTag.')
	hotkeys: dict[str,ActionTag] = Field(default_factory=dict, description='dict of ActionTag hotkeys to the representative ActionTag.')


class Schema(BaseModel):
	name: str = Field(None, description='The name of the schema.')
	description: str = Field(None, description='The description of the schema.')
	components: list[Component] = Field(default_factory=list, description='Expected components in the schema.')
	features: list[Feature] = Field(default_factory=list, description='Features to track within the schema.')
	actions: list[Action] = Field(default_factory=list, description='Available actions.')


class Collection(BaseModel):
	name: str = Field(None, description='The name of the collection.')
	schema: Schema = Field(None, description='The schema used within the collection.')
	description: str = Field(None, description='The description of the collection')
	spectra: list[str] = Field(default_factory=list, description='The names of all spectral items in the collection')

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


class Spectrum(BaseModel):
	model_config = ConfigDict(arbitrary_types_allowed=True)

	name: str = Field(None, description='The name of the spectrum.')
	file: str = Field(None, description='The name of the file within the collection\'s data directory corresponding with spectrum')
	components: dict[str,NDArray] = Field(default_factory=dict, description='The component arrays of the spectrum as specified in the schema.')
	wave: NDArray = Field(None, description='The wavelength array.')
	data: NDArray = Field(None, description='The flux array.')
	noise: NDArray = Field(None, description='The noise array.')
	metadata: dict = Field(default_factory=dict, description='Metadata about the spectrum to display.')
	asdf: str = Field(None, description='The parent collection of which this spectrum belongs.')

