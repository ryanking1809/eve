import { eveHistory } from "../../eveHistory";

export const history = (intance) => {
	return (target, prop, descriptor, listenTo) => {
        return {
            initializer() {
                return eveHistory.create({
					name: `${this.id}-${prop}`,
					eventIds: target.stateProps.map((prop) => ({
						store: this._name,
						storeId: this.id,
						prop
					})),
				});
            }
        };
	};
};
