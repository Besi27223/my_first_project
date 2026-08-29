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
  const description = String(formData.get("description") ?? "").trim();
  const invoiceNumber = String(formData.get("invoiceNumber") ?? "").trim() || null;
  const expenseDate = String(formData.get("expenseDate") ?? "");
  const taxYear = Number(formData.get("taxYear"));
  const amount = Number(formData.get("amount"));
  const categoryId = String(formData.get("categoryId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const file = formData.get("file") as File | null;

  if (!description || description.length > 100) {
    return NextResponse.json({ error: "שם ספק/מוצר חובה, עד 100 תווים" }, { status: 400 });
  }
  if (!categoryId) {
    return NextResponse.json({ error: "יש לבחור קטגוריית הוצאה" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: "סכום ההוצאה חייב להיות שונה מאפס" }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "יש לצרף תמונת קבלה או קובץ" }, { status: 400 });
  }
  if (!expenseDate || !Number.isFinite(taxYear)) {
    return NextResponse.json({ error: "תאריך ושנת מס חובה" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: category, error: categoryError } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("id", categoryId)
    .single();

  if (categoryError || !category) {
    return NextResponse.json({ error: "קטגוריה לא נמצאה" }, { status: 400 });
  }

  const month = Number(expenseDate.split("-")[1]);
  const folder = dropboxFolder(taxYear, month, category.short_name);
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const storagePath = `${profile.household_id}/${folder}/${fileName}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(storagePath, fileBuffer, { contentType: file.type || "application/octet-stream" });

  if (uploadError) {
    return NextResponse.json({ error: "העלאת הקובץ נכשלה: " + uploadError.message }, { status: 500 });
  }

  const { data: expense, error: insertError } = await supabase
    .from("expenses")
    .insert({
      household_id: profile.household_id,
      created_by: profile.id,
      description,
      invoice_number: invoiceNumber,
      expense_date: expenseDate,
      tax_year: taxYear,
      amount,
      category_id: categoryId,
      tax_pct_snapshot: category.tax_pct,
      notes,
      receipt_paths: [storagePath],
    })
    .select()
    .single();

  if (insertError || !expense) {
    await supabase.storage.from("receipts").remove([storagePath]);
    return NextResponse.json({ error: "שמירת ההוצאה נכשלה: " + insertError?.message }, { status: 500 });
  }

  const { data: archive, error: archiveError } = await supabase
    .from("expense_archive")
    .insert({
      expense_id: expense.id,
      household_id: profile.household_id,
      created_by: profile.id,
      supplier_name: description,
      invoice_number: invoiceNumber,
      notes,
    })
    .select()
    .single();

  let dropboxWarning: string | null = null;
  let dropboxPath: string | null = null;
  try {
    dropboxPath = await uploadToDropbox(`${profile.household_id}/${folder}`, fileName, fileBuffer);
  } catch (err) {
    dropboxWarning = "העתק ל-Dropbox נכשל, אך הקבלה נשמרה בהצלחה במערכת";
    console.error("Dropbox upload failed", err);
  }

  await supabase
    .from("expenses")
    .update({
      archive_ref_id: archive?.id ?? null,
      dropbox_path: dropboxPath,
    })
    .eq("id", expense.id);

  if (archiveError) {
    console.error("Archive insert failed", archiveError);
  }

  return NextResponse.json({ id: expense.id, dropboxWarning }, { status: 201 });
}
