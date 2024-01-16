import { Handle, NodeProps, Position } from "react-flow-renderer";

function CourseNode({ data, id }: NodeProps) {
	return (
		<>
			{data.hasLeft ? <Handle type="target" position={Position.Left} /> : null}
			<div
				style={{
					filter: data.enabled ? "grayscale(0)" : "grayscale(0.6) brightness(0.8)",
					width: "160px",
					minHeight: "40px",
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
				}}
			>
				{data.label}
				{data.enabled && (
					<input
						className="nodrag"
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
