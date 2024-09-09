import type {MESSAGE_INFO} from "./messages.js";

type ExtractArgs<F> = F extends (args: infer P) => unknown ? P : never;
type CombineArgs<M, D> = M & D extends object ? M & D : never;

export type MessageArgs = {
	[K in keyof typeof MESSAGE_INFO]:
	CombineArgs<
		ExtractArgs<typeof MESSAGE_INFO[K]["message"]>, ExtractArgs<typeof MESSAGE_INFO[K]["details"]>
	>;
};
