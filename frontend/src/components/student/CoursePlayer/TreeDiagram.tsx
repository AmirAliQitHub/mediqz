import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { EU } from '../../../types';
import { useCourseStore } from '../../../store/useCourseStore';

interface Props {
 eu: EU;
}

interface TreeNode {
 id: string;
 text: string;
 children?: TreeNode[];
 mode?: 'full' | 'leaves_only';
}

interface DraggingState {
 wordId: string;
 wordText: string;
 originSlotId?: string;
 currentX: number;
 currentY: number;
 width: number;
 height: number;
}

export const TreeDiagram: React.FC<Props> = ({ eu }) => {
 const rootNode: TreeNode = eu.payload || { id: 'node-root', text: 'موضوع اصلی', mode: 'full', children: [] };
 const mode: 'full' | 'leaves_only' = rootNode.mode || 'full';

 const [userSlots, setUserSlots] = useState<Record<string, string>>({});
 const [correctSlotIds, setCorrectSlotIds] = useState<Set<string>>(new Set());
 const [wrongSlotIds, setWrongSlotIds] = useState<Set<string>>(new Set());
 const [bankWords, setBankWords] = useState<{ id: string; text: string }[]>([]);
 const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
 const [dragging, setDragging] = useState<DraggingState | null>(null);
 const [evaluationStatus, setEvaluationStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
 const [hasInteracted, setHasInteracted] = useState(false);

 const containerRef = useRef<HTMLDivElement>(null);
 const svgRef = useRef<SVGSVGElement>(null);
 const slotRectsRef = useRef<Array<{ id: string; rect: DOMRect }>>([]);
 const animFrameRef = useRef<number | null>(null);

 const { recordEUResult } = useCourseStore();

 // Helper: Is a node a droppable slot?
 const isSlotNode = useCallback(
 (node: TreeNode, isRoot: boolean) => {
  if (isRoot) return false;
  if (mode === 'leaves_only') {
  return !node.children || node.children.length === 0;
  }
  return true; // mode === 'full'
 },
 [mode]
 );

 // Compute tree dimensions dynamically
 const getTreeMetrics = (node: TreeNode): { depth: number; maxBranch: number } => {
 if (!node.children || node.children.length === 0) return { depth: 1, maxBranch: 1 };
 let maxD = 0;
 let sumB = 0;
 for (const c of node.children) {
  const m = getTreeMetrics(c);
  maxD = Math.max(maxD, m.depth);
  sumB += m.maxBranch;
 }
 return { depth: 1 + maxD, maxBranch: Math.max(sumB, node.children.length) };
 };

 const { depth, maxBranch } = getTreeMetrics(rootNode);
 const dynamicMinHeight = Math.max(660, maxBranch * 72 + 160);
 const dynamicMinWidth = Math.max(1050, depth * 260 + 360);

 // Initialize and extract bank words on mount or EU change
 useEffect(() => {
 const extracted: { id: string; text: string }[] = [];
 const traverse = (node: TreeNode, isRoot: boolean) => {
  if (isSlotNode(node, isRoot)) {
  extracted.push({ id: `word-${node.id}-${Math.random().toString(36).substr(2, 5)}`, text: node.text });
  }
  (node.children || []).forEach((c) => traverse(c, false));
 };

 traverse(rootNode, true);
 setBankWords([...extracted].sort(() => Math.random() - 0.5));
 setUserSlots({});
 setCorrectSlotIds(new Set());
 setWrongSlotIds(new Set());
 setHoveredSlotId(null);
 setDragging(null);
 setEvaluationStatus('idle');
 setHasInteracted(false);
 }, [eu.id, rootNode, isSlotNode]);

 // Connect parent to child nodes via horizontal stepped SVG paths
 const drawConnectingLines = useCallback(() => {
 const container = containerRef.current;
 const svg = svgRef.current;
 if (!container || !svg) return;

 svg.setAttribute('width', `${Math.max(container.scrollWidth, container.clientWidth)}`);
 svg.setAttribute('height', `${Math.max(container.scrollHeight, container.clientHeight)}`);

 const cRect = container.getBoundingClientRect();
 let paths = '';

 const connect = (parent: TreeNode) => {
  if (!parent.children || parent.children.length === 0) return;

  const pCard = document.getElementById(`s-card-${parent.id}`);
  if (!pCard) return;

  const pRect = pCard.getBoundingClientRect();
  const parentStartX = pRect.right - cRect.left + container.scrollLeft;
  const parentStartY = pRect.top - cRect.top + pRect.height / 2 + container.scrollTop;

  parent.children.forEach((child) => {
  const cCard = document.getElementById(`s-card-${child.id}`);
  if (cCard) {
   const cRectChild = cCard.getBoundingClientRect();
   const childEndX = cRectChild.left - cRect.left + container.scrollLeft;
   const childEndY = cRectChild.top - cRect.top + cRectChild.height / 2 + container.scrollTop;
   const midX = parentStartX + (childEndX - parentStartX) / 2;

   paths += `<path d="M ${parentStartX} ${parentStartY} H ${midX} V ${childEndY} H ${childEndX}" />`;
  }
  connect(child);
  });
 };

 connect(rootNode);
 svg.innerHTML = paths;
 }, [rootNode]);

 useEffect(() => {
 const timer = setTimeout(drawConnectingLines, 60);
 window.addEventListener('resize', drawConnectingLines);
 return () => {
  clearTimeout(timer);
  window.removeEventListener('resize', drawConnectingLines);
 };
 }, [drawConnectingLines, userSlots]);

 // Cache slot bounding rects before drag movement
 const cacheSlotCoordinates = () => {
 const slots = Array.from(document.querySelectorAll<HTMLElement>('.tree-slot'));
 slotRectsRef.current = slots.map((s) => ({
  id: s.getAttribute('data-slot-id') || '',
  rect: s.getBoundingClientRect(),
 }));
 };

 // Pointer Down (Start dragging with centered ghost block)
 const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, wordId: string, wordText: string, originSlotId?: string) => {
 if (evaluationStatus === 'correct') return;
 if (originSlotId && correctSlotIds.has(originSlotId)) return;

 e.preventDefault();
 const target = e.currentTarget;
 const rect = target.getBoundingClientRect();

 cacheSlotCoordinates();

 setDragging({
  wordId,
  wordText,
  originSlotId,
  currentX: e.clientX,
  currentY: e.clientY,
  width: rect.width || 160,
  height: rect.height || 48,
 });
 setEvaluationStatus('idle');
 };

 // Global window pointer listeners while dragging (ensuring centered mouse position & collision)
 useEffect(() => {
 if (!dragging) return;

 const onPointerMove = (e: PointerEvent) => {
  if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  animFrameRef.current = requestAnimationFrame(() => {
  setDragging((prev) => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));

  let foundSlotId: string | null = null;
  for (const slot of slotRectsRef.current) {
   if (
   e.clientX >= slot.rect.left &&
   e.clientX <= slot.rect.right &&
   e.clientY >= slot.rect.top &&
   e.clientY <= slot.rect.bottom
   ) {
   foundSlotId = slot.id;
   break;
   }
  }
  setHoveredSlotId(foundSlotId);
  });
 };

 const onPointerUp = (e: PointerEvent) => {
  let foundSlotId: string | null = null;
  for (const slot of slotRectsRef.current) {
  if (
   e.clientX >= slot.rect.left &&
   e.clientX <= slot.rect.right &&
   e.clientY >= slot.rect.top &&
   e.clientY <= slot.rect.bottom
  ) {
   foundSlotId = slot.id;
   break;
  }
  }

  if (foundSlotId && !correctSlotIds.has(foundSlotId)) {
  const currentOccupant = userSlots[foundSlotId];
  const newSlots = { ...userSlots };

  if (dragging.originSlotId && dragging.originSlotId !== foundSlotId) {
   delete newSlots[dragging.originSlotId];
  }

  newSlots[foundSlotId] = dragging.wordText;
  setUserSlots(newSlots);
  setHasInteracted(true);

  if (currentOccupant && currentOccupant !== dragging.wordText) {
   setBankWords((prev) => [...prev, { id: `word-${Date.now()}`, text: currentOccupant }]);
  }

  if (!dragging.originSlotId) {
   setBankWords((prev) => prev.filter((w) => w.id !== dragging.wordId));
  }
  } else {
  // Dropped outside slot
  if (dragging.originSlotId) {
   const newSlots = { ...userSlots };
   delete newSlots[dragging.originSlotId];
   setUserSlots(newSlots);
   setBankWords((prev) => [...prev, { id: `word-${Date.now()}`, text: dragging.wordText }]);
  }
  }

  setDragging(null);
  setHoveredSlotId(null);
 };

 window.addEventListener('pointermove', onPointerMove);
 window.addEventListener('pointerup', onPointerUp);
 return () => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
 };
 }, [dragging, userSlots, correctSlotIds]);

 const handleRemoveFromSlot = (slotId: string, wordText: string) => {
 if (evaluationStatus === 'correct' || correctSlotIds.has(slotId)) return;
 const newSlots = { ...userSlots };
 delete newSlots[slotId];
 setUserSlots(newSlots);
 setBankWords((prev) => [...prev, { id: `word-${Date.now()}`, text: wordText }]);
 setEvaluationStatus('idle');
 };

 const handleBankWordClick = (word: { id: string; text: string }) => {
 if (evaluationStatus === 'correct') return;
 const findFirstEmptySlot = (node: TreeNode, isRoot: boolean): string | null => {
  if (isSlotNode(node, isRoot) && !userSlots[node.id]) return node.id;
  for (const child of node.children || []) {
  const empty = findFirstEmptySlot(child, false);
  if (empty) return empty;
  }
  return null;
 };

 const emptySlotId = findFirstEmptySlot(rootNode, true);
 if (emptySlotId) {
  setUserSlots((prev) => ({ ...prev, [emptySlotId]: word.text }));
  setBankWords((prev) => prev.filter((w) => w.id !== word.id));
  setHasInteracted(true);
  setEvaluationStatus('idle');
 }
 };

 // -------------------------------------------------------------
 // EXACT UNORDERED TREE ISOMORPHISM (SIBLING EQUIVALENCE) FROM APP.JS
 // -------------------------------------------------------------
 const evaluateTreeIsomorphism = () => {
 // DOM-based isomorphism matching identical to app.js
 const rootWrapper = document.getElementById(`s-wrapper-${rootNode.id}`);
 if (!rootWrapper) return;

 const getChildWrappers = (wrapperEl: HTMLElement): HTMLElement[] => {
  const container = Array.from(wrapperEl.children).find((c) => c.classList.contains('tree-children-container-h'));
  if (!container) return [];
  return Array.from(container.children).filter((c) => c.classList.contains('tree-node-wrapper-h')) as HTMLElement[];
 };

 const getBlockInWrapper = (wrapperEl: HTMLElement): { text: string; isFixed: boolean; slotId?: string } | null => {
  const card = Array.from(wrapperEl.children).find((c) => c.classList.contains('tree-node-card-h'));
  if (!card) return null;
  const slot = card.querySelector('.tree-slot') as HTMLElement;
  if (slot) {
  const slotId = slot.getAttribute('data-slot-id') || '';
  const userWord = userSlots[slotId];
  if (userWord) return { text: userWord.trim(), isFixed: false, slotId };
  return null;
  }
  const fixed = card.querySelector('.tree-fixed-block') as HTMLElement;
  if (fixed) return { text: fixed.innerText.trim(), isFixed: true };
  return null;
 };

 const scoreSubtreeMatch = (
  w: HTMLElement,
  t: TreeNode
 ): { score: number; validSlotIds: string[] } => {
  const block = getBlockInWrapper(w);
  if (!block) return { score: 0, validSlotIds: [] };
  if (block.text !== t.text.trim()) return { score: -1, validSlotIds: [] };

  const wChildren = getChildWrappers(w);
  const tChildren = t.children || [];
  if (wChildren.length !== tChildren.length) return { score: -1, validSlotIds: [] };
  if (tChildren.length === 0) {
  return { score: 1, validSlotIds: block.slotId ? [block.slotId] : [] };
  }

  const bestAssignment = findBestChildAssignment(wChildren, tChildren);
  return {
  score: 1 + bestAssignment.score,
  validSlotIds: block.slotId ? [block.slotId, ...bestAssignment.validSlotIds] : bestAssignment.validSlotIds,
  };
 };

 const findBestChildAssignment = (
  wChildren: HTMLElement[],
  tChildren: TreeNode[]
 ): { score: number; validSlotIds: string[] } => {
  const n = wChildren.length;
  let bestScore = -1;
  let bestSlotIds: string[] = [];

  const matrix: { score: number; validSlotIds: string[] }[][] = [];
  for (let i = 0; i < n; i++) {
  matrix[i] = [];
  for (let j = 0; j < n; j++) {
   matrix[i][j] = scoreSubtreeMatch(wChildren[i], tChildren[j]);
  }
  }

  const usedT = new Array(n).fill(false);
  const permute = (wIdx: number, currentScore: number, currentSlots: string[]) => {
  if (wIdx === n) {
   if (currentScore > bestScore) {
   bestScore = currentScore;
   bestSlotIds = [...currentSlots];
   }
   return;
  }

  for (let j = 0; j < n; j++) {
   if (!usedT[j]) {
   const res = matrix[wIdx][j];
   if (res.score >= 0) {
    usedT[j] = true;
    permute(wIdx + 1, currentScore + res.score, currentSlots.concat(res.validSlotIds));
    usedT[j] = false;
   }
   }
  }
  for (let j = 0; j < n; j++) {
   if (!usedT[j]) {
   usedT[j] = true;
   permute(wIdx + 1, currentScore, currentSlots);
   usedT[j] = false;
   }
  }
  };

  permute(0, 0, []);
  return { score: Math.max(0, bestScore), validSlotIds: bestSlotIds };
 };

 const rootChildrenWrappers = getChildWrappers(rootWrapper);
 const rootTargetChildren = rootNode.children || [];

 const assignment = findBestChildAssignment(rootChildrenWrappers, rootTargetChildren);
 const validSet = new Set(assignment.validSlotIds);
 setCorrectSlotIds(validSet);

 // Identify filled slots that are NOT valid
 const filledSlotIds = Object.keys(userSlots);
 const wrongIds = filledSlotIds.filter((id) => !validSet.has(id));
 setWrongSlotIds(new Set(wrongIds));

 // Calculate total required slots
 let totalSlots = 0;
 const countSlots = (node: TreeNode, isRoot = true) => {
  if (isSlotNode(node, isRoot)) totalSlots++;
  (node.children || []).forEach((c) => countSlots(c, false));
 };
 countSlots(rootNode, true);

 const isAllCorrect = validSet.size === totalSlots && totalSlots > 0;

 if (isAllCorrect) {
  setEvaluationStatus('correct');
  recordEUResult(eu.id, {
  status: 'correct',
  user_answer: 'تمام گره‌ها صحیح و منطبق',
  correct_answer: 'ساختار درختی منطبق',
  });
 } else {
  setEvaluationStatus('wrong');
  recordEUResult(eu.id, {
  status: 'wrong',
  user_answer: `${validSet.size} از ${totalSlots} گره صحیح`,
  correct_answer: 'ساختار درختی منطبق',
  });

  // Shake wrong blocks, then bounce back to bank after 700ms
  if (wrongIds.length > 0) {
  setTimeout(() => {
   const returnedWords: { id: string; text: string }[] = [];
   setUserSlots((prev) => {
   const next = { ...prev };
   wrongIds.forEach((wid) => {
    if (next[wid]) {
    returnedWords.push({ id: `word-${Date.now()}-${wid}`, text: next[wid] });
    delete next[wid];
    }
   });
   return next;
   });
   setBankWords((prev) => [...prev, ...returnedWords]);
   setWrongSlotIds(new Set());
  }, 700);
  }
 }
 };

 // Render tree node horizontally (parent -> children)
 const renderHorizontalNode = (node: TreeNode, isRoot = true) => {
 const isSlot = isSlotNode(node, isRoot);
 const placedWord = userSlots[node.id];
 const isHovered = hoveredSlotId === node.id;
 const isCorrectSlot = correctSlotIds.has(node.id);
 const isWrongSlot = wrongSlotIds.has(node.id);

 return (
  <div key={node.id} id={`s-wrapper-${node.id}`} className="tree-node-wrapper-h">
  <div id={`s-card-${node.id}`} className="tree-node-card-h relative z-10 flex items-center">
   {isRoot ? (
   <div className="tree-fixed-block text-sm md:text-base font-black px-6 py-3.5">
    {node.text}
   </div>
   ) : isSlot ? (
   <div
    id={`slot-${node.id}`}
    data-slot-id={node.id}
    className={`tree-slot ${isHovered ? 'hovered drag-snap-target' : ''} ${
    isCorrectSlot ? 'border-emerald-500 bg-emerald-50/50' : isWrongSlot ? 'border-rose-400 bg-rose-50/50' : ''
    }`}
   >
    {placedWord ? (
    <div
     data-text={placedWord}
     onPointerDown={(e) => handlePointerDown(e, `placed-${node.id}`, placedWord, node.id)}
     onClick={() => handleRemoveFromSlot(node.id, placedWord)}
     className={`draggable-block ${
     isCorrectSlot ? 'correct' : isWrongSlot ? 'wrong' : ''
     }`}
     title={isCorrectSlot ? 'ثبیت شده' : 'برای بازگرداندن به بانک کلمات کلیک کنید'}
    >
     {placedWord}
    </div>
    ) : (
    <span className="text-[11px] font-bold text-blue-300 pointer-events-none select-none">
     جای خالی
    </span>
    )}
   </div>
   ) : (
   <div className="tree-fixed-block text-xs md:text-sm font-black px-5 py-3">
    {node.text}
   </div>
   )}
  </div>

  {node.children && node.children.length > 0 && (
   <div className="tree-children-container-h">
   {node.children.map((c) => renderHorizontalNode(c, false))}
   </div>
  )}
  </div>
 );
 };

 return (
 <div
  className="relative w-full mx-auto p-4 md:p-6 rounded-3xl glass-panel flex flex-col gap-3 select-none animate-fadeIn transition-all duration-300 h-full max-h-[calc(100vh-10.5rem)]"
  style={{
  maxWidth: `${Math.min(1440, Math.max(1150, dynamicMinWidth + 40))}px`,
  }}
 >
  {/* Top Header & Evaluation Controls */}
  <div className="flex justify-between items-center z-20 pb-3 border-b border-white/60 flex-wrap gap-4">
  <div className="flex items-center gap-3">
   <span className="px-3.5 py-1 rounded-full text-xs font-black text-blue-900 bg-blue-100/90 border border-blue-200 shadow-xs">
   {eu.topic_tag || 'نمودار درختی حافظه فعال'}
   </span>
   <span className="text-xs font-bold text-slate-500">
   {mode === 'leaves_only' ? 'تکمیل برگ‌های انتهایی' : 'تکمیل ساختار کامل درخت'}
   </span>
  </div>

  <div className="flex items-center gap-3">
   {evaluationStatus === 'correct' && (
   <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fadeIn">
    ✦ آفرین! تمام گره‌ها صحیح و ساختار منطبق است.
   </span>
   )}
   {evaluationStatus === 'wrong' && (
   <span className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 animate-shake">
    ! در چیدمان گره‌ها اشتباه وجود دارد؛ گره‌های نادرست بازگردانده شدند.
   </span>
   )}

   <button
   type="button"
   onClick={evaluateTreeIsomorphism}
   className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-950 text-white text-xs font-black shadow-md transition-all hover:scale-102 cursor-pointer"
   >
   بررسی پاسخ ✓
   </button>
  </div>
  </div>

  {/* Main Canvas & Floating Right Word Bank */}
  <div
  className="relative flex-1 min-h-0 overflow-x-auto overflow-y-auto pr-[300px] rounded-2xl bg-white/30 backdrop-blur-md border border-white/60 flex items-center justify-start p-6"
  >
  <div className="tree-container-horizontal" ref={containerRef}>
   <svg className="tree-svg-canvas" ref={svgRef} />
   {renderHorizontalNode(rootNode, true)}
  </div>

  {/* Right Floating Word Bank Sidebar */}
  <div className="word-bank-sidebar">
   <div className="flex justify-between items-center pb-3 border-b border-blue-100 mb-3">
   <span className="text-xs font-black text-blue-950">بانک واژگان</span>
   <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
    {bankWords.length} واژه
   </span>
   </div>

   {!hasInteracted && (
   <p className="text-[11px] text-slate-500 mb-3 leading-relaxed text-right animate-fadeIn">
    واژه‌ها را روی خانه‌های خالی رها کنید.
   </p>
   )}

   <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
   {bankWords.map((word) => (
    <div
    key={word.id}
    onPointerDown={(e) => handlePointerDown(e, word.id, word.text)}
    onClick={() => handleBankWordClick(word)}
    className="draggable-block text-xs"
    title="برای کشیدن بکشید یا برای قرار دادن در اولین جای خالی کلیک کنید"
    >
    {word.text}
    </div>
   ))}

   {bankWords.length === 0 && (
    <div className="text-center py-10 text-emerald-600 text-xs font-black flex flex-col items-center gap-2">
    <span>✓</span>
    <span>تمام واژه‌ها در درخت قرار گرفتند.</span>
    </div>
   )}
   </div>
  </div>
  </div>

  {/* Centered Floating Dragging Ghost Block appended to body via createPortal */}
  {dragging &&
  createPortal(
   <div
   style={{
    position: 'fixed',
    left: `${dragging.currentX - dragging.width / 2}px`,
    top: `${dragging.currentY - dragging.height / 2}px`,
    width: `${dragging.width}px`,
    height: `${dragging.height}px`,
    zIndex: 999999,
    pointerEvents: 'none',
    transform: 'translate3d(0, 0, 0)',
   }}
   className="draggable-block dragging flex items-center justify-center text-xs font-black shadow-2xl"
   >
   {dragging.wordText}
   </div>,
   document.body
  )}
 </div>
 );
};
