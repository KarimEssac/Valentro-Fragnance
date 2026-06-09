import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

type TodoResponse = {
  message: string;
  filters: {
    collection: string | null;
    gender: string | null;
    scentProfile: string | null;
  };
};

export async function GET(
  request: NextRequest
): Promise<NextResponse<TodoResponse>> {
  const {searchParams} = request.nextUrl;
  // TODO: Return published fragrances filtered by collection, gender, and scentProfile.
  return NextResponse.json(
    {
      message: "TODO: list storefront fragrances",
      filters: {
        collection: searchParams.get("collection"),
        gender: searchParams.get("gender"),
        scentProfile: searchParams.get("scentProfile")
      }
    },
    {status: 501}
  );
}
