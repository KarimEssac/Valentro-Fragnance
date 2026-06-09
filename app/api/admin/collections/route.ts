import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

type TodoResponse = {
  message: string;
};

export async function GET(): Promise<NextResponse<TodoResponse>> {
  // TODO: List collections for admin management.
  return NextResponse.json(
    {message: "TODO: list admin collections"},
    {status: 501}
  );
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<TodoResponse>> {
  void request;
  // TODO: Create a collection.
  return NextResponse.json(
    {message: "TODO: create admin collection"},
    {status: 501}
  );
}
