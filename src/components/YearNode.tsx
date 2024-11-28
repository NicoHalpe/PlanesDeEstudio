import { NodeProps } from "react-flow-renderer";
import { Materia } from "../types/Plan";

function YearNode({ data }: NodeProps) {
	return (
		<>
			<div
				className="nodrag"
				style={{
					width: "160px",
					minHeight: "40px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: 10,
					color: "#fff",
					borderRadius: 14,
					border: "0px solid #000",
					fontFamily: '"Inter", sans-serif',
					fontSize: "20px",
					gap: 20,
				}}
			>
				{data.materias.some((m: Materia) => m.data.enabled) && (
					<input
						className="noclick"
						type="checkbox"
						onChange={(e) =>
							data.materias.forEach((m: Materia) => {
								if (m.data.enabled) m.data.onCheck?.(e, m.id);
							})
						}
						checked={data.materias.every((m: Materia) => m.data.done)}
						style={{
							scale: "1.8",
						}}
						onClick={(e) => {
							window.preventFitView = true;
							e.stopPropagation();
						}}
					/>
				)}

				{data.label}
			</div>
		</>
	);
}

export default YearNode;
