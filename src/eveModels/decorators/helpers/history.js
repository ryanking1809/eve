import { eveHistory } from "../../../eveHistory";

export const history = (intance) => {
	return (target, prop, descriptor, listenTo) => {
        return {
            initializer() {
                return eveHistory.create({
					name: `${this.id}-${prop}`,
					eventIds: target.stateProps.map((prop) => ({
						path: [...this._path, prop],
					})),
				});
            }
        };
	};
};
