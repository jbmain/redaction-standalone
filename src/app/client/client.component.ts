import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { RedactionConfig } from "../interfaces/redaction.component";
import { NotificationService } from "@progress/kendo-angular-notification";

@Component({
  selector: "app-client",
  templateUrl: "./client.component.html",
  styleUrls: ["./client.component.less"],
  // encapsulation: ViewEncapsulation.None
})
export class ClientComponent implements OnInit {

  public config: RedactionConfig;
  public redactionText: string;
  public enableSave = false;
  public resetRedaction = false;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.redactionText = localStorage.getItem("redactionText") ?? "";
    const configJsonString = localStorage.getItem("config");
    if (configJsonString) {
      this.config = JSON.parse(configJsonString);
    }
  }

  public updateText(updateText) {
    this.redactionText = updateText;
    this.enableSave = true;
  }

  public save() {
    localStorage.setItem("redactionText", this.redactionText);
    this.enableSave = false;
    this.notificationService.show({
      content: "Successfully saved redaction text",
      hideAfter: 600,
      position: {
        horizontal: "center", vertical: "bottom"
      },
      type: { style: "success", icon: true }
    });
  }

  public reset() {
    this.redactionText = "";
    this.resetRedaction = true;
    this.enableSave = true;
    setTimeout(() => this.resetRedaction = false);
    this.notificationService.show({
      content: "Successfully reset redaction text",
      hideAfter: 600,
      position: {
        horizontal: "center", vertical: "bottom"
      },
      type: { style: "success", icon: true }
    });
  }

}
