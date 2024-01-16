import { MarkerType } from "react-flow-renderer";

type RawMateria = {
	/* foreground: string;
	background: string; */
	tituloIntermedio: boolean;
	label: string;
	cuatrimestre: number;
	requires: string[];
};

type Year = {
	id: string;
	type: string;
	data: { label: string; [key: string]: any };
	position: { x: number; y: number };
};

type Edge = {
	id: string;
	source: string;
	target: string;
	markerEnd: { type: MarkerType };
};

type RawPlan = {
	[year: string]: RawMateria[];
};

type Materia = {
	id: string;
	type: string;
	data: RawMateria & {
		year: string;
		hasLeft?: boolean;
		hasRight?: boolean;
		enabled?: boolean;
		onCheck?: (event: React.ChangeEvent<HTMLInputElement>, id: string) => void;
		done?: boolean;
		[key: string]: any;
	};
	position: { x: number; y: number };
};

type Node = {
	id: string;
	type: string;
	data: { [key: string]: any };
	position: { x: number; y: number };
};

type Plan = Materia[];

type FormPlan = {
	nombre: string;
	materias: RawMateria[];
}[];

export type { Plan, RawPlan, FormPlan, Year, Edge, Materia, RawMateria, Node };
