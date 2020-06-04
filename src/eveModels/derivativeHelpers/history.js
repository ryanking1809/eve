import { eveHistory } from "../../eveHistory";

export const history = (op, path) => {
				return {
					custom: (self, prop) => {
						Object.defineProperty(self, prop, {
							value: eveHistory.create({
								name: self.id,
								eventIds: Object.keys(self._def.state).map(
									(prop) => ({
										path: [...self._path, prop],
									})
								),
							}),
						});
					},
				};
			}