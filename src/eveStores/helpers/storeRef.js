export const storeRef = (refProp, store) => {
	return (target, prop, descriptor, listenTo) => {
		return {
			get() {
				return (store || target.constructor).get(this[refProp]);
			},
		};
	};
};
