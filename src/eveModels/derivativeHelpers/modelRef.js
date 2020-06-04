import { eveModels } from "..";

export const modelRef = ({ modelName, refProp }) => {
		return {
			eventIds: (self) => [
				{ path: ["models", modelName, self[refProp]] },
			],
			compute: (self) => eveModels[modelName].get(self[refProp]),
		};
	}