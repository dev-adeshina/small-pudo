import { redirect } from "next/navigation";

export default function CustomerShipmentsPage() {
  redirect("/account/shipments/new");
}
