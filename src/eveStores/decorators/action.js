

import { emitTracer } from "../../eveEvents/eveTracer";
import { fireListeners } from "../../eveEvents/eveListeners";

export function action(target, prop, descriptor) {
	return {
		get() {
            const path = { store: this._name, storeId: this.id, prop };
			// emitTracer(path);
			return (...args) => {
				if (fireListeners(path, "intercept")) {
					const updater = () => descriptor.value.bind(this)(...args);
					this.update(updater);
					fireListeners(path);
				}
			};
		}
	};
}