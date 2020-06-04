import { listenTo, addListeners } from "../../eveListeners";

export const addDerivatives = (object, derivativeDefs) => {
	Object.keys(derivativeDefs).forEach((prop) => {
		const propDef = derivativeDefs[prop];
		let cachedVal = null;
		let needsUpdate = true;
		const setNeedsUpdate = () => (needsUpdate = true);
		if (typeof propDef === "function") {
			const updateCache = (self) => {
				const listeners = listenTo(() => propDef(self), setNeedsUpdate);
				object._listeners[prop] = listeners;
				cachedVal = propDef(self);
			};
			Object.defineProperty(object, prop, {
				get() {
					needsUpdate && updateCache(this);
					return cachedVal;
				},
			});
		} else if (propDef.listenTo) {
			const listeners = listenTo(
				() => propDef.listenTo(object),
				setNeedsUpdate
			);
			object._listeners[prop] = listeners;
			const updateCache = (self) => (cachedVal = propDef.compute(self));
			Object.defineProperty(object, prop, {
				get() {
					needsUpdate && updateCache(this);
					return cachedVal;
				},
			});
		} else if (propDef.eventIds) {
			const listeners = addListeners(
				propDef.eventIds(object),
				setNeedsUpdate
			);
			object._listeners[prop] = listeners;
			const updateCache = (self) => (cachedVal = propDef.compute(self));
			Object.defineProperty(object, prop, {
				get() {
					needsUpdate && updateCache(this);
					return cachedVal;
				},
			});
		} else if (propDef.custom) {
			propDef.custom(object, prop);
		}
	});
};
