sap.ui.define(["sap/ui/table/Table"], function(Table) {
	function MyClass() {
	}

	MyClass.prototype.initTable = function() {
		this.table = new Table();
	};

	MyClass.prototype.doSomething = function() {
		this.table.clone().setVisibleRowCount(5);
	};

	return MyClass;
});
