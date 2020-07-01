import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { includes } from "lodash-es";

declare const $: JQuery;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.less"]
})
export class AppComponent {
  constructor(private router: Router) {
    const path = localStorage.getItem("path");
    if (!this.router.navigated && path) {
      if (includes(path, "admin")) {
        localStorage.removeItem("path");
        this.router.navigate([path]);
      } else {
        localStorage.removeItem("path");
        this.router.navigate(["/client"]);
      }
    }
  }
}
