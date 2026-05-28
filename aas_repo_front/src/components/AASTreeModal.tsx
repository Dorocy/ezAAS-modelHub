"use client";

import { useState } from "react";
import _ from "lodash";
import { Maximize2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AASTree from "./feature/model/AASTree";

interface OpenTreeModalButtonProps {
  label?: string;
  treeData: any[] | undefined;
  treeDataRefCurrent?: Record<string, any>;
  metadata?: any;
  setMetaData?: (data: any) => void;
  mode: "create" | "edit" | "view";
}

export default function OpenTreeModalButton({
  label = "Open in Modal",
  treeData,
  treeDataRefCurrent,
  metadata,
  setMetaData,
  mode,
}: OpenTreeModalButtonProps) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    if (["create", "edit"].includes(mode) && treeDataRefCurrent != null && setMetaData != null) {
      for (const key in treeDataRefCurrent) {
        _.set(metadata, key, treeDataRefCurrent[key]);
      }
      // clear ref
      Object.keys(treeDataRefCurrent).forEach((k) => delete treeDataRefCurrent[k]);
      setMetaData({ ...metadata });
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        title={label}
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-8 h-8 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mr-1"
      >
        <Maximize2 className="size-4" />
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-full w-screen h-screen rounded-none p-0 flex flex-col">
          <DialogHeader className="px-6 pt-4 pb-2 border-b flex-row items-center justify-between space-y-0">
            <DialogTitle>AAS Tree</DialogTitle>
            <Button variant="outline" onClick={handleClose}>
              <X className="size-3.5 mr-1" />Close
            </Button>
          </DialogHeader>
          <div className="flex-1 overflow-auto px-6 py-4">
            {Array.isArray(treeData) && (
              <AASTree
                data={treeData}
                treeDataRefCurrent={treeDataRefCurrent}
                editMode={["create", "edit"].includes(mode)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
