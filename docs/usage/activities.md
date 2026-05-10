---
title: Activities
---

Activities are 


ViewActivity(Activity):
	name: Literal['view']
	actions: [GetPreviousAction,GetNextAction]


class FeatureVerifyActivity(Activity):
	name: Literal['feature-verify']
	actions: [GetPreviousAction, GetNextAction, UpdateManifestAction]


class FeatureMarkActivity