import { FormPlan, RawPlan } from "../types/Plan";

const formatPlan = (plan: RawPlan) => {
	let formattedPlan: FormPlan = [];
	Object.keys(plan).forEach((año) => {
		formattedPlan.push({
			id: Math.random().toString(36).substr(2, 9),
			nombre: año,
			materias: plan[año]!.map((materia) => {
				return {
					id: Math.random().toString(36).substr(2, 9),
					...materia,
				};
			}),
		});
	});

	return formattedPlan;
};

export default formatPlan;
