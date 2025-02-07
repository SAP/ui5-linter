import test from "ava";
import SharedLanguageService from "../../../../src/linter/ui5Types/SharedLanguageService.js";
import {EmptyLanguageServiceHost} from "../../../../src/linter/ui5Types/LanguageServiceHostProxy.js";
import ts from "typescript";

test("SharedLanguageService - acquire and release", (t) => {
	const sharedLanguageService = new SharedLanguageService();
	const languageServiceHost = new EmptyLanguageServiceHost();

	sharedLanguageService.acquire(languageServiceHost);
	sharedLanguageService.release();

	t.pass();
});

test("SharedLanguageService - acquire twice without release", (t) => {
	const sharedLanguageService = new SharedLanguageService();
	const languageServiceHost = new EmptyLanguageServiceHost();

	sharedLanguageService.acquire(languageServiceHost);

	t.throws(() => {
		sharedLanguageService.acquire(languageServiceHost);
	}, {
		message: "SharedCompiler is already acquired",
	});
});

test("SharedLanguageService - release without acquire", (t) => {
	const sharedLanguageService = new SharedLanguageService();

	t.throws(() => {
		sharedLanguageService.release();
	}, {
		message: "SharedCompiler is not acquired",
	});
});

test("SharedLanguageService - getProgram", (t) => {
	const sharedLanguageService = new SharedLanguageService();
	const languageServiceHost = new EmptyLanguageServiceHost();

	sharedLanguageService.acquire(languageServiceHost);

	const program = sharedLanguageService.getProgram();

	t.truthy(program);
});

test("SharedLanguageService - getProgram fails", (t) => {
	const sharedLanguageService = new SharedLanguageService();
	const languageServiceHost = new EmptyLanguageServiceHost();

	// This error can only be produced by setting a the internal language service
	// to a syntactic language service which does not provide a program

	/* @ts-expect-error languageService is defined as private readonly */
	sharedLanguageService.languageService = ts.createLanguageService(
		languageServiceHost, ts.createDocumentRegistry(),
		ts.LanguageServiceMode.Syntactic
	);

	sharedLanguageService.acquire(languageServiceHost);

	t.throws(() => {
		sharedLanguageService.getProgram();
	}, {
		message: "SharedCompiler failed to create a program",
	});
});

test("SharedLanguageService - getProgram without acquire", (t) => {
	const sharedLanguageService = new SharedLanguageService();

	t.throws(() => {
		sharedLanguageService.getProgram();
	}, {
		message: "SharedCompiler is not acquired",
	});
});

test("SharedLanguageService - getNextProjectScriptVersion", (t) => {
	const sharedLanguageService = new SharedLanguageService();
	t.is(sharedLanguageService.getNextProjectScriptVersion(), "1");
	t.is(sharedLanguageService.getNextProjectScriptVersion(), "2");
	t.is(sharedLanguageService.getNextProjectScriptVersion(), "3");

	// Count should be per instance
	t.is(new SharedLanguageService().getNextProjectScriptVersion(), "1");
});
