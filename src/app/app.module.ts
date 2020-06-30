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
import { RedactionMulitpleSelectionDialogComponent } from "./redaction-mulitple-selection-dialog/redaction-mulitple-selection-dialog.component";
import { ClientComponent } from "./client/client.component";
import { AdminComponent } from "./admin/admin.component";
import { InputsModule } from "@progress/kendo-angular-inputs";
import { TextGroupingsGridComponent } from "./text-groupings-grid/text-groupings-grid.component";
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { NotificationModule } from '@progress/kendo-angular-notification';





@NgModule({
  declarations: [
    AppComponent,
    RedactionComponent,
    RedactionMulitpleSelectionDialogComponent,
    ClientComponent,
    AdminComponent,
    TextGroupingsGridComponent
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
    InputsModule,
    DropDownsModule,
    NotificationModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
