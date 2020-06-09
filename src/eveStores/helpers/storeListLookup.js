import { GroupedSet } from "../dataTypes/GroupedSet";
import { emitTracer } from "../../eveEvents/eveTracer";
import { fireListeners } from "../../eveEvents/eveListeners";

export const storeListLookup = ({ store, key, filter, sort }) => {
    return (target, prop, descriptor, listenTo) => {
        !target.listenTo && (target.listenTo = {});
        !target.listenTo[prop] && (target.listenTo[prop] = []);
        let items = new GroupedSet([], key);
        const addItem = ({event, self}) => {
            if (event.storeId && !event.prop) {
				const newInst = store.get(event.storeId);
				if (!filter || filter(newInst)) {
					items.add(newInst);
				}
                fireListeners({
                    op: "replace",
                    store: self._name,
                    storeId: self.id,
                    prop,
                });
			}
        };
        target.listenTo[prop].push({
            targets: { add: (self) => [store] },
            action: addItem,
            type: "listen",
        });
        const updateItem = ({event, self}) => {
            if (event.prop) {
                const inst = store.get(event.storeId);
                if (!filter || filter(inst)) {
                    items.add(inst);
                } else {
                    items.delete(inst);
                }
                fireListeners({
                    op: "replace",
                    store: self._name,
                    storeId: self.id,
                    prop,
                });
            }
        };
        target.listenTo[prop].push({
            targets: (self) => [store],
            action: updateItem,
            type: "listen",
        });
        const removeItem = ({event, self}) => {
            const inst = store.get(event.storeId);
            if (event.storeId && !event.prop) {
				items.delete(inst);
                fireListeners({
					op: "replace",
					store: self._name,
					storeId: self.id,
					prop,
				});
			}
        };
        target.listenTo[prop].push({
            targets: { remove: (self) => [store] },
            action: removeItem,
            type: "listen",
        });
        Object.defineProperty(target.constructor, prop, {
            get() {
                emitTracer({
					store: this._name,
					prop,
				});
                return {}
            }
        });
        return {
            get() {
                emitTracer({
					store: this._name,
					storeId: this.id,
					prop,
				});
                return items;
            },
        }
    }
};