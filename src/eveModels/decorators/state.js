import { fireTracerCallbacks } from "../../eveTracer";

export function state(target, prop, descriptor) {
	!target.stateInitializers && (target.stateInitializers = {});
	!target.stateProps && (target.stateProps = []);
	target.stateInitializers[prop] = descriptor.initializer;
	target.stateProps.push(prop);
	return {
		get() {
			fireTracerCallbacks([...this._path, prop]);
			return this._getState()[prop];
		},
		set(val) {
			this.update(() => this._getState()[prop] = val);
		}
	};
}