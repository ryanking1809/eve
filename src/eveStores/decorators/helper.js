// helperFormat = (...helperArgs) => (target, prop, descriptor, listenTo) => {...doStuff}
export function helper(...args) {
	if (args.length === 3) {
		return decorator(...args);
	}
	return (target, prop, descriptor) =>
		decorator(target, prop, descriptor, args[0]);
}

function decorator(target, prop, descriptor, listenTo) {
	return descriptor.initializer()(target, prop, descriptor, listenTo);
}