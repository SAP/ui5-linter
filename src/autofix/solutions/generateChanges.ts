import ts from "typescript";
import type {RawLintMessage} from "../../linter/LinterContext.js";
import {MESSAGE} from "../../linter/messages.js";
import {
	Position,
	type ChangeSet,
	type ExistingModuleDeclarationInfo,
} from "../autofix.js";
import {collectIdentifiers, matchPropertyAccessExpression} from "../utils.js";
import parseModuleDeclaration from "../../linter/ui5Types/amdTranspiler/parseModuleDeclaration.js";
import parseRequire from "../../linter/ui5Types/amdTranspiler/parseRequire.js";
import {getLogger} from "@ui5/logger";
import Fix from "../../linter/ui5Types/fixHints/Fix.js";
import {addDependencies, Dependencies, getDependencies, removeDependencies} from "./amdImports.js";
import {resolveUniqueName} from "../../linter/ui5Types/utils/utils.js";

const log = getLogger("linter:autofix:NoGlobals");

interface NodeSearchInfo {
	position: Position;
	fix: Fix;
	nodeTypes: ts.SyntaxKind[];
}

interface FixRange {
	start: number;
	end: number;
	fix: Fix;
}

interface DependencyRequest {
	moduleName: string;
	preferredIdentifier: string;
	position: number;
	fix: Fix;
}

interface DependencyDeclarations {
	moduleDeclarationInfo: ExistingModuleDeclarationInfo;
	start: number;
	end: number;
	dependencies: Dependencies;
}

export default function generateChanges(
	resourcePath: string, checker: ts.TypeChecker, sourceFile: ts.SourceFile, content: string,
	messages: RawLintMessage<MESSAGE.NO_GLOBALS | MESSAGE.DEPRECATED_API_ACCESS | MESSAGE.DEPRECATED_FUNCTION_CALL>[],
	changeSets: ChangeSet[]
) {
	const nodeSearchInfo = new Set<NodeSearchInfo>();
	// Collect all fixes from the messages
	for (const msg of messages) {
		if (!(msg.fixHints instanceof Fix)) {
			continue;
		}
		// Map "position for search" (calculated from the transpiled AST using the source map) to the absolute
		// position in the source file
		const fixStart = msg.fixHints.getPositionForSearch();
		// TypeScript lines and columns are 0-based
		const line = fixStart.line - 1;
		const column = fixStart.column - 1;
		const pos = sourceFile.getPositionOfLineAndCharacter(line, column);

		let nodeTypes = msg.fixHints.getNodeTypeForSearch();
		if (!Array.isArray(nodeTypes)) {
			nodeTypes = [nodeTypes];
		}
		nodeSearchInfo.add({
			fix: msg.fixHints,
			nodeTypes,
			position: {
				line,
				column,
				pos,
			},
		});
	}

	const moduleDeclarations = new Map<ts.CallExpression, ExistingModuleDeclarationInfo>();

	function visitNode(node: ts.Node) {
		for (const nodeInfo of nodeSearchInfo) {
			// For each fix, search for a match for requested position and node type until it acquires a context
			// (meaning that it found its node in the source file)
			if (nodeInfo.fix.hasSourceFileContext()) {
				continue;
			}
			if (node.getStart() === nodeInfo.position.pos && nodeInfo.nodeTypes.includes(node.kind)) {
				nodeInfo.fix.setSourceFileContext(node, nodeInfo.position.pos, sourceFile);
			}
		}
		// Also collect all module declarations (define and require calls)
		if (ts.isCallExpression(node) &&
			ts.isPropertyAccessExpression(node.expression)) {
			if (matchPropertyAccessExpression(node.expression, "sap.ui.define")) {
				try {
					moduleDeclarations.set(node, {
						moduleDeclaration: parseModuleDeclaration(node.arguments, checker),
						importRequests: new Map(),
						additionalNodeInfos: [],
					});
				} catch (err) {
					const errorMessage = err instanceof Error ? err.message : String(err);
					log.verbose(`Failed to parse sap.ui.define ` +
						`call in ${sourceFile.fileName}: ${errorMessage}`);
				}
			} else if (matchPropertyAccessExpression(node.expression, "sap.ui.require")) {
				try {
					const requireExpression = parseRequire(node.arguments, checker);
					// Only handle async require calls, not sap.ui.require probing
					if (requireExpression.async) {
						moduleDeclarations.set(node, {
							moduleDeclaration: requireExpression,
							importRequests: new Map(),
							additionalNodeInfos: [],
						});
					}
				} catch (err) {
					const errorMessage = err instanceof Error ? err.message : String(err);
					log.verbose(`Failed to parse sap.ui.require ` +
						`call in ${sourceFile.fileName}: ${errorMessage}`);
				}
			}
		}
		ts.forEachChild(node, visitNode);
	}
	ts.forEachChild(sourceFile, visitNode);

	const fixRanges: FixRange[] = [];
	for (const nodeInfo of nodeSearchInfo) {
		const ranges = nodeInfo.fix.getModificationRanges();
		if (Array.isArray(ranges)) {
			for (const range of ranges) {
				fixRanges.push({
					start: range.start,
					end: range.end,
					fix: nodeInfo.fix,
				});
			}
		} else {
			const {start, end} = ranges;
			fixRanges.push({
				start,
				end,
				fix: nodeInfo.fix,
			});
		}
	}

	const conflicts = findRangeConflicts(fixRanges);
	const dependencyRequests = new Set<DependencyRequest>();
	for (const nodeInfo of nodeSearchInfo) {
		if (conflicts.includes(nodeInfo.fix)) {
			nodeSearchInfo.delete(nodeInfo);
			continue;
		}
		// Collect new dependencies
		const newDependencies = nodeInfo.fix.getNewModuleDependencies();
		if (Array.isArray(newDependencies)) {
			for (const {moduleName, preferredIdentifier, position} of newDependencies) {
				dependencyRequests.add({
					moduleName,
					preferredIdentifier,
					position,
					fix: nodeInfo.fix,
				});
			}
		} else {
			const {moduleName, preferredIdentifier, position} = newDependencies;
			dependencyRequests.add({
				moduleName,
				preferredIdentifier,
				position,
				fix: nodeInfo.fix,
			});
		}
	}

	const dependencyDeclarations: DependencyDeclarations[] = [];
	for (const [moduleDeclaration, moduleDeclarationInfo] of moduleDeclarations) {
		const deps = getDependencies(moduleDeclarationInfo.moduleDeclaration, resourcePath);
		dependencyDeclarations.push({
			moduleDeclarationInfo,
			start: moduleDeclaration.getStart(),
			end: moduleDeclaration.getEnd(),
			dependencies: deps,
		});
	}

	// Collect all identifiers in the source file to ensure unique names when adding imports
	const identifiers = collectIdentifiers(sourceFile);

	// Sort dependency requests into declarations
	mergeDependencyRequests(dependencyRequests, dependencyDeclarations, identifiers);

	// Create changes for new and removed dependencies
	for (const [defineCall, moduleDeclarationInfo] of moduleDeclarations) {
		// TODO: Find a better way to define modules for removal
		const moduleRemovals = new Set(["sap/base/strings/NormalizePolyfill", "jquery.sap.unicode"]);

		// Remove dependencies from the existing module declaration
		removeDependencies(moduleRemovals,
			moduleDeclarationInfo, changeSets, resourcePath, identifiers);

		// Resolve dependencies for the module declaration
		addDependencies(defineCall, moduleDeclarationInfo, changeSets, resourcePath, moduleRemovals);
	}

	for (const nodeInfo of nodeSearchInfo) {
		const changes = nodeInfo.fix.getChanges();
		if (Array.isArray(changes)) {
			for (const change of changes) {
				changeSets.push(change);
			}
		} else {
			changeSets.push(changes);
		}
	}
}

function findRangeConflicts(fixRanges: FixRange[]) {
	if (fixRanges.length === 0) return [];

	// Sort fixRanges by start position; if start is the same, sort by end position
	fixRanges.sort((a, b) => a.start - b.start || a.end - b.end);

	const overlaps = [];
	let currentEnd = fixRanges[0].end;

	for (let i = 1; i < fixRanges.length; i++) {
		const fixRange = fixRanges[i];

		if (fixRange.start < currentEnd) {
			overlaps.push(fixRange.fix);
		}

		currentEnd = Math.max(currentEnd, fixRange.end);
	}

	return overlaps;
}

function mergeDependencyRequests(dependencyRequests: Set<DependencyRequest>,
	dependencyDeclarations: DependencyDeclarations[], identifiers: Set<string>) {
	// Step 1.) Try to fulfill dependency requests using the existing dependency declarations
	for (const dependencyRequest of dependencyRequests) {
		const {moduleName, position, fix} = dependencyRequest;
		// Dependency declarations are sorted in order of appearance in the source file
		// Start the search from the end to visit the most specific ones first
		for (let i = dependencyDeclarations.length - 1; i >= 0; i--) {
			const decl = dependencyDeclarations[i];
			const depIdentifier = decl.dependencies.get(moduleName);
			if (depIdentifier && typeof depIdentifier === "string" &&
				decl.start <= position && decl.end >= position) {
				// Dependency request can be fulfilled directly
				fix.setIdentifier(depIdentifier, moduleName);
				dependencyRequests.delete(dependencyRequest); // Request fulfilled
				break;
			}
		}
	}

	// Step 2.) Build a list of potential additions to existing dependency declarations
	// that would fulfill all remaining requests
	const newDependencyDeclarations = new Map<DependencyDeclarations, DependencyRequest[]>();
	for (const dependencyRequest of dependencyRequests) {
		// Dependency declarations are sorted in order of appearance in the source file
		// Start the search from the end to visit the most specific ones first
		for (let i = dependencyDeclarations.length - 1; i >= 0; i--) {
			const decl = dependencyDeclarations[i];
			if (decl.start <= dependencyRequest.position && decl.end >= dependencyRequest.position) {
				if (newDependencyDeclarations.has(decl)) {
					// Add request to existing declaration
					newDependencyDeclarations.get(decl)!.push(dependencyRequest);
					break;
				} else {
					newDependencyDeclarations.set(decl, [dependencyRequest]);
				}
				break;
			}
		}
	}

	// Step 3.) Build a hierarchy of the dependency declarations in order to traverse it
	interface DependencyDeclarationsNode {
		declaration: DependencyDeclarations;
		children: DependencyDeclarationsNode[];
		newDependencies?: DependencyRequest[];
	}

	const mappedDeclarations = new Set<DependencyDeclarations>();
	function createDependencyDeclarationsNode(decl: DependencyDeclarations): DependencyDeclarationsNode | undefined {
		if (mappedDeclarations.has(decl)) {
			// A node for this declaration has already been created and added to the corresponding parent
			// This check prevents a declaration from being added to multiple parents if the positions overlap
			// The correct parent is always the first one that has visited this node.
			return;
		}
		mappedDeclarations.add(decl);
		const children = [];
		for (const otherDecl of dependencyDeclarations) {
			if (decl.start <= otherDecl.start && decl.end >= otherDecl.end) {
				// decl contains otherDecl (might be direct or indirect child)
				const child = createDependencyDeclarationsNode(otherDecl);
				if (!child) {
					// Indirect child, ignore
					continue;
				}
				children.push(child);
			}
		}
		return {
			declaration: decl,
			children,
		};
	}

	const moduleNameToDeclToRequests = new Map<string, [DependencyDeclarations, DependencyRequest[]]>();

	// Function to traverse and count moduleNames
	function assignDependencyRequests(node: DependencyDeclarationsNode): string[] {
		const dependencyModuleNames: string[] = [];
		// Traverse depth-first to collect all dependency requests
		const depsPerChild = node.children.map((child) => {
			return assignDependencyRequests(child);
		});

		// Check whether there is a request for this dependency declaration
		const dependencyRequests = newDependencyDeclarations.get(node.declaration);
		if (dependencyRequests) {
			for (const dependencyRequest of dependencyRequests) {
				const moduleName = dependencyRequest.moduleName;
				if (moduleNameToDeclToRequests.has(moduleName)) {
					const existingRequests = moduleNameToDeclToRequests.get(moduleName)!;
					existingRequests[1].push(dependencyRequest);
				} else {
					moduleNameToDeclToRequests.set(moduleName, [node.declaration, [dependencyRequest]]);
				}

				if (!dependencyModuleNames.includes(moduleName)) {
					dependencyModuleNames.push(moduleName);
				}
			}
		}

		if (depsPerChild.length > 0) {
			// Check if multiple children have requests for the same module
			const moduleNameOccurences = new Map<string, number>();
			for (const moduleName of dependencyModuleNames) {
				moduleNameOccurences.set(moduleName, 1);
			}
			for (const childDeps of depsPerChild) {
				for (const moduleName of childDeps) {
					const count = moduleNameOccurences.get(moduleName) ?? 0;
					moduleNameOccurences.set(moduleName, count + 1);
				}
			}
			for (const [moduleName, count] of moduleNameOccurences) {
				if (count > 1) {
					// Multiple children have requests for the same module
					// Assign all requests to this dependency declarations
					moduleNameToDeclToRequests.get(moduleName)![0] = node.declaration;
				}
			}
		}
		return dependencyModuleNames;
	}

	// Step 4.) Merge new dependencies into existing dependency declarations
	const rootDependencyDeclarations = createDependencyDeclarationsNode(dependencyDeclarations[0])!;
	assignDependencyRequests(rootDependencyDeclarations);

	for (const [moduleName, [decl, requests]] of moduleNameToDeclToRequests) {
		// Get preferred identifier unless it's already in use
		let identifier;
		for (const request of requests) {
			if (!identifiers.has(request.preferredIdentifier)) {
				identifier = request.preferredIdentifier;
				break;
			}
		}
		// Create a unique name if the preferred identifier is already in use
		// Use the first preferred identifier
		identifier ??= resolveUniqueName(moduleName, identifiers);

		identifiers.add(identifier);
		decl.moduleDeclarationInfo.importRequests.set(moduleName, {identifier});

		for (const request of requests) {
			// Set the identifier for the fix
			request.fix.setIdentifier(identifier, moduleName);
		}
	}
}
