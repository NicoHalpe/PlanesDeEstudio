import { IconExternalLink } from "@tabler/icons-react";
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
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
						width: "100%",
						height: "100%",
						gap: 3,
					}}
				>
					<span
						style={{
							lineHeight: "1.2",
							overflow: "hidden",
							textOverflow: "ellipsis",
							maxHeight: "2.4em",
							display: "-webkit-box",
							WebkitLineClamp: 2,
							WebkitBoxOrient: "vertical",
						}}
					>
						{data.label}
					</span>
					<span>{data.weekHours ? `(${data.weekHours}hs)` : ""}</span>
				</div>
				{data.enabled && (
					<input
						className="noclick"
						type="checkbox"
						onChange={(e) => data.onCheck?.(e, id)}
						checked={data.done}
						style={{
							position: "absolute",
							left: 10,
							top: 10,
							scale: "1.5",
						}}
					/>
				)}
				{data.externalLink && (
					<a
						href={data.externalLink}
						target="_blank"
						className="external-link"
						style={{
							position: "absolute",
							right: 9,
							top: 9,
							height: 22,
							width: 22,
							display: "grid",
							placeItems: "center",
							borderRadius: "2px",
							color: "#000",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<IconExternalLink size={20} />
					</a>
				)}
			</div>
			{data.hasRight ? <Handle type="source" position={Position.Right} /> : null}
		</>
	);
}

export default CourseNode;
