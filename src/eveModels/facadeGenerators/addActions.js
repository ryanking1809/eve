import { fireTracerCallbacks } from "../../eveTracer";
import { fireInterceptors } from "../../eveInterceptors";
import { fireListeners } from "../../eveListeners";

export const addActions = (object, actionDefs) => {
	Object.keys(actionDefs).forEach((prop) => {
		const path = [...object._path, prop];
		Object.defineProperty(object, prop, {
			get() {
				fireTracerCallbacks(path);
				return (...args) => {
					if (fireListeners({ path }, "intercept")) {
						const updater = (self) =>
							actionDefs[prop](self, ...args);
						this.update(updater);
						fireListeners({ path });
					}
				};
			},
		});
	});
};
