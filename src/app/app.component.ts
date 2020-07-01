import { Component } from "@angular/core";
import { Router } from "@angular/router";

declare const $: JQuery;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.less"]
})
export class AppComponent {
  constructor(private router: Router) {
    const path = localStorage.getItem("path");
    if (path === "/admin") {
      localStorage.removeItem("path");
      this.router.navigate([path]);
    } else {
      localStorage.removeItem("path");
      this.router.navigate(["/client"]);
    }
  }
}
