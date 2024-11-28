import "./Plan.css";
import { useEffect, useState, ReactElement, ComponentType } from "react";
import ReactFlow, {
	Controls,
	ControlButton,
	Background,
	useNodesState,
	useEdgesState,
	NodeProps,
	NodeMouseHandler,
} from "react-flow-renderer";
import CourseNode from "../../components/CourseNode";
import YearNode from "../../components/YearNode";
import { parsePlans, defaultPlans } from "../../constants";
import { toPng } from "html-to-image";
import { Materia, Plan, Year } from "../../types/Plan";
import {
	ActionIcon,
	Box,
	Select,
	Text,
} from "@mantine/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLocalStorage } from "@mantine/hooks";
import { IconPencil, IconReload } from "@tabler/icons-react";
import { modals } from "@mantine/modals";

declare global {
	interface Window {
		preventFitView: boolean;
	}
}

const nodeTypes: {
	[key: string]: ComponentType<NodeProps>;
} = { course: CourseNode, year: YearNode };

interface ReactFlowInstance {
	fitView: (params: { duration: number; padding: number; center: boolean }) => void;
}

const onInit = (
	reactFlowInstance: ReactFlowInstance,
	setReactFlowInstance: (instance: ReactFlowInstance) => void
) => {
	setReactFlowInstance(reactFlowInstance);
	const backgroundPattern = document.querySelector(".reactFlowBackgroundPattern") as HTMLElement;
	backgroundPattern.onclick = () => {
		console.log("background clicked");
	};
};

function PlanPage(): ReactElement {
	let [selectedPlanName, setSelectedPlanName] = useLocalStorage({
		key: "selectedPlan",
		defaultValue: "Licenciatura en Ciencias de Datos",
		serialize(value) {
			return JSON.stringify(value);
		},
		deserialize(value) {
			return value ? JSON.parse(value) : "Licenciatura en Ciencias de Datos";
		},
		getInitialValueInEffect: false,
	});

	let [searchParams, setSearchParams] = useSearchParams();

	const isPreview = searchParams.get("preview") !== null;

	const previewPlanName = searchParams.get("preview-name");

	const planName = previewPlanName || selectedPlanName;

	const [localPlans, setLocalPlans] = useLocalStorage({
		key: "plans",
		defaultValue: defaultPlans,
		serialize(value) {
			return JSON.stringify(value);
		},
		deserialize(value) {
			return value ? JSON.parse(value) : defaultPlans;
		},
		getInitialValueInEffect: false,
	});

	const [localCheckedNodes, setLocalCheckedNodes] = useLocalStorage({
		key: "checkedNodes",
		defaultValue: {},
		serialize(value) {
			return JSON.stringify(value);
		},
		deserialize(value) {
			return value ? JSON.parse(value) : {};
		},
		getInitialValueInEffect: false,
	});

	const parsedPlans = parsePlans(localPlans, localCheckedNodes);

	const selectedPlan = parsedPlans.find((plan) => plan.name === planName) || parsedPlans[0];

	useEffect(() => {
		document.title = selectedPlan.name + " - Plan de estudios";
	}, [selectedPlan]);

	const initialNodes = selectedPlan.plan;
	const initialEdges = selectedPlan.edges;
	const years = selectedPlan.years;

	/* const rawCheckedNodes = window.localStorage.getItem("checkedNodes");
	const checkedNodes: string[] | null = rawCheckedNodes
		? JSON.parse(rawCheckedNodes)[selectedPlan.name]
		: null;

	if (checkedNodes) {
		initialNodes.forEach((node) => {
			if (checkedNodes.includes(node.id)) {
				node.data.done = true;
			} else {
				node.data.done = false;
			}
		});
	} else {
		initialNodes.forEach((node) => {
			node.data.done = false;
		});
	} */

	const lefts: string[] = [];
	const rights: string[] = [];
	const full_edges: [string, string][] = [];
	initialEdges.forEach((e) => {
		full_edges.push([e.source, e.target]);
		lefts.push(e.target);
		rights.push(e.source);
	});

	const ids: string[] = [];
	initialNodes.forEach((n) => {
		ids.push(n.id);
		if (lefts.includes(n.id)) {
			n.data.hasLeft = true;
		}
		if (rights.includes(n.id)) {
			n.data.hasRight = true;
		}
	});

	initialNodes.forEach((n) => {
		if (!n.data.done) {
			n.data.enabled = false;
			if (backward_path(n.id, full_edges).length === 0) {
				n.data.enabled = true;
			}
			if (n.data.hasLeft) {
				if (backward_path(n.id, full_edges).every((id) => course_by_id(id)?.data.done)) {
					n.data.enabled = true;
				}
			}
		} else {
			n.data.enabled = true;
		}
	});

	interface CorrAmm {
		[id: string]: number;
	}

	let corrAmm: CorrAmm = {};
	let corrAmmLis: [string, number][] = [];
	ids.forEach((id) => {
		const thisPath = path(id).full;
		corrAmm[id] = thisPath.length - 1;
		corrAmmLis.push([id, thisPath.length - 1]);
	});
	corrAmmLis = corrAmmLis.sort((a, b) => b[1] - a[1]);

	function onlyUnique(value: string, index: number, self: string[]): boolean {
		return self.indexOf(value) === index;
	}

	function forward_path(n: string, edges: [string, string][]): string[] {
		const nodes: string[] = [];
		edges.forEach(function (edge) {
			if (edge[0] === n) {
				nodes.push(edge[1]);
				forward_path(edge[1], edges).forEach(function (node) {
					nodes.push(node);
				});
			}
		});
		return nodes.filter(onlyUnique);
	}

	function backward_path(n: string, edges: [string, string][]): string[] {
		const nodes: string[] = [];
		edges.forEach(function (edge) {
			if (edge[1] === n) {
				nodes.push(edge[0]);
				backward_path(edge[0], edges).forEach(function (node) {
					nodes.push(node);
				});
			}
		});
		return nodes.filter(onlyUnique);
	}

	function path(n: string): { forward: string[]; backward: string[]; full: string[] } {
		const forward = forward_path(n, full_edges);
		const backward = backward_path(n, full_edges);
		return {
			forward: forward,
			backward: backward,
			full: forward.concat(backward).concat([n]),
		};
	}

	function filterNodesByID(id: string): Materia[] {
		const nodes: Materia[] = [];
		initialNodes.forEach(function (node) {
			if (path(id).full.includes(node.id)) {
				nodes.push(node);
			}
		});
		return nodes;
	}

	function filterNodesByYear(year: string): Materia[] {
		const nodes: Materia[] = [];
		initialNodes.forEach(function (node) {
			if (node.data.year === year) {
				nodes.push(node);
			}
		});
		return nodes;
	}

	function filterNodesByBackground(background: string): Materia[] {
		const nodes: Materia[] = [];
		initialNodes.forEach(function (node) {
			if (node.data.background === background) {
				nodes.push(node);
			}
		});

		nodes.forEach((node) => {
			const backward = backward_path(node.id, full_edges);
			backward.forEach((id) => {
				const course = course_by_id(id);
				if (course && !nodes.includes(course)) {
					nodes.push(course);
				}
			});
		});

		return nodes;
	}

	function course_by_id(id: string): Materia | null {
		let course: Materia | null = null;
		initialNodes.forEach(function (node) {
			if (node.id === id) {
				course = node;
			}
		});
		return course;
	}

	function downloadImage(dataUrl: string): void {
		const a = document.createElement("a");
		a.setAttribute("download", "Correlativas_LCD.png");
		a.setAttribute("href", dataUrl);
		a.click();
	}

	const screenshot = (): void => {
		toPng(document.querySelector(".react-flow") as HTMLElement, {
			filter: (node) => {
				if (
					node?.classList?.contains("react-flow__minimap") ||
					node?.classList?.contains("react-flow__controls")
				) {
					return false;
				}

				return true;
			},
		}).then(downloadImage);
	};

	const getNodeYear = (year: string): Year => {
		return years.filter((y) => y.id === year)[0];
	};

	const [nodes, setNodes, onNodesChange] = useNodesState(years.concat(initialNodes));
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	useEffect(() => {
		setNodes(years.concat(initialNodes));
		setEdges(initialEdges);
	}, [localPlans, selectedPlanName, localCheckedNodes]);

	const [pathview, setPathview] = useState(true);
	const [label, setLabel] = useState("Clickea en una materia para ver todas sus correlativas");
	const [preLabel, setPreLabel] = useState("");
	const [clickedCourse, setClickedCourse] = useState("");

	const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

	const updateNodes = (id: string | null, reducedView: boolean): void => {
		setPathview(reducedView);
		if (reducedView) {
			setNodes(filterNodesByID(id as string));
		} else {
			setNodes(years.concat(initialNodes));
		}
		setEdges(initialEdges);
	};

	const nodeClick: NodeMouseHandler = (event, element): void => {
		if (element.type === "course") {
			if ((event.target as HTMLElement).classList.contains("noclick")) {
				window.preventFitView = true;
				return;
			}
			if (clickedCourse !== element.id) {
				setClickedCourse(element.id);
				updateNodes(element.id, true);
				setClickedCourse(element.id);
				if (!pathview) {
					setLabel("Clickea en una materia para ver todas sus correlativas");
				} else {
					setLabel("Clickea en cualquier materia para resetear vista");
				}
			} else {
				reset();
				setClickedCourse("");
			}
		} else if (element.type === "year") {
			setNodes([getNodeYear(element.id)].concat(filterNodesByYear(element.id) as Plan));
			setEdges(initialEdges);
			setLabel("Clickea en cualquier materia para resetear vista");
		}
	};

	const mapClick: React.MouseEventHandler<HTMLDivElement> = (e): void => {
		if ((e.target as HTMLElement).className === "react-flow__pane react-flow__container") {
			reset();
		}
	};

	const nodeMouseEnter: NodeMouseHandler = (_event, element): void => {
		setPreLabel(label);
		if (element.type === "year") {
			setLabel("Clickea en " + element.id + " para ver todas las materias de ese año");
			return;
		} else {
			if (element.id !== clickedCourse) {
				if (corrAmm[element.id] > 1) {
					setLabel(
						"Clickea en " +
							course_by_id(element.id)?.data.label +
							" para ver sus " +
							corrAmm[element.id] +
							" correlativas"
					);
				} else if (corrAmm[element.id] === 1) {
					setLabel(
						"Clickea en " + course_by_id(element.id)?.data.label + " para ver su correlativa"
					);
				} else {
					setLabel(course_by_id(element.id)?.data.label + " no tiene correlativas");
				}
			} else {
				if (corrAmm[element.id] > 1) {
					setLabel(
						course_by_id(element.id)?.data.label + " tiene " + corrAmm[element.id] + " correlativas"
					);
				} else if (corrAmm[element.id] === 1) {
					setLabel(course_by_id(element.id)?.data.label + " tiene 1 correlativa");
				} else if (corrAmm[element.id] === 0) {
					setLabel(course_by_id(element.id)?.data.label + " no tiene correlativas");
				} else {
					setLabel("Clickea en una materia para ver todas sus correlativas");
				}
			}
		}
	};

	const nodeMouseLeave: NodeMouseHandler = (): void => {
		setLabel("Clickea en una materia para ver todas sus correlativas");
	};

	const reset = (): void => {
		updateNodes(null, false);
		setLabel("Clickea en una materia para ver todas sus correlativas");
	};

	useEffect(() => {
		if (reactFlowInstance && !window.preventFitView) {
			reactFlowInstance.fitView({ duration: 800, padding: 0.1, center: true });
		}
		window.preventFitView = false;
	}, [nodes, reactFlowInstance]);

	const handleNodeCheck = (event: MouseEvent, id: string): void => {
		const course = course_by_id(id);
		if (!course) return;

		const checked = (event.target as HTMLInputElement).checked;

		course.data.done = checked;
		const thisPath = path(id).full;
		thisPath.forEach((id) => {
			const course = course_by_id(id);
			if (!course) return;
			if (!course.data.done) {
				course.data.enabled = false;
				if (backward_path(id, full_edges).length === 0) {
					course.data.enabled = true;
				}
				if (course.data.hasLeft) {
					if (backward_path(id, full_edges).every((id) => course_by_id(id)?.data.done)) {
						course.data.enabled = true;
					}
				}
			}
		});

		const newNodes = [...nodes];
		newNodes.map((node) => {
			if (node.id === id) {
				node.data.done = (event.target as HTMLInputElement).checked;
			}
			return node;
		});

		const nodesChecked = newNodes.filter((node) => node.type === "course" && node.data.done);
		let nodesCheckedIDs = nodesChecked.map((node) => node.id);

		setLocalCheckedNodes({
			...localCheckedNodes,
			[selectedPlan.name]: nodesCheckedIDs,
		});

		/* setNodes(newNodes); */
	};

	const navigate = useNavigate();

	return (
		<div className="App">
			<div className="label-wrapper">
				{!isPreview ? (
					<Box className="mantine select-wrapper">
						<Select
							w={"420px"}
							mb="sm"
							data={parsedPlans.map((plan) => plan.name)}
							value={selectedPlan.name}
							allowDeselect={false}
							onChange={(value) => {
								const plan = parsedPlans.find((plan) => plan.name === value);
								if (plan) {
									const selected = parsedPlans.find((plan) => plan.name === value);
									if (!selected) return;
									setSelectedPlanName(selected.name);
								}
							}}
						/>

						<ActionIcon
							size={"36px"}
							variant="default"
							onClick={() => {
								navigate("/create");
							}}
						>
							<IconPencil style={{ width: "60%", height: "60%" }} stroke={1} />
						</ActionIcon>

						<ActionIcon
							size={"36px"}
							variant="default"
							onClick={() => {
								modals.openConfirmModal({
									centered: true,
									title: <b>Restablecer planes</b>,
									children:
										"¿Estás seguro de que deseas restablecer los planes a los predeterminados?",
									labels: { cancel: "Cancelar", confirm: "Restablecer" },
									onConfirm: () => {
										setLocalPlans(defaultPlans);
									},
								});
							}}
						>
							<IconReload style={{ width: "60%", height: "60%" }} stroke={1} />
						</ActionIcon>
					</Box>
				) : (
					<Box className="mantine preview-wrapper">
						<Text size="sm">Preview: {planName}</Text>
					</Box>
				)}

				<div
					style={{
						backgroundColor: "#1E1E1E",
						padding: "2px",
						borderRadius: "5px",
						width: "auto",
						height: "auto",
						zIndex: 20,
						fontFamily: '"Inter", sans-serif',
					}}
				>
					{label}
				</div>
			</div>

			<div className="colorType-wrapper">
				<div
					className="colorType-container"
					onClick={() => {
						const backgroundColor = "rgb(241, 197, 152)";
						const nodes = filterNodesByBackground(backgroundColor);
						setNodes(nodes);
					}}
					onMouseOver={() => {
						setLabel("Clickea para ver las materias del Título intermedio");
					}}
				>
					<div
						className="colorCircle"
						style={{
							backgroundColor: "rgb(241, 197, 152)",
						}}
					/>
					<span className={"colorType"}>Título intermedio</span>
				</div>

				<div
					className="colorType-container"
					onClick={() => {
						reset();
					}}
					onMouseOver={() => {
						setLabel("Clickea para ver las materias del Título completo");
					}}
				>
					<div
						className="colorCircle"
						style={{
							backgroundColor: "rgb(199, 214, 236)",
						}}
					/>
					<span className={"colorType"}>Título completo</span>
				</div>
			</div>

			<ReactFlow
				nodes={[
					...nodes.map((node) => {
						if (node.type === "course") {
							return {
								...node,
								data: {
									...node.data,
									onCheck: handleNodeCheck,
								},
							};
						}
						return node;
					}),
				]}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				nodesDraggable={true}
				nodesConnectable={false}
				onInit={(instance) => onInit(instance, setReactFlowInstance)}
				fitView={true}
				attributionPosition="top-right"
				nodeTypes={nodeTypes}
				onClick={mapClick}
				onNodeClick={nodeClick}
				onNodeMouseEnter={nodeMouseEnter}
				onNodeMouseLeave={nodeMouseLeave}
				minZoom={0.1}
			>
				<Controls
					style={{
						color: "#4A4A4A",
						backgroundColor: "#181818",
						borderRadius: "2px",
						padding: "5px",
						zIndex: 100,
					}}
					//onFitView={() => updateNodes(setNodes, setEdges, null, false, setPathview)}
					showInteractive={false}
				>
					<ControlButton
						onClick={reset}
						onMouseEnter={() => {
							setPreLabel(label);
							setLabel("Resetear vista");
						}}
						onMouseLeave={() => {
							setLabel(preLabel);
						}}
					>
						<>⌘</>
					</ControlButton>
					<ControlButton
						onClick={screenshot}
						style={{
							transform: "rotate(180deg)",
						}}
						onMouseEnter={() => {
							setPreLabel(label);
							setLabel("Descargar imagen");
						}}
						onMouseLeave={() => {
							setLabel(preLabel);
						}}
					>
						<>⏏︎</>
					</ControlButton>
				</Controls>
				<Background color="#aaa" gap={16} className="reactFlowBackgroundPattern" />
			</ReactFlow>
		</div>
	);
}

export default PlanPage;
