import { redirect } from "next/navigation";

// /delivery/dashboard/map route doesn't exist as a separate page.
// Map is embedded directly inside each order card in /delivery/dashboard.
// Redirect to the main dashboard.
export default function DeliveryMapPage() {
  redirect("/delivery/dashboard");
}
