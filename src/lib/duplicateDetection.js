/**
 * Shared Duplicate Detection Utility
 * Priority: Email → Phone → LinkedIn → Full Name + Current Company
 */

function normalize(str) {
  if (!str) return "";
  return String(str).toLowerCase().trim().replace(/\s+/g, " ");
}

function emailMatches(email1, email2) {
  if (!email1 || !email2) return false;
  return normalize(email1) === normalize(email2);
}

function phoneMatches(phone1, phone2) {
  if (!phone1 || !phone2) return false;
  const clean1 = String(phone1).replace(/\D/g, "");
  const clean2 = String(phone2).replace(/\D/g, "");
  return clean1 === clean2 && clean1.length >= 7;
}

function linkedinMatches(url1, url2) {
  if (!url1 || !url2) return false;
  const extract = (url) => {
    if (!url) return "";
    let clean = String(url).toLowerCase().replace(/^https?:\/\/(www\.)?/, "");
    const match = clean.match(/linkedin\.com(?:\/in\/)?([a-z0-9-]+)/);
    return match ? match[1].replace(/-/g, "") : clean;
  };
  const extracted1 = extract(url1);
  const extracted2 = extract(url2);
  return extracted1 && extracted2 && extracted1 === extracted2;
}

function nameAndCompanyMatch(name1, company1, name2, company2) {
  if (!name1 || !name2) return false;
  if (!company1 && !company2) return false;
  const nameMatch = normalize(name1) === normalize(name2);
  const companyMatch = normalize(company1) === normalize(company2);
  return nameMatch && companyMatch;
}

export function findDuplicateCandidate(candidate, existingCandidates) {
  if (!candidate || !existingCandidates || existingCandidates.length === 0) return null;

  // Priority 1: Email
  if (candidate.email) {
    const byEmail = existingCandidates.find(c => emailMatches(c.email, candidate.email));
    if (byEmail) return byEmail;
  }

  // Priority 2: Phone
  if (candidate.phone) {
    const byPhone = existingCandidates.find(c => phoneMatches(c.phone, candidate.phone));
    if (byPhone) return byPhone;
  }

  // Priority 3: LinkedIn
  if (candidate.linkedin_url) {
    const byLinkedIn = existingCandidates.find(c =>
      linkedinMatches(c.linkedin_url, candidate.linkedin_url)
    );
    if (byLinkedIn) return byLinkedIn;
  }

  // Priority 4: Name + Company
  if (candidate.full_name) {
    const byNameCompany = existingCandidates.find(c =>
      nameAndCompanyMatch(c.full_name, c.current_company, candidate.full_name, candidate.current_company)
    );
    if (byNameCompany) return byNameCompany;
  }

  return null;
}
