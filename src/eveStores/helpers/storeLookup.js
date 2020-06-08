import { BinaryMap } from "../dataTypes/BinaryMap";
import { emitTracer } from "../../eveEvents/eveTracer";

export const storeLookup = ({ store, key, filter, sort }) => {
	return (target, prop, descriptor, listenTo) => {
		!target.listenTo && (target.listenTo = {});
		!target.listenTo[prop] && (target.listenTo[prop] = []);
		let items = sort
			? new BinaryMap([], (a, b) =>
					sort(
						store.get(a),
						store.get(b)
					)
			  )
			: new Map();
		const addItem = ({ event }) => {
			if (event.storeId && !event.prop) {
				const newInst = store.get(event.storeId);
				if (!filter || filter(newInst)) {
					items.set(key(newInst), newInst);
				}
			}
		};
		target.listenTo[prop].push({
			targets: { add: (self) => [store] },
			action: addItem,
			type: "listen",
		});
		const updateItem = ({ event }) => {
			if (event.prop) {
				const inst = store.get(event.storeId);
				if (!filter || filter(inst)) {
					items.set(key(inst), inst);
				} else {
					items.delete(key(inst));
				}
			}
		};
		target.listenTo[prop].push({
			targets: (self) => [store],
			action: updateItem,
			type: "listen",
		});
		const removeItem = ({event}) => {
			const inst = store.get(event.storeId);
			if (event.storeId && !event.prop) {
				items.delete(key(inst));
			}
		};
		target.listenTo[prop].push({
			targets: { remove: (self) => [store] },
			action: removeItem,
			type: "listen",
		});
		Object.defineProperty(target.constructor, prop, {
			get() {
				emitTracer(store._tracer);
				return {}
			},
		});
		return {
			get() {
				emitTracer(store._tracer);
				return items;
			},
		};
	};
};