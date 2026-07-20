import { setDefaultResultOrder } from "node:dns";
import { setDefaultAutoSelectFamily } from "node:net";

let isConfigured = false;

/**
 * Node 22 can time out while racing IPv4 and IPv6 routes on some networks.
 * Neon's HTTP endpoint is reachable over IPv4 here, so use that deterministic
 * route before creating a database client.
 */
export const configureNeonNetwork = () => {
  if (isConfigured) return;

  setDefaultResultOrder("ipv4first");
  setDefaultAutoSelectFamily(false);
  isConfigured = true;
};
