import numpy as np
import numpy.typing as npt
import pathlib
from pydantic import AfterValidator, BaseModel, BeforeValidator, ConfigDict, Field, model_validator, PlainSerializer
import toml
from typing import Annotated, Any, ClassVar


COLLECTION_DIR = pathlib.Path(__file__).resolve().parent.parent.parent.joinpath('collections')
SCHEMA_DIR = COLLECTION_DIR.joinpath('schemas')

DEFAULT_CONFIG_NAME = 'config.toml'
DEFAULT_DATA_NAME = 'data_file.csv'



def deserialize_list(data: list) -> npt.NDArray:
	return np.array(data)


def clean_array(data: npt.NDArray) -> npt.NDArray:
	data[np.isnan(data)] = 0.0
	data[~np.isfinite(data)] = 0.0
	return data


def serialize_array(array: npt.NDArray) -> list:
	return array.tolist()


NDArray = Annotated[npt.NDArray, BeforeValidator(deserialize_list), AfterValidator(clean_array), PlainSerializer(serialize_array, return_type=list)]


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
	product_fmt: str = Field(None, description='The product format expected for data using this schema.')
	components: list[Component] = Field(default_factory=list, description='Expected components in the schema.')
	features: list[Feature] = Field(default_factory=list, description='Features to track within the schema.')
	actions: list[Action] = Field(default_factory=list, description='Available actions.')

	schemas: ClassVar[dict] = {}

	@classmethod
	def get_schemas(cls):
		if len(Schema.schemas) == 0:
			for schema_file in SCHEMA_DIR.glob('*'):
				schema = cls(**toml.load(schema_file))
				Schema.schemas[schema.name] = schema
		return Schema.schemas


	@classmethod
	def by_name(cls, name):
		return Schema.schemas.get(name, None)


def set_schema(value: Schema | str) -> Schema:
	if isinstance(value, Schema):
		return Schema
	return Schema.by_name(value)



class Collection(BaseModel):
	name: str = Field(None, description='The name of the collection.')
	slug: str = Field(None, description='Slug label used in URLs to represent this Collection.')
	schema: Annotated[Schema | str, AfterValidator(set_schema)] = Field(None, description='The schema used within the collection.')
	description: str = Field(None, description='The description of the collection.')
	spectra: list[str] = Field(default_factory=list, description='The names of all spectral items in the collection.')
	data_dir: pathlib.Path | str = Field(None, description='The directory containing the spectrum files for this collection.')
	metadata: list[str] = Field(default_factory=list, description='The expected keys of the metadata field for each Spectrum in the Colleciton.')

	collections: ClassVar[dict] = {}

	@model_validator(mode='after')
	def set_slug(self):
		self.slug = self.name.replace(' ', '-')
		return self


	@model_validator(mode='after')
	def setup(self):
		# TODO: check if data_dir exists

		col_dir = COLLECTION_DIR.joinpath(self.slug)
		col_dir.mkdir(parents=True, exist_ok=True)

		config_file = col_dir.joinpath(DEFAULT_CONFIG_NAME)
		if not config_file.exists():
			with open(config_file, 'w') as f:
				f.write(toml.dumps(self.model_dump()))

		if isinstance(self.data_dir, str):
			self.data_dir = pathlib.Path(self.data_dir)

		# TODO: check for collection with this name already exists
		Collection.collections[self.name] = self
		return self


	@staticmethod
	def get_collections():
		if len(Collection.collections) == 0:
			for col_file in COLLECTION_DIR.glob('*'):
				col = cls(**toml.load(col_file))
				Collection.collections[col.name] = col
		return Collection.collections


	@classmethod
	def from_name(cls, name):
		config_file = COLLECTION_DIR.joinpath(name, DEFAULT_CONFIG_NAME)
		if not config_file.exists():
			raise Exception('Not found: %s'%str(config_file))

		col_dict = toml.load(config_file)
		print(col_dict)
		return cls(**col_dict)


	def get_spectra(self):
		if len(self.spectra) == 0:
			self.spectra = [f.stem for f in self.data_dir.glob('*')]
		return self.spectra


	def get_spectrum(self, spec_name):
		spec_file = self.data_dir.joinpath('%s.fits'%spec_name)
		if not spec_file.exists():
			print('Could not find request spectrum: %s'%str(spec_file))

		# TODO: support other data types
		from lyra.inputs.sdss import SDSSSpectrum
		return SDSSSpectrum.from_file(spec_file, self)



class Spectrum(BaseModel):
	model_config = ConfigDict(arbitrary_types_allowed=True)

	name: str = Field(None, description='The name of the spectrum.')
	file: str = Field(None, description='The name of the file within the collection\'s data directory corresponding with spectrum')
	components: dict[str,NDArray] = Field(default_factory=dict, description='The component arrays of the spectrum as specified in the schema.')
	wave: NDArray = Field(None, description='The wavelength array.')
	data: NDArray = Field(None, description='The flux array.')
	noise: NDArray = Field(None, description='The noise array.')
	metadata: dict = Field(default_factory=dict, description='Metadata about the spectrum to display.')
	collection: str = Field(None, description='The parent collection of which this spectrum belongs.')

# TODO: metadata: redshift, ra, dec, spaxels if IFU, fit info

