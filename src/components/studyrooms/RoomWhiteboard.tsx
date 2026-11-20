import React, { useEffect, useRef, useState } from 'react';
import {
  Circle,
  Download,
  Eraser,
  Minus,
  PenTool,
  Square,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import { StudyRoom, WhiteboardElement, WhiteboardTool } from '../../types/studyRooms';
import { WHITEBOARD_COLORS } from '../../data/studyRoomsData';
import { useStudyRooms } from '../../context/StudyRoomsContext';

interface RoomWhiteboardProps {
  room: StudyRoom;
}

const LOGICAL_WIDTH = 900;
const LOGICAL_HEIGHT = 480;

function drawElement(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = el.tool === 'eraser' ? '#FFFFFF' : el.color;
  ctx.fillStyle = el.color;
  ctx.lineWidth = el.tool === 'eraser' ? Math.max(14, el.strokeWidth * 4) : el.strokeWidth;

  if ((el.tool === 'pen' || el.tool === 'eraser') && el.points && el.points.length > 0) {
    ctx.beginPath();
    ctx.moveTo(el.points[0].x, el.points[0].y);
    for (let i = 1; i < el.points.length; i++) {
      ctx.lineTo(el.points[i].x, el.points[i].y);
    }
    ctx.stroke();
  } else if (el.tool === 'line' && el.start && el.end) {
    ctx.beginPath();
    ctx.moveTo(el.start.x, el.start.y);
    ctx.lineTo(el.end.x, el.end.y);
    ctx.stroke();
  } else if (el.tool === 'rect' && el.start && el.end) {
    ctx.strokeRect(
      el.start.x,
      el.start.y,
      el.end.x - el.start.x,
      el.end.y - el.start.y
    );
  } else if (el.tool === 'circle' && el.start && el.end) {
    const rx = Math.abs(el.end.x - el.start.x) / 2;
    const ry = Math.abs(el.end.y - el.start.y) / 2;
    const cx = (el.start.x + el.end.x) / 2;
    const cy = (el.start.y + el.end.y) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (el.tool === 'text' && el.start && el.text) {
    ctx.font = `600 ${Math.max(14, el.strokeWidth * 4 + 10)}px system-ui, sans-serif`;
    ctx.fillText(el.text, el.start.x, el.start.y);
  }
  ctx.restore();
}

export const RoomWhiteboard: React.FC<RoomWhiteboardProps> = ({ room }) => {
  const { currentUserId, currentUserName, mutateWhiteboard, showToast } = useStudyRooms();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<WhiteboardTool>('pen');
  const [color, setColor] = useState<string>(WHITEBOARD_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [draftEl, setDraftEl] = useState<WhiteboardElement | null>(null);
  const [textPrompt, setTextPrompt] = useState<{ x: number; y: number; value: string } | null>(
    null
  );

  const participant = room.participants.find((p) => p.userId === currentUserId);
  const canDraw =
    room.enableWorkspace &&
    (!participant ||
      participant.canUseWorkspace ||
      participant.role === 'Owner' ||
      participant.role === 'Co-host' ||
      participant.role === 'Moderator');

  // Re-render canvas whenever server whiteboard elements or active draft change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Subtle academic grid dots
    ctx.fillStyle = '#E2E8F0';
    for (let x = 30; x < LOGICAL_WIDTH; x += 30) {
      for (let y = 30; y < LOGICAL_HEIGHT; y += 30) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    room.whiteboard.forEach((el) => drawElement(ctx, el));
    if (draftEl) drawElement(ctx, draftEl);
  }, [room.whiteboard, draftEl]);

  const toLogicalCoords = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(((evt.clientX - rect.left) / rect.width) * LOGICAL_WIDTH),
      y: Math.round(((evt.clientY - rect.top) / rect.height) * LOGICAL_HEIGHT),
    };
  };

  const handlePointerDown = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    const pt = toLogicalCoords(evt);
    if (tool === 'text') {
      setTextPrompt({ x: pt.x, y: pt.y, value: '' });
      return;
    }
    evt.currentTarget.setPointerCapture(evt.pointerId);
    const id = `wb_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const nowIso = new Date().toISOString();

    if (tool === 'pen' || tool === 'eraser') {
      setDraftEl({
        id,
        tool,
        color,
        strokeWidth,
        points: [pt],
        authorId: currentUserId,
        authorName: currentUserName,
        createdAt: nowIso,
      });
    } else {
      setDraftEl({
        id,
        tool,
        color,
        strokeWidth,
        start: pt,
        end: pt,
        authorId: currentUserId,
        authorName: currentUserName,
        createdAt: nowIso,
      });
    }
  };

  const handlePointerMove = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draftEl) return;
    const pt = toLogicalCoords(evt);
    if (draftEl.tool === 'pen' || draftEl.tool === 'eraser') {
      setDraftEl((prev) =>
        prev ? { ...prev, points: [...(prev.points || []), pt] } : null
      );
    } else {
      setDraftEl((prev) => (prev ? { ...prev, end: pt } : null));
    }
  };

  const handlePointerUp = async () => {
    if (!draftEl) return;
    const finalEl = draftEl;
    setDraftEl(null);
    await mutateWhiteboard(room.id, 'add', finalEl);
  };

  const handlePlaceText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textPrompt || !textPrompt.value.trim()) {
      setTextPrompt(null);
      return;
    }
    await mutateWhiteboard(room.id, 'add', {
      id: `wb_${Date.now()}`,
      tool: 'text',
      color,
      strokeWidth,
      start: { x: textPrompt.x, y: textPrompt.y },
      text: textPrompt.value.trim(),
      authorId: currentUserId,
      authorName: currentUserName,
      createdAt: new Date().toISOString(),
    });
    setTextPrompt(null);
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${room.name.toLowerCase().replace(/\W+/g, '_')}_whiteboard.png`;
    a.click();
    showToast('Whiteboard exported as PNG.');
  };

  const tools: Array<{ id: WhiteboardTool; label: string; icon: any }> = [
    { id: 'pen', label: 'Pen', icon: PenTool },
    { id: 'eraser', label: 'Eraser', icon: Eraser },
    { id: 'line', label: 'Line', icon: Minus },
    { id: 'rect', label: 'Rectangle', icon: Square },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'text', label: 'Text', icon: Type },
  ];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-1">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                disabled={!canDraw}
                onClick={() => setTool(t.id)}
                title={t.label}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 ${
                  tool === t.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Colors & Stroke Width */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {WHITEBOARD_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full border-2 cursor-pointer ${
                  color === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                }`}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>

          <select
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
            title="Stroke thickness"
          >
            <option value={2}>Thin</option>
            <option value={3}>Medium</option>
            <option value={6}>Thick</option>
          </select>

          <button
            type="button"
            disabled={!canDraw || room.whiteboard.length === 0}
            onClick={() => mutateWhiteboard(room.id, 'undo')}
            title="Undo last item"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 disabled:opacity-40 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={!canDraw || room.whiteboard.length === 0}
            onClick={() => mutateWhiteboard(room.id, 'clear')}
            title="Clear canvas"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-red-600 disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PNG</span>
          </button>
        </div>
      </div>

      {/* Inline Text Placement Bar */}
      {textPrompt && (
        <form
          onSubmit={handlePlaceText}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800"
        >
          <input
            type="text"
            autoFocus
            value={textPrompt.value}
            onChange={(e) =>
              setTextPrompt((prev) => (prev ? { ...prev, value: e.target.value } : null))
            }
            placeholder="Type text to place on whiteboard..."
            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
          >
            Place
          </button>
          <button
            type="button"
            onClick={() => setTextPrompt(null)}
            className="px-2 py-1.5 text-xs text-slate-500 cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Drawing Canvas */}
      <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`w-full aspect-[15/8] touch-none block ${
            canDraw ? 'cursor-crosshair' : 'cursor-not-allowed'
          }`}
        />
        {!canDraw && (
          <div className="absolute inset-0 bg-slate-950/10 flex items-center justify-center p-4">
            <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
              Collaborative whiteboard editing is disabled for your role in this room.
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Click/drag to draw · Tap Text tool then click canvas to label diagrams</span>
        <span className="tabular-nums">{room.whiteboard.length} synced stroke(s)</span>
      </div>
    </div>
  );
};
