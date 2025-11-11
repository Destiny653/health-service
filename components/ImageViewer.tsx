/* --------------------------------------------------------------
   ImageViewer – a tiny reusable component that does the heavy lifting
   -------------------------------------------------------------- */
import { useState, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
    src: string;
}

export default function ImageViewer({ src }: ImageViewerProps) {
    const [open, setOpen] = useState(false);
    const [isPanningMode, setIsPanningMode] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    return (
        <>
            {/* ----- Thumbnail (click → light-box) ----- */}
            <div
                className="relative cursor-pointer overflow-hidden rounded-sm  bg-white group"
                onClick={() => setOpen(true)}
            >
                <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={8}
                    wheel={{ step: 0.2 }}
                    panning={{ disabled: !isPanningMode }}
                    doubleClick={{ mode: "reset" }}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                            {/* Toolbar (top-right) */}
                            <div className="absolute bottom-4 left-[46%] z-10 flex space-x-2   p-1">
                                <ToolbarButton onClick={() => zoomIn()}>
                                    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full">
                                        <PlusIcon />
                                    </div>
                                </ToolbarButton>
                                <ToolbarButton onClick={() => zoomOut()}>
                                    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full">
                                        <MinusIcon />
                                    </div>
                                </ToolbarButton>
                                <ToolbarButton onClick={() => setIsPanningMode(!isPanningMode)}>
                                    <div className={`bg-white/80 backdrop-blur-sm p-2 rounded-full transition-colors ${isPanningMode ? 'bg-blue-100' : ''}`}>
                                        <CursorGrab />
                                    </div>
                                </ToolbarButton>
                            </div>
                            <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                                <img
                                    src={src}
                                    alt={`File ${src.split("/").pop()}`}
                                    className="w-full h-[600] object-full"
                                    loading="lazy"
                                />
                            </TransformComponent>
                            <button
                                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded hover:bg-white transition-colors"
                                onClick={() => resetTransform()}
                            >
                                <FullscreenIcon />
                            </button>
                        </>
                    )}
                </TransformWrapper>

            </div>
        </>
    );
}

/* --------------------------------------------------------------
   Tiny SVG icons – matching the image exactly
   -------------------------------------------------------------- */
const CursorGrab = () => (
    <img src="/images/frame.svg" alt="palm" width={'25'} />
);


const FullscreenIcon = () => (
    <svg className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
);

const PlusIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const MinusIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
);

const ResetIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m10 10v-5h-5" />
    </svg>
);

const CloseIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ToolbarButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-md hover:bg-white/40"
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
    >
        {children}
    </Button>
);