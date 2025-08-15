import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApp } from "@/context/AppContext";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({ 
  open, 
  onClose, 
  onConfirm, 
  isLoading = false 
}: ConfirmDeleteDialogProps) {
  const { t } = useApp();

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md" data-testid="confirm-delete-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-gray-900">
            {t("deleteConnectorConfirm")}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-end space-x-4">
          <AlertDialogCancel 
            onClick={onClose}
            disabled={isLoading}
            data-testid="delete-cancel-button"
          >
            {t("no")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
            data-testid="delete-confirm-button"
          >
            {isLoading ? "Deleting..." : t("yes")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
