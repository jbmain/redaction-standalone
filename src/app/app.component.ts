import { Component } from "@angular/core";

declare const $: JQuery;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.less"]
})
export class AppComponent {
  title = "redaction-standalone";
}
