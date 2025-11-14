import SplitPane from "@/components/sections/Prev";


export default function Page() {
  return (
    <div className="h-screen">
      <SplitPane
        initialPercent={60}
        minPercent={20}
        maxPercent={80}
        left={<div className="p-6">Code editor placeholder</div>}
        right={<div className="p-6">Preview placeholder</div>}
      />
    </div>
  );
}
