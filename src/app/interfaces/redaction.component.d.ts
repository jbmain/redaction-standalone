import { IConfigurationGroupData } from "./test-grouping-grid";

export interface RedactionConfig {
  title: string;
  height: string;
  automaticRedaction: boolean;
  showLabel: boolean;
  textGroupings: IConfigurationGroupData[];
  standardRedactionLength: boolean;
}

export interface IGroup {
  groupUuid: string | null;
  groupLabel: string | null;
  groupComment: string | null;
  groupTypeName: string | null;
  groupTypeLabel: string | null;
  groupTypeLinkEntity: string | null;
  groupColor: string | null;
  textSelections: ITextSelectionObject[];
  // Kendo internal attribute. Used for sng-grid-kendo override.
  uid?: string;
}

export interface IHighlightedTextMultipleInstancesObject {
  pos: number;
  sentence: string;
  redact: boolean;
  selectedText: string;
}

  
export class TextSelection {
  public range: Range;
  public selected: Selection;
  public selectedString: string;
}

export interface ITextSelectionObject {
  textSelectionUuid: string | null;
  selectedText: string | null;
  groupUuid: string | null;
}