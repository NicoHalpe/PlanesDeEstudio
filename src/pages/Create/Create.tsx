import React, { useEffect, useId, useMemo, useState } from "react";
import {
	Accordion,
	AccordionControlProps,
	ActionIcon,
	Box,
	Button,
	Center,
	Checkbox,
	Container,
	FileInput,
	Flex,
	Grid,
	JsonInput,
	Modal,
	MultiSelect,
	Paper,
	Select,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { IconArrowLeft, IconGripVertical, IconTrash } from "@tabler/icons-react";

import styles from "./Create.module.css";
import { CodeHighlight } from "@mantine/code-highlight";
import { FormPlan, RawMateria, RawPlan } from "../../types/Plan";
import formatPlan from "../../utils/formatPlan";
import parsePlan from "../../utils/parsePlan";
import { useLocalStorage, useMediaQuery } from "@mantine/hooks";
import { defaultPlans } from "../../constants";
import { modals } from "@mantine/modals";
import { DndContext, useDraggable } from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";

type Props = {};

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

export default function CreatePlan({}: Props) {
	const [savedPlans, setSavedPlans] = useLocalStorage<
		{
			name: string;
			plan: RawPlan;
		}[]
	>({
		key: "plans",
		defaultValue: defaultPlans,
		serialize: (value) => {
			return JSON.stringify(value);
		},
		deserialize: (value) => {
			return value ? JSON.parse(value) : defaultPlans;
		},
		getInitialValueInEffect: false,
	});

	let [selectedPlanName, setSelectedPlanName] = useLocalStorage({
		key: "selectedPlan",
		defaultValue: "",
		serialize(value) {
			return JSON.stringify(value);
		},
		deserialize(value) {
			return value ? JSON.parse(value) : "";
		},
		getInitialValueInEffect: false,
	});

	const selectedPlan = savedPlans.find((plan) => plan.name === selectedPlanName) || savedPlans[0];

	const [nombre, setNombre] = React.useState(savedPlans.length ? selectedPlan.name : "Nuevo plan");
	const [plan, setPlan] = React.useState<FormPlan>(
		savedPlans.length
			? formatPlan(selectedPlan.plan)
			: [
					{
						id: Math.random().toString(36).substr(2, 9),
						nombre: "Primer año",
						materias: [{ ...nuevaMateria }],
					},
			  ]
	);

	const [yearsOrder, setYearsOrder] = useState(plan.map((año) => año.id));

	useEffect(() => {
		setSelectedPlanName(nombre);
	}, [nombre]);

	const [exportModalOpened, setExportModalOpened] = useState(false);
	const [importModalOpened, setImportModalOpened] = useState(false);
	const [JSONImport, setJSONImport] = useState("");

	const nombresMaterias = plan.flatMap((año) =>
		año.materias.map((materia) => ({ nombre: materia.label, año: año.nombre }))
	);

	const nombresWithoutDuplicates = nombresMaterias.filter((materia, index) => {
		return nombresMaterias.findIndex((m) => m.nombre === materia.nombre) === index;
	});

	const updateNombreMateria = (añoIndex: number, materiaIndex: number, nombre: string) => {
		const newPlan = [...plan];
		newPlan[añoIndex].materias[materiaIndex].label = nombre;
		setPlan(newPlan);
	};

	const createPlan = () => {
		const parsedPlan = parsePlan(nombre, plan);

		const updatedPlans = savedPlans.map((plan: { name: string; plan: RawPlan }) => {
			if (plan.name === nombre) {
				return parsedPlan;
			}
			return plan;
		});

		setSavedPlans(updatedPlans);

		setExportModalOpened(true);
	};

	const deletePlan = () => {
		modals.openConfirmModal({
			title: "Eliminar plan",
			centered: true,
			children: <Text size="sm">Estás seguro que querés eliminar este plan?</Text>,
			labels: { confirm: "Eliminar", cancel: "Cancelar" },
			confirmProps: { color: "red" },
			onCancel: () => {
				console.log("cancel");
			},
			onConfirm: () => {
				const newSavedPlans = savedPlans.filter((plan) => plan.name !== nombre);
				setSavedPlans(newSavedPlans);
				setNombre(newSavedPlans[0].name);
				setPlan(formatPlan(newSavedPlans[0].plan));
			},
		});
	};

	useEffect(() => {
		const parsedPlan = parsePlan(nombre, plan);

		const updatedPlans = savedPlans.map((plan: { name: string; plan: RawPlan }) => {
			if (plan.name === selectedPlanName) {
				return parsedPlan;
			}
			return plan;
		});

		setSavedPlans(updatedPlans);
		setSelectedPlanName(nombre);
	}, [plan, nombre]);

	const isSmallScreen = useMediaQuery("(max-width: 1250px)");

	const handleImport = () => {
		try {
			const jsonValue = JSON.parse(JSONImport);

			if (!jsonValue.name || !jsonValue.plan) return;

			const formattedPlan = formatPlan(jsonValue.plan);

			const parsedPlan = parsePlan(jsonValue.name, formattedPlan);

			const planNameExists = savedPlans.findIndex((plan) => plan.name === jsonValue.name);

			const newPlans = [...savedPlans];

			if (planNameExists !== -1) {
				modals.openConfirmModal({
					title: "Ya existe un plan con ese nombre",
					centered: true,
					children: (
						<Text size="sm">Estás por sobrescribir un plan ya existente. ¿Estás seguro?</Text>
					),
					labels: { confirm: "Confirmar", cancel: "Cancelar" },
					confirmProps: { color: "red" },
					onCancel: () => {
						console.log("cancel");
					},
					onConfirm: () => {
						newPlans[planNameExists] = parsedPlan;

						setSavedPlans(newPlans);
						setSelectedPlanName(jsonValue.name);
						setPlan(formattedPlan);
						setNombre(jsonValue.name);

						setImportModalOpened(false);
					},
				});
			} else {
				newPlans.push(parsedPlan);

				setSavedPlans(newPlans);
				setSelectedPlanName(jsonValue.name);
				setPlan(formattedPlan);
				setNombre(jsonValue.name);

				setImportModalOpened(false);
			}
		} catch (error) {
			console.log(error);
		}
	};

	const [activeYear, setActiveYear] = useState<string | null>(yearsOrder[0]);

	/* console.log(window.location.origin + "/importPlan?plan=" + JSON.stringify(parsePlan(nombre, plan))); */

	const jsonFileUrl = useMemo(() => {
		const blob = new Blob([JSON.stringify(parsePlan(nombre, plan), null, 4)], {
			type: "application/json",
		});
		const url = window.URL.createObjectURL(blob);
		return url;
	}, [nombre, plan]);

	return (
		<>
			<Modal
				opened={exportModalOpened}
				onClose={() => setExportModalOpened(false)}
				title={nombre}
				size="xl"
			>
				<Button color="blue" component="a" href={jsonFileUrl} download={nombre + ".json"} fullWidth>
					Exportar JSON
				</Button>

				{/* <QRCode value={window.location.origin + "/importPlan?plan=" + JSON.stringify(parsePlan(nombre, plan))} width={"100%"} /> */}
				<CodeHighlight language="json" code={JSON.stringify(parsePlan(nombre, plan), null, 4)} />
			</Modal>
			<Modal
				opened={importModalOpened}
				onClose={() => setImportModalOpened(false)}
				title={nombre}
				size="xl"
			>
				<FileInput
					label="Importar archivo JSON"
					accept="application/json"
					placeholder="Seleccionar un archivo JSON"
					onChange={(file) => {
						if (!file) return;
						const reader = new FileReader();
						reader.onload = (e) => {
							const content = e.target?.result;
							if (typeof content === "string") {
								setJSONImport(content);
							}
						};
						reader.readAsText(file);
					}}
				/>

				<JsonInput
					label="Importar plan"
					placeholder="Pegar el JSON del plan de estudios"
					autosize
					maxRows={30}
					formatOnBlur
					value={JSONImport}
					onChange={(value) => {
						setJSONImport(value);
					}}
				/>

				<Button color="blue" onClick={handleImport} mt={"sm"} fullWidth>
					Importar
				</Button>
			</Modal>

			<Flex gap={"0"} className={styles.fullWrapper}>
				<Container size="md" p="xl" ml={isSmallScreen ? undefined : "0"} w={"100%"} h={"100%"}>
					<Button
						variant="default"
						mb={"md"}
						onClick={() => (window.location.href = "/")}
						leftSection={<IconArrowLeft size={20} />}
					>
						Volver
					</Button>

					<Flex align="end" gap="sm" w="100%" mb={"sm"}>
						{savedPlans && (
							<Select
								w={"100%"}
								flex={"1"}
								label="Seleccionar plan de estudios"
								data={savedPlans.map((plan) => plan.name)}
								value={nombre}
								onChange={(value) => {
									const plan = savedPlans.find(
										(plan: { name: string; plan: RawPlan }) => plan.name === value
									);
									if (plan) {
										setNombre(plan.name);
										setPlan(formatPlan(plan.plan));
									}
								}}
							/>
						)}

						<Button
							variant="default"
							w="110"
							onClick={() => {
								setNombre("Nuevo plan");
								setPlan([
									{
										id: Math.random().toString(36).substr(2, 9),
										nombre: "Primer año",
										materias: [{ ...nuevaMateria }],
									},
								]);
								setSavedPlans(() => {
									return [
										...savedPlans,
										{
											...parsePlan("Nuevo plan", [
												{
													id: Math.random().toString(36).substr(2, 9),
													nombre: "Primer año",
													materias: [{ ...nuevaMateria }],
												},
											]),
										},
									];
								});
							}}
						>
							Nuevo
						</Button>

						<Button w="110" variant="default" onClick={() => setImportModalOpened(true)}>
							Importar
						</Button>
					</Flex>
					<Paper shadow="sm" withBorder p="xl">
						<Stack>
							<Flex align="center" justify="space-between" gap="xl">
								<Title order={2} className={styles.planTitle}>
									{nombre}
								</Title>
								<Button w={"fit-content"} color="red" variant="outline" onClick={deletePlan}>
									Eliminar plan
								</Button>
							</Flex>

							<TextInput
								label="Nombre de la carrera"
								value={nombre}
								onChange={(e) => {
									const nombre = e.currentTarget.value;
									setNombre(nombre);
								}}
							/>

							<Paper shadow="sm" withBorder p="md" bg={"var(--mantine-color-dark-6)"}>
								<Stack gap="md">
									<Title order={4}>Plan de estudios</Title>
									<Accordion
										variant="separated"
										classNames={styles}
										chevronPosition="left"
										value={activeYear}
										onChange={(year) => setActiveYear(year)}
									>
										<DndContext
											/* onDragStart={(event) => setActiveId(event?.active?.id)} */
											onDragEnd={(event) => {
												if (event?.active?.id !== event?.over?.id) {
													const dragIndex = yearsOrder.findIndex(
														(value) => value === event?.active?.id
													);
													const hoverIndex = yearsOrder.findIndex(
														(value) => value === event?.over?.id
													);

													const newItems = arrayMove(yearsOrder, dragIndex, hoverIndex);

													setYearsOrder(newItems);

													setPlan((plan) => {
														return newItems.map(
															(id) => plan.find((año) => año.id === id) as FormPlan[0]
														);
													});
												}
											}}
										>
											<SortableContext items={yearsOrder} strategy={verticalListSortingStrategy}>
												{plan.map((año, i) => {
													return (
														<AccordioYearItem
															key={"año-" + año.id}
															año={año}
															i={i}
															nombresWithoutDuplicates={nombresWithoutDuplicates}
															plan={plan}
															setPlan={setPlan}
															updateNombreMateria={updateNombreMateria}
															isOpened={activeYear === año.id}
														/>
													);
												})}
											</SortableContext>
										</DndContext>
									</Accordion>

									<Button
										fullWidth
										color="blue"
										onClick={() => {
											setPlan((plan) => {
												plan.push({
													id: Math.random().toString(36).substr(2, 9),
													nombre: "Nuevo año",
													materias: [{ ...nuevaMateria }],
												});
												return [...plan];
											});
										}}
									>
										Agregar año
									</Button>
								</Stack>
							</Paper>

							<Button color="grape" fullWidth onClick={createPlan}>
								Exportar plan
							</Button>

							{isSmallScreen && (
								<iframe
									src={window.location.origin + "?preview&preview-name=" + nombre}
									scrolling=""
									width="100%"
									height="400px"
									className={styles.preview}
								></iframe>
							)}
						</Stack>
					</Paper>
				</Container>
				{!isSmallScreen && (
					<iframe
						src={window.location.origin + "?preview&preview-name=" + nombre}
						scrolling=""
						width="100%"
						height="400px"
						className={styles.preview}
					></iframe>
				)}
			</Flex>
		</>
	);
}

import { CSS } from "@dnd-kit/utilities";
import QRCode from "react-qr-code";

const AccordioYearItem = ({
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

	const style = {
		transition,
		transform: CSS.Transform.toString(transform),
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

					{isOpened &&
						año.materias.map((item, materiaIndex) => {
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
								<Paper
									shadow="xs"
									p="lg"
									withBorder
									bg={"var(--mantine-color-dark-6)"}
									key={"materia-" + materiaIndex}
								>
									<Flex align="center" justify="space-between" mb="md">
										<Title order={4}>{item.label}</Title>
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
													updateNombreMateria(i, materiaIndex, nombre);
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
														plan[i].materias[materiaIndex].cuatrimestre = cuatrimestre;
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
															plan[i].materias[materiaIndex].tituloIntermedio = tituloIntermedio;
															return [...plan];
														});
													}}
												/>
											</Box>
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
															plan[i].materias[materiaIndex].requires = [...new Set(newValues)];
															return [...plan];
														});
													} else {
														setPlan((plan) => {
															plan[i].materias[materiaIndex].requires = value;
															return [...plan];
														});
													}
												}}
												withCheckIcon={false}
											/>
										</Grid.Col>
									</Grid>
								</Paper>
							);
						})}

					<Button
						color="orange"
						onClick={() => {
							setPlan((plan) => {
								plan[i].materias.push({ ...nuevaMateria });
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
