import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { RedactionComponent } from "./redaction/redaction.component";
import { ButtonsModule } from "@progress/kendo-angular-buttons";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ToolBarModule } from "@progress/kendo-angular-toolbar";
import { GridModule } from "@progress/kendo-angular-grid";
import { ContextMenuModule } from "@progress/kendo-angular-menu";
import { EditorModule } from "@progress/kendo-angular-editor";
import { ContenteditableModule } from "@ng-stack/contenteditable";
import { FormsModule } from "@angular/forms";
import { DialogsModule } from "@progress/kendo-angular-dialog";


@NgModule({
  declarations: [
    AppComponent,
    RedactionComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ButtonsModule,
    BrowserAnimationsModule,
    ToolBarModule,
    DialogsModule,
    GridModule,
    ContextMenuModule,
    EditorModule,
    ContenteditableModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
