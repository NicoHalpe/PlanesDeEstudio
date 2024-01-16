import { FormPlan, RawPlan } from "../types/Plan";

const formatPlan = (plan: RawPlan) => {
	let formattedPlan: FormPlan = [];

	Object.keys(plan).forEach((año) => {
		formattedPlan.push({
			nombre: año,
			materias: plan[año],
		});
	});

	return formattedPlan;
};

export default formatPlan;