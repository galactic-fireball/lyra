ACTION_REGISTRY = {}

class SpectralSource(BaseModel):
	name: str = None


class ActionInput(BaseModel):
	action_name: str = None
	collection: str = None
	spec_source: SpectralSource = None


class ActionOutput(BaseModel):
	success: bool = True


class Action(BaseModel):
	name: str
	input_model: ActionInput
	output_model: ActionOutput
	func_name: str


class FeatureVerifyActionInput(ActionInput):
	action_name: Literal['feature-verify']
	feature: str = None
	verify: int = 0


class FeatureVerifyActionOutput(ActionOutput):
	pass


ACTION_REGISTRY['feature-verify'] = Action({
	'name':'feature-verify',
	'input_model':FeatureVerifyActionInput,
	'output_model':FeatureVerifyActionOutput,
	'func_name':'feature_verify',
})
