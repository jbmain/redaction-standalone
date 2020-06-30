import { Component, OnInit, Input, Output, ViewEncapsulation, EventEmitter } from "@angular/core";
import { IHighlightedTextMultipleInstancesObject } from "../interfaces/redaction.component";
import { RedactionMulitpleSelectionDialogComponentService } from "./redaction-mulitple-selection-dialog.component.service";

@Component({
  selector: "app-redaction-mulitple-selection-dialog",
  templateUrl: "./redaction-mulitple-selection-dialog.component.html",
  styleUrls: ["./redaction-mulitple-selection-dialog.component.less"],
  // encapsulation: ViewEncapsulation.None
})
export class RedactionMulitpleSelectionDialogComponent implements OnInit {

  @Input() redactionText: boolean;
  @Input() matches: number;
  @Input() selectedText: string;

  @Output() closeDialog = new EventEmitter();
  // @Output() closeDialog: (textMultipleInstances: IHighlightedTextMultipleInstancesObject[] | undefined) => void;

  isDialogOpen = true;

  // Class variables used in the view and the controller
  public highlightedTextObjects: IHighlightedTextMultipleInstancesObject[] = [];
  public numberOfInstancesFoundString: string;

  constructor(
    private redactionMulitpleSelectionDialogComponentService: RedactionMulitpleSelectionDialogComponentService
  ) {}

  ngOnInit(): void {
    this.numberOfInstancesFoundString = this.matches + " instances of the selected text were identified.";
    this.highlightedTextObjects = this.redactionMulitpleSelectionDialogComponentService.getMatchedTexts(
      this.redactionText,
      this.selectedText
    );
  }

  public cancel() {
    this.isDialogOpen = false;
    this.closeDialog.emit(undefined);
  }

  public commit() {
    this.isDialogOpen = false;
    this.closeDialog.emit(this.highlightedTextObjects);
  }

  public checkAll(): void {
    this.setHighlightedTextObjectsRedact(true);
  }

  public uncheckAll(): void {
    this.setHighlightedTextObjectsRedact(false);
  }

  public markRow(text: IHighlightedTextMultipleInstancesObject): void {
    text.redact = !text.redact;
  }

  private setHighlightedTextObjectsRedact(redact: boolean): void {
    this.highlightedTextObjects.forEach((highlightedText: IHighlightedTextMultipleInstancesObject) => {
      highlightedText.redact = redact;
    });
  }

}
