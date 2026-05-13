import astropy.units as u
import numpy as np
import pathlib

def serialize(obj):
	if isinstance(obj, (str,int,float,bool)):
		return obj
	if obj is None:
		return obj
	if isinstance(obj, (list,np.ndarray)):
		return [serialize(item) for item in obj]
	if isinstance(obj, dict):
		return {k:serialize(v) for k,v in obj.items()}
	if isinstance(obj, (u.Unit,u.CompositeUnit)):
		return obj.to_string()
	if isinstance(obj, pathlib.Path):
		return str(obj)
	if isinstance(obj, (np.float32,np.float64)):
		return float(obj)
	# return str(obj)
	breakpoint()
