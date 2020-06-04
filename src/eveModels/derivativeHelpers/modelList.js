import { eveModels } from "..";
import { addListener } from "../../eveListeners";
import { BinarySet } from "../dataTypes/BinaryMap";

export const modelList = ({
	modelName,
	filter,
	sort,
	listeners,
}) => {
	return {
		custom: (self, prop) => {
			let items = sort
				? new BinarySet([], (a, b) =>
						sort(
							eveModels[modelName].get(a),
							eveModels[modelName].get(b)
						)
				  )
				: new Set();
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
							items.add(newInst);
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
							items.add(inst);
						} else {
							items.delete(inst);
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
						items.delete(inst);
					}
				}
			);
			self._listeners[`${prop}-add`] = newItemListener;
			self._listeners[`${prop}-update`] = updateItemListener;
			self._listeners[`${prop}-destroy`] = destroyItemListener;
		},
	};
};