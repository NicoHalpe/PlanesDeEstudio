import React, { useEffect, useMemo, useState } from "react";
import {
	Accordion,
	Button,
	Container,
	FileInput,
	Flex,
	JsonInput,
	Modal,
	Paper,
	Select,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

import styles from "./Create.module.css";
import { CodeHighlight } from "@mantine/code-highlight";
import { FormPlan, RawMateria, RawPlan } from "../../types/Plan";
import formatPlan from "../../utils/formatPlan";
import parsePlan from "../../utils/parsePlan";
import { useLocalStorage, useMediaQuery } from "@mantine/hooks";
import { defaultPlans } from "../../constants";
import { modals } from "@mantine/modals";
import { DndContext } from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import AccordionYearItem from "../../components/AccordionYearItem";

type Props = {};

const nuevaMateria = {
	label: "Nueva materia",
	tituloIntermedio: false,
	cuatrimestre: 1,
	requires: [],
};

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
						materias: [{ ...nuevaMateria, id: Math.random().toString(36).substr(2, 9) }],
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
										materias: [{ ...nuevaMateria, id: Math.random().toString(36).substr(2, 9) }],
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
													materias: [{ ...nuevaMateria, id: Math.random().toString(36).substr(2, 9) }],
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
											onDragStart={(event) => setActiveYear(null)}
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
														<AccordionYearItem
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
													materias: [{ ...nuevaMateria, id: Math.random().toString(36).substr(2, 9) }],
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

