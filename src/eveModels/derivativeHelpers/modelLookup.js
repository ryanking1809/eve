import { eveModels } from "..";
import { addListener } from "../../eveListeners";
import { BinaryMap } from "../dataTypes/BinaryMap";

export const modelLookup = ({
	modelName,
	key,
	filter,
	sort,
	listeners,
}) => {
	return {
		custom: (self, prop) => {
			let items = sort
				? new BinaryMap([], (a, b) =>
						sort(
							eveModels[modelName].get(a),
							eveModels[modelName].get(b)
						)
				  )
				: new Map();
			Object.defineProperty(self, prop, {
				get: () => items,
			});
			const newItemListener = addListener(
				{
					op: "add",
					path: ["models", modelName],
					exactPathMatch: false,
				},
				(e) => {
					if (e.path.length === 3) {
						const newInst = eveModels[modelName].get(e.path[2]);
						if (!filter || filter(newInst)) {
							items.set(key(newInst), newInst);
						}
					}
				}
			);
			// add condition if listeners
			const updateItemListener = addListener(
				{
					path: ["models", modelName],
					exactPathMatch: false,
				},
				(e) => {
					if (e.path.length > 3) {
						const inst = eveModels[modelName].get(e.path[2]);
						if (!filter || filter(inst)) {
							items.set(key(inst), inst);
						} else {
							items.delete(key(inst));
						}
					}
				}
			);
			const destroyItemListener = addListener(
				{
					op: "remove",
					path: ["models", modelName],
					exactPathMatch: false,
				},
				(e) => {
					const inst = eveModels[modelName].get(e.path[2]);
					if (e.path.length === 3) {
						items.delete(key(inst));
					}
				}
			);
			self._listeners[`${prop}-add`] = newItemListener;
			self._listeners[`${prop}-update`] = updateItemListener;
			self._listeners[`${prop}-destroy`] = destroyItemListener;
		},
	};
};