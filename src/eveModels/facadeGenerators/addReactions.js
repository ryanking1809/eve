import { addListeners, listenTo } from "../../eveListeners";

export const addReactions = (object, reactionDefs) => {
	Object.keys(reactionDefs).forEach((prop) => {
		const propDef = reactionDefs[prop];
		if (propDef.listenTo) {
			const reaction = () => propDef.reaction(object);
			const listeners = listenTo(
				() => propDef.listenTo(object),
				reaction
			);
			object._listeners[prop] = listeners;
			Object.defineProperty(object, prop, {
				value: reaction,
			});
		} else if (propDef.eventIds) {
			const reaction = () => propDef.reaction(object);
			const listeners = addListeners(propDef.eventIds(object), reaction);
			object._listeners[prop] = listeners;
			Object.defineProperty(object, prop, {
				value: reaction,
			});
		}
	});
};
