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
		parsedPlan.plan[año.nombre] = año.materias.map((materia: any) => {
			/* delete materia.id;
			if(materia.weekHours === null) delete materia.weekHours; */
			const materiaCopy = { ...materia };
			delete materiaCopy.id;
			if (materiaCopy.weekHours === null || isNaN(materiaCopy.weekHours)) delete materiaCopy.weekHours;
			return materiaCopy;
		});
	});

	return parsedPlan;
};

export default parsePlan;
