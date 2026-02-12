
import { REQUEST_TRANSITIONS, RequestStatus } from "@/types/myrequest";

export function canTransition(
  from: RequestStatus,
  to: RequestStatus
): boolean {
  return REQUEST_TRANSITIONS[from].includes(to);
}
