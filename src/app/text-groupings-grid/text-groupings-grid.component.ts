import { Component, OnInit, Output, EventEmitter, Input, ViewEncapsulation } from "@angular/core";
import { IConfigurationGroup } from "../interfaces/test-grouping-grid";
import { RegexMarkupService } from "../services/regexMarkup.service";
import { some } from "lodash-es";

@Component({
  selector: "app-text-groupings-grid",
  templateUrl: "./text-groupings-grid.component.html",
  styleUrls: ["./text-groupings-grid.component.less"],
  // encapsulation: ViewEncapsulation.None
})
export class TextGroupingsGridComponent implements OnInit {

  @Input() listItems: IConfigurationGroup[];
  @Input() showLabel: boolean;
  @Output() listItemsUpdate = new EventEmitter();

  public selectedListItem: IConfigurationGroup | undefined;

  public isDialogOpen = false;
  public addItem = false;
  public dialogLabel;
  public dialogName;

  public redactionConcepts: string[];
  public avalableRedactionConcepts: string[];

  constructor(
    private regexMarkupService: RegexMarkupService
  ) {}

  ngOnInit(): void {
    this.redactionConcepts = this.regexMarkupService.getRedactionConcepts();
  }

  public listSelection = (listItem: IConfigurationGroup) => {
    this.selectedListItem = listItem;
  }

  public isSelected(id: number) {
    return this.selectedListItem?.id === id;
  }

  public addListItem(): void {
    this.addItem = true;
    this.avalableRedactionConcepts = this.listItems.length === 0 ? this.redactionConcepts :
      this.redactionConcepts.filter(concept => some(this.listItems, item => item.data.name !== concept));
    this.isDialogOpen = true;
  }

  public deleteListItems(): void {
    this.listItems = this.listItems.filter(item => this.selectedListItem.id !== item.id);
    this.selectedListItem = undefined;
    this.listItemsUpdate.emit(this.listItems);
  }

  public editListItem(): void {
    this.dialogLabel = this.selectedListItem.data.label;
    this.dialogName = this.selectedListItem.data.name;
    this.avalableRedactionConcepts = this.redactionConcepts.filter(
      concept => some(
        this.listItems,
        item => item.data.name !== concept && item.id !== this.selectedListItem.id
      )
    );
    this.isDialogOpen = true;
  }

  public closeDialog(type?: string): void {
    // Bug - edit cancel button performs update
    if (type === "cancel" && !this.addItem) {
      this.commitDialog();
    } else {
      this.isDialogOpen = false;
      this.dialogLabel = "";
      this.dialogName = "";
    }
  }

  public commitDialog(): void {
    // Bug not enforcing mandatory fields
    if (this.addItem) {
      this.listItems.push({
        id: this.listItems.length,
        label: this.dialogLabel,
        data: {
          label: this.dialogLabel,
          name: this.dialogName
        }
      });
    } else {
      this.selectedListItem.label = this.dialogLabel;
      this.selectedListItem.data.label = this.dialogLabel;
      this.selectedListItem.data.name = this.dialogName;
    }
    this.addItem = false;
    this.closeDialog();
    this.listItemsUpdate.emit(this.listItems);
  }
}
