import { MarkerType } from "react-flow-renderer";
import { RawPlan, Plan, Edge, Year } from "./types/Plan";
import defaultPlans from "./defaultPlans.json";

const localPlans = localStorage.getItem("plans");
const plans: {
	name: string;
	plan: RawPlan;
}[] = localPlans ? JSON.parse(localPlans) : defaultPlans;

defaultPlans.forEach((defaultPlan) => {
	if (!plans.find((plan) => plan.name === defaultPlan.name)) {
		plans.push(defaultPlan);
	}
});

localStorage.setItem("plans", JSON.stringify(plans));

/* const localCheckedNodes = window.localStorage.getItem("checkedNodes");
const checkedNodes = localCheckedNodes ? JSON.parse(localCheckedNodes) : [];

localStorage.setItem("plans", JSON.stringify(plans)); */

const parsePlans = (
	plans: { name: string; plan: RawPlan }[],
	checkedNodes: { [key: string]: string[] }
) => {
	const parsedPlans = plans.map(({ plan, name }) => {
		const parsedPlan: Plan = [];
		Object.keys(plan).forEach((year, i) => {
			if(!plan[year]) return;
			const sorted = plan[year].sort((a, b) => a.cuatrimestre - b.cuatrimestre);

			const materiasDelPrimerCuatrimestre = sorted.filter((m) => m.cuatrimestre === 1);
			const materiasDelSegundoCuatrimestre = sorted.filter((m) => m.cuatrimestre === 2);
			const materiasAnuales = sorted.filter((m) => m.cuatrimestre === 3);

			const materiasCuatrimestrales = [
				...materiasDelPrimerCuatrimestre,
				...materiasDelSegundoCuatrimestre,
			];

			materiasCuatrimestrales.forEach((materia, j) => {
				const cuatrimestre = materia.cuatrimestre - 1;
				const materiasDelCuatrimestreAnterior = sorted.filter(
					(m) => m.cuatrimestre === materia.cuatrimestre - 1
				).length;
				parsedPlan.push({
					id: `y${i + 1}-m${j + 1}`,
					type: "course",
					data: {
						...materia,
						background: materia.tituloIntermedio ? "rgb(241, 197, 152)" : "rgb(199, 214, 236)",
						foreground: "#000",
						year,
						done: checkedNodes[name]?.includes(`y${i + 1}-m${j + 1}`) ?? false,
					},
					position: {
						x: 0 + 600 * i + 250 * cuatrimestre,
						y: 100 + 100 * j - 100 * materiasDelCuatrimestreAnterior,
					},
				});
			});

			const actualRows = Math.max(
				materiasDelPrimerCuatrimestre.length,
				materiasDelSegundoCuatrimestre.length
			);

			materiasAnuales.forEach((materia, j) => {
				parsedPlan.push({
					id: `y${i + 1}-m${j + materiasCuatrimestrales.length + 1}`,
					type: "course",
					data: {
						...materia,
						background: materia.tituloIntermedio ? "rgb(241, 197, 152)" : "rgb(199, 214, 236)",
						foreground: "#000",
						year,
						done: checkedNodes[name]?.includes(`y${i + 1}-m${j + 1}`) ?? false,
					},
					position: {
						x: 0 + 600 * i,
						y: 100 + 100 * actualRows + 100 * j,
					},
				});
			});
		});

		const parsedYears: Year[] = [];
		Object.keys(plan).forEach((year, i) => {
			parsedYears.push({
				id: year,
				type: "year",
				data: {
					label: year,
					materias: parsedPlan.filter((materia) => materia.data.year === year),
				},
				position: { x: 150 + 600 * i, y: 0 },
			});
		});

		const findMateriaByLabel = (label: string) => {
			return parsedPlan.find((materia) => materia.data.label === label);
		};

		const findMateriasByYear = (year: string) => {
			return parsedPlan.filter((materia) => materia.data.year === year);
		};

		const parsedEdges: Edge[] = [];
		parsedPlan.forEach((materia) => {
			if (materia.data.requires) {
				materia.data.requires.forEach((require) => {
					const source = findMateriaByLabel(require);
					if (!source) {
						const sourceYear = findMateriasByYear(require);
						if (sourceYear.length > 0) {
							sourceYear.forEach((mat) => {
								parsedEdges.push({
									id: `${mat.id}-${materia.id}`,
									source: mat.id,
									target: materia.id,
									markerEnd: { type: MarkerType.ArrowClosed },
								});
							});
						}
					} else {
						parsedEdges.push({
							id: `${source.id}-${materia.id}`,
							source: source.id,
							target: materia.id,
							markerEnd: { type: MarkerType.ArrowClosed },
						});
					}
				});
			}
		});

		return {
			name,
			plan: parsedPlan,
			years: parsedYears,
			edges: parsedEdges,
		};
	});

	return parsedPlans;
};

export { parsePlans, defaultPlans };
