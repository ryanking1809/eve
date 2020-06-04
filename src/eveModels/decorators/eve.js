import { silentUpdateEveStore } from "../../eveStore";

export function eve(name, singleton = false) {
	return function decorator(Class) {
		return extendClass(Class, name, singleton);
	};
}

const extendClass = (Class, name, singleton) => {
	Class._path = ["models", name];
    Class._name = name;
    Class._singleton = singleton
    if (singleton) {
        Class.instance = null;
        Class.get = () => Class.instance
    } else {
        Class.instances = {};
        Class.get = (instanceId) => Class.instances[instanceId];
	    silentUpdateEveStore((store) => (store.models[name] = {}));
    }
	return Class;
};