import UIComponent from "sap/ui/core/UIComponent";
import { IAsyncContentCreation } from "sap/ui/core/library";

export default class Component extends UIComponent implements IAsyncContentCreation {
    __implements__sap_ui_core_IAsyncContentCreation: boolean;
}
