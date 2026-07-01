import { useEffect, useState } from "react";
import { normalize } from "@/lib/duplicateDetection/utils";
import { searchCandidatesForDuplicates } from "@/lib/duplicateDetection/supabaseQueries";

export default function useDuplicateCheck(
  entity,
  values,
  currentId = null
) {
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState({
    exactMatch: null,
    possibleMatches: [],
    hasDuplicate: false,
  });

  useEffect(() => {
    if (entity !== "candidates") return;

    const timer = setTimeout(async () => {
      try {
        const hasSearchField =
          values.email ||
          values.phone ||
          values.linkedin ||
          values.full_name;

        if (!hasSearchField) {
          setResult({
            exactMatch: null,
            possibleMatches: [],
            hasDuplicate: false,
          });
          return;
        }

        setLoading(true);

        const rows = await searchCandidatesForDuplicates(values);
        const filteredRows = currentId
  ? rows.filter((row) => row.id !== currentId)
  : rows;

        let exact = null;
        const possible = [];

        filteredRows.forEach((candidate) => {
          const emailMatch =
            normalize(candidate.email) === normalize(values.email);

          const phoneMatch =
            normalize(candidate.phone) === normalize(values.phone);

          const linkedinMatch =
            normalize(candidate.linkedin) === normalize(values.linkedin);

          if (emailMatch || phoneMatch || linkedinMatch) {
            exact = candidate;
            return;
          }

          const nameMatch =
            normalize(candidate.full_name) ===
            normalize(values.full_name);

          const companyMatch =
            normalize(candidate.current_company) ===
            normalize(values.current_company);

          if (nameMatch && companyMatch) {
            possible.push(candidate);
          }
        });

        setResult({
          exactMatch: exact,
          possibleMatches: possible,
          hasDuplicate: !!exact || possible.length > 0,
        });
      } catch (err) {
        console.error("Duplicate check failed", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    entity,
    values.email,
    values.phone,
    values.linkedin,
    values.full_name,
    values.current_company,
  ]);

  return {
    loading,
    ...result,
  };
}