import ts from "typescript";

export default class TypeInfo {
	static getTypeInfoFromSymbol(
		symbol: ts.Symbol
	): TypeInfo | null {
		if (!symbol) {
			return null;
		}

		const type = symbol.valueDeclaration ? symbol.valueDeclaration.type : undefined;
		if (!type) {
			return null;
		}

		const typeInfo: ts.Type = {
			typeName: symbol.name,
			type: type,
			symbol: symbol,
			valueDeclaration: symbol.valueDeclaration,
			declarations: symbol.declarations,
			flags: symbol.flags,
			escapedName: symbol.escapedName,
			id: symbol.id,
		};

		return typeInfo;
	}
}
