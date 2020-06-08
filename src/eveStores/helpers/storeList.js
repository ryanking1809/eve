import { BinarySet } from "../dataTypes/BinarySet";
import { emitTracer } from "../../eveEvents/eveTracer";

export const storeList = ({store, filter, sort}) => {
			return (target, prop, descriptor, listenTo) => {
                !target.listenTo && (target.listenTo = {});
				!target.listenTo[prop] && (target.listenTo[prop] = []);
                let items = sort
					? new BinarySet([], (a, b) =>
							sort(
								store.get(a),
								store.get(b)
							)
					  )
                    : new Set();
                const addItem = ({event}) => {
                    if (event.storeId && !event.prop) {
						const newInst = store.get(event.storeId);
						if (!filter || filter(newInst)) {
							items.add(newInst);
						}
					}
                };
                target.listenTo[prop].push({
					targets: {add: (self) => [store]},
					action: addItem,
					type: "listen",
                });
                const updateItem = ({event}) => {
					if (event.prop) {
						const inst = store.get(event.storeId);
						if (!filter || filter(inst)) {
							items.add(inst);
						} else {
							items.delete(inst);
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
						items.delete(inst);
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
						return []
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
