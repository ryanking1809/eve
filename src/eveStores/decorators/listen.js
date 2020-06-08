export function listen(listenTo) {
	return function decorator(target, prop, descriptor) {
		!target.listenTo && (target.listenTo = {});
		!target.listenTo[prop] && (target.listenTo[prop] = []);
		target.listenTo[prop].push({
			targets: listenTo,
			action: ({self}) => self[prop](),
			type: "listen",
		});
		return {
            get() {
                return descriptor.value.bind(this)
            }
        };
	};
}

