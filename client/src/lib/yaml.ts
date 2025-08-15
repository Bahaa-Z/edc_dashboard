import { Connector } from "@shared/schema";

export function generateConnectorYaml(connector: Connector): string {
  return `apiVersion: v1
kind: ConfigMap
metadata:
  name: edc-config
data:
  connector:
    name: "${connector.name}"
    version: "${connector.version}"
    bpn: "${connector.bpn}"
    endpoint: "${connector.endpoint}"
    status: "${connector.status}"`;
}
