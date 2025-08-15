import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useApp } from "@/context/AppContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertConnectorSchema, type Connector, type InsertConnector } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { generateConnectorYaml } from "@/lib/yaml";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface AddEditConnectorModalProps {
  open: boolean;
  onClose: () => void;
  connector?: Connector | null;
  wizardData?: any;
}

export function AddEditConnectorModal({ open, onClose, connector, wizardData }: AddEditConnectorModalProps) {
  const { t } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editFieldsEnabled, setEditFieldsEnabled] = useState(!connector);
  const [yamlContent, setYamlContent] = useState("");

  const isEditMode = !!connector;

  const form = useForm<InsertConnector>({
    resolver: zodResolver(insertConnectorSchema),
    defaultValues: {
      name: "",
      version: "",
      bpn: "",
      endpoint: "",
    },
  });

  const { watch, reset } = form;
  const watchedValues = watch();

  useEffect(() => {
    if (connector) {
      reset({
        name: connector.name,
        version: connector.version,
        bpn: connector.bpn,
        endpoint: connector.endpoint,
      });
      setEditFieldsEnabled(false);
      setYamlContent(generateConnectorYaml(connector));
    } else if (wizardData?.edc) {
      // Pre-fill form with wizard data when adding new connector
      reset({
        name: wizardData.edc.name,
        version: wizardData.edc.version,
        bpn: wizardData.edc.bpn,
        endpoint: wizardData.edc.endpoint,
      });
      setEditFieldsEnabled(true);
      const tempConnector: Connector = {
        id: "temp",
        name: wizardData.edc.name,
        version: wizardData.edc.version,
        bpn: wizardData.edc.bpn,
        endpoint: wizardData.edc.endpoint,
        status: "Connected",
      };
      setYamlContent(generateConnectorYaml(tempConnector));
    } else {
      reset({
        name: "",
        version: "",
        bpn: "",
        endpoint: "",
      });
      setEditFieldsEnabled(true);
      setYamlContent("");
    }
  }, [connector, wizardData, reset]);

  useEffect(() => {
    // Update YAML when form values change
    if (watchedValues.name || watchedValues.version || watchedValues.bpn || watchedValues.endpoint) {
      const tempConnector: Connector = {
        id: connector?.id || "temp",
        name: watchedValues.name || "",
        version: watchedValues.version || "",
        bpn: watchedValues.bpn || "",
        endpoint: watchedValues.endpoint || "",
        status: connector?.status || "Connected",
      };
      setYamlContent(generateConnectorYaml(tempConnector));
    }
  }, [watchedValues, connector]);

  const createMutation = useMutation({
    mutationFn: api.createConnector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connectors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Connector created successfully",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create connector",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertConnector> }) =>
      api.updateConnector(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connectors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Connector updated successfully",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update connector",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setEditFieldsEnabled(!connector);
    setYamlContent("");
    onClose();
  };

  const onSubmit = (data: InsertConnector) => {
    if (connector) {
      updateMutation.mutate({ id: connector.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="add-edit-connector-modal">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold text-gray-900">
              {t("editConnector")}
            </DialogTitle>
            {isEditMode && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editFields"
                  checked={editFieldsEnabled}
                  onCheckedChange={setEditFieldsEnabled}
                  data-testid="edit-fields-checkbox"
                />
                <Label htmlFor="editFields" className="text-sm text-gray-600 cursor-pointer">
                  {t("editFields")}
                </Label>
              </div>
            )}
          </div>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder={t("name")}
                disabled={isEditMode && !editFieldsEnabled}
                data-testid="connector-name-input"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="version">{t("version")}</Label>
              <Input
                id="version"
                {...form.register("version")}
                placeholder={t("version")}
                disabled={isEditMode && !editFieldsEnabled}
                data-testid="connector-version-input"
              />
              {form.formState.errors.version && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.version.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="bpn">BPN</Label>
              <Input
                id="bpn"
                {...form.register("bpn")}
                placeholder="BPN"
                disabled={isEditMode && !editFieldsEnabled}
                data-testid="connector-bpn-input"
              />
              {form.formState.errors.bpn && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.bpn.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="endpoint">{t("endpoint")}</Label>
              <Input
                id="endpoint"
                {...form.register("endpoint")}
                placeholder={t("endpoint")}
                disabled={isEditMode && !editFieldsEnabled}
                data-testid="connector-endpoint-input"
              />
              {form.formState.errors.endpoint && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.endpoint.message}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              {t("yamlViewer")}
            </Label>
            <Textarea
              value={yamlContent}
              readOnly
              className="w-full h-40 font-mono text-sm bg-gray-50"
              data-testid="yaml-viewer"
            />
          </div>
          
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              data-testid="connector-cancel-button"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[var(--arena-orange)] hover:bg-[var(--arena-orange-hover)] text-white"
              data-testid="connector-save-button"
            >
              {isLoading ? "Saving..." : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
