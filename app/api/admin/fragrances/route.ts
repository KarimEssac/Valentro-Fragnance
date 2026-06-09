import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

type TodoResponse = {
  message: string;
};

export async function GET(): Promise<NextResponse<TodoResponse>> {
  // TODO: List fragrances for admin management.
  return NextResponse.json(
    {message: "TODO: list admin fragrances"},
    {status: 501}
  );
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<TodoResponse>> {
  void request;
  // TODO: Create a fragrance with variants, ingredients, images, and collections.
  return NextResponse.json(
    {message: "TODO: create admin fragrance"},
    {status: 501}
  );
}
