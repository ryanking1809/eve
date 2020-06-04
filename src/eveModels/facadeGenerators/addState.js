import { fireTracerCallbacks } from "../../eveTracer";
import { updateEveStore } from "../../eveStore";

export const addState = (object, stateDefs) => {
	Object.keys(stateDefs).forEach((prop) => {
		Object.defineProperty(object, prop, {
			get() {
				fireTracerCallbacks([...object._path, prop]);
				return this.raw[prop];
			},
			set(val) {
				updateEveStore((store) => {
					if (this._modelName) {
						store.models[this._modelName][this.id][prop] = val;
					} else if (this._collectionName) {
						store.collections[this._collectionName][prop] = val;
					}
				});
			},
		});
	});
};
