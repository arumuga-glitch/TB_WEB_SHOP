import { ServiceRequest } from "@/types/myrequest";

export type UIStage =
  | "upcoming"
  | "in-processing"
  | "applied"
  | "completed"
  | "rejected";

export function getUIStage(request: ServiceRequest): UIStage {
  if (request.status === "rejected") return "rejected";
  if (request.status === "completed") return "completed";
  if (request.status === "applied") return "applied";
  if (request.status === "active") return "in-processing";

  return "upcoming";
}
