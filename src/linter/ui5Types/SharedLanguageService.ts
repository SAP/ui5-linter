import ts from "typescript";
import LanguageServiceHostProxy from "./LanguageServiceHostProxy.js";

export default class SharedLanguageService {
	private readonly languageServiceHostProxy: LanguageServiceHostProxy;
	private readonly languageService: ts.LanguageService;
	private acquired = false;

	constructor() {
		this.languageServiceHostProxy = new LanguageServiceHostProxy();
		this.languageService = ts.createLanguageService(this.languageServiceHostProxy, ts.createDocumentRegistry());
	}

	acquire(languageServiceHost: ts.LanguageServiceHost) {
		if (this.acquired) {
			throw new Error("SharedCompiler is already acquired");
		}
		this.acquired = true;

		// Set actual LanguageServiceHost implementation
		this.languageServiceHostProxy.setHost(languageServiceHost);
	}

	getProgram() {
		if (!this.acquired) {
			throw new Error("SharedCompiler is not acquired");
		}

		const program = this.languageService.getProgram();
		if (!program) {
			throw new Error("SharedCompiler failed to create a program");
		}
		return program;
	}

	release() {
		if (!this.acquired) {
			throw new Error("SharedCompiler is not acquired");
		}

		// Remove previously set LanguageServiceHost implementation
		this.languageServiceHostProxy.setHost(null);

		this.acquired = false;
	}
}
