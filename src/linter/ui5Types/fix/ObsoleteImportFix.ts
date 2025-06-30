import ts from "typescript";
import {PositionInfo} from "../../LinterContext.js";
import Fix from "./Fix.js";

export interface ObsoleteImportFixParams {
	moduleName: string;
};

export default class ObsoleteImportFix extends Fix {
	private sourcePosition: PositionInfo | undefined;

	constructor(private params: ObsoleteImportFixParams) {
		super();
	}

	visitLinterNode(node: ts.Node, sourcePosition: PositionInfo) {
		if (!ts.isImportDeclaration(node.parent) || !ts.isSourceFile(node.parent.parent)) {
			return false;
		}
		const sourceFile = node.parent.parent;
		const relevantIdentifiers = new Set<string>();
		sourceFile.forEachChild((childNode) => {
			if (!ts.isImportDeclaration(childNode)) {
				return;
			}
			if (childNode.moduleSpecifier &&
				ts.isStringLiteral(childNode.moduleSpecifier) &&
				childNode.moduleSpecifier.text === this.params.moduleName) {
				// We found the module import
				if (childNode.importClause?.namedBindings) {
					if (ts.isNamedImports(childNode.importClause.namedBindings)) {
						for (const element of childNode.importClause.namedBindings.elements) {
							relevantIdentifiers.add(element.name.text);
						}
					} else if (ts.isNamespaceImport(childNode.importClause.namedBindings)) {
						relevantIdentifiers.add(childNode.importClause.namedBindings.name.text);
					}
				} else if (childNode.importClause?.name) {
					// Default import
					relevantIdentifiers.add(childNode.importClause.name.text);
				}
			}
		});

		let identifierIsUsed = false;
		const findIdentifierUsage = (node: ts.Node) => {
			if (identifierIsUsed) {
				return;
			}
			if (ts.isIdentifier(node) && !ts.isImportClause(node.parent) &&
				relevantIdentifiers.has(node.text)) {
				identifierIsUsed = true;
				return;
			}
			ts.forEachChild(node, findIdentifierUsage);
		};
		ts.forEachChild(sourceFile, findIdentifierUsage);
		if (identifierIsUsed) {
			return false;
		}
		this.sourcePosition = sourcePosition;
		return true;
	}

	getNodeSearchParameters() {
		if (this.sourcePosition === undefined) {
			throw new Error("Position for search is not defined");
		}
		return {
			nodeTypes: [ts.SyntaxKind.StringLiteral],
			position: this.sourcePosition,
		};
	}

	visitAutofixNode(_node: ts.Node, _position: number, _sourceFile: ts.SourceFile) {
		return true;
	}

	getAffectedSourceCodeRange() {
		return undefined;
	}

	setIdentifierForDependency() {
		return;
	}

	getNewModuleDependencies() {
		return undefined;
	}

	getNewGlobalAccess() {
		return undefined;
	}

	setIdentifierForGlobal() {
		return;
	}

	generateChanges() {
		return undefined;
	}

	getObsoleteModuleDependencies() {
		return {
			moduleName: this.params.moduleName,
		};
	}
}
