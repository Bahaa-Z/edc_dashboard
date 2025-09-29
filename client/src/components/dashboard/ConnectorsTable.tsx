import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Edit, Trash2, Plus, FileText } from "lucide-react";
import { useState } from "react";
import { IntroWizardModal } from "@/components/modals/IntroWizardModal";
import { AddEditConnectorModal } from "@/components/modals/AddEditConnectorModal";
import { ConfirmDeleteDialog } from "@/components/modals/ConfirmDeleteDialog";
import { Connector } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { EdcDetails } from "@/components/EdcDetailDrawer";

export function ConnectorsTable({ onSelectEdc }: { onSelectEdc?: (edc: EdcDetails) => void }) {
  const { t } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showIntroWizard, setShowIntroWizard] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [connectorToDelete, setConnectorToDelete] = useState<Connector | null>(null);
  const [wizardData, setWizardData] = useState<any>(null);

  const { data: connectors = [], isLoading } = useQuery({
    queryKey: ["/api/connectors"],
    queryFn: api.getConnectors,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteConnector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connectors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sde/stats"] });
      toast({ title: "Success", description: "Connector deleted successfully" });
      setShowDeleteDialog(false);
      setConnectorToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete connector",
        variant: "destructive",
      });
    },
  });

  const handleAddConnector = () => setShowIntroWizard(true);

  const handleContinueFromWizard = (deploymentData?: any) => {
    setShowIntroWizard(false);
    setSelectedConnector(null);
    setWizardData(deploymentData);
    setShowAddEditModal(true);
  };

  const handleEditConnector = (connector: Connector) => {
    setSelectedConnector(connector);
    setShowAddEditModal(true);
  };

  const handleDeleteConnector = (connector: Connector) => {
    setConnectorToDelete(connector);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (connectorToDelete) {
      deleteMutation.mutate(connectorToDelete.id);
    }
  };

  return (
    <>
      <Card className="bg-white/90 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-6 py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex flex-row justify-between items-center space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[var(--arena-orange)] bg-opacity-10 rounded-lg">
              <Edit className="h-5 w-5 text-[var(--arena-orange)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {t("manageConnectors")}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage your EDC instances and connections
              </p>
            </div>
          </div>
          <Button
            onClick={handleAddConnector}
            className="bg-gradient-to-r from-[var(--arena-orange)] to-orange-500 hover:from-[var(--arena-orange-hover)] hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6 py-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("addEdc")}
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("name")}
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("version")}
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BPN
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("status")}
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("endpoint")}
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Loading connectors...
                    </TableCell>
                  </TableRow>
                ) : connectors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No connectors found. Click "Add EDC" to create your first connector.
                    </TableCell>
                  </TableRow>
                ) : (
                  connectors.map((connector) => (
                    <TableRow key={connector.id} className="group hover:bg-green-50 transition">
                      {/* Name klickbar */}
                      <TableCell
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--arena-orange)] hover:text-green-600 cursor-pointer group-hover:underline"
                        onClick={() =>
                          onSelectEdc?.({
                            name: connector.name,
                            status: connector.status,
                            assetCount: 0,
                            policyCount: 0,
                            contractCount: 0,
                            version: connector.version,
                            url: connector.endpoint,
                            bpn: connector.bpn,
                            dataSpace: "Catena-X",
                            yaml: `version: ${connector.version}\nbpn: ${connector.bpn}\nendpoint: ${connector.endpoint}`,
                          })
                        }
                      >
                        {connector.name}
                      </TableCell>

                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {connector.version}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {connector.bpn}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={connector.status === "Connected" ? "default" : "secondary"}
                          className={connector.status === "Connected" ? "bg-green-100 text-green-800" : ""}
                        >
                          {connector.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {connector.endpoint}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onSelectEdc?.({
                              name: connector.name,
                              status: connector.status,
                              assetCount: 0,
                              policyCount: 0,
                              contractCount: 0,
                              version: connector.version,
                              url: connector.endpoint,
                              bpn: connector.bpn,
                              dataSpace: "Catena-X",
                              yaml: `version: ${connector.version}\nbpn: ${connector.bpn}\nendpoint: ${connector.endpoint}`,
                            })
                          }
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          YAML
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditConnector(connector)}
                          className="text-[var(--arena-orange)] hover:text-[var(--arena-orange-hover)]"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {t("edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConnector(connector)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t("delete")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <IntroWizardModal
        open={showIntroWizard}
        onClose={() => setShowIntroWizard(false)}
        onContinue={handleContinueFromWizard}
      />
      <AddEditConnectorModal
        open={showAddEditModal}
        onClose={() => {
          setShowAddEditModal(false);
          setSelectedConnector(null);
          setWizardData(null);
        }}
        connector={selectedConnector}
        wizardData={wizardData}
      />
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setConnectorToDelete(null);
        }}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}