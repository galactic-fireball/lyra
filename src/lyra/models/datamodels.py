import astropy.units as u
from dataclasses import asdict, dataclass, field
from typing import ClassVar
# import numpy as np
# import numpy.typing as npt
# import pandas as pd
# import pathlib
# from pydantic import AfterValidator, BaseModel, BeforeValidator, ConfigDict, Field, model_validator, PlainSerializer
# import toml
# from typing import Annotated, Any, ClassVar

from lyra.store.models import load_model, load_models
from lyra.utils import serialize

@dataclass
class DataValue:
	name: str
	type: str = 'float'
	units: str | u.Unit | None = None
	# units: str = '-'
	is_log: bool = False

	def __post_init__(self):
		# pass
		if isinstance(self.units, str):
			self.units = u.Unit(self.units)


@dataclass
class DataField(DataValue):	
	column: str = None

	def __post_init__(self):
		super().__post_init__()
		if self.column is None:
			self.column = self.name
		return self


@dataclass
class DataAttribute(DataValue):
	pass


@dataclass
class DataFeatures:
	names: list[str] = field(default_factory=list)
	attributes: list[DataAttribute] = field(default_factory=list)
	column_format: str = '{name_upper}_{attr_upper}'


@dataclass
class DataModel:
	models: ClassVar[dict] = {}

	name: str
	name_column: str
	fields: list[DataField] = field(default_factory=list)
	features: DataFeatures = None


	def __post_init__(self):
		DataModel.models[self.name] = self


	def resolve_column(self, name: str, attr: str) -> str:
		if self.features is None: return None
		return self.features.column_format.format(
			name=name,
			name_lower=name.lower(),
			name_upper=name.upper(),
			attr=attr,
			attr_lower=attr.lower(),
			attr_upper=attr.upper()
		)

	@classmethod
	def from_dict(cls, dm_dict):
		return cls(**dm_dict)


	@classmethod
	def from_file(cls, dm_file):
		dm_dict = load_model(dm_file)
		if not dm_dict:
			return None
		return cls.from_dict(dm_dict)


	@classmethod
	def from_name(cls, name):
		DataModel.get_models()
		dm = DataModel.models.get(name, None)
		if not dm is None:
			return dm

		dm_file = name.replace(' ', '_').lower()+'.json'
		return cls.from_file(dm_file)


	@staticmethod
	def get_models():
		if len(DataModel.models) == 1 and 'Empty' in DataModel.models:
			[DataModel(**model_data) for model_data in load_models()]
		return DataModel.models


	def to_dict(self):
		return serialize(asdict(self))


	def validate_with_data(self, df):
		return False
		# TODO: check name column exists
		# TODO: purge nonexistant fields
		# TODO: purge nonexistant feature.attrs
		# TODO: return True on success


	def save(self):
		file_name = self.name.replace(' ', '_').lower()+'.json'
		json_store(self, file_name, store=DATA_MODEL_STORE)


TestModel = DataModel(name='Basic', name_column='spec_name',
	fields=[
		DataField(name='ra', column='RA', units='deg'),
		DataField(name='dec', column='DEC', units='deg'),
		DataField(name='z', column='z'),
	],
	features=DataFeatures(
		names=['H_BETA', 'OIII',],
		attributes=[
			DataAttribute(name='FLUX', units='erg / s / cm**2 / AA', is_log=True),
			DataAttribute(name='FWHM', units='km / s')
		],
		column_format='{name_upper}_{attr_upper}'
	),
)

EmptyModel = DataModel(name='Empty', name_column='name', fields=[],features={})


# def main():
# 	create_basic_model()


# if __name__ == '__main__':
# 	main()



# class FilterValue(BaseModel):

# Feature:   [OIII]
# Attribute: [Flux]
# Operator:  [>]
# Value:     [1e-15]







