export const modelRef = (refProp, model) => {
	return (target, prop, descriptor, listenTo) => {
		return {
			get() {
				return (model || target.constructor).get(this[refProp]);
			},
		};
	};
};
