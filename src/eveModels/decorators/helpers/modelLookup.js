import { BinaryMap } from "../../dataTypes/BinaryMap";

export const modelLookup = ({ model, key, filter, sort }) => {
	return (target, prop, descriptor, listenTo) => {
		!target.listenTo && (target.listenTo = {});
		!target.listenTo[prop] && (target.listenTo[prop] = []);
		let items = sort
			? new BinaryMap([], (a, b) =>
					sort(
						model.get(a),
						model.get(b)
					)
			  )
			: new Map();
		const addItem = (e) => {
			if (e.path.length === 3) {
				const newInst = model.get(e.path[2]);
				if (!filter || filter(newInst)) {
					items.set(key(newInst), newInst);
				}
			}
		};
		target.listenTo[prop].push({
			targets: { add: (self) => [model] },
			action: (self) => addItem,
			type: "react",
		});
		const updateItem = (e) => {
			if (e.path.length > 3) {
				const inst = model.get(e.path[2]);
				if (!filter || filter(inst)) {
					items.set(key(inst), inst);
				} else {
					items.delete(key(inst));
				}
			}
		};
		target.listenTo[prop].push({
			targets: (self) => [model],
			action: (self) => updateItem,
			type: "react",
		});
		const removeItem = (e) => {
			const inst = model.get(e.path[2]);
			if (e.path.length === 3) {
				items.delete(key(inst));
			}
		};
		target.listenTo[prop].push({
			targets: { remove: (self) => [model] },
			action: (self) => removeItem,
			type: "react",
		});
		return {
			initializer() {
				return items;
			},
		};
	};
};