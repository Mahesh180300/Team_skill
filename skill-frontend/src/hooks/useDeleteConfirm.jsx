import { useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";

export default function useDeleteConfirm({ onConfirm, title, message, confirmText = "Yes, Delete", icon = "🗑️" }) {
  const [targetId, setTargetId] = useState(null);

  const trigger = (id) => setTargetId(id);
  const cancel = () => setTargetId(null);

  const handleConfirm = async () => {
    await onConfirm(targetId);
    setTargetId(null);
  };

  const DeleteDialog = targetId ? (
    <ConfirmDialog
      icon={icon}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText="Cancel"
      onConfirm={handleConfirm}
      onCancel={cancel}
    />
  ) : null;

  return { targetId, triggerDelete: trigger, cancelDelete: cancel, DeleteDialog };
}
