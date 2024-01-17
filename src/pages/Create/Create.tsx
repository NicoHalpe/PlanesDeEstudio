import React, { useEffect, useState } from "react";
import {
	Accordion,
	AccordionControlProps,
	ActionIcon,
	Box,
	Button,
	Center,
	Checkbox,
	ColorInput,
	Container,
	Flex,
	Grid,
	Modal,
	MultiSelect,
	Paper,
	Select,
	Stack,
	TextInput,
	Title,
	Tooltip,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

import styles from "./Create.module.css";
import { CodeHighlight } from "@mantine/code-highlight";
import { FormPlan, RawMateria, RawPlan } from "../../types/Plan";
import formatPlan from "../../utils/formatPlan";
import parsePlan from "../../utils/parsePlan";
import { useLocalStorage, useMediaQuery } from "@mantine/hooks";
import { defaultPlans } from "../../constants";

type Props = {};

const nuevaMateria = {
	label: "Nueva materia",
	tituloIntermedio: false,
	cuatrimestre: 1,
	requires: [],
};

function AccordionControl(
	props: AccordionControlProps & { onIconClick: () => void; showIcon: boolean }
) {
	return (
		<Center>
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

	const [nombre, setNombre] = React.useState(
		savedPlans.length ? savedPlans[0].name : "Nueva carrera"
	);
	const [plan, setPlan] = React.useState<FormPlan>(
		savedPlans.length
			? formatPlan(savedPlans[0].plan)
			: [
					{
						nombre: "Primer año",
						materias: [{ ...nuevaMateria }],
					},
			  ]
	);

	const [modalOpened, setModalOpened] = React.useState(false);

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

		setModalOpened(true);
	};

	useEffect(() => {
		const parsedPlan = parsePlan(nombre, plan);

		const updatedPlans = savedPlans.map((plan: { name: string; plan: RawPlan }) => {
			if (plan.name === nombre) {
				return parsedPlan;
			}
			return plan;
		});

		setSavedPlans(updatedPlans);
	}, [plan, nombre]);

	const isSmallScreen = useMediaQuery("(max-width: 1250px)");

	return (
		<>
			<Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={nombre} size="xl">
				<CodeHighlight language="json" code={JSON.stringify(parsePlan(nombre, plan), null, 4)} />
			</Modal>
			<Flex gap={"0"} className={styles.fullWrapper}>
				<Container size="md" p="xl" ml={isSmallScreen ? undefined : "0"} w={"100%"} h={"100%"}>
					<Flex align="end" gap="sm" w="100%" mb={"sm"}>
						{savedPlans && (
							<Select
								w={"100%"}
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
							w={"150"}
							onClick={() => {
								setNombre("Nueva carrera");
								setPlan([
									{
										nombre: "Primer año",
										materias: [{ ...nuevaMateria }],
									},
								]);
								setSavedPlans(() => {
									return [
										...savedPlans,
										{
											...parsePlan("Nueva carrera", [
												{
													nombre: "Primer año",
													materias: [{ ...nuevaMateria }],
												},
											]),
										},
									];
								});
							}}
						>
							Crear plan
						</Button>
					</Flex>
					<Paper shadow="sm" withBorder p="xl">
						<Stack>
							<Flex align="center" justify="space-between">
								<Title order={2}>{nombre}</Title>
								<Button
									color="red"
									variant="outline"
									onClick={() => {
										const newSavedPlans = savedPlans.filter((plan) => plan.name !== nombre);
										setSavedPlans(newSavedPlans);
										setNombre(newSavedPlans[0].name);
										setPlan(formatPlan(newSavedPlans[0].plan));
									}}
								>
									Eliminar carrera
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
									<Accordion variant="separated" classNames={styles} chevronPosition="left">
										{plan.map((año, i) => {
											return (
												<Accordion.Item value={i.toString()} key={i}>
													<AccordionControl
														showIcon={plan.length > 1}
														onIconClick={() => {
															setPlan((plan) => {
																plan.splice(i, 1);
																return [...plan];
															});
														}}
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

															{año.materias.map((item, materiaIndex) => {
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
																						setPlan((plan) => {
																							plan[i].materias.splice(
																								plan[i].materias.indexOf(item),
																								1
																							);
																							return [...plan];
																						});
																					}}
																				>
																					<IconTrash
																						style={{ width: "70%", height: "70%" }}
																						stroke={1.5}
																					/>
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
																						{ value: "1", label: "1" },
																						{ value: "2", label: "2" },
																					]}
																					onChange={(value) => {
																						const cuatrimestre = parseInt(value || "1");
																						setPlan((plan) => {
																							plan[i].materias[materiaIndex].cuatrimestre =
																								cuatrimestre;
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
																								plan[i].materias[materiaIndex].tituloIntermedio =
																									tituloIntermedio;
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
																					data={grouped}
																					onChange={(value) => {
																						if (!value) return;
																						const valueWithCompleto = value.find((v) =>
																							v.includes(" (Completo)")
																						);
																						if (valueWithCompleto) {
																							const newValues = value.map((v) =>
																								v.replace(" (Completo)", "")
																							);
																							setPlan((plan) => {
																								plan[i].materias[materiaIndex].requires = [
																									...new Set(newValues),
																								];
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
										})}
									</Accordion>

									<Button
										fullWidth
										color="blue"
										onClick={() => {
											setPlan((plan) => {
												plan.push({
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

							<Flex gap={"md"}>
								<Button color="grape" fullWidth onClick={createPlan}>
									Exportar plan
								</Button>

								<Tooltip label="Próximamente" position="bottom">
									<Button color="pink" fullWidth disabled>
										Importar un plan
									</Button>
								</Tooltip>
							</Flex>

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
