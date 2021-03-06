import { useState, useEffect } from "react";
import { listenTo } from "../eveEvents/eveListeners";

export function useListener(propArray) {
	const [reactState, setReactState] = useState(propArray());
	useEffect(() => {
		listenTo(propArray, () => {
			setReactState(propArray());
		});
	}, []);
	return reactState;
}
