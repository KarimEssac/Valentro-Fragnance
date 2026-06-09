import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

type TodoResponse = {
  message: string;
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<TodoResponse>> {
  void request;
  // TODO: Place a cash-on-delivery order, snapshot address, and decrement stock.
  return NextResponse.json({message: "TODO: place order"}, {status: 501});
}
