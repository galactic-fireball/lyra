import pandas as pd
import pathlib
from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import ClassVar

from spark.io import load_spectral_product

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

	@model_validator(mode='after')
	def setup(self):
		self.slug = self.name.replace(' ', '-')

		if isinstance(self.manifest, str):
			self.manifest = pathlib.Path(self.manifest)
		if isinstance(self.repository, str):
			self.repository = pathlib.Path(self.repository)

		if isinstance(self.data_model, str):
			self.data_model = DataModel.from_name(self.data_model)

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


	def get_spectrum(self, spec_name):
		spec_file = self.repository.joinpath('%s.fits'%spec_name)
		if not spec_file.exists():
			print('Could not find request spectrum: %s'%str(spec_file))
			return None

		return load_spectral_product(spec_file, 'SDSS', name=spec_file.stem)


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
