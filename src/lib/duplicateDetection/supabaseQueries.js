import { supabase } from "@/lib/supabase";

export async function searchCandidatesForDuplicates(data) {
  const filters = [];

  if (data.email) {
    filters.push(`email.eq.${data.email}`);
  }

  if (data.phone) {
    filters.push(`phone.eq.${data.phone}`);
  }

  if (data.linkedin) {
    filters.push(`linkedin.eq.${data.linkedin}`);
  }

  if (data.full_name && data.current_company) {
    filters.push(
      `and(full_name.eq.${data.full_name},current_company.eq.${data.current_company})`
    );
  }

  if (!filters.length) {
    return [];
  }

  const { data: rows, error } = await supabase
    .from("candidates")
    .select("*")
    .or(filters.join(","));

  if (error) {
    throw error;
  }

  return rows || [];
}