import { useEffect } from "react";
import { Handle, NodeProps, Position, useUpdateNodeInternals } from "react-flow-renderer";

function CourseNode({ data, id }: NodeProps) {
	const updateNodeInternals = useUpdateNodeInternals();

	useEffect(() => {
		updateNodeInternals(id);
	}, [data.hasLeft, data.hasRight, id, updateNodeInternals]);

	return (
		<>
			{data.hasLeft ? <Handle type="target" position={Position.Left} /> : null}
			<div
				className="nodrag"
				style={{
					filter: data.enabled ? "grayscale(0)" : "grayscale(0.6) brightness(0.8)",
					width: data.cuatrimestre === 3 ? "410px" : "160px",
					minHeight: "40px",
					height: "60px",
					overflow: "hidden",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 10,
					padding: "10px 35px",
					color: data.foreground,
					background: data.background,
					borderRadius: 14,
					border: "1px solid #000",
					fontFamily: '"Inter", sans-serif',
					fontSize: "14px",
					cursor: "pointer",
				}}
			>
				<span>{data.label}</span>
				{data.enabled && (
					<input
						className="noclick"
						type="checkbox"
						onChange={(e) => data.onCheck?.(e, id)}
						checked={data.done}
						style={{
							position: "absolute",
							right: 10,
							top: 10,
							scale: "1.2",
						}}
					/>
				)}
			</div>
			{data.hasRight ? <Handle type="source" position={Position.Right} /> : null}
		</>
	);
}

export default CourseNode;
