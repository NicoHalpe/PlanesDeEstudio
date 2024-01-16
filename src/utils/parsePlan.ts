import { FormPlan, RawPlan } from "../types/Plan";

const parsePlan = (name: string, plan: FormPlan) => {
	let parsedPlan: {
		name: string;
		plan: RawPlan;
	} = {
		name: name,
		plan: {},
	};

	plan.forEach((año: any) => {
		parsedPlan.plan[año.nombre] = año.materias;
	});

	return parsedPlan;
};

export default parsePlan;