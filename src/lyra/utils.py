def serialize(obj):
	if isinstance(obj, list):
		return [serialize(item) for item in obj]
	if isinstance(obj, dict):
		return {k:serialize(v) for k,v in obj.items()}
	if isinstance(obj, (str,int,float)):
		return obj
	return str(obj)
