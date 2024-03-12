import {
	ControlDeclaration, RequireExpression, Position,
} from "../Parser.js";
import Writer from "./Writer.js";

interface ImportStatement {
	moduleName: string;
	variableName: string;
	start?: Position;
	end?: Position;
}

// TODO: Generate type information to make View#byId() access typed?

export default abstract class AbstractGenerator {
	_imports = new Set<ImportStatement>();
	_variableNames = new Set<string>();
	_body: Writer;

	constructor(resourceName: string) {
		this._body = new Writer(resourceName.replace(/.xml$/, ".js"), resourceName);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	writeRootControl(controlDeclaration: ControlDeclaration) {
		throw new Error("Not implemented");
	}

	writeControl(controlDeclaration: ControlDeclaration) {
		const importVariableName = this._getUniqueVariableName(controlDeclaration.name);

		// Add import
		this._imports.add({
			moduleName: controlDeclaration.namespace.replaceAll(".", "/") + `/${controlDeclaration.name}`,
			variableName: importVariableName,
			start: controlDeclaration.start,
			end: controlDeclaration.end,
		});
		// Generate variable name
		controlDeclaration.variableName = this._getUniqueVariableName(`o${controlDeclaration.name}`);

		// Create the control
		this._body.write(`const ${controlDeclaration.variableName} = `);
		this._body.writeln(`new ${importVariableName}({`, controlDeclaration.start, controlDeclaration.end);
		// Write properties
		controlDeclaration.properties.forEach((attribute) => {
			// TODO: Determine attribute type based on metadata and parse/write value accordingly
			this._body.write(`    `);
			this._body.writeln(
				`${attribute.name}: ${JSON.stringify(attribute.value)},`,
				attribute.start, attribute.end);
		});
		// Write aggregations
		controlDeclaration.aggregations.forEach((aggregationDeclaration, aggregationName) => {
			this._body.write(`    `);
			this._body.write(aggregationName, aggregationDeclaration.start, aggregationDeclaration.end);
			this._body.writeln(`: [`);
			aggregationDeclaration.controls.forEach((control) => {
				if (!control.variableName) {
					throw new Error(
						`Control ${control.name} required in aggregation ` +
						`${aggregationName} of control ${controlDeclaration.name} has no yet been declared`);
				}
				this._body.writeln(`        ${control.variableName},`);
			});
			this._body.writeln(`    ],`);
		});
		this._body.writeln("});\n");
	}

	writeRequire(requireExpression: RequireExpression) {
		requireExpression.declarations.forEach((declaration) => {
			if (!declaration.variableName) {
				// Side effect require?
				declaration.variableName = "_";
			}
			const variableName = this._getUniqueVariableName(declaration.variableName);
			declaration.variableName = variableName;
			this._imports.add({
				moduleName: declaration.moduleName,
				variableName: variableName,
				start: requireExpression.start,
				end: requireExpression.end,
			});
		});
	}

	getModuleContent() {
		// Sort by import variable name
		const imports = Array.from(this._imports).sort((a, b) => {
			return b.variableName.localeCompare(a.variableName);
		});
		imports.forEach((importStatment) => {
			this._body.prependln(`import ${importStatment.variableName} from "${importStatment.moduleName}";`,
				importStatment.start, importStatment.end);
		});

		return {
			source: this._body.getString(),
			map: JSON.stringify(this._body.getSourceMap()),
		};
	}

	_getUniqueVariableName(variableName: string): string {
		let variableNameCandidate = variableName;
		if (this._variableNames.has(variableNameCandidate)) {
			let counter = 2;
			while (this._variableNames.has(variableNameCandidate)) {
				variableNameCandidate = `${variableName}${counter}`;
				counter++;
			}
		}
		this._variableNames.add(variableNameCandidate);
		return variableNameCandidate;
	}
}
