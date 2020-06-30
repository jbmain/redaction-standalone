import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ClientComponent } from "./client/client.component";
import { AdminComponent } from "./admin/admin.component";


const routes: Routes = [
  {path: "client", component: ClientComponent},
  {path: "admin", component: AdminComponent},
  { path: "",   redirectTo: "?client", pathMatch: "full" }, // redirect to `first-component`
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
