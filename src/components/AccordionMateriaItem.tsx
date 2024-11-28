import { CSS } from "@dnd-kit/utilities";
import {
	ActionIcon,
	Box,
	Checkbox,
	Flex,
	Grid,
	MultiSelect,
	NumberInput,
	Paper,
	Select,
	TextInput,
	Title,
} from "@mantine/core";
import { IconGripVertical, IconTrash } from "@tabler/icons-react";
import React, { useId } from "react";
import { FormPlan, RawMateria } from "../types/Plan";
import { useSortable } from "@dnd-kit/sortable";

type Props = {
	año: FormPlan[0];
	añoIndex: number;
	item: RawMateria;
	index: number;
	nombresWithoutDuplicates: { nombre: string; año: string }[];
	updateNombreMateria: (añoIndex: number, materiaIndex: number, nombre: string) => void;
	deleteMateria: (onConfirm: () => void) => void;
	setPlan: React.Dispatch<React.SetStateAction<FormPlan>>;
};

export default function AccordionMateriaItem({
	año,
	añoIndex: i,
	item,
	index,
	nombresWithoutDuplicates,
	updateNombreMateria,
	deleteMateria,
	setPlan,
}: Props) {
	const { listeners, attributes, setNodeRef, transition, transform, active } = useSortable({
		id: item.id || "",
	});

	const isActive = active?.id === item.id;

	const style = {
		transition,
		transform: CSS.Transform.toString(transform),
		opacity: isActive ? 0.8 : 1,
	};

	const requiresOptions = nombresWithoutDuplicates
		.filter((materia) => materia.nombre !== item.label)
		.map((materia) => ({
			value: materia.nombre,
			label: materia.nombre,
			group: materia.año,
		}));

	const grouped = requiresOptions.reduce(
		(prev, curr, currIndex) => {
			const group = curr.group;
			const exists = prev.find((item) => item.group === group);
			if (exists) {
				exists.items.push(curr.label);
			} else {
				prev.push({
					group,
					items: [group + " (Completo)", curr.label],
				});
			}
			return prev;
		},
		[] as {
			group: string;
			items: string[];
		}[]
	);

	return (
		<div style={style} ref={setNodeRef}>
			<Paper shadow="xs" p="lg" withBorder bg={"var(--mantine-color-dark-6)"}>
				<Flex align="center" justify="space-between" mb="md">
					<Flex align="center" gap="sm">
						<ActionIcon variant="subtle" color="white" {...listeners} {...attributes}>
							<IconGripVertical />
						</ActionIcon>
						<Title order={4}>{item.label}</Title>
					</Flex>
					{año.materias.length > 1 && (
						<ActionIcon
							color="red"
							onClick={() => {
								deleteMateria(() =>
									setPlan((plan) => {
										plan[i].materias.splice(plan[i].materias.indexOf(item), 1);
										return [...plan];
									})
								);
							}}
						>
							<IconTrash style={{ width: "70%", height: "70%" }} stroke={1.5} />
						</ActionIcon>
					)}
				</Flex>

				<Grid grow gutter="sm">
					<Grid.Col span={7}>
						<TextInput
							label="Nombre"
							value={item.label}
							onChange={(e) => {
								const nombre = e.currentTarget.value;
								updateNombreMateria(i, index, nombre);
							}}
						/>
					</Grid.Col>

					<Grid.Col span={7}>
						<Select
							label="Cuatrimestre"
							value={item.cuatrimestre.toString()}
							data={[
								{ value: "1", label: "1er Cuatrimestre" },
								{ value: "2", label: "2do Cuatrimestre" },
								{ value: "3", label: "Anual" },
							]}
							onChange={(value) => {
								const cuatrimestre = parseInt(value || "1");
								setPlan((plan) => {
									plan[i].materias[index].cuatrimestre = cuatrimestre;
									return [...plan];
								});
							}}
							withCheckIcon={false}
						/>
					</Grid.Col>

					<Grid.Col span={4}>
						<Box
							style={{
								display: "flex",
								height: "100%",
								minWidth: "170px",
								alignItems: "end",
							}}
						>
							<Checkbox
								styles={{
									root: {
										border: "1px solid var(--mantine-color-dark-4)",
										backgroundColor: "var(--mantine-color-dark-6)",
										borderRadius: "4px",
										height: "calc(2.25rem*var(--mantine-scale))",
										width: "100%",
										display: "flex",
										alignItems: "center",
										padding: "0 0.5rem",
									},
								}}
								label="Título intermedio"
								checked={item.tituloIntermedio}
								onChange={(e) => {
									const tituloIntermedio = e.currentTarget.checked;
									setPlan((plan) => {
										plan[i].materias[index].tituloIntermedio = tituloIntermedio;
										return [...plan];
									});
								}}
							/>
						</Box>
					</Grid.Col>

					<Grid.Col span={5}>
						<NumberInput
							label="Horas semanales"
							value={item.weekHours}
							min={0}
							onChange={(e) => {
								const weekHours = parseInt(e.toString());
								setPlan((plan) => {
									plan[i].materias[index].weekHours = weekHours;
									return [...plan];
								});
							}}
						/>
					</Grid.Col>

					<Grid.Col span={5}>
						<TextInput
							label="Link externo"
							value={item.externalLink}
							onChange={(e) => {
								const externalLink = e.currentTarget.value;
								setPlan((plan) => {
									plan[i].materias[index].externalLink = externalLink;
									return [...plan];
								});
							}}
						/>
					</Grid.Col>

					<Grid.Col span={8}>
						<MultiSelect
							label="Correlativas"
							placeholder="Materias que se requieren para poder cursarla"
							value={item.requires}
							multiple
							searchable
							data={grouped}
							onChange={(value) => {
								if (!value) return;
								const valueWithCompleto = value.find((v) => v.includes(" (Completo)"));
								if (valueWithCompleto) {
									const newValues = value.map((v) => v.replace(" (Completo)", ""));
									setPlan((plan) => {
										plan[i].materias[index].requires = [...new Set(newValues)];
										return [...plan];
									});
								} else {
									setPlan((plan) => {
										plan[i].materias[index].requires = value;
										return [...plan];
									});
								}
							}}
							withCheckIcon={false}
						/>
					</Grid.Col>
				</Grid>
			</Paper>
		</div>
	);
}
