// Declare module
jQuery.sap.declare("my.module");

// Require button
jQuery.sap.require("sap.m.Button");
jQuery.sap.require("my.Control");

// Use button
const button = new sap.m.Button();
const control = new my.Control();
