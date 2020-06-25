import { Component, OnInit, Input, ViewChild, ElementRef, ViewEncapsulation } from "@angular/core";
import { RedactionConfig, IGroup } from "../interfaces/redaction.component";
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

  public textModeButtons;
  public selectedTextModeButton;
  public gridData;
  public groupTypes;

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

  constructor(
    private redactionComponentService: RedactionComponentService
  ) { }

  ngOnInit(): void {

    this.setupTextMode();
    this.setupGroupGrid();
    this.setupContextMenu();

    if (!this.isDesignMode()) {
      this.groupTypes = this.config?.textGroupings;
    }
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
      const newRedactionGroups: IGroup[] = this.redactionComponentService.manualRedactText(this.redactionText, this.editableContentEl);
      this.redactionGroups = this.redactionGroups.concat(newRedactionGroups);
    }
  }

  public removeRedactionGroupsSelected() {
    this.isManualRedactSelected = false;
    this.isRemoveRedactionGroupsSelected = !this.isRemoveRedactionGroupsSelected;
  }

  public automaticRedaction() {
    this.redactionComponentService.automaticRedactText(this.redactionText);
  }

  public performRedactions() {
    const confirmResult = confirm("Completing the redaction will permanently redact marked text. Are you sure you want to continue?");
    if (confirmResult) {
      this.redactionComponentService.redactSpans(
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
    this.selectedRedactionGroup = event.selectedRows[0].dataItem as IGroup;
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
            this.selectedRedactionGroup = undefined;const unSelectedSpans = this.editableContentEl.nativeElement.querySelectorAll("span.selected-span");
            $(unSelectedSpans).removeClass("selected-span");
          }
        } else {
          this.redactionGroups = this.redactionComponentService.highlightText(
            this.isManualRedactSelected,
            target,
            this.redactionGroups,
            this.gridSelection,
            this.redactionText,
            this.editableContentEl
          );
        }
      }
    }
  }

  public keyDown(event: KeyboardEvent): void {
    if (this.isRedactMode()) {
      event?.preventDefault();
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
