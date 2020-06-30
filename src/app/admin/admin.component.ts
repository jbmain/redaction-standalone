import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { RedactionConfig } from "../interfaces/redaction.component";
import { IConfigurationGroup, IConfigurationGroupData } from "../interfaces/test-grouping-grid";
import { identifierModuleUrl } from "@angular/compiler";
import { NotificationService } from "@progress/kendo-angular-notification";

@Component({
  selector: "app-admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.less"],
  // encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit {

  public config: RedactionConfig;
  public enableSave = false;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    const configJsonString = localStorage.getItem("config");
    if (configJsonString) {
      this.config = JSON.parse(configJsonString);
    } else {
      this.config = {
        title: "Redaction",
        height: "300px",
        automaticRedaction: false,
        standardRedactionLength: false,
        showLabel: false,
        textGroupings: []
      };
      this.enableSave = true;
    }
  }

  public save() {
    localStorage.setItem("config", JSON.stringify(this.config));
    this.enableSave = false;
    this.notificationService.show({
      content: "Successfully saved redaction admin",
      hideAfter: 600,
      position: {
        horizontal: "center", vertical: "bottom"
      },
      type: { style: "success", icon: true }
    });
  }

  public reset() {
    localStorage.clear();
    this.ngOnInit();
    this.notificationService.show({
      content: "Successfully cleared admin and redaction text",
      hideAfter: 600,
      position: {
        horizontal: "center", vertical: "bottom"
      },
      type: { style: "success", icon: true }
    });
  }

  public get title(): string {
    return this.config.title;
  }

  public set title(v: string) {
    this.config.title = v;
    this.enableSave = true;
  }

  public get height(): string {
    return this.config.height;
  }

  public set height(v: string) {
    this.config.height = v;
    this.enableSave = true;
  }

  public get automaticRedaction(): boolean {
    return this.config.automaticRedaction;
  }

  public set automaticRedaction(v: boolean) {
    this.config.automaticRedaction = v;
    this.enableSave = true;
  }

  public get standardRedactionLength(): boolean {
    return this.config.standardRedactionLength;
  }

  public set standardRedactionLength(v: boolean) {
    this.config.standardRedactionLength = v;
    this.enableSave = true;
  }

  public get showLabel(): boolean {
    return this.config.showLabel;
  }

  public set showLabel(v: boolean) {
    this.config.showLabel = v;
    this.enableSave = true;
  }

  public get textGroupings(): IConfigurationGroup[] {
    return this.config.textGroupings.map((grouping, index) => ({
      id: index,
      label: grouping.label,
      data: grouping
    }));
  }

  public set textGroupings(v: IConfigurationGroup[]) {
    this.config.textGroupings = v.map(gridItem => gridItem.data);
    this.enableSave = true;
  }

  public updateTextGroupings(gridItems: IConfigurationGroup[]) {
    this.textGroupings = gridItems;
  }

}
