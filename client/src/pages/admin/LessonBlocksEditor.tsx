import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUp, ArrowDown, Trash2, Plus, Eye, ChevronDown, ChevronRight } from "lucide-react";
import InteractiveLesson from "@/components/lms/InteractiveLesson";
import type { LessonBlock } from "@shared/lesson-blocks";
import { LESSON_BLOCK_TYPES } from "@shared/lesson-blocks";

interface LessonBlocksEditorProps {
  /** The step's config object ({ blocks } or legacy { html_content }) */
  value: any;
  onChange: (config: any) => void;
}

const BLOCK_TEMPLATES: Record<LessonBlock["type"], LessonBlock> = {
  hero_image: { type: "hero_image", src: "/images/training/", alt: "" },
  image: { type: "image", src: "/images/training/", alt: "", caption: "" },
  heading: { type: "heading", level: 3, text: "" },
  paragraph: { type: "paragraph", html: "" },
  list: { type: "list", items: [""] },
  callout: { type: "callout", variant: "tip", text: "" },
  key_takeaways: { type: "key_takeaways", items: [""] },
  hotspot_diagram: { type: "hotspot_diagram", src: "/images/training/", alt: "", hotspots: [{ x: 50, y: 50, label: "", description: "" }] },
  flip_cards: { type: "flip_cards", cards: [{ front: "", back: "" }] },
  embedded_quiz: { type: "embedded_quiz", questions: [{ question: "", type: "mcq_single", options: ["", ""], correctAnswers: "", explanation: "" }] },
  drag_drop: { type: "drag_drop", mode: "matching", prompt: "", items: [{ id: "a", label: "", targetId: "t1" }], targets: [{ id: "t1", label: "" }] },
  scenario: { type: "scenario", prompt: "", choices: [{ text: "", correct: true, feedback: "" }] },
};

function blockSummary(block: LessonBlock): string {
  switch (block.type) {
    case "hero_image":
    case "image":
      return block.src;
    case "heading":
      return block.text;
    case "paragraph":
      return block.html.replace(/<[^>]+>/g, "").slice(0, 80);
    case "list":
      return `${block.items.length} items`;
    case "callout":
      return `${block.variant}: ${block.text.replace(/<[^>]+>/g, "").slice(0, 60)}`;
    case "key_takeaways":
      return `${block.items.length} takeaways`;
    case "hotspot_diagram":
      return `${block.src} · ${block.hotspots.length} hotspots`;
    case "flip_cards":
      return `${block.cards.length} cards`;
    case "embedded_quiz":
      return `${block.questions.length} questions`;
    case "drag_drop":
      return `${block.mode} · ${block.items.length} items`;
    case "scenario":
      return (block.title || block.prompt.replace(/<[^>]+>/g, "")).slice(0, 60);
    default:
      return "";
  }
}

/** Textarea bound to a JSON value; only propagates when the JSON parses. */
function JsonField({ label, value, onChange, testId }: { label: string; value: any; onChange: (v: any) => void; testId: string }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [invalid, setInvalid] = useState(false);
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label} (JSON)</Label>
      <Textarea
        value={text}
        rows={6}
        className={`font-mono text-xs ${invalid ? "border-red-500" : ""}`}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setInvalid(false);
          } catch {
            setInvalid(true);
          }
        }}
        data-testid={testId}
      />
      {invalid && <p className="text-xs text-red-600">Invalid JSON — changes not applied</p>}
    </div>
  );
}

function LinesField({ label, items, onChange, testId }: { label: string; items: string[]; onChange: (items: string[]) => void; testId: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label} (one per line)</Label>
      <Textarea
        value={items.join("\n")}
        rows={4}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        data-testid={testId}
      />
    </div>
  );
}

function BlockFields({ block, onChange, index }: { block: LessonBlock; onChange: (b: LessonBlock) => void; index: number }) {
  const set = (patch: any) => onChange({ ...block, ...patch });
  switch (block.type) {
    case "hero_image":
    case "image":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Image URL</Label>
            <Input value={block.src} onChange={(e) => set({ src: e.target.value })} data-testid={`block-${index}-src`} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Alt text</Label>
            <Input value={block.alt} onChange={(e) => set({ alt: e.target.value })} data-testid={`block-${index}-alt`} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Caption (optional)</Label>
            <Input value={block.caption || ""} onChange={(e) => set({ caption: e.target.value || undefined })} data-testid={`block-${index}-caption`} />
          </div>
        </div>
      );
    case "heading":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Level</Label>
            <Select value={String(block.level)} onValueChange={(v) => set({ level: parseInt(v) })}>
              <SelectTrigger data-testid={`block-${index}-level`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
                <SelectItem value="4">H4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Text</Label>
            <Input value={block.text} onChange={(e) => set({ text: e.target.value })} data-testid={`block-${index}-text`} />
          </div>
        </div>
      );
    case "paragraph":
      return (
        <div className="space-y-1">
          <Label className="text-xs">HTML content</Label>
          <Textarea value={block.html} rows={4} onChange={(e) => set({ html: e.target.value })} data-testid={`block-${index}-html`} />
        </div>
      );
    case "list":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch checked={!!block.ordered} onCheckedChange={(v) => set({ ordered: v })} data-testid={`block-${index}-ordered`} />
            <Label className="text-xs">Numbered list</Label>
          </div>
          <LinesField label="Items" items={block.items} onChange={(items) => set({ items })} testId={`block-${index}-items`} />
        </div>
      );
    case "callout":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Variant</Label>
            <Select value={block.variant} onValueChange={(v) => set({ variant: v })}>
              <SelectTrigger data-testid={`block-${index}-variant`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tip">Tip</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Text</Label>
            <Textarea value={block.text} rows={2} onChange={(e) => set({ text: e.target.value })} data-testid={`block-${index}-text`} />
          </div>
        </div>
      );
    case "key_takeaways":
      return <LinesField label="Takeaways" items={block.items} onChange={(items) => set({ items })} testId={`block-${index}-items`} />;
    case "hotspot_diagram":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Image URL</Label>
            <Input value={block.src} onChange={(e) => set({ src: e.target.value })} data-testid={`block-${index}-src`} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Alt text</Label>
            <Input value={block.alt} onChange={(e) => set({ alt: e.target.value })} data-testid={`block-${index}-alt`} />
          </div>
          <JsonField label="Hotspots — x/y are % of image size" value={block.hotspots} onChange={(hotspots) => set({ hotspots })} testId={`block-${index}-hotspots`} />
        </div>
      );
    case "flip_cards":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Title (optional)</Label>
            <Input value={block.title || ""} onChange={(e) => set({ title: e.target.value || undefined })} data-testid={`block-${index}-title`} />
          </div>
          <JsonField label="Cards" value={block.cards} onChange={(cards) => set({ cards })} testId={`block-${index}-cards`} />
        </div>
      );
    case "embedded_quiz":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Title (optional)</Label>
            <Input value={block.title || ""} onChange={(e) => set({ title: e.target.value || undefined })} data-testid={`block-${index}-title`} />
          </div>
          <JsonField label="Questions — correctAnswers must equal an option text" value={block.questions} onChange={(questions) => set({ questions })} testId={`block-${index}-questions`} />
        </div>
      );
    case "drag_drop":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Mode</Label>
            <Select value={block.mode} onValueChange={(v) => set({ mode: v })}>
              <SelectTrigger data-testid={`block-${index}-mode`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="matching">Matching (items → categories)</SelectItem>
                <SelectItem value="ordering">Ordering (sequence steps)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Prompt</Label>
            <Input value={block.prompt} onChange={(e) => set({ prompt: e.target.value })} data-testid={`block-${index}-prompt`} />
          </div>
          <JsonField label="Items — ordering mode: author in correct order" value={block.items} onChange={(items) => set({ items })} testId={`block-${index}-items`} />
          {block.mode === "matching" && (
            <JsonField label="Targets" value={block.targets || []} onChange={(targets) => set({ targets })} testId={`block-${index}-targets`} />
          )}
        </div>
      );
    case "scenario":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Title (optional)</Label>
            <Input value={block.title || ""} onChange={(e) => set({ title: e.target.value || undefined })} data-testid={`block-${index}-title`} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Situation prompt (HTML allowed)</Label>
            <Textarea value={block.prompt} rows={3} onChange={(e) => set({ prompt: e.target.value })} data-testid={`block-${index}-prompt`} />
          </div>
          <JsonField label="Choices" value={block.choices} onChange={(choices) => set({ choices })} testId={`block-${index}-choices`} />
        </div>
      );
    default:
      return null;
  }
}

/**
 * Admin editor for the structured lesson `blocks` config. Also handles legacy
 * `html_content` lessons (raw HTML textarea + one-way switch to blocks).
 */
export default function LessonBlocksEditor({ value, onChange }: LessonBlocksEditorProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [addType, setAddType] = useState<LessonBlock["type"]>("paragraph");

  const blocks: LessonBlock[] | null = Array.isArray(value?.blocks) ? value.blocks : null;
  const htmlContent: string = value?.html_content || value?.htmlContent || value?.content || "";

  const setBlocks = (next: LessonBlock[]) => onChange({ ...value, blocks: next });

  const move = (i: number, dir: -1 | 1) => {
    if (!blocks) return;
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
    setExpanded(null);
  };

  if (!blocks) {
    return (
      <div className="space-y-2 border-t pt-4">
        <Label>Lesson HTML (legacy format)</Label>
        <Textarea
          value={htmlContent}
          rows={8}
          className="font-mono text-xs"
          onChange={(e) => onChange({ ...value, html_content: e.target.value })}
          data-testid="input-step-html"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange({ blocks: [] })}
          data-testid="button-switch-to-blocks"
        >
          Switch to block editor (discards HTML)
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <Label>Content Blocks ({blocks.length})</Label>
        <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)} data-testid="button-preview-lesson">
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          Preview
        </Button>
      </div>

      <div className="space-y-2">
        {blocks.map((block, i) => (
          <div key={i} className="border rounded-md" data-testid={`block-row-${i}`}>
            <div className="flex items-center gap-2 p-2">
              <button
                type="button"
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
                data-testid={`block-toggle-${i}`}
              >
                {expanded === i ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                <Badge variant="outline" className="shrink-0">{block.type}</Badge>
                <span className="text-xs text-muted-foreground truncate">{blockSummary(block)}</span>
              </button>
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, -1)} data-testid={`block-up-${i}`}>
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === blocks.length - 1} onClick={() => move(i, 1)} data-testid={`block-down-${i}`}>
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  setBlocks(blocks.filter((_, j) => j !== i));
                  setExpanded(null);
                }}
                data-testid={`block-delete-${i}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {expanded === i && (
              <div className="p-3 border-t bg-muted/30">
                <BlockFields
                  block={block}
                  index={i}
                  onChange={(b) => setBlocks(blocks.map((old, j) => (j === i ? b : old)))}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Select value={addType} onValueChange={(v) => setAddType(v as LessonBlock["type"])}>
          <SelectTrigger className="w-48" data-testid="select-add-block-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LESSON_BLOCK_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={() => {
            setBlocks([...blocks, JSON.parse(JSON.stringify(BLOCK_TEMPLATES[addType]))]);
            setExpanded(blocks.length);
          }}
          data-testid="button-add-block"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Block
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lesson Preview</DialogTitle>
          </DialogHeader>
          <InteractiveLesson blocks={blocks} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
