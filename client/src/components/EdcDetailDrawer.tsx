// components/EdcDetailDrawer.tsx
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { useState } from "react";

export type EdcDetails = {
  name: string;
  status: string;
  assetCount: number;
  policyCount: number;
  contractCount: number;
  version: string;
  url: string;
  bpn: string;
  dataSpace: string;
  yaml: string;
};

type Props = {
  edc: EdcDetails | null;
  onClose: () => void;
};

export default function EdcDetailDrawer({ edc, onClose }: Props) {
  const [showYaml, setShowYaml] = useState(false);

  if (!edc) return null;

  return (
    <Dialog open={!!edc} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">EDC: {edc.name}</h2>
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setShowYaml((prev) => !prev)}
          >
            {showYaml ? "View Info" : "View YAML"}
          </button>
        </div>

        {showYaml ? (
          <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-[60vh]">
            {edc.yaml}
          </pre>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle>Name</CardTitle></CardHeader>
              <CardContent>{edc.name}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Status</CardTitle></CardHeader>
              <CardContent>{edc.status}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>EDC Version</CardTitle></CardHeader>
              <CardContent>{edc.version}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle># of Assets</CardTitle></CardHeader>
              <CardContent>{edc.assetCount}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle># of Policies</CardTitle></CardHeader>
              <CardContent>{edc.policyCount}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle># of Contracts</CardTitle></CardHeader>
              <CardContent>{edc.contractCount}</CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-3">
              <CardHeader><CardTitle>EDC URL</CardTitle></CardHeader>
              <CardContent className="flex justify-between items-center">
                <code className="text-xs text-gray-700 break-all">{edc.url}</code>
                <button onClick={() => navigator.clipboard.writeText(edc.url)}>
                  <Copy size={16} />
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>BPN</CardTitle></CardHeader>
              <CardContent className="flex justify-between items-center">
                <code className="text-xs text-gray-700">{edc.bpn}</code>
                <button onClick={() => navigator.clipboard.writeText(edc.bpn)}>
                  <Copy size={16} />
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Data Space</CardTitle></CardHeader>
              <CardContent className="text-xs text-gray-700">{edc.dataSpace}</CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
