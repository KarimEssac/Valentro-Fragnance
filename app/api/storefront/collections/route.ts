import {NextResponse} from "next/server";

type TodoResponse = {
  message: string;
};

export async function GET(): Promise<NextResponse<TodoResponse>> {
  // TODO: Return published storefront collections ordered by position.
  return NextResponse.json(
    {message: "TODO: list storefront collections"},
    {status: 501}
  );
}
