"use client";
import { useDrag } from "react-dnd";
import { useRef, useState } from "react";

const ItemTypes = { EVENT: "event" };

function DraggableEvent({ event, onEventClick, onResizeEnd, onContextMenu, style, className }) {
  const [isResizing, setIsResizing] = useState(false);
  const didDragRef = useRef(false);
  const eventRef = useRef(null);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.EVENT,
      item: () => {
        if (isResizing) return null;
        didDragRef.current = true;
        return { event };
      },
      collect: (m) => ({ isDragging: m.isDragging() }),
      canDrag: () => !isResizing,
      end: () => {
        // Keep the flag true briefly so the click that fires on mouseup is suppressed
        setTimeout(() => { didDragRef.current = false; }, 0);
      },
    }),
    [event, isResizing]
  );

  const handleResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    didDragRef.current = true;
    const startY = e.clientY;
    const startH = eventRef.current?.offsetHeight || 0;

    const onMove = (me) => {
      const h = Math.max(20, startH + (me.clientY - startY));
      if (eventRef.current) eventRef.current.style.height = `${h}px`;
    };
    const onUp = () => {
      setIsResizing(false);
      if (eventRef.current && onResizeEnd) {
        const delta = Math.round(((eventRef.current.offsetHeight - startH) / 64) * 60);
        onResizeEnd(event, delta);
      }
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setTimeout(() => { didDragRef.current = false; }, 0);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const combinedRef = (el) => {
    eventRef.current = el;
    drag(el);
  };

  const fmt = (ds) => new Date(ds).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div
      ref={combinedRef}
      className={`${className} ${isDragging ? "opacity-50" : ""} group relative`}
      style={{ ...style, cursor: isResizing ? "ns-resize" : "grab" }}
      onClick={(e) => {
        e.stopPropagation();
        if (didDragRef.current || isResizing) return;
        if (onEventClick) onEventClick(event);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onContextMenu) onContextMenu(event, e.clientX, e.clientY);
      }}
    >
      <div className="font-medium truncate text-[11px]">{fmt(event.start_time)}</div>
      <div className="truncate">{event.title}</div>
      {event.location && (
        <div className="text-[10px] opacity-90 truncate flex items-center gap-0.5">
          <span className="material-icons-outlined" style={{ fontSize: "11px" }}>place</span>
          {event.location}
        </div>
      )}
      {onResizeEnd && (
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
          style={{ background: "rgba(255,255,255,0.3)" }}
        />
      )}
    </div>
  );
}

export { DraggableEvent, ItemTypes };
