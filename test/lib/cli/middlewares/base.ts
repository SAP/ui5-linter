import anyTest, {TestFn} from "ava";
import sinon, { SinonStub } from "sinon";
import esmock from "esmock";

const test = anyTest as TestFn<{
	initLogger: SinonStub,
	baseMiddleware: (args: { loglevel: number }) => void
}>;

test.beforeEach(async (t) => {
	t.context.initLogger = sinon.stub();
	t.context.baseMiddleware = await esmock("../../../../src/cli/middlewares/base.js", {
		"../../../../src/cli/middlewares/logger.js": {
			initLogger: t.context.initLogger
		}
	});
});

test.afterEach("Stubs Cleanup", () => {
	sinon.restore();
});

test.serial("uses default middleware", (t) => {
	const {baseMiddleware, initLogger} = t.context;
	baseMiddleware({loglevel: 1});
	t.is(initLogger.called, true, "Logger middleware initialized");
});
