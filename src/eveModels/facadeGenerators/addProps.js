export const addProps = (object, propDefs) => {
	Object.keys(propDefs).forEach((prop) => {
		Object.defineProperty(object, prop, {
			value: propDefs[prop],
		});
	});
};
