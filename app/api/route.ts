import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "智学 API 服务运行中",
    version: "1.0.0"
  });
}
