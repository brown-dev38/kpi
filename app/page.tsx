import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PanelsTopLeft } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PanelsTopLeft />
          </EmptyMedia>
          <EmptyTitle>ไม่พบหน้าที่ต้องการ</EmptyTitle>
          <EmptyDescription>
            กรุณาทำการติดต่อผู้ดูแลระบบ เพื่อสอบถามรายละเอียดเพิ่มเติม
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button>รีโหลดหน้าใหม่</Button>
          </div>
        </EmptyContent>
      </Empty>
    </main>
  );
}
