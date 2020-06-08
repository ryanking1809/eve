import { emitTracer } from "../../eveEvents/eveTracer";

export function state(target, prop, descriptor) {
	!target.stateInitializers && (target.stateInitializers = {});
	!target.stateProps && (target.stateProps = []);
	target.stateInitializers[prop] = descriptor.initializer;
	target.stateProps.push(prop);
    Object.defineProperty(target.constructor, prop, {
		get() {
			emitTracer({ store: this._name, prop });
			return descriptor.initializer();
		}
	});
	return {
		get() {
			emitTracer({store: this._name, storeId: this.id, prop});
			return this._getState()[prop];
		},
		set(val) {
			this.update(() => this._getState()[prop] = val);
		}
	};
}