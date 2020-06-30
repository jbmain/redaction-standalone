import { Component, OnInit, Input, ViewChild, ElementRef, ViewEncapsulation, Output, EventEmitter } from "@angular/core";
import { RedactionConfig, IGroup, TextSelection, IHighlightedTextMultipleInstancesObject } from "../interfaces/redaction.component";
import { ContextMenuComponent } from "@progress/kendo-angular-menu";
import { isUndefined } from "lodash-es";
import { RedactionComponentService } from "./redaction.component.service";
import { SelectionEvent, CellClickEvent } from "@progress/kendo-angular-grid";

export enum textMode {
  edit = "edit",
  redact = "redact"
}

@Component({
  selector: "app-redaction",
  templateUrl: "./redaction.component.html",
  styleUrls: ["./redaction.component.less"],
  encapsulation: ViewEncapsulation.None
})
export class RedactionComponent implements OnInit {

  @Input() mode: string;
  @Input() redactionText: string;
  @Input() config: RedactionConfig;
  @Output() updateText = new EventEmitter();

  public textModeButtons;
  public selectedTextModeButton;
  public gridData;

  public redactionGroups: IGroup[] = [];
  public selectedRedactionGroup: IGroup;

  public gridContextMenuItems;
  @ViewChild("gridmenu") public gridContextMenu: ContextMenuComponent;
  private contextRedactionGroup;

  @ViewChild("editableContent") public editableContentEl: ElementRef;

  public isRemoveRedactionGroupsSelected = false;
  public isManualRedactSelected = false;

  public isLabelDialogOpen = false;
  public groupLabel = "";

  public multiSelectMatches: number;
  public multiSelectTextSelection: TextSelection;
  public isMultiSelectionDialogOpen = false;

  constructor(
    private redactionComponentService: RedactionComponentService
  ) { }

  ngOnInit(): void {

    this.setupTextMode();
    this.setupGroupGrid();
    this.setupContextMenu();
  }

  public get redactionTextHTML(): string {
    return this.redactionText;
  }


  public set redactionTextHTML(v: string) {
    this.redactionText = v;
    this.updateText.emit(this.redactionText);
  }


  // Boolean functions
  public isDesignMode(): boolean {
    return this.mode === "design";
  }

  public completeRedactionDisabled(): boolean {
    return Boolean(this.redactionGroups?.length === 0);
  }
  public isRedactMode(): boolean {
    return this.selectedTextModeButton.id === textMode.redact && !this.isDesignMode();
  }
  public isEditMode(): boolean {
    return this.selectedTextModeButton.id === textMode.edit && !this.isDesignMode();
  }

  // Button functions
  // tslint:disable-next-line: variable-name
  public textModeButtonChange(_event: unknown, button) {
    this.selectedTextModeButton = button;
  }

  public manualRedactTextSelected() {
    this.isRemoveRedactionGroupsSelected = false;
    this.isManualRedactSelected = !this.isManualRedactSelected;

    if (this.isManualRedactSelected) {
      const returnArray = this.redactionComponentService.manualRedactText(
        this.redactionText,
        this.editableContentEl,
        this.openMultiSelectDialog
      );

      if (!isUndefined(returnArray)) {
        this.redactionGroups.push(returnArray[0]);
        this.redactionTextHTML = returnArray[1];
      }
    }
  }

  public removeRedactionGroupsSelected() {
    this.isManualRedactSelected = false;
    this.isRemoveRedactionGroupsSelected = !this.isRemoveRedactionGroupsSelected;
  }

  public automaticRedaction() {
    const [redactionGroups, htmlText] = this.redactionComponentService.automaticRedactText(
      this.redactionText,
      this.config.showLabel ? this.config.textGroupings : []
    );
    this.redactionGroups.push(...redactionGroups);
    this.redactionTextHTML = htmlText;
  }

  public performRedactions() {
    const confirmResult = confirm("Completing the redaction will permanently redact marked text. Are you sure you want to continue?");
    if (confirmResult) {
      this.redactionTextHTML = this.redactionComponentService.redactSpans(
        this.editableContentEl,
        this.config.standardRedactionLength,
        this.config.showLabel
      );

      this.redactionGroups = [];
      this.selectedRedactionGroup = undefined;
    }
  }

  // Grid functions
  public gridSelection = (event: SelectionEvent) => {
    this.selectedRedactionGroup = event.selectedRows[0]?.dataItem as IGroup;
    this.redactionComponentService.highlightSelectedGroup(this.editableContentEl, this.selectedRedactionGroup);
  }

  public onGridCellClick(event: CellClickEvent) {
    if (event.type === "contextmenu") {
      const originalEvent = event.originalEvent;

      originalEvent.preventDefault();

      this.contextRedactionGroup = event.dataItem;

      this.gridContextMenu.show({ left: originalEvent.pageX, top: originalEvent.pageY });
    }
  }

  public onContextItemSelect({item}) {
    item.onClick();
  }

  private setupTextMode() {
    this.textModeButtons = [
      {
        id: textMode.edit,
        name: "Edit"
      },
      {
        id: textMode.redact,
        name: "Redact"
      }
    ];
    this.selectedTextModeButton = this.textModeButtons[0];
  }

  // Contenteditable functions
  public mouseUpOrKeyUp(event: Event) {
    if (this.isRedactMode()) {
      const target = event.target as HTMLElement;
      if (!this.isDesignMode()) {
        if (this.isRemoveRedactionGroupsSelected) {
          const {redactionGroups, clearSelectedGroup} = this.redactionComponentService.removeRedactGroup(
            target, this.editableContentEl, this.redactionGroups, this.selectedRedactionGroup?.groupUuid
          );
          this.redactionGroups = redactionGroups;
          if (clearSelectedGroup) {
            this.selectedRedactionGroup = undefined;
            const unSelectedSpans = this.editableContentEl.nativeElement.querySelectorAll("span.selected-span");
            $(unSelectedSpans).removeClass("selected-span");
          }
        } else {
          const returnArray = this.redactionComponentService.highlightText(
            this.isManualRedactSelected,
            target,
            this.redactionGroups,
            this.gridSelection,
            this.redactionText,
            this.editableContentEl,
            this.openMultiSelectDialog
          );

          // if (!isUndefined(returnGroup)) {
          //   this.redactionGroups.push(returnGroup);
          // }

          if (!isUndefined(returnArray)) {
            this.redactionGroups.push(returnArray[0]);
            this.redactionTextHTML = returnArray[1];
          }
        }
      }
    }
  }

  public keyDown(event: KeyboardEvent): void {
    if (this.isRedactMode()) {
      event?.preventDefault();
    }
  }

  public handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    // Paste plain text
    if (event.clipboardData ) {
        const content = event.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, content);
    }
}

  public closeLabelDialog(action: string) {
    if (action === "update" && this.contextRedactionGroup) {
      this.redactionComponentService.updateSelectedGroupComment(
        this.contextRedactionGroup,
        this.groupLabel,
        this.editableContentEl
      );
    }
    this.isLabelDialogOpen = false;
  }

  public openMultiSelectDialog: (matches: number, textSelection: TextSelection) => void =
    (matches: number, textSelection: TextSelection) => {
    this.multiSelectMatches = matches;
    this.multiSelectTextSelection = textSelection;
    this.isMultiSelectionDialogOpen = true;
  }

  public multiSelectClose(output: IHighlightedTextMultipleInstancesObject[] | undefined) {
    this.isMultiSelectionDialogOpen = false;
    if (output) {
      const returnArray = this.redactionComponentService.markUpText(
        this.redactionText,
        this.multiSelectTextSelection,
        this.editableContentEl,
        this.multiSelectTextSelection.selectedString,
        true,
        output
      );

      // if (!isUndefined(returnGroup)) {
      //   this.redactionGroups.push(returnGroup);
      // }

      if (!isUndefined(returnArray)) {
        this.redactionGroups.push(returnArray[0]);
        this.redactionTextHTML = returnArray[1];
      }
    }
    this.multiSelectMatches = undefined;
    this.multiSelectTextSelection = undefined;

  }

  // Private functions
  private setupGroupGrid() {
    // TODO set columns, add label columns is label enabled, set context menu(iff edit)
    this.gridData = {
      columns: [
        {
          field: "groupLabel",
          title: "Marked text"
        }
      ],
      selectableSettings: {
        mode: "single"
      },
      sortableSettings: {
        mode: "single",
        allowUnsort: true
      }
    };

    if (this.config.showLabel) {
      this.gridData.columns.push({
        field: "groupComment",
        title: "Label"
      })
    }
  }

  private setupContextMenu() {
    this.gridContextMenuItems = [
      {
        text: "Remove",
        onClick: (): void => this.removeRedaction(this.contextRedactionGroup),
      },
    ];
    if (this.config.showLabel) {
      this.gridContextMenuItems.push({
        text: "Update label",
        onClick: (): void => this.updateSelectedGroupLabel(this.contextRedactionGroup)
      });
    }
  }

  private removeRedaction(redactionGroup: IGroup) {
    this.redactionGroups = this.redactionComponentService.removeRedactionGroup(
      redactionGroup,
      this.editableContentEl,
      this.redactionGroups
    );

    if (redactionGroup.groupUuid === this.selectedRedactionGroup?.groupUuid) {
      this.selectedRedactionGroup = undefined;
    }
  }

  private updateSelectedGroupLabel(redactionGroup: IGroup) {
    this.groupLabel = redactionGroup.groupComment ?? "";
    this.isLabelDialogOpen = true;
  }
}
