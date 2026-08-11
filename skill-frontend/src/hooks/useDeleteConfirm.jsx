import { useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";

export default function useDeleteConfirm({ onConfirm, title, message, confirmText = "Yes, Delete", icon = "🗑️", danger = true }) {
  const [targetId, setTargetId] = useState(null);

  const trigger = (id) => setTargetId(id);
  const cancel = () => setTargetId(null);

  const handleConfirm = async () => {
    const id = targetId;
    setTargetId(null);
    await onConfirm(id);
  };

  const DeleteDialog = targetId ? (
    <ConfirmDialog
      icon={icon}
      title={typeof title === "function" ? title(targetId) : title}
      message={typeof message === "function" ? message(targetId) : message}
      confirmText={confirmText}
      cancelText="Cancel"
      danger={danger}
      onConfirm={handleConfirm}
      onCancel={cancel}
    />
  ) : null;

  return { targetId, triggerDelete: trigger, cancelDelete: cancel, DeleteDialog };
}
