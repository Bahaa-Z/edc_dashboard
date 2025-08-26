import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";

interface IntroWizardModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: (deploymentData?: StepData) => void;
}

interface StepData {
  submodelService: { url: string; apiKey: string };
  digitalTwinRegistry: { url: string; credentials: string };
  edc: { name: string; version: string; bpn: string; endpoint: string };
  edcRegistration: { registryUrl: string; certificatePath: string };
}

type StepKey = keyof StepData;

export function IntroWizardModal({ open, onClose, onContinue }: IntroWizardModalProps) {
  const { t } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<StepData>({
    submodelService: { url: "", apiKey: "" },
    digitalTwinRegistry: { url: "", credentials: "" },
    edc: { name: "", version: "", bpn: "", endpoint: "" },
    edcRegistration: { registryUrl: "", certificatePath: "" },
  });

  // Track "skipped" steps
  const [skipped, setSkipped] = useState<Record<StepKey, boolean>>({
    submodelService: false,
    digitalTwinRegistry: false,
    edc: false,
    edcRegistration: false,
  });

  const steps = useMemo(
    () => [
      { number: 1, label: t("submodelService"), key: "submodelService" as StepKey },
      { number: 2, label: t("digitalTwinRegistry"), key: "digitalTwinRegistry" as StepKey },
      { number: 3, label: t("edc"), key: "edc" as StepKey },
      { number: 4, label: t("edcRegistration"), key: "edcRegistration" as StepKey },
    ],
    [t]
  );

  const updateStepData = (step: StepKey, field: string, value: string) => {
    setStepData((prev) => ({
      ...prev,
      [step]: { ...prev[step], [field]: value },
    }));
    // Wenn der User tippt, Schritt als "nicht übersprungen" markieren
    if (skipped[step]) {
      setSkipped((prev) => ({ ...prev, [step]: false }));
    }
  };

  const isStepComplete = (stepNumber: number): boolean => {
    const stepKey = steps[stepNumber - 1].key;
    if (skipped[stepKey]) return true;

    switch (stepKey) {
      case "submodelService":
        return (
          stepData.submodelService.url.trim() !== "" &&
          stepData.submodelService.apiKey.trim() !== ""
        );
      case "digitalTwinRegistry":
        return (
          stepData.digitalTwinRegistry.url.trim() !== "" &&
          stepData.digitalTwinRegistry.credentials.trim() !== ""
        );
      case "edc":
        return (
          stepData.edc.name.trim() !== "" &&
          stepData.edc.version.trim() !== "" &&
          stepData.edc.bpn.trim() !== "" &&
          stepData.edc.endpoint.trim() !== ""
        );
      case "edcRegistration":
        return (
          stepData.edcRegistration.registryUrl.trim() !== "" &&
          stepData.edcRegistration.certificatePath.trim() !== ""
        );
      default:
        return false;
    }
  };

  const canProceedToNext = () => isStepComplete(currentStep);

  // Du kannst hier festlegen, was zum Abschluss minimal nötig ist.
  // Beispiel: EDC muss ausgefüllt oder übersprungen sein; Registration optional.
  const canFinish = () => {
    const edcDone = isStepComplete(3);
    // Wenn du Registrierung verpflichtend machen willst, dekommentiere:
    // const edcRegDone = isStepComplete(4);
    // return edcDone && edcRegDone;

    return edcDone; // Registrierung optional/überspringbar
  };

  const handleNext = () => {
    if (!canProceedToNext()) return;
    if (currentStep < steps.length) {
      setCurrentStep((s) => s + 1);
    } else if (canFinish()) {
      onContinue(stepData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleClose = () => {
    setCurrentStep(1);
    setStepData({
      submodelService: { url: "", apiKey: "" },
      digitalTwinRegistry: { url: "", credentials: "" },
      edc: { name: "", version: "", bpn: "", endpoint: "" },
      edcRegistration: { registryUrl: "", certificatePath: "" },
    });
    setSkipped({
      submodelService: false,
      digitalTwinRegistry: false,
      edc: false,
      edcRegistration: false,
    });
    onClose();
  };

  const skipCurrentStep = () => {
    const stepKey = steps[currentStep - 1].key;
    setSkipped((prev) => ({ ...prev, [stepKey]: true }));
    if (currentStep < steps.length) {
      setCurrentStep((s) => s + 1);
    }
  };

  const jumpToEdc = () => setCurrentStep(3);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("submodelService")}</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="submodel-url">Service URL</Label>
                  <Input
                    id="submodel-url"
                    type="url"
                    placeholder="https://submodel-service.example.com"
                    value={stepData.submodelService.url}
                    onChange={(e) => updateStepData("submodelService", "url", e.target.value)}
                    data-testid="submodel-url-input"
                  />
                </div>
                <div>
                  <Label htmlFor="submodel-apikey">API Key</Label>
                  <Input
                    id="submodel-apikey"
                    type="password"
                    placeholder="Enter API key"
                    value={stepData.submodelService.apiKey}
                    onChange={(e) => updateStepData("submodelService", "apiKey", e.target.value)}
                    data-testid="submodel-apikey-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("digitalTwinRegistry")}</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="registry-url">Registry URL</Label>
                  <Input
                    id="registry-url"
                    type="url"
                    placeholder="https://digital-twin-registry.example.com"
                    value={stepData.digitalTwinRegistry.url}
                    onChange={(e) => updateStepData("digitalTwinRegistry", "url", e.target.value)}
                    data-testid="registry-url-input"
                  />
                </div>
                <div>
                  <Label htmlFor="registry-credentials">Credentials</Label>
                  <Input
                    id="registry-credentials"
                    type="password"
                    placeholder="Enter credentials"
                    value={stepData.digitalTwinRegistry.credentials}
                    onChange={(e) => updateStepData("digitalTwinRegistry", "credentials", e.target.value)}
                    data-testid="registry-credentials-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("edc")}</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edc-name">{t("name")}</Label>
                  <Input
                    id="edc-name"
                    placeholder="Enter connector name"
                    value={stepData.edc.name}
                    onChange={(e) => updateStepData("edc", "name", e.target.value)}
                    data-testid="edc-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="edc-version">{t("version")}</Label>
                  <Input
                    id="edc-version"
                    placeholder="e.g., 0.8.0"
                    value={stepData.edc.version}
                    onChange={(e) => updateStepData("edc", "version", e.target.value)}
                    data-testid="edc-version-input"
                  />
                </div>
                <div>
                  <Label htmlFor="edc-bpn">BPN</Label>
                  <Input
                    id="edc-bpn"
                    placeholder="Business Partner Number"
                    value={stepData.edc.bpn}
                    onChange={(e) => updateStepData("edc", "bpn", e.target.value)}
                    data-testid="edc-bpn-input"
                  />
                </div>
                <div>
                  <Label htmlFor="edc-endpoint">{t("endpoint")}</Label>
                  <Input
                    id="edc-endpoint"
                    type="url"
                    placeholder="https://edc.example.com"
                    value={stepData.edc.endpoint}
                    onChange={(e) => updateStepData("edc", "endpoint", e.target.value)}
                    data-testid="edc-endpoint-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("edcRegistration")}</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="registration-url">Registry URL</Label>
                  <Input
                    id="registration-url"
                    type="url"
                    placeholder="https://edc-registry.example.com"
                    value={stepData.edcRegistration.registryUrl}
                    onChange={(e) => updateStepData("edcRegistration", "registryUrl", e.target.value)}
                    data-testid="registration-url-input"
                  />
                </div>
                <div>
                  <Label htmlFor="certificate-path">Certificate Path</Label>
                  <Input
                    id="certificate-path"
                    placeholder="/path/to/certificate.pem"
                    value={stepData.edcRegistration.certificatePath}
                    onChange={(e) => updateStepData("edcRegistration", "certificatePath", e.target.value)}
                    data-testid="certificate-path-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="intro-wizard-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 mb-4">
            EDC Deployment Wizard
          </DialogTitle>
          <DialogDescription>
            Follow these steps to deploy your EDC. You can skip steps or jump directly to EDC.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6" data-testid="process-steps">
            {steps.map((step, idx) => {
              const done = isStepComplete(step.number);
              const isActive = currentStep === step.number;
              return (
                <div key={step.number} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.number)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 border transition
                      ${isActive ? "bg-[var(--arena-orange)] text-white border-[var(--arena-orange)]"
                        : done ? "bg-green-500 text-white border-green-500"
                        : "bg-gray-200 text-gray-600 border-gray-300"}`}
                    title={step.label}
                  >
                    {done && !isActive ? <Check className="h-6 w-6" /> : step.number}
                  </button>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-4 min-w-8 ${done ? "bg-green-500" : "bg-gray-300"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mb-4">
            <Button variant="outline" onClick={jumpToEdc}>
              Skip to EDC
            </Button>
            <Button
              variant="outline"
              onClick={skipCurrentStep}
              className="ml-auto"
            >
              Skip this step
            </Button>
          </div>

          {/* Content */}
          <div className="mb-6">{renderStepContent()}</div>
        </div>

        <div className="flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose} data-testid="wizard-cancel-button">
              {t("cancel")}
            </Button>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious} data-testid="wizard-previous-button">
                Previous
              </Button>
            )}
          </div>

          {/* Next / Complete */}
          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="bg-[var(--arena-orange)] hover:bg-[var(--arena-orange-hover)] text-white disabled:opacity-50"
              data-testid="wizard-next-button"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={() => onContinue(stepData)}
              disabled={!canFinish()}
              className="bg-[var(--arena-orange)] hover:bg-[var(--arena-orange-hover)] text-white disabled:opacity-50"
              data-testid="wizard-complete-button"
            >
              Complete Deployment
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}