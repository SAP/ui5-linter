import {
	ChangeAction,
	type ImportRequests,
	type ChangeSet,
} from "../autofix.js";

export default function generateSolutionCodeReplacer(importRequests: ImportRequests, changeSet: ChangeSet[]) {
	for (const [, {nodeInfos}] of importRequests) {
		nodeInfos.forEach((nodeInfo) => {
			if (!("exportCodeToBeUsed" in nodeInfo) || !nodeInfo.exportCodeToBeUsed) {
				return;
			}
			const {node, exportCodeToBeUsed} = nodeInfo;

			const value = typeof exportCodeToBeUsed === "string" ?
				exportCodeToBeUsed :
				exportCodeToBeUsed.args?.reduce((acc, arg, index) => {
					return acc?.replace(`$${index + 1}`, arg);
				}, exportCodeToBeUsed.name ?? "") ?? exportCodeToBeUsed.name;

			const callNode = node; // TODO: Check if this is correct
			changeSet.push({
				action: ChangeAction.REPLACE,
				start: callNode?.getStart() ?? 0,
				end: callNode?.getEnd() ?? 0,
				value,
			});
		});
	}
}
