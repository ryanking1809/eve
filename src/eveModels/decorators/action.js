

import { fireTracerCallbacks } from "../../eveTracer";
import { fireListeners } from "../../eveListeners";

export function action(target, prop, descriptor) {
	return {
		get() {
            const path = [...this._path, prop];
			fireTracerCallbacks(path);
			return (...args) => {
				if (fireListeners({ path }, "intercept")) {
					const updater = () => descriptor.value.bind(this)(...args);
					this.update(updater);
					fireListeners({ path });
				}
			};
		}
	};
}