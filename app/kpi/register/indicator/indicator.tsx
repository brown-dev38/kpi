import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type Indicator = {
  id: number;
  name: string;
  isAnswered: boolean;
};

export default function KpiRegisterIndicatorIndicator({
  data,
  selectedIndicator,
  setSelectedIndicator,
  handleSelectIndicator,
}: {
  data: Indicator[];
  selectedIndicator: number;
  setSelectedIndicator: (indicatorid: number) => void;
  handleSelectIndicator: (indicatorid: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-2">
        <Label>ตัวชี้วัด</Label>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedIndicator(0)}
        >
          <Trash2 />
        </Button>
      </div>
      {data.map((x) => (
        <div key={x.id}>
          <Button
            type="button"
            variant={selectedIndicator === x.id ? "default" : "ghost"}
            className="h-full w-full text-left justify-start whitespace-normal"
            onClick={() => handleSelectIndicator(x.id)}
          >
            <span className="flex-1 text-left">{x.name}</span>
            {!x.isAnswered && (
              <Badge variant="destructive">ยังไม่ลง</Badge>
            )}
          </Button>
          <Separator />
        </div>
      ))}
    </div>
  );
}
