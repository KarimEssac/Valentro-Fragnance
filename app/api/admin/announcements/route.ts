import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

type TodoResponse = {
  message: string;
};

export async function GET(): Promise<NextResponse<TodoResponse>> {
  // TODO: List announcements for the protected admin dashboard.
  return NextResponse.json(
    {message: "TODO: list admin announcements"},
    {status: 501}
  );
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<TodoResponse>> {
  void request;
  // TODO: Create an announcement and enforce one active announcement at a time.
  return NextResponse.json(
    {message: "TODO: create admin announcement"},
    {status: 501}
  );
}
