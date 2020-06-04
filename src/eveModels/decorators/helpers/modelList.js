import { BinarySet } from "../../dataTypes/BinaryMap";

export const modelList = ({model, filter, sort}) => {
			return (target, prop, descriptor, listenTo) => {
                !target.listenTo && (target.listenTo = {});
				!target.listenTo[prop] && (target.listenTo[prop] = []);
                let items = sort
					? new BinarySet([], (a, b) =>
							sort(
								model.get(a),
								model.get(b)
							)
					  )
                    : new Set();
                const addItem = (e) => {
                    if (e.path.length === 3) {
                        const newInst = model.get(e.path[2]);
                        if (!filter || filter(newInst)) {
                            items.add(newInst);
                        }
                    }
                };
                target.listenTo[prop].push({
					targets: {add: (self) => [model]},
					action: self => addItem,
					type: "react",
                });
                const updateItem = (e) => {
					if (e.path.length > 3) {
						const inst = model.get(e.path[2]);
						if (!filter || filter(inst)) {
							items.add(inst);
						} else {
							items.delete(inst);
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
						items.delete(inst);
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
