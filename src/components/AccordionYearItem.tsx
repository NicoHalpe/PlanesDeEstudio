import React from "react";
import {
	Accordion,
	AccordionControlProps,
	ActionIcon,
	Button,
	Center,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { IconGripVertical, IconTrash } from "@tabler/icons-react";

import { FormPlan } from "../types/Plan";
import { modals } from "@mantine/modals";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { DndContext } from "@dnd-kit/core";
import AccordionMateriaItem from "./AccordionMateriaItem";

const nuevaMateria = {
	label: "Nueva materia",
	tituloIntermedio: false,
	cuatrimestre: 1,
	requires: [],
};

function AccordionControl(
	props: AccordionControlProps & {
		onIconClick: () => void;
		showIcon: boolean;
		dragHandle: React.ReactNode;
	}
) {
	return (
		<Center>
			{props.dragHandle}
			<Accordion.Control {...props} />
			{props.showIcon && (
				<ActionIcon size="lg" variant="subtle" color="red" mr="xs" onClick={props.onIconClick}>
					<IconTrash style={{ width: "70%", height: "70%" }} stroke={1.5} />
				</ActionIcon>
			)}
		</Center>
	);
}

const AccordionYearItem = ({
	año,
	i,
	plan,
	setPlan,
	nombresWithoutDuplicates,
	updateNombreMateria,
	isOpened,
}: {
	año: FormPlan[0];
	i: number;
	plan: FormPlan;
	setPlan: React.Dispatch<React.SetStateAction<FormPlan>>;
	nombresWithoutDuplicates: { nombre: string; año: string }[];
	updateNombreMateria: (añoIndex: number, materiaIndex: number, nombre: string) => void;
	isOpened: boolean;
}) => {
	const { listeners, attributes, setNodeRef, transition, transform, active } = useSortable({
		id: año.id,
	});

	const isActive = active?.id === año.id;

	const t = transform ? { ...transform, scaleY: 1 } : null;

	const style = {
		transition,
		transform: CSS.Transform.toString(t as typeof transform),
		opacity: isActive ? 0.8 : 1,
	};

	const deleteMateria = (onConfirm: () => void) =>
		modals.openConfirmModal({
			title: "Eliminar materia",
			centered: true,
			children: <Text size="sm">¿Estás seguro que querés eliminar esta materia?</Text>,
			labels: { confirm: "Eliminar", cancel: "Cancelar" },
			confirmProps: { color: "red" },
			onCancel: () => {
				console.log("cancel");
			},
			onConfirm: () => {
				onConfirm();
			},
		});

	const deleteYear = (onConfirm: () => void) =>
		modals.openConfirmModal({
			title: "Eliminar año",
			centered: true,
			children: <Text size="sm">¿Estás seguro que querés eliminar este año?</Text>,
			labels: { confirm: "Eliminar", cancel: "Cancelar" },
			confirmProps: { color: "red" },
			onCancel: () => {
				console.log("cancel");
			},
			onConfirm,
		});

	const [materiasOrder, setMateriasOrder] = React.useState(
		año.materias.map((m, i) => m.id as string)
	);

	return (
		<Accordion.Item value={año.id} key={i} ref={setNodeRef} style={style}>
			<AccordionControl
				showIcon={plan.length > 1}
				onIconClick={() => {
					deleteYear(() =>
						setPlan((plan) => {
							plan.splice(i, 1);
							return [...plan];
						})
					);
				}}
				dragHandle={
					<ActionIcon variant="subtle" color="white" ml={"xs"} {...listeners} {...attributes}>
						<IconGripVertical />
					</ActionIcon>
				}
			>
				{año.nombre || "-"}
			</AccordionControl>
			<Accordion.Panel>
				<Stack gap="md">
					<TextInput
						label="Nombre"
						value={año.nombre}
						onChange={(e) => {
							const nombre = e.currentTarget.value;
							setPlan((plan) => {
								plan[i].nombre = nombre;
								return [...plan];
							});
						}}
					/>

					<span>Materias</span>

					{isOpened && (
						<>
							<DndContext
								/* onDragStart={(event) => setActiveYear(null)} */
								onDragEnd={(event) => {
									if (event?.active?.id !== event?.over?.id) {
										const dragIndex = materiasOrder.findIndex(
											(value) => value === event?.active?.id
										);
										const hoverIndex = materiasOrder.findIndex(
											(value) => value === event?.over?.id
										);

										const newItems = arrayMove(materiasOrder, dragIndex, hoverIndex);

										setMateriasOrder(newItems);

										setPlan((plan) => {
											return plan.map((año, añoIndex) => {
												if (añoIndex === i) {
													return {
														...año,
														materias: newItems.map((id) => {
															return año.materias.find((m) => m.id === id);
														}),
													};
												}
												return año;
											}) as FormPlan;
										});
									}
								}}
							>
								<SortableContext items={materiasOrder} strategy={verticalListSortingStrategy}>
									{año.materias.map((item, materiaIndex) => {
										return (
											<AccordionMateriaItem
												key={"materia-" + item.id}
												item={item}
												año={año}
												añoIndex={i}
												deleteMateria={deleteMateria}
												setPlan={setPlan}
												nombresWithoutDuplicates={nombresWithoutDuplicates}
												updateNombreMateria={updateNombreMateria}
												index={materiaIndex}
											/>
										);
									})}
								</SortableContext>
							</DndContext>
						</>
					)}

					<Button
						color="orange"
						onClick={() => {
							setPlan((plan) => {
								plan[i].materias.push({ ...nuevaMateria, id: Math.random().toString(36).substr(2, 9) });
								return [...plan];
							});
						}}
					>
						Agregar materia
					</Button>
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
};

export default AccordionYearItem;
