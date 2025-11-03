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
                    panning={{ disabled: false }}
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
                                <ToolbarButton onClick={() => resetTransform()}>
                                    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full">
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
                        </>
                    )}
                </TransformWrapper>

                {/* Bottom overlay icons */}
                {/* <div className="absolute inset-x-0 bottom-0 flex justify-center space-x-3 p-2">
                    <button
                        className="hover:scale-110 transition-transform bg-white rounded-full p-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(true);
                        }}
                    >
                        <SearchPlusIcon />
                    </button>
                    <button
                        className="hover:scale-110 transition-transform bg-white rounded-full p-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(true);
                        }}
                    >
                        <SearchMinusIcon />
                    </button>
                    <button
                        className="hover:scale-110 transition-transform bg-white rounded-full p-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = src;
                            link.download = src.split('/').pop() || 'image';
                            link.click();
                        }}
                    >
                        <CursorGrab />
                    </button>
                </div> */}

                {/* Fullscreen icon in top-right corner */}
                <button
                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded hover:bg-white transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen(true);
                    }}
                >
                    <FullscreenIcon />
                </button>
            </div>

            {/* ----- Full-screen light-box ----- */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-7xl max-h-[90vh] p-0 overflow-hidden bg-black">
                    <TransformWrapper
                        initialScale={1}
                        minScale={0.5}
                        maxScale={8}
                        wheel={{ step: 0.2 }}
                        panning={{ disabled: false }}
                        doubleClick={{ mode: "reset" }}
                    >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                                {/* Toolbar (top-right) */}
                                <div className="absolute top-4 right-4 z-10 flex space-x-2 bg-white/80 backdrop-blur-sm rounded-md p-1">
                                    <ToolbarButton onClick={() => zoomIn()}>
                                        <PlusIcon />
                                    </ToolbarButton>
                                    <ToolbarButton onClick={() => zoomOut()}>
                                        <MinusIcon />
                                    </ToolbarButton>
                                    <ToolbarButton onClick={() => resetTransform()}>
                                        <ResetIcon />
                                    </ToolbarButton>
                                    <ToolbarButton onClick={() => setOpen(false)}>
                                        <CloseIcon />
                                    </ToolbarButton>
                                </div>

                                {/* Image */}
                                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                                    <img
                                        ref={imgRef}
                                        src={src}
                                        alt="Full view"
                                        className="max-w-none"
                                        style={{ touchAction: "none" }}
                                    />
                                </TransformComponent>
                            </>
                        )}
                    </TransformWrapper>
                </DialogContent>
            </Dialog>
        </>
    );
}

/* --------------------------------------------------------------
   Tiny SVG icons – matching the image exactly
   -------------------------------------------------------------- */
const SearchPlusIcon = () => (
    <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="11" cy="11" r="7" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 8v6M8 11h6" />
    </svg>
);

const SearchMinusIcon = () => (
    <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="11" cy="11" r="7" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11h6" />
    </svg>
);

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