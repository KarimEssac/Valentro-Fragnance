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
  // TODO: Update a fragrance and nested product data.
  return NextResponse.json(
    {message: "TODO: update admin fragrance"},
    {status: 501}
  );
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<TodoResponse>> {
  void request;
  void context;
  // TODO: Delete a fragrance.
  return NextResponse.json(
    {message: "TODO: delete admin fragrance"},
    {status: 501}
  );
}
