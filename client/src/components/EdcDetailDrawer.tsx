import { X } from "lucide-react";
import { useEffect } from "react";

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
  edc: EdcDetails;
  onClose: () => void;
};

export default function EdcDetailDrawer({ edc, onClose }: Props) {
  // Escape zum Schließen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-lg border-l z-50 overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">EDC Details</h2>
        <button onClick={onClose}>
          <X className="h-5 w-5 text-gray-500 hover:text-red-500" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-sm text-gray-600">Name</p>
          <p className="font-medium text-gray-900">{edc.name}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Status</p>
          <p className="font-medium text-gray-900">{edc.status}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Assets</p>
            <p className="font-medium text-gray-900">{edc.assetCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Policies</p>
            <p className="font-medium text-gray-900">{edc.policyCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Contracts</p>
            <p className="font-medium text-gray-900">{edc.contractCount}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600">Version</p>
          <p className="font-medium text-gray-900">{edc.version}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">BPN</p>
          <p className="font-medium text-gray-900">{edc.bpn}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">URL</p>
          <p className="font-medium text-blue-600">{edc.url}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Data Space</p>
          <p className="font-medium text-gray-900">{edc.dataSpace}</p>
        </div>

        {/* YAML View + Actions */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">YAML View</p>
            <div className="space-x-2">
              <button className="text-sm text-blue-600 hover:underline">Edit</button>
              <button className="text-sm text-red-600 hover:underline">Delete</button>
            </div>
          </div>
          <pre className="bg-gray-100 text-xs text-gray-800 p-3 rounded border whitespace-pre-wrap overflow-x-auto">
            {edc.yaml}
          </pre>
        </div>
      </div>
    </div>
  );
}