import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type TodoResponse = {
  message: string;
};

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<TodoResponse>> {
  void request;
  void context;
  // TODO: Update an announcement and enforce one active announcement at a time.
  return NextResponse.json(
    {message: "TODO: update admin announcement"},
    {status: 501}
  );
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<TodoResponse>> {
  void request;
  void context;
  // TODO: Delete an announcement.
  return NextResponse.json(
    {message: "TODO: delete admin announcement"},
    {status: 501}
  );
}
