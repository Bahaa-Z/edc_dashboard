import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useApp } from "@/context/AppContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDataspaceSettingsSchema, type InsertDataspaceSettings } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DataspaceSettings() {
  const { t } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editFieldsEnabled, setEditFieldsEnabled] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings/dataspace"],
    queryFn: api.getDataspaceSettings,
  });

  const form = useForm<InsertDataspaceSettings>({
    resolver: zodResolver(insertDataspaceSettingsSchema),
    defaultValues: {
      walletUrl: "",
      portalUrl: "",
      centralIdpUrl: "",
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (settings) {
      reset({
        walletUrl: settings.walletUrl || "",
        portalUrl: settings.portalUrl || "",
        centralIdpUrl: settings.centralIdpUrl || "",
      });
    }
  }, [settings, reset]);

  const saveMutation = useMutation({
    mutationFn: api.saveDataspaceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/dataspace"] });
      toast({
        title: "Success",
        description: "Dataspace settings saved successfully",
      });
      setEditFieldsEnabled(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save dataspace settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDataspaceSettings) => {
    saveMutation.mutate(data);
  };

  const handleCancel = () => {
    if (settings) {
      reset({
        walletUrl: settings.walletUrl || "",
        portalUrl: settings.portalUrl || "",
        centralIdpUrl: settings.centralIdpUrl || "",
      });
    }
    setEditFieldsEnabled(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading dataspace settings...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="dataspace-settings-title">
          {t("dataspaceSettings")}
        </h1>
      </div>
      
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t("introduction")}
            </h2>
            <p className="text-gray-600 mb-6" data-testid="dataspace-description">
              {t("whatUserCanDo")}
            </p>
            
            <div className="flex items-center space-x-2 mb-6">
              <Checkbox
                id="editDataspaceFields"
                checked={editFieldsEnabled}
                onCheckedChange={setEditFieldsEnabled}
                data-testid="edit-dataspace-fields-checkbox"
              />
              <Label htmlFor="editDataspaceFields" className="text-sm text-gray-600 cursor-pointer">
                {t("editFields")}
              </Label>
            </div>
          </div>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="walletUrl">{t("walletUrl")}</Label>
                <Input
                  id="walletUrl"
                  type="url"
                  {...form.register("walletUrl")}
                  disabled={!editFieldsEnabled}
                  className="mt-1"
                  data-testid="wallet-url-input"
                />
                {form.formState.errors.walletUrl && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.walletUrl.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="portalUrl">{t("portalUrl")}</Label>
                <Input
                  id="portalUrl"
                  type="url"
                  {...form.register("portalUrl")}
                  disabled={!editFieldsEnabled}
                  className="mt-1"
                  data-testid="portal-url-input"
                />
                {form.formState.errors.portalUrl && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.portalUrl.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="centralIdpUrl">{t("centralIdpUrl")}</Label>
                <Input
                  id="centralIdpUrl"
                  type="url"
                  {...form.register("centralIdpUrl")}
                  disabled={!editFieldsEnabled}
                  className="mt-1"
                  data-testid="central-idp-url-input"
                />
                {form.formState.errors.centralIdpUrl && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.centralIdpUrl.message}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saveMutation.isPending}
                data-testid="dataspace-cancel-button"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending || !editFieldsEnabled}
                className="bg-[var(--arena-orange)] hover:bg-[var(--arena-orange-hover)] text-white"
                data-testid="dataspace-save-button"
              >
                {saveMutation.isPending ? "Saving..." : t("save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
