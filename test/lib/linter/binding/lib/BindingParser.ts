import anyTest, {TestFn} from "ava";
import BindingParser, {BindingInfo} from "../../../../../src/linter/binding/lib/BindingParser.js";

const test = anyTest as TestFn<{
	parse: (string: string) => BindingInfo;
}>;

test.before((t) => {
	t.context.parse = function (string: string) {
		return BindingParser.complexParser(string, null, true, true, true, true);
	};
});

test("XML Binding: Formatter", (t) => {
	const {parse} = t.context;

	// Formatters using global notation are no longer supported.
	const res = parse(`{
		path: 'invoice>Status',
		formatter: 'ui5.walkthrough.model.formatter.statusText'
	}`);
	t.snapshot(res);
});

test("XML Binding: Formatter bound to controller", (t) => {
	const {parse} = t.context;

	const res = parse(`{
		path: 'invoice>Status',
    	formatter: 'Formatter.statusText.bind($controller)'
	}`);
	t.snapshot(res);
});

test("XML Binding: Type", (t) => {
	const {parse} = t.context;

	const res = parse(`{
		formatOptions: {showDate: false, showTime: false},
		parts: [{value: null}, {path: 'TimezoneID'}],
		type: 'sap.ui.model.odata.type.DateTimeWithTimezone'
	}`);
	t.snapshot(res);
});

test("XML Binding: Calculated Fields Local formatter", (t) => {
	const {parse} = t.context;

	const res = parse(`Hello Mr. {
			path: '/singleEntry/firstName',
			formatter: '.myFormatter'
		},
		{
			/singleEntry/lastName
		}
	`);
	t.snapshot(res);
});

test("XML Binding: Calculated Fields global formatter", (t) => {
	const {parse} = t.context;

	const res = parse(`Hello Mr. {
			path:'/singleEntry/firstName',
			formatter: 'global.yFormatter'
		},
		{
			/singleEntry/lastName
		}
	`);
	t.snapshot(res);
});

test("XML Binding: Parts", (t) => {
	const {parse} = t.context;

	const res = parse(`{
		parts: [
			{path:'birthday/day'},
			{path:'birthday/month'},
			{path:'birthday/year'}
		],
		formatter:'my.globalFormatter'
	}`);
	t.snapshot(res);
});

test("XML Binding: Expression Binding", (t) => {
	const {parse} = t.context;

	const res = parse(`{= %{status} === 'critical' }`);
	t.snapshot(res);
});

test("XML Binding: Complex Expression Binding", (t) => {
	const {parse} = t.context;

	const res = parse(`{= %{/data/message}.length < 20
      ? %{i18n>errorMsg} 
      : %{parts: [
         {path: 'i18n>successMsg'},
         {path: '/data/today', type:'sap.ui.model.type.Date', constraints:{displayFormat:'Date'}},
         {path: '/data/tomorrow', type:'sap.ui.model.type.Date', constraints:{displayFormat:'Date'}}
      ], formatter: 'my.globalFormatter'}}`);
	t.snapshot(res);
});