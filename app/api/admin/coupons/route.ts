import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

type TodoResponse = {
  message: string;
};

export async function GET(): Promise<NextResponse<TodoResponse>> {
  // TODO: List coupons for admin management.
  return NextResponse.json({message: "TODO: list admin coupons"}, {status: 501});
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<TodoResponse>> {
  void request;
  // TODO: Create a coupon and optional user targeting.
  return NextResponse.json(
    {message: "TODO: create admin coupon"},
    {status: 501}
  );
}
