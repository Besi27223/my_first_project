import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { dropboxFolder } from "@/lib/period";
import { uploadToDropbox } from "@/lib/dropbox";

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function POST(request: NextRequest) {
  if (isDemo) {
    return NextResponse.json({ error: "לא זמין במצב דמו" }, { status: 400 });
  }

  let profile;
  try {
    profile = await getCurrentProfile();
  } catch {
    return NextResponse.json({ error: "לא מחובר/ת" }, { status: 401 });
  }

  const formData = await request.formData();
  const grossAmount = Number(formData.get("grossAmount"));
  const netAmount = Number(formData.get("netAmount"));
  const taxYear = Number(formData.get("taxYear"));
  const month = Number(formData.get("month"));
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (!Number.isFinite(grossAmount) || grossAmount < 0 || !Number.isFinite(netAmount) || netAmount < 0) {
    return NextResponse.json({ error: "סכומים לא תקינים" }, { status: 400 });
  }
  if (!Number.isFinite(taxYear) || !Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "חודש/שנת מס לא תקינים" }, { status: 400 });
  }

  const supabase = await createClient();
  const folder = dropboxFolder(taxYear, month);

  const referenceDocPaths: string[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const storagePath = `${profile.household_id}/${folder}/income-${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(storagePath, buffer, { contentType: file.type || "application/octet-stream" });

    if (uploadError) {
      return NextResponse.json({ error: "העלאת קובץ האסמכתא נכשלה: " + uploadError.message }, { status: 500 });
    }
    referenceDocPaths.push(storagePath);

    try {
      await uploadToDropbox(`${profile.household_id}/${folder}`, `income-${fileName}`, buffer);
    } catch (err) {
      console.error("Dropbox upload failed for income reference doc", err);
    }
  }

  const { data: income, error: insertError } = await supabase
    .from("monthly_income")
    .insert({
      household_id: profile.household_id,
      created_by: profile.id,
      gross_amount: grossAmount,
      net_amount: netAmount,
      tax_year: taxYear,
      month,
      reference_doc_paths: referenceDocPaths,
      dropbox_path: referenceDocPaths.length ? `${profile.household_id}/${folder}` : null,
    })
    .select()
    .single();

  if (insertError || !income) {
    return NextResponse.json({ error: "שמירת ההכנסה נכשלה: " + insertError?.message }, { status: 500 });
  }

  return NextResponse.json({ id: income.id }, { status: 201 });
}
