import { intercept, addInterceptors } from "../../eveInterceptors";
import { listenTo, addListeners } from "../../eveListeners";

export const addRetroactions = (object, retroactionDefs) => {
	Object.keys(retroactionDefs).forEach((prop) => {
		const propDef = retroactionDefs[prop];
		if (propDef.listenTo) {
			const retroaction = () => propDef.retroaction(object);
			const interceptors = listenTo(
				() => propDef.listenTo(object),
                retroaction,
                "intercept"
			);
			object._interceptors[prop] = interceptors;
			Object.defineProperty(object, prop, {
				value: retroaction,
			});
		} else if (propDef.eventIds) {
			const retroaction = () => propDef.retroaction(object);
			const interceptors = addListeners(
				propDef.eventIds(object),
				retroaction,
				"intercept"
			);
			object._interceptors[prop] = interceptors;
			Object.defineProperty(object, prop, {
				value: retroaction,
			});
		}
	});
};
