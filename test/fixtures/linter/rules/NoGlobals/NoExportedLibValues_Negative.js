sap.ui.define(
	[
		"sap/ui/unified/library",
		"sap/ui/core/library",
		"sap/ui/comp/library",
		// This ones are correct- elements, imported as modules
		"sap/ui/unified/DateTypeRange",
		"sap/ui/unified/CalendarDayType",
	],
	function (unifiedLibrary, coreLibrary, compLibrary) {
		"use strict";

		// These are data types that are actually exported by the library		
		var SelectOptionSign = compLibrary.smartfilterbar.SelectOptionSign;

		var CalendarAppointmentHeight =
				unifiedLibrary.CalendarAppointmentHeight,
			CalendarAppointmentRoundWidth =
				unifiedLibrary.CalendarAppointmentRoundWidth,
			ColorPickerMode = unifiedLibrary.ColorPickerMode,
			ContentSwitcherAnimation = unifiedLibrary.ContentSwitcherAnimation;
	}
);
