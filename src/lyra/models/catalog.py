import pandas as pd
import pathlib
from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import ClassVar

from spark.io import load_spectral_product
from spark.io.models import SparkSpec, SparkCube

from lyra.models import DataModel, EmptyModel
from lyra.store.models import store_catalog, load_catalog, load_catalogs
from lyra.utils import serialize

class Catalog(BaseModel):
	model_config = ConfigDict(arbitrary_types_allowed=True)
	catalogs: ClassVar[dict] = {}

	name: str = Field(None, description='The name of the catalog')
	slug: str = Field(None, description='Slug label used in URLs to represent this Catalog')
	description: str = Field(None, description='A description of the Catalog')
	data_model: str | DataModel = Field(EmptyModel, description='The data model used within the Catalog')
	manifest: str | pathlib.Path = Field(None, description='The path to the catalog metadata')
	repository: str | pathlib.Path = Field(None, description='Storage repository of catalog spectra data')

	_mdf: pd.DataFrame = None
	_spec_cache: dict = {}

	@model_validator(mode='after')
	def setup(self):
		self.slug = self.name.replace(' ', '-')

		if isinstance(self.repository, str):
			self.repository = pathlib.Path(self.repository)

		if isinstance(self.data_model, str):
			self.data_model = DataModel.from_name(self.data_model)

		if self.manifest is None or self.manifest == '':
			self.manifest = self.data_model.create_manifest(self.repository)
		if isinstance(self.manifest, str):
			self.manifest = pathlib.Path(self.manifest)

		print(self.manifest)
		if self.manifest:
			self._mdf = pd.read_csv(self.manifest)

		store_catalog(self)
		Catalog.catalogs[self.slug] = self
		return self


	@classmethod
	def from_name(cls, name):
		print('Catalog.from_name: %s'%name)
		Catalog.get_catalogs()
		cat = Catalog.catalogs.get(name, None)
		if not cat is None:
			return cat

		cat_data = load_catalog(name)
		if not cat_data:
			print('Invalid catalog name: %s'%name)
			return None
		return cls(**cat_data)


	def to_dict(self):
		return serialize(self.model_dump())


	@staticmethod
	def get_catalogs():
		if len(Catalog.catalogs) == 0:
			[Catalog(**cat_data) for cat_data in load_catalogs()]
		print('Catalogs:')
		for name, cat in Catalog.catalogs.items():
			print('%s (%s)'%(name,cat.slug))
		return Catalog.catalogs


	def get_spectra(self):
		if self._mdf is None:
			return []

		name_col = self.data_model.name_column
		return self._mdf[name_col].values


	def get_spectra_info(self, spec_name=None):
		if self._mdf is None:
			return []
		if spec_name is None:
			return self._mdf.to_dict(orient='records')
		res = self._mdf[self._mdf[self.data_model.name_column] == spec_name]
		if len(res) != 1:
			print('unexpected result count: %d'%len(res))
			return []
		return res.iloc[0].to_dict(orient='records')


	# TODO: make a separate models/spectrum and models/cube to handle these
	def get_spectrum(self, spec_name):
		print('spec_name: %s'%spec_name)

		if spec_name in self._spec_cache:
			return self._spec_cache[spec_name]

		spec_file = self.repository.joinpath('%s.fits'%spec_name)
		if not spec_file.exists():
			print('Could not find request spectrum: %s'%str(spec_file))
			return None

		self._spec_cache[spec_name] = load_spectral_product(spec_file, 'MIRI_MRS', name=spec_file.stem)
		return self._spec_cache[spec_name]


	def get_spectrum_map(self, spec_name, map_type):
		print('get_spectrum_map')
		spec = self.get_spectrum(spec_name)
		if spec is None:
			print('Could not find request spectrum: %s'%str(spec_file))
			return None

		if not isinstance(spec, SparkCube):
			print('maps only available for data cubes')
			return None

		if map_type != 'median':
			print('Only median maps currently supported')
			return None

		return spec.get_median_map()


	def get_spec_spaxel_data(self, spec_name, x, y):
		print('get_spec_spaxel_data')
		spec = self.get_spectrum(spec_name)
		if spec is None:
			print('Could not find request spectrum: %s'%str(spec_file))
			return None
		print('got spec')

		if not isinstance(spec, SparkCube):
			print('spaxels only available for data cubes')
			return None

		spax = spec.spax(x,y)
		print('got spax')
		# TODO: better workaround
		spax.flux = spax.flux.value
		spax.err = spax.err.value
		spax.wave = spax.wave.value
		print('returning')
		return spax


# class SurveyCollection(Collection):

# 	spectra: list[str] = Field(default_factory=list, description='The names of all spectral items in the collection.')
# 	data_dir: Annotated[pathlib.Path | str, PlainSerializer(serialize_path, return_type=str)] = Field(None, description='The directory containing the spectrum files for this collection.')
# 	data_model: str | pathlib.Path | DataModel = Field(None, description='TODO')
# 	manifest: Annotated[pathlib.Path | str, PlainSerializer(serialize_path, return_type=str)] = Field(None, description='A manifest csv with all the objects of the collection.')
# 	mdf: Annotated[pd.DataFrame | None, PlainSerializer(serialize_df, return_type=str)] = Field(None, description='The manifest dataframe.')
# 	index_map: dict[str,int] = Field(default_factory=dict, description='Map to track indices of spectra for retrieving next and previous spectrum.')


# 	def post_setup(self):
# 		if isinstance(self.data_dir, str):
# 			self.data_dir = pathlib.Path(self.data_dir)

# 		if isinstance(self.manifest, str):
# 			self.manifest = pathlib.Path(self.manifest)
# 		if (not self.manifest is None) and (not self.manifest.is_absolute()):
# 			self.manifest = self.data_dir.joinpath(self.manifest)
# 		if (not self.manifest is None):
# 			self.mdf = pd.read_csv(self.manifest)

# 		# if isinstance(self.data_model, str):
# 		# 	self.data_model = pathlib.Path(self.data_model)
# 		# if (not self.data_model is None) and (not self.data_model.is_absolute()):
# 		# 	self.data_model = self.data_dir.joinpath(self.data_model)

# 		self.create_index_map()


# 	def create_index_map(self):
# 		# make sure spectra list is setup
# 		self.get_spectra()
# 		self.index_map = {name:i for i,name in enumerate(self.spectra)}


# 	def get_spectra(self) -> list:
# 		if len(self.spectra) == 0:
# 			if (not self.manifest is None) and (self.manifest.exists()):
# 				df = pd.read_csv(self.manifest)
# 				if not self.name_col in df:
# 					print('Could not find [%s] column in manifest'%name_col)
# 					return []
# 				self.spectra = list(df[self.name_col].values)
# 			else:
# 				self.spectra = [f.stem for f in self.data_dir.glob('*')]

# 		return self.spectra


# 	def get_spectrum(self, spec_name):
# 		spec_file = self.data_dir.joinpath('%s.fits'%spec_name)
# 		if not spec_file.exists():
# 			print('Could not find request spectrum: %s'%str(spec_file))
# 			return None

# 		# TODO: support other data types
# 		from lyra.inputs.sdss import SDSSSpectrum
# 		return SDSSSpectrum.from_file(spec_file, self)


# 	def get_next_spectrum(self, cur_spec_name):
# 		idx = self.index_map[cur_spec_name]
# 		if idx + 1 < len(self.spectra):
# 			return self.get_spectrum(self.spectra[idx+1])
# 		return None


# 	def get_prev_spectrum(self, cur_spec_name):
# 		idx = self.index_map[cur_spec_name]
# 		if idx > 0:
# 			return self.get_spectrum(self.spectra[idx-1])
# 		return None


# 	def mark_manifest_data(self, **kwargs):
# 		spec_name = kwargs.get('spec_name', None)
# 		data_col = kwargs.get('data_col', None)
# 		data_val = kwargs.get('data_val', None)

# 		if (spec_name is None) or (data_col is None) or (data_val is None):
# 			print('Missing data argument')
# 			return False

# 		self.mdf.loc[self.mdf[self.name_col] == spec_name, data_col] = data_val
# 		self.mdf.to_csv(self.manifest, index=False)
# 		return True
