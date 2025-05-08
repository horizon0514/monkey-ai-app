import { DragHandleDots2Icon } from "@radix-ui/react-icons"
import * as ResizablePrimitive from "react-resizable-panels"
import { cn } from "@renderer/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const ResizablePanel = ResizablePrimitive.Panel

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        "relative flex w-px items-center justify-center bg-border/50 transition-all hover:bg-border/80",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 after:bg-transparent",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
        "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        "data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1",
        "data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2",
        "data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        "group/handle data-[dragging=true]:bg-blue-500/50 data-[dragging=true]:after:bg-blue-500/20",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border/80 hover:bg-border transition-colors group-data-[dragging=true]/handle:bg-blue-500/80 group-data-[dragging=true]/handle:border-blue-500/50">
          <DragHandleDots2Icon className="h-2.5 w-2.5 group-data-[dragging=true]/handle:text-blue-100" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }