import { emitTracer } from "../../eveEvents/eveTracer";
import { fireListeners } from "../../eveEvents/eveListeners";

export const storeRef = (refProp, store) => {
	return (target, prop, descriptor, listenTo) => {
		const emitChange = ({self}) => {
                fireListeners({
					op: "replace",
					store: self._name,
					storeId: self.id,
					prop,
				});
		}
		!target.listenTo && (target.listenTo = {});
		!target.listenTo[prop] && (target.listenTo[prop] = []);
		target.listenTo[prop].push({
			targets: (self) => [
				(store || target.constructor) && (store || target.constructor).get(
					self[refProp]
				),
			],
			action: emitChange,
			type: "listen",
		});
		Object.defineProperty(target.constructor, prop, {
			get() {
				emitTracer({
					store: this._name,
					prop,
				});
				return null;
			},
		});
		return {
			get() {
				emitTracer({
					store: this._name,
					storeId: this.id,
					prop,
				});
				return (
					(store || target.constructor) &&
					(store || target.constructor).get(this[refProp])
				);
			},
		};
	};
};
